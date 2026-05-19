import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { AppSelect } from "@/components/AppSelect";
import { FormHeaderActions } from "@/components/FormHeaderActions";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { formatBRL, type ItemVenda, type Product, type Sale } from "@/lib/types";
import { api, useBuscarProdutos, useDadosOperacionais, useFormasPagamento, useItensEncomenda, type VendaSalvar } from "@/lib/api";
import { BASE_URL } from "@/lib/http";
import { useShortcutLabel } from "@/hooks/useShortcutLabel";
import { Search, X, UserPlus, CreditCard } from "lucide-react";
import { toast } from "sonner";

interface Item {
  produtoId: string;
  tamanho: string;
  quantidade: number;
  preco: number;
}

interface DescProduto { pct: number; val: number; }
const ZERO_DESC: DescProduto = { pct: 0, val: 0 };
const GRADE_PADRAO = ["P", "M", "G", "GG"];

function calcPrecoEfetivo(preco: number, desc: DescProduto): number {
  if (desc.pct > 0) return preco * (1 - desc.pct / 100);
  if (desc.val > 0) return Math.max(0, preco - desc.val);
  return preco;
}

function dataHoje() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function NovaVenda() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { clientes, fichas, encomendas, produtos, vendas } = useDadosOperacionais();
  const { data: formasPagamento = [] } = useFormasPagamento();
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
    ? venda.clienteId
    : encomendaOrigem
      ? encomendaOrigem.clienteId
      : fichaOrigem
        ? fichaOrigem.clienteId
      : null;
  const primeiroProduto = produtos[0];

  const [buscaCliente, setBuscaCliente] = useState("");
  const [clienteId, setClienteId] = useState<string | null>(clienteIdInicial);
  const [buscaProduto, setBuscaProduto] = useState("");
  const [termoBusca, setTermoBusca] = useState("");
  const [produtosAdicionados, setProdutosAdicionados] = useState<Record<string, Product>>({});
  const [itens, setItens] = useState<Item[]>(
    venda && primeiroProduto
      ? [{ produtoId: primeiroProduto.id, tamanho: "M", quantidade: venda.pecas, preco: primeiroProduto.precoVarejo }]
      : []
  );
  const [descontoGlobal, setDescontoGlobal] = useState(0);
  const [descontosPorProduto, setDescontosPorProduto] = useState<Record<string, DescProduto>>({});
  const [formaPagamentoId, setFormaPagamentoId] = useState(venda?.formaPagamentoId ?? "");
  const [valorPago, setValorPago] = useState(0);
  const [dataVenda, setDataVenda] = useState(venda?.data?.substring(0, 10) ?? dataHoje());
  const [modalPagamento, setModalPagamento] = useState(false);
  const [fpModal, setFpModal] = useState("");
  const [valorModal, setValorModal] = useState(0);
  const idempotencyKey = useRef(crypto.randomUUID());
  const [gerando, setGerando] = useState(false);
  const { data: itensEncomendaOrigem } = useItensEncomenda(encomendaOrigemId ?? "");
  const itensPreenchidos = useRef(false);

  useEffect(() => {
    if (!buscaProduto.trim()) { setTermoBusca(""); return; }
    const t = setTimeout(() => setTermoBusca(buscaProduto.trim()), 300);
    return () => clearTimeout(t);
  }, [buscaProduto]);

  const { data: resultadoBusca = [], isLoading: buscando } = useBuscarProdutos(termoBusca);

  useEffect(() => {
    if (itensPreenchidos.current) return;
    if (!encomendaOrigemId || produtos.length === 0) return;
    if (parcial) {
      itensPreenchidos.current = true;
      const str = sessionStorage.getItem("sono_leve_itens_venda");
      sessionStorage.removeItem("sono_leve_itens_venda");
      if (!str) return;
      const novosItens = mapearItensParaVenda(JSON.parse(str) as ItemVenda[]);
      if (novosItens.length > 0) setItens(novosItens);
    } else {
      if (!itensEncomendaOrigem || itensEncomendaOrigem.length === 0) return;
      itensPreenchidos.current = true;
      const novosItens = mapearItensParaVenda(itensEncomendaOrigem);
      if (novosItens.length > 0) setItens(novosItens);
    }
  }, [itensEncomendaOrigem, encomendaOrigemId, parcial, produtos]);

  const cliente = clientes.find((c) => c.id === clienteId) ?? null;
  const tipoCliente = cliente?.tipo ?? "varejo";

  const clientesFiltrados = buscaCliente
    ? clientes.filter((c) => c.nome.toLowerCase().includes(buscaCliente.toLowerCase()))
    : [];
  const produtosFiltrados = resultadoBusca.filter((p) => p.ativo);

  const adicionarProduto = (produto: Product) => {
    if (itens.some((i) => i.produtoId === produto.id)) {
      toast.info("Produto já adicionado. Ajuste as quantidades nos tamanhos.");
      setBuscaProduto("");
      return;
    }
    const preco = tipoCliente === "atacado" ? produto.precoAtacado : produto.precoVarejo;
    const grade = produto.categoriaGrade?.length ? produto.categoriaGrade : GRADE_PADRAO;
    setProdutosAdicionados((prev) => ({ ...prev, [produto.id]: produto }));
    setItens((prev) => [...prev, ...grade.map((t) => ({ produtoId: produto.id, tamanho: t, quantidade: 0, preco }))]);
    setBuscaProduto("");
  };

  const atualizarQuantidade = (idx: number, quantidade: number) =>
    setItens((prev) => prev.map((it, i) => (i === idx ? { ...it, quantidade: Math.max(0, quantidade) } : it)));

  const itensValidos = useMemo(() => itens.filter((i) => i.quantidade > 0), [itens]);

  const subtotal = useMemo(
    () =>
      itensValidos.reduce((s, i) => {
        const d = descontosPorProduto[i.produtoId] ?? ZERO_DESC;
        return s + i.quantidade * calcPrecoEfetivo(i.preco, d);
      }, 0),
    [itensValidos, descontosPorProduto]
  );
  const total = Math.max(0, subtotal - descontoGlobal);
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

  const executarGerar = async (fpId: string, vPago: number) => {
    setGerando(true);
    try {
      const origem: Sale["origem"] = encomendaOrigem ? "Encomenda" : fichaOrigem ? "Ficha" : "Balcão";
      const payload: VendaSalvar = {
        id: venda?.id,
        clienteId: cliente!.id,
        formaPagamentoId: fpId || undefined,
        data: new Date(dataVenda + "T12:00:00").toISOString(),
        pecas: itensValidos.reduce((sum, item) => sum + item.quantidade, 0),
        total,
        status: venda?.status ?? "Gerada" as const,
        origem,
        items: itensValidos.map((item) => {
          const desc = descontosPorProduto[item.produtoId] ?? ZERO_DESC;
          return {
            produtoId: item.produtoId,
            tamanho: item.tamanho,
            quantidade: item.quantidade,
            precoUnitario: calcPrecoEfetivo(item.preco, desc),
            descontoPct: desc.pct > 0 ? desc.pct : undefined,
            descontoVal: desc.val > 0 ? desc.val : undefined,
          };
        }),
      };

      if (editando) await api.atualizarVenda({ ...payload, id: venda!.id });
      else await api.salvarVenda(payload, idempotencyKey.current);

      if (!editando && encomendaOrigem?.status === "Fabricado parcialmente" && saldoRestante > 0) {
        await api.salvarEncomenda({
          clienteId: encomendaOrigem.clienteId,
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
        setItens([]); setValorPago(0); setDescontoGlobal(0); setDescontosPorProduto({} as Record<string, DescProduto>);
      }
      router.push("/vendas");
    } catch {
      toast.error("Não foi possível salvar a venda.");
    } finally {
      setGerando(false);
    }
  };

  const handleGerar = () => {
    if (!cliente) return toast.error("Selecione um cliente");
    if (itensValidos.length === 0) return toast.error("Adicione ao menos um item");
    if (!formaPagamentoId) {
      setFpModal("");
      setValorModal(0);
      setModalPagamento(true);
      return;
    }
    executarGerar(formaPagamentoId, valorPago);
  };

  const formasPagamentoAtivas = formasPagamento.filter((f) => f.ativo);

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

          {/* Coluna esquerda: apenas produtos */}
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
                {(buscando && termoBusca) && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover px-3 py-2 text-sm text-muted-foreground shadow-lg">
                    Buscando...
                  </div>
                )}
                {!buscando && produtosFiltrados.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-lg">
                    {produtosFiltrados.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => adicionarProduto(p)}
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
                <div className="space-y-2">
                  {agrupados.map(([pid, grupo]) => {
                    const p = produtosAdicionados[pid] ?? produtos.find((x) => x.id === pid);
                    if (!p) return null;
                    const descProduto = descontosPorProduto[pid] ?? ZERO_DESC;
                    const temDesconto = descProduto.pct > 0 || descProduto.val > 0;
                    const precoEfetivo = calcPrecoEfetivo(grupo[0].preco, descProduto);
                    return (
                      <div key={pid} className="rounded-md border p-2.5">
                        {/* Cabeçalho compacto */}
                        <div className="mb-2 flex items-center gap-2">
                          {p.imagemUrl ? (
                            <img src={`${BASE_URL}${p.imagemUrl}`} alt="" className="h-8 w-8 shrink-0 rounded object-cover" />
                          ) : (
                            <div className="h-8 w-8 shrink-0 rounded bg-muted" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="truncate text-sm font-medium leading-tight">{p.nome}</div>
                            <div className="text-xs text-muted-foreground">
                              {p.ref} ·{" "}
                              {temDesconto ? (
                                <>
                                  <span className="line-through opacity-50">{formatBRL(grupo[0].preco)}</span>
                                  {" "}
                                  <span className="font-semibold text-[hsl(var(--success))]">{formatBRL(precoEfetivo)}</span>
                                </>
                              ) : (
                                formatBRL(grupo[0].preco)
                              )}
                            </div>
                          </div>
                          {/* Desconto R$ */}
                          <div className="relative w-[62px] shrink-0">
                            <span className="pointer-events-none absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">R$</span>
                            <Input
                              type="number"
                              min={0}
                              value={descProduto.val || ""}
                              onChange={(e) => {
                                const v = Math.max(0, Number(e.target.value) || 0);
                                setDescontosPorProduto((prev) => ({ ...prev, [pid]: { pct: 0, val: v } }));
                              }}
                              disabled={descProduto.pct > 0}
                              placeholder="0"
                              className="h-7 pl-7 pr-1 text-right text-xs disabled:opacity-40"
                            />
                          </div>
                          {/* Desconto % */}
                          <div className="relative w-[52px] shrink-0">
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              step={1}
                              value={descProduto.pct || ""}
                              onChange={(e) => {
                                const v = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                                setDescontosPorProduto((prev) => ({ ...prev, [pid]: { pct: v, val: 0 } }));
                              }}
                              disabled={descProduto.val > 0}
                              placeholder="0"
                              className="h-7 pr-5 text-right text-xs disabled:opacity-40"
                            />
                            <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">%</span>
                          </div>
                          <button
                            onClick={() => setItens((prev) => prev.filter((i) => i.produtoId !== pid))}
                            className="shrink-0 text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        {/* Tamanhos em linha única */}
                        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                          {grupo.map((it) => {
                            const idx = itens.indexOf(it);
                            return (
                              <div key={it.tamanho} className="shrink-0 w-12 text-center">
                                <div className="text-[10px] font-semibold uppercase text-muted-foreground">{it.tamanho}</div>
                                <Input
                                  type="number"
                                  min={0}
                                  value={it.quantidade}
                                  onChange={(e) => atualizarQuantidade(idx, +e.target.value)}
                                  className="mt-0.5 h-8 border-muted/60 px-1 text-center text-sm font-semibold"
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

          {/* Coluna direita */}
          <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            {/* Resumo (inclui cliente) */}
            <Card className="p-5">
              {/* Cliente */}
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

              {/* Origem da venda (compacto) */}
              {encomendaOrigem && (
                <div className="mt-3 rounded-md border border-primary/15 bg-primary/5 px-3 py-2 text-xs">
                  <span className="font-medium text-primary">Encomenda</span>
                  <span className="mx-1 text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{encomendaOrigem.status}</span>
                  {encomendaOrigem.status === "Fabricado parcialmente" && saldoRestante > 0 && (
                    <span className="ml-1 text-warning">· saldo {formatBRL(saldoRestante)}</span>
                  )}
                </div>
              )}

              <div className="my-4 border-t" />

              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Resumo</h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Data da venda</span>
                  <Input
                    type="date"
                    value={dataVenda}
                    onChange={(e) => setDataVenda(e.target.value)}
                    className="h-8 w-44 text-right"
                  />
                </div>
                <Linha label="Subtotal" valor={formatBRL(subtotal)} />
                <Linha label="Peças" valor={itensValidos.reduce((s, i) => s + i.quantidade, 0).toString()} />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Desconto (R$)</span>
                  <Input
                    type="number"
                    min={0}
                    value={descontoGlobal || ""}
                    onChange={(e) => setDescontoGlobal(+e.target.value || 0)}
                    placeholder="0"
                    className="h-8 w-28 text-right"
                  />
                </div>
                <div className="my-3 border-t" />
                <Linha label="Total" valor={formatBRL(total)} negrito />
                {encomendaOrigem?.status === "Fabricado parcialmente" && (
                  <Linha label="Restante na nova encomenda" valor={formatBRL(saldoRestante)} tom={saldoRestante > 0 ? "aviso" : "mudo"} />
                )}
              </div>
            </Card>

            {/* Pagamento */}
            <Card className="p-5">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <CreditCard className="h-4 w-4" /> Pagamento
              </h3>
              <div className="space-y-3 text-sm">
                <label className="space-y-1.5">
                  <span className="text-xs text-muted-foreground">Forma de pagamento</span>
                  <AppSelect
                    value={formaPagamentoId}
                    onValueChange={setFormaPagamentoId}
                    placeholder="Selecionar..."
                    options={formasPagamentoAtivas.map((f) => ({
                      value: f.id,
                      label: `${f.nome}${f.condicao ? ` — ${f.condicao}` : ""}`,
                    }))}
                  />
                </label>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Valor pago</span>
                  <Input
                    type="number"
                    min={0}
                    value={valorPago || ""}
                    onChange={(e) => setValorPago(+e.target.value || 0)}
                    placeholder="0"
                    className="h-8 w-28 text-right"
                  />
                </div>
                {(valorPago > 0 || saldo > 0) && (
                  <>
                    <div className="border-t pt-2" />
                    <Linha label="Saldo em aberto" valor={formatBRL(saldo)} tom={saldo > 0 ? "aviso" : "mudo"} />
                    {troco > 0 && <Linha label="Troco" valor={formatBRL(troco)} tom="sucesso" />}
                  </>
                )}
              </div>
              <Button className="mt-5 w-full" size="lg" onClick={handleGerar} disabled={gerando}>
                {gerando ? "Salvando..." : editando ? "Salvar alterações" : "Gerar venda"}
              </Button>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal: pagamento não preenchido */}
      <Dialog open={modalPagamento} onOpenChange={setModalPagamento}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Informar pagamento</DialogTitle>
            <DialogDescription>
              Nenhuma forma de pagamento foi selecionada. Deseja informar agora ou gerar a venda sem pagamento?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm">
            <label className="space-y-1.5">
              <span className="text-xs text-muted-foreground">Forma de pagamento</span>
              <AppSelect
                value={fpModal}
                onValueChange={setFpModal}
                placeholder="Selecionar..."
                options={formasPagamentoAtivas.map((f) => ({
                  value: f.id,
                  label: `${f.nome}${f.condicao ? ` — ${f.condicao}` : ""}`,
                }))}
              />
            </label>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Valor pago</span>
              <Input
                type="number"
                min={0}
                value={valorModal || ""}
                onChange={(e) => setValorModal(+e.target.value || 0)}
                placeholder="0"
                className="h-8 w-28 text-right"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => {
                setModalPagamento(false);
                executarGerar("", 0);
              }}
              disabled={gerando}
            >
              Gerar sem pagamento
            </Button>
            <Button
              onClick={() => {
                setFormaPagamentoId(fpModal);
                setValorPago(valorModal);
                setModalPagamento(false);
                executarGerar(fpModal, valorModal);
              }}
              disabled={gerando || !fpModal}
            >
              Confirmar e gerar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function mapearItensParaVenda(fonte: ItemVenda[]): Item[] {
  return fonte
    .filter((pi) => pi.quantidade > 0)
    .map((pi) => ({
      produtoId: pi.produtoId,
      tamanho: pi.tamanho,
      quantidade: pi.quantidade,
      preco: pi.precoUnitario,
    }));
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
