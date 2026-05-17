import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { FormHeaderActions } from "@/components/FormHeaderActions";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatBRL, type PieceDetailItem, type Sale } from "@/lib/types";
import { api, useDadosOperacionais, useItensEncomenda } from "@/lib/api";
import { BASE_URL } from "@/lib/http";
import { useShortcutLabel } from "@/hooks/useShortcutLabel";
import { Search, X, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface Item {
  produtoId: string;
  tamanho: string;
  quantidade: number;
  preco: number;
}

const tamanhos = ["P", "M", "G", "GG"];

export default function NovaVenda() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { clientes, fichas, encomendas, produtos, vendas } = useDadosOperacionais();
  const cancelShortcutLabel = useShortcutLabel("cancel");
  const saveShortcutLabel = useShortcutLabel("save");
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();
  const venda = vendas.find((item) => item.id === params.id);
  const encomendaOrigemId = searchParams.get("from") === "encomenda" ? searchParams.get("id") : null;
  const parcial = searchParams.get("parcial") === "1";
  const encomendaOrigem = encomendaOrigemId ? encomendas.find((item) => item.id === encomendaOrigemId) ?? null : null;
  const fichaOrigemId = searchParams.get("from") === "ficha" ? searchParams.get("id") : null;
  const fichaOrigem = fichaOrigemId ? fichas.find((item) => item.id === fichaOrigemId) ?? null : null;
  const editando = Boolean(venda);
  const vieuDoDashboard = searchParams.get("from") === "dashboard";
  const breadcrumb = vieuDoDashboard
    ? ["Dashboard", "Venda", editando ? "Editar venda" : "Nova venda"]
    : ["Vendas", editando ? "Editar" : "Nova"];
  const cancelHref = vieuDoDashboard ? "/" : "/vendas";
  const clienteIdInicial = venda
    ? clientes.find((item) => item.nome === venda.cliente)?.id ?? null
    : encomendaOrigem
      ? clientes.find((item) => item.nome === encomendaOrigem.cliente)?.id ?? null
      : fichaOrigem
        ? clientes.find((item) => item.nome === fichaOrigem.revendedora)?.id ?? null
      : null;
  const primeiroProduto = produtos[0];
  const [buscaCliente, setBuscaCliente] = useState("");
  const [clienteId, setClienteId] = useState<string | null>(clienteIdInicial);
  const [buscaProduto, setBuscaProduto] = useState("");
  const [itens, setItens] = useState<Item[]>(
    venda && primeiroProduto
      ? [{ produtoId: primeiroProduto.id, tamanho: "M", quantidade: venda.pecas, preco: primeiroProduto.precoVarejo }]
      : []
  );
  const [desconto, setDesconto] = useState(0);
  const [valorPago, setValorPago] = useState(0);
  const idempotencyKey = useRef(crypto.randomUUID());
  const [gerando, setGerando] = useState(false);
  const { data: itensEncomendaOrigem } = useItensEncomenda(encomendaOrigemId ?? "");
  const itensPreenchidos = useRef(false);

  useEffect(() => {
    if (itensPreenchidos.current) return;
    if (!encomendaOrigemId || produtos.length === 0) return;

    if (parcial) {
      itensPreenchidos.current = true;
      const str = sessionStorage.getItem("sono_leve_itens_venda");
      sessionStorage.removeItem("sono_leve_itens_venda");
      if (!str) return;
      const novosItens = mapearItensParaVenda(JSON.parse(str) as PieceDetailItem[], produtos);
      if (novosItens.length > 0) setItens(novosItens);
    } else {
      if (!itensEncomendaOrigem || itensEncomendaOrigem.length === 0) return;
      itensPreenchidos.current = true;
      const novosItens = mapearItensParaVenda(itensEncomendaOrigem, produtos);
      if (novosItens.length > 0) setItens(novosItens);
    }
  }, [itensEncomendaOrigem, encomendaOrigemId, parcial, produtos]);

  const cliente = clientes.find((c) => c.id === clienteId) ?? null;
  const tipoCliente = cliente?.tipo ?? "varejo";

  const clientesFiltrados = buscaCliente
    ? clientes.filter((c) => c.nome.toLowerCase().includes(buscaCliente.toLowerCase()))
    : [];
  const produtosFiltrados = buscaProduto
    ? produtos.filter(
        (p) =>
          p.ativo &&
          (p.nome.toLowerCase().includes(buscaProduto.toLowerCase()) ||
            p.ref.toLowerCase().includes(buscaProduto.toLowerCase()))
      )
    : [];

  const adicionarProduto = (produtoId: string) => {
    const p = produtos.find((x) => x.id === produtoId)!;
    const preco = tipoCliente === "atacado" ? p.precoAtacado : p.precoVarejo;
    setItens((prev) => [...prev, ...tamanhos.map((t) => ({ produtoId, tamanho: t, quantidade: 0, preco }))]);
    setBuscaProduto("");
  };

  const atualizarQuantidade = (idx: number, quantidade: number) =>
    setItens((prev) => prev.map((it, i) => (i === idx ? { ...it, quantidade: Math.max(0, quantidade) } : it)));

  const itensValidos = useMemo(() => itens.filter((i) => i.quantidade > 0), [itens]);
  const subtotal = itensValidos.reduce((s, i) => s + i.quantidade * i.preco, 0);
  const total = Math.max(0, subtotal - desconto);
  const saldo = Math.max(0, total - valorPago);
  const troco = Math.max(0, valorPago - total);

  const agrupados = useMemo(() => {
    const map = new Map<string, Item[]>();
    itens.forEach((it) => {
      if (!map.has(it.produtoId)) map.set(it.produtoId, []);
      map.get(it.produtoId)!.push(it);
    });
    return Array.from(map.entries());
  }, [itens]);

  const saldoRestante = encomendaOrigem ? Math.max(0, encomendaOrigem.total - total) : 0;

  const handleGerar = async () => {
    if (!cliente) return toast.error("Selecione um cliente");
    if (itensValidos.length === 0) return toast.error("Adicione ao menos um item");
    setGerando(true);
    try {
      const origem: Sale["origem"] = encomendaOrigem ? "Encomenda" : fichaOrigem ? "Ficha" : "Balcão";
      const payload = {
        id: venda?.id,
        cliente: cliente.nome,
        data: venda?.data,
        pecas: itensValidos.reduce((sum, item) => sum + item.quantidade, 0),
        pagamento: valorPago > 0 && saldo > 0 ? "Parcial" : valorPago > 0 ? "Pago" : "A receber",
        total,
        status: venda?.status ?? "Gerada" as const,
        origem,
        items: itensValidos.map((item) => {
          const produto = produtos.find((entry) => entry.id === item.produtoId)!;
          return {
            product: produto.nome,
            ref: produto.ref,
            size: item.tamanho,
            quantity: item.quantidade,
            unitPrice: item.preco,
          };
        }),
      };

      if (editando) await api.atualizarVenda({ ...payload, id: venda!.id });
      else await api.salvarVenda(payload, idempotencyKey.current);

      if (!editando && encomendaOrigem?.status === "Fabricado parcialmente" && saldoRestante > 0) {
        await api.salvarEncomenda({
          id: `${encomendaOrigem.id}-R${Date.now().toString().slice(-4)}`,
          cliente: encomendaOrigem.cliente,
          criadoEm: new Date().toISOString().slice(0, 10),
          previsao: encomendaOrigem.previsao,
          total: Number(saldoRestante.toFixed(2)),
          entrada: 0,
          status: "Aberta",
          items: [],
        });
        await api.atualizarStatusEncomenda(encomendaOrigem.id, "Entregue");
        toast.success(`Venda gerada e nova encomenda criada com saldo restante de ${formatBRL(saldoRestante)}!`);
      } else {
        if (!editando && encomendaOrigem) await api.atualizarStatusEncomenda(encomendaOrigem.id, "Entregue");
        toast.success(editando ? "Venda atualizada com sucesso!" : "Venda gerada com sucesso!");
      }
      await queryClient.invalidateQueries({ queryKey: ["vendas"] });
      await queryClient.invalidateQueries({ queryKey: ["encomendas"] });
      if (!editando) {
        setItens([]); setValorPago(0); setDesconto(0);
      }
      router.push("/vendas");
    } catch {
      toast.error("Não foi possível salvar a venda.");
    } finally {
      setGerando(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        breadcrumb={breadcrumb}
        title={editando ? "Editar venda" : "Nova venda"}
        status={editando ? venda?.status : itens.length === 0 ? "Não salvo" : undefined}
        actions={
          <FormHeaderActions
            cancelHref={cancelHref}
            cancelLabel={`Cancelar${cancelShortcutLabel}`}
            onSave={handleGerar}
            saving={gerando}
            idleLabel={`${editando ? "Salvar alterações" : "Gerar venda"}${saveShortcutLabel}`}
          />
        }
      />

      <div className="flex-1 overflow-y-auto">
      <div className="grid gap-6 p-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* Cliente */}
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Cliente</h3>
            {cliente ? (
              <div className="flex items-center justify-between rounded-md border bg-primary-soft/40 p-3">
                <div>
                  <div className="font-medium">{cliente.nome}</div>
                  <div className="text-xs text-muted-foreground">
                    {cliente.telefone} · <span className="font-medium uppercase text-primary">{cliente.tipo}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setClienteId(null)}>Trocar</Button>
              </div>
            ) : (
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente..."
                  className="pl-9"
                  value={buscaCliente}
                  onChange={(e) => setBuscaCliente(e.target.value)}
                />
                {clientesFiltrados.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-lg">
                    {clientesFiltrados.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => { setClienteId(c.id); setBuscaCliente(""); }}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                      >
                        <span>{c.nome}</span>
                        <span className="text-xs uppercase text-muted-foreground">{c.tipo}</span>
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

          {encomendaOrigem && (
            <Card className="border-primary/15 bg-primary/5 p-5">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Origem da venda</h3>
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Encomenda</div>
                  <div className="font-medium">{encomendaOrigem.id}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Status</div>
                  <div className="font-medium">{encomendaOrigem.status}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Saldo projetado</div>
                  <div className="font-medium">{formatBRL(saldoRestante)}</div>
                </div>
              </div>
              {encomendaOrigem.status === "Fabricado parcialmente" && (
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
                value={buscaProduto}
                onChange={(e) => setBuscaProduto(e.target.value)}
              />
              {produtosFiltrados.length > 0 && (
                <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-lg">
                  {produtosFiltrados.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => adicionarProduto(p.id)}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted"
                    >
                      {p.imagemUrl ? (
                        <img src={`${BASE_URL}${p.imagemUrl}`} alt="" className="h-8 w-8 shrink-0 rounded object-cover" />
                      ) : (
                        <div className="h-8 w-8 shrink-0 rounded bg-muted" />
                      )}
                      <span className="flex-1 min-w-0">{p.nome} <span className="text-xs text-muted-foreground">({p.ref})</span></span>
                      <span className="shrink-0 text-xs font-semibold">
                        {formatBRL(tipoCliente === "atacado" ? p.precoAtacado : p.precoVarejo)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {agrupados.length === 0 ? (
              <div className="rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
                Busque um produto acima para começar
              </div>
            ) : (
              <div className="space-y-4">
                {agrupados.map(([pid, grupo]) => {
                  const p = produtos.find((x) => x.id === pid)!;
                  return (
                    <div key={pid} className="rounded-md border p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {p.imagemUrl ? (
                            <img src={`${BASE_URL}${p.imagemUrl}`} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
                          ) : (
                            <div className="h-10 w-10 shrink-0 rounded bg-muted" />
                          )}
                          <div>
                            <div className="font-medium">{p.nome}</div>
                            <div className="text-xs text-muted-foreground">{p.ref} · {formatBRL(grupo[0].preco)}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => setItens((prev) => prev.filter((i) => i.produtoId !== pid))}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        {grupo.map((it) => {
                          const idx = itens.indexOf(it);
                          return (
                            <div key={it.tamanho} className="rounded-md bg-muted/40 p-2 text-center">
                              <div className="text-xs font-semibold uppercase text-muted-foreground">{it.tamanho}</div>
                              <Input
                                type="number"
                                min={0}
                                value={it.quantidade}
                                onChange={(e) => atualizarQuantidade(idx, +e.target.value)}
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
            <Linha label="Subtotal" valor={formatBRL(subtotal)} />
            <Linha label="Peças" valor={itensValidos.reduce((s, i) => s + i.quantidade, 0).toString()} />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Desconto</span>
              <Input
                type="number"
                value={desconto}
                onChange={(e) => setDesconto(+e.target.value || 0)}
                className="h-8 w-28 text-right"
              />
            </div>
            <div className="my-3 border-t" />
            <Linha label="Total" valor={formatBRL(total)} negrito />
            {encomendaOrigem?.status === "Fabricado parcialmente" && (
              <Linha label="Restante na nova encomenda" valor={formatBRL(saldoRestante)} tom={saldoRestante > 0 ? "aviso" : "mudo"} />
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Valor pago</span>
              <Input
                type="number"
                value={valorPago}
                onChange={(e) => setValorPago(+e.target.value || 0)}
                className="h-8 w-28 text-right"
              />
            </div>
            <Linha label="Saldo em aberto" valor={formatBRL(saldo)} tom={saldo > 0 ? "aviso" : "mudo"} />
            {troco > 0 && <Linha label="Troco" valor={formatBRL(troco)} tom="sucesso" />}
          </div>
          <Button className="mt-5 w-full" size="lg" onClick={handleGerar} disabled={gerando}>
            {gerando ? "Salvando..." : editando ? "Salvar alterações" : "Gerar venda"}
          </Button>
        </Card>
      </div>
      </div>
    </AppShell>
  );
}

function mapearItensParaVenda(fonte: PieceDetailItem[], produtos: { id: string; ref: string; nome: string }[]): Item[] {
  return fonte
    .filter((pi) => pi.quantity > 0)
    .map((pi) => {
      const produto = produtos.find((p) => p.ref === pi.ref) ?? produtos.find((p) => p.nome === pi.product);
      if (!produto) return null;
      return { produtoId: produto.id, tamanho: pi.size, quantidade: pi.quantity, preco: pi.unitPrice };
    })
    .filter(Boolean) as Item[];
}

function Linha({ label, valor, negrito, tom }: { label: string; valor: string; negrito?: boolean; tom?: "mudo" | "aviso" | "sucesso" }) {
  const tomClass = tom === "aviso" ? "text-warning" : tom === "sucesso" ? "text-[hsl(var(--success))]" : "";
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`${negrito ? "text-base font-semibold" : ""} ${tomClass}`}>{valor}</span>
    </div>
  );
}
