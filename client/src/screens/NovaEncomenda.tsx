import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { AppSelect } from "@/components/AppSelect";
import { FormHeaderActions } from "@/components/FormHeaderActions";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatBRL } from "@/lib/types";
import { api, useDadosOperacionais } from "@/lib/api";
import { useShortcutLabel } from "@/hooks/useShortcutLabel";
import { toast } from "sonner";

export default function NovaEncomenda() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { customers, products, orders } = useDadosOperacionais();
  const cancelShortcutLabel = useShortcutLabel("cancel");
  const saveShortcutLabel = useShortcutLabel("save");
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();
  const order = orders.find((item) => item.id === params.id);
  const isEditing = Boolean(order);
  const cameFromDashboard = searchParams.get("from") === "dashboard";
  const breadcrumb = cameFromDashboard
    ? ["Dashboard", "Encomenda", isEditing ? "Editar encomenda" : "Nova encomenda"]
    : ["Encomendas", isEditing ? "Editar" : "Nova"];
  const cancelHref = cameFromDashboard ? "/" : "/encomendas";
  const [saving, setSaving] = useState(false);
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [customerName, setCustomerName] = useState(order?.customer ?? customers[0]?.name ?? "");
  const [dueDate, setDueDate] = useState(order?.dueDate ?? "");
  const [size, setSize] = useState("P");
  const [quantity, setQuantity] = useState(1);
  const [entry, setEntry] = useState(order?.entry ?? 0);

  const selectedProduct = products.find((product) => product.id === productId);
  const total = selectedProduct ? selectedProduct.priceRetail * quantity : order?.total ?? 0;

  useEffect(() => {
    if (order) {
      setCustomerName(order.customer);
      setDueDate(order.dueDate);
      setEntry(order.entry);
      return;
    }

    if (!customerName && customers[0]) setCustomerName(customers[0].name);
  }, [customerName, customers, order]);

  useEffect(() => {
    if (!productId && products[0]) setProductId(products[0].id);
  }, [productId, products]);

  const handleSave = async () => {
    if (!customerName) return toast.error("Selecione um cliente.");
    if (!dueDate) return toast.error("Informe a previsão de entrega.");
    if (!selectedProduct) return toast.error("Selecione um produto.");

    setSaving(true);
    try {
      const payload = {
        id: order?.id,
        customer: customerName,
        createdAt: order?.createdAt,
        dueDate,
        total,
        entry,
        status: order?.status ?? "Aberta" as const,
        items: [{
          product: selectedProduct.name,
          ref: selectedProduct.ref,
          size,
          quantity,
          unitPrice: selectedProduct.priceRetail,
        }],
      };
      if (isEditing) await api.atualizarEncomenda({ ...payload, id: order!.id });
      else await api.salvarEncomenda(payload);
      await queryClient.invalidateQueries({ queryKey: ["encomendas"] });
      setSaving(false);
      toast.success(isEditing ? "Encomenda atualizada com sucesso!" : "Encomenda cadastrada com sucesso!");
      router.push("/encomendas");
    } catch {
      toast.error("Não foi possível salvar a encomenda.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        breadcrumb={breadcrumb}
        title={isEditing ? "Editar encomenda" : "Nova encomenda"}
        status={isEditing ? order?.status : "Não salvo"}
        actions={
          <FormHeaderActions
            cancelHref={cancelHref}
            cancelLabel={`Cancelar${cancelShortcutLabel}`}
            onSave={handleSave}
            saving={saving}
            idleLabel={`${isEditing ? "Salvar alterações" : "Cadastrar encomenda"}${saveShortcutLabel}`}
          />
        }
      />

      <div className="grid gap-6 p-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Cliente e prazo</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-sm font-medium">Cliente</span>
                <AppSelect
                  value={customerName}
                  onValueChange={setCustomerName}
                  options={customers.map((customer) => ({ value: customer.name, label: customer.name }))}
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium">Previsão de entrega</span>
                <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
              </label>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Item encomendado</h3>
            <div className="grid gap-4 md:grid-cols-4">
              <label className="space-y-1.5 md:col-span-2">
                <span className="text-sm font-medium">Produto</span>
                <AppSelect
                  className="w-full"
                  value={productId}
                  onValueChange={setProductId}
                  options={products.map((product) => ({
                    value: product.id,
                    label: `${product.name} (${product.ref})`,
                  }))}
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium">Tamanho</span>
                <AppSelect
                  defaultValue="P"
                  value={size}
                  onValueChange={setSize}
                  options={["P", "M", "G", "GG"].map((size) => ({ value: size, label: size }))}
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium">Quantidade</span>
                <Input type="number" min={1} value={quantity} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value || 1)))} />
              </label>
            </div>
            <Textarea className="mt-4" placeholder="Observações da encomenda" />
          </Card>
        </div>

        <Card className="h-fit p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Resumo</h3>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Preço unitário</span>
              <span className="font-medium">{selectedProduct ? formatBRL(selectedProduct.priceRetail) : formatBRL(0)}</span>
            </div>
            <label className="block space-y-1.5 pt-2">
              <span className="text-sm font-medium">Entrada</span>
              <Input type="number" min={0} step="0.01" value={entry} onChange={(event) => setEntry(Number(event.target.value || 0))} placeholder="0,00" />
            </label>
            <div className="flex justify-between pt-2">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold">{formatBRL(total)}</span>
            </div>
            <p className="pt-2 text-xs text-muted-foreground">O saldo fica em aberto até a entrega ou geração da venda.</p>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
