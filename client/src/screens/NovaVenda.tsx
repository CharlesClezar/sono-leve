import { useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { FormHeaderActions } from "@/components/FormHeaderActions";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatBRL, type Sale } from "@/lib/types";
import { api, useDadosOperacionais } from "@/lib/api";
import { useShortcutLabel } from "@/hooks/useShortcutLabel";
import { Search, X, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface Item {
  productId: string;
  size: string;
  qty: number;
  price: number;
}

const sizes = ["P", "M", "G", "GG"];

export default function NovaVenda() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { customers, fichas, orders, products, sales } = useDadosOperacionais();
  const cancelShortcutLabel = useShortcutLabel("cancel");
  const saveShortcutLabel = useShortcutLabel("save");
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();
  const sale = sales.find((item) => item.id === params.id);
  const sourceOrderId = searchParams.get("from") === "encomenda" ? searchParams.get("id") : null;
  const sourceOrder = sourceOrderId ? orders.find((item) => item.id === sourceOrderId) ?? null : null;
  const sourceFichaId = searchParams.get("from") === "ficha" ? searchParams.get("id") : null;
  const sourceFicha = sourceFichaId ? fichas.find((item) => item.id === sourceFichaId) ?? null : null;
  const isEditing = Boolean(sale);
  const cameFromDashboard = searchParams.get("from") === "dashboard";
  const breadcrumb = cameFromDashboard
    ? ["Dashboard", "Venda", isEditing ? "Editar venda" : "Nova venda"]
    : ["Vendas", isEditing ? "Editar" : "Nova"];
  const cancelHref = cameFromDashboard ? "/" : "/vendas";
  const initialCustomerId = sale
    ? customers.find((item) => item.name === sale.customer)?.id ?? null
    : sourceOrder
      ? customers.find((item) => item.name === sourceOrder.customer)?.id ?? null
      : sourceFicha
        ? customers.find((item) => item.name === sourceFicha.reseller)?.id ?? null
      : null;
  const initialProduct = products[0];
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerId, setCustomerId] = useState<string | null>(initialCustomerId);
  const [productQuery, setProductQuery] = useState("");
  const [items, setItems] = useState<Item[]>(
    sale && initialProduct
      ? [{ productId: initialProduct.id, size: "M", qty: sale.pieces, price: initialProduct.priceRetail }]
      : []
  );
  const [discount, setDiscount] = useState(0);
  const [paid, setPaid] = useState(0);
  const [generating, setGenerating] = useState(false);

  const customer = customers.find((c) => c.id === customerId) ?? null;
  const customerType = customer?.type ?? "varejo";

  const matchedCustomers = customerQuery
    ? customers.filter((c) => c.name.toLowerCase().includes(customerQuery.toLowerCase()))
    : [];
  const matchedProducts = productQuery
    ? products.filter(
        (p) =>
          p.active &&
          (p.name.toLowerCase().includes(productQuery.toLowerCase()) ||
            p.ref.toLowerCase().includes(productQuery.toLowerCase()))
      )
    : [];

  const addProduct = (productId: string) => {
    const p = products.find((x) => x.id === productId)!;
    const price = customerType === "atacado" ? p.priceWholesale : p.priceRetail;
    setItems((prev) => [...prev, ...sizes.map((s) => ({ productId, size: s, qty: 0, price }))]);
    setProductQuery("");
  };

  const updateQty = (idx: number, qty: number) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, qty: Math.max(0, qty) } : it)));

  const validItems = useMemo(() => items.filter((i) => i.qty > 0), [items]);
  const subtotal = validItems.reduce((s, i) => s + i.qty * i.price, 0);
  const total = Math.max(0, subtotal - discount);
  const balance = Math.max(0, total - paid);
  const change = Math.max(0, paid - total);

  const grouped = useMemo(() => {
    const map = new Map<string, Item[]>();
    items.forEach((it) => {
      if (!map.has(it.productId)) map.set(it.productId, []);
      map.get(it.productId)!.push(it);
    });
    return Array.from(map.entries());
  }, [items]);

  const projectedRemainder = sourceOrder ? Math.max(0, sourceOrder.total - total) : 0;

  const handleGenerate = async () => {
    if (!customer) return toast.error("Selecione um cliente");
    if (validItems.length === 0) return toast.error("Adicione ao menos um item");
    setGenerating(true);
    try {
      const origin: Sale["origin"] = sourceOrder ? "Encomenda" : sourceFicha ? "Ficha" : "Balcão";
      const payload = {
        id: sale?.id,
        customer: customer.name,
        date: sale?.date,
        pieces: validItems.reduce((sum, item) => sum + item.qty, 0),
        payment: paid > 0 && balance > 0 ? "Parcial" : paid > 0 ? "Pago" : "A receber",
        total,
        status: sale?.status ?? "Gerada" as const,
        origin,
        items: validItems.map((item) => {
          const product = products.find((entry) => entry.id === item.productId)!;
          return {
            product: product.name,
            ref: product.ref,
            size: item.size,
            quantity: item.qty,
            unitPrice: item.price,
          };
        }),
      };

      if (isEditing) await api.atualizarVenda({ ...payload, id: sale!.id });
      else await api.salvarVenda(payload);

      if (!isEditing && sourceOrder?.status === "Fabricado parcialmente" && projectedRemainder > 0) {
        await api.salvarEncomenda({
          id: `${sourceOrder.id}-R${Date.now().toString().slice(-4)}`,
          customer: sourceOrder.customer,
          createdAt: new Date().toISOString().slice(0, 10),
          dueDate: sourceOrder.dueDate,
          total: Number(projectedRemainder.toFixed(2)),
          entry: 0,
          status: "Aberta",
          items: [],
        });
        await api.atualizarStatusEncomenda(sourceOrder.id, "Entregue");
        toast.success(`Venda gerada e nova encomenda criada com saldo restante de ${formatBRL(projectedRemainder)}!`);
      } else {
        if (!isEditing && sourceOrder) await api.atualizarStatusEncomenda(sourceOrder.id, "Entregue");
        toast.success(isEditing ? "Venda atualizada com sucesso!" : "Venda gerada com sucesso!");
      }
      await queryClient.invalidateQueries({ queryKey: ["vendas"] });
      await queryClient.invalidateQueries({ queryKey: ["encomendas"] });
      if (!isEditing) {
        setItems([]); setPaid(0); setDiscount(0);
      }
      router.push("/vendas");
    } catch {
      toast.error("Não foi possível salvar a venda.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        breadcrumb={breadcrumb}
        title={isEditing ? "Editar venda" : "Nova venda"}
        status={isEditing ? sale?.status : items.length === 0 ? "Não salvo" : undefined}
        actions={
          <FormHeaderActions
            cancelHref={cancelHref}
            cancelLabel={`Cancelar${cancelShortcutLabel}`}
            onSave={handleGenerate}
            saving={generating}
            idleLabel={`${isEditing ? "Salvar alterações" : "Gerar venda"}${saveShortcutLabel}`}
          />
        }
      />

      <div className="grid gap-6 p-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* Cliente */}
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Cliente</h3>
            {customer ? (
              <div className="flex items-center justify-between rounded-md border bg-primary-soft/40 p-3">
                <div>
                  <div className="font-medium">{customer.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {customer.phone} · <span className="font-medium uppercase text-primary">{customer.type}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setCustomerId(null)}>Trocar</Button>
              </div>
            ) : (
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente..."
                  className="pl-9"
                  value={customerQuery}
                  onChange={(e) => setCustomerQuery(e.target.value)}
                />
                {matchedCustomers.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-lg">
                    {matchedCustomers.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => { setCustomerId(c.id); setCustomerQuery(""); }}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                      >
                        <span>{c.name}</span>
                        <span className="text-xs uppercase text-muted-foreground">{c.type}</span>
                      </button>
                    ))}
                    <button className="flex w-full items-center gap-2 border-t px-3 py-2 text-left text-sm font-medium text-primary hover:bg-primary-soft">
                      <UserPlus className="h-4 w-4" /> Cadastrar novo cliente
                    </button>
                  </div>
                )}
              </div>
            )}
          </Card>

          {sourceOrder && (
            <Card className="border-primary/15 bg-primary/5 p-5">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Origem da venda</h3>
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Encomenda</div>
                  <div className="font-medium">{sourceOrder.id}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Status</div>
                  <div className="font-medium">{sourceOrder.status}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Saldo projetado</div>
                  <div className="font-medium">{formatBRL(projectedRemainder)}</div>
                </div>
              </div>
              {sourceOrder.status === "Fabricado parcialmente" && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Ao faturar parcialmente esta encomenda, o sistema gera uma nova encomenda com o saldo restante.
                </p>
              )}
            </Card>
          )}

          {/* Produtos */}
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Produtos</h3>
            <div className="relative mb-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou referência..."
                className="pl-9"
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
              />
              {matchedProducts.length > 0 && (
                <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-lg">
                  {matchedProducts.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => addProduct(p.id)}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                    >
                      <span>{p.name} <span className="text-xs text-muted-foreground">({p.ref})</span></span>
                      <span className="text-xs font-semibold">
                        {formatBRL(customerType === "atacado" ? p.priceWholesale : p.priceRetail)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {grouped.length === 0 ? (
              <div className="rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
                Busque um produto acima para começar
              </div>
            ) : (
              <div className="space-y-4">
                {grouped.map(([pid, group]) => {
                  const p = products.find((x) => x.id === pid)!;
                  return (
                    <div key={pid} className="rounded-md border p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <div className="font-medium">{p.name}</div>
                          <div className="text-xs text-muted-foreground">{p.ref} · {formatBRL(group[0].price)}</div>
                        </div>
                        <button
                          onClick={() => setItems((prev) => prev.filter((i) => i.productId !== pid))}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        {group.map((it) => {
                          const idx = items.indexOf(it);
                          return (
                            <div key={it.size} className="rounded-md bg-muted/40 p-2 text-center">
                              <div className="text-xs font-semibold uppercase text-muted-foreground">{it.size}</div>
                              <Input
                                type="number"
                                min={0}
                                value={it.qty}
                                onChange={(e) => updateQty(idx, +e.target.value)}
                                className="mt-1 h-9 border-0 bg-card text-center font-semibold"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Resumo */}
        <Card className="h-fit p-5 sticky top-20">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Resumo</h3>
          <div className="space-y-2.5 text-sm">
            <Row label="Subtotal" value={formatBRL(subtotal)} />
            <Row label="Peças" value={validItems.reduce((s, i) => s + i.qty, 0).toString()} />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Desconto</span>
              <Input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(+e.target.value || 0)}
                className="h-8 w-28 text-right"
              />
            </div>
            <div className="my-3 border-t" />
            <Row label="Total" value={formatBRL(total)} bold />
            {sourceOrder?.status === "Fabricado parcialmente" && (
              <Row label="Restante na nova encomenda" value={formatBRL(projectedRemainder)} tone={projectedRemainder > 0 ? "warning" : "muted"} />
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Valor pago</span>
              <Input
                type="number"
                value={paid}
                onChange={(e) => setPaid(+e.target.value || 0)}
                className="h-8 w-28 text-right"
              />
            </div>
            <Row label="Saldo em aberto" value={formatBRL(balance)} tone={balance > 0 ? "warning" : "muted"} />
            {change > 0 && <Row label="Troco" value={formatBRL(change)} tone="success" />}
          </div>
          <Button className="mt-5 w-full" size="lg" onClick={handleGenerate} disabled={generating}>
            {generating ? "Salvando..." : isEditing ? "Salvar alterações" : "Gerar venda"}
          </Button>
        </Card>
      </div>
    </AppShell>
  );
}

function Row({ label, value, bold, tone }: { label: string; value: string; bold?: boolean; tone?: "muted" | "warning" | "success" }) {
  const toneClass = tone === "warning" ? "text-warning" : tone === "success" ? "text-[hsl(var(--success))]" : "";
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`${bold ? "text-base font-semibold" : ""} ${toneClass}`}>{value}</span>
    </div>
  );
}
