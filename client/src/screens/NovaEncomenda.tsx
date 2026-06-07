import { gerarUUID } from "@/lib/uuid";
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
import { formatBRL } from "@/lib/types";
import type { Product } from "@/lib/types";
import { api, useClientes, useBuscarProdutos, useEncomendaPorId, useItensEncomenda, useClientePorId, useDadosOperacionais } from "@/lib/api";
import { ProdutoImagem } from "@/components/ProdutoImagem";
import { useShortcutLabel } from "@/hooks/useShortcutLabel";
import { Search, X } from "lucide-react";
import { toast } from "sonner";

interface Item { produtoId: string; tamanho: string; quantidade: number; preco: number; }
interface DescProduto { pct: number; val: number; }
const ZERO_DESC: DescProduto = { pct: 0, val: 0 };
const GRADE_PADRAO = ["P", "M", "G", "GG"];
const PRODUTOS_VAZIOS: Product[] = [];

function calcPrecoEfetivo(preco: number, desc: DescProduto): number {
  if (desc.pct > 0) return preco * (1 - desc.pct / 100);
  if (desc.val > 0) return Math.max(0, preco - desc.val);
  return preco;
}

export default function NovaEncomenda() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { produtos } = useDadosOperacionais();
  const { data: clientes = [] } = useClientes();
  const cancelShortcutLabel = useShortcutLabel("cancel");
  const saveShortcutLabel = useShortcutLabel("save");
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();
  const { data: encomenda } = useEncomendaPorId(params.id);
  const { data: itensExistentes } = useItensEncomenda(params.id ?? "");
  const editando = Boolean(params.id);
  const vieuDoDashboard = searchParams.get("from") === "dashboard";
  const breadcrumb = vieuDoDashboard
    ? ["Dashboard", "Encomenda", editando ? "Editar encomenda" : "Nova encomenda"]
    : ["Encomendas", editando ? "Editar" : "Nova"];
  const cancelHref = vieuDoDashboard ? "/" : "/encomendas";
  const idempotencyKey = useRef(gerarUUID());
  const itensPreenchidos = useRef(false);

  const [salvando, setSalvando] = useState(false);
  const [tentouSalvar, setTentouSalvar] = useState(false);
  const [clienteId, setClienteId] = useState(encomenda?.clienteId ?? clientes[0]?.id ?? "");
  const [previsao, setPrevisao] = useState(encomenda?.previsao ?? "");
  const [entrada, setEntrada] = useState(encomenda?.entrada ?? 0);

  // ── Produtos ──────────────────────────────────────────────────────────────
  const [itens, setItens] = useState<Item[]>([]);
  const [produtosAdicionados, setProdutosAdicionados] = useState<Record<string, Product>>({});
  const [descontosPorProduto, setDescontosPorProduto] = useState<Record<string, DescProduto>>({});
  const [descontoGlobal, setDescontoGlobal] = useState(0);
  const [modoDescontoGlobal, setModoDescontoGlobal] = useState<"fixo" | "percentual">("fixo");
  const [descontoGlobalPct, setDescontoGlobalPct] = useState(0);

  const [buscaProduto, setBuscaProduto] = useState("");
  const [termoBusca, setTermoBusca] = useState("");
  const [indiceProduto, setIndiceProduto] = useState(-1);
  const [produtosVisiveis, setProdutosVisiveis] = useState<Product[]>([]);

  const refBuscaProduto = useRef<HTMLInputElement>(null);
  const refDropdownProduto = useRef<HTMLDivElement>(null);

  const aguardandoDebounce = buscaProduto.trim() !== termoBusca;
  const { data: resultadoBusca = PRODUTOS_VAZIOS, isFetching: buscando } = useBuscarProdutos(termoBusca);
  const { data: clienteSelecionado } = useClientePorId(clienteId || undefined);
  const tipoCliente = clienteSelecionado?.tipo ?? "varejo";

  useEffect(() => {
    if (!buscaProduto.trim()) { setTermoBusca(""); setProdutosVisiveis([]); return; }
    const t = setTimeout(() => setTermoBusca(buscaProduto.trim()), 300);
    return () => clearTimeout(t);
  }, [buscaProduto]);

  useEffect(() => {
    if (!buscando) setProdutosVisiveis(resultadoBusca.filter((p) => p.ativo));
  }, [resultadoBusca, buscando]);

  useEffect(() => { setIndiceProduto(-1); }, [produtosVisiveis]);

  useEffect(() => {
    const fechar = (e: MouseEvent) => {
      if (refDropdownProduto.current && !refDropdownProduto.current.contains(e.target as Node))
        setBuscaProduto("");
    };
    document.addEventListener("mousedown", fechar);
    return () => document.removeEventListener("mousedown", fechar);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "+") { e.preventDefault(); refBuscaProduto.current?.focus(); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Preencher campos ao editar
  useEffect(() => {
    if (!encomenda) { if (!clienteId && clientes[0]) setClienteId(clientes[0].id); return; }
    setClienteId(encomenda.clienteId);
    setPrevisao(encomenda.previsao);
    setEntrada(encomenda.entrada);
  }, [encomenda, clientes, clienteId]);

  // Restaurar itens ao editar
  useEffect(() => {
    if (!editando || itensPreenchidos.current || !itensExistentes?.length) return;
    itensPreenchidos.current = true;
    const novosDescontos: Record<string, DescProduto> = {};
    const novosItens: Item[] = itensExistentes.map((iv) => {
      const pct = iv.descontoPct ?? 0;
      const val = iv.descontoVal ?? 0;
      if (pct > 0) novosDescontos[iv.produtoId] = { pct, val: 0 };
      else if (val > 0) novosDescontos[iv.produtoId] = { pct: 0, val };
      let preco = iv.precoUnitario;
      if (pct > 0) preco = iv.precoUnitario / (1 - pct / 100);
      else if (val > 0) preco = iv.precoUnitario + val;
      return { produtoId: iv.produtoId, tamanho: iv.tamanho, quantidade: iv.quantidade, preco };
    });
    setItens(novosItens);
    if (Object.keys(novosDescontos).length > 0) setDescontosPorProduto(novosDescontos);
  }, [itensExistentes, editando]);

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
    setIndiceProduto(-1);
  };

  const atualizarQuantidade = (idx: number, raw: string | number) => {
    const quantidade = raw === "" ? 0 : Math.max(0, Number(raw) || 0);
    setItens((prev) => prev.map((it, i) => (i === idx ? { ...it, quantidade } : it)));
  };

  const itensValidos = useMemo(() => itens.filter((i) => i.quantidade > 0), [itens]);

  const subtotal = useMemo(() =>
    itensValidos.reduce((s, i) => {
      const d = descontosPorProduto[i.produtoId] ?? ZERO_DESC;
      return s + i.quantidade * calcPrecoEfetivo(i.preco, d);
    }, 0),
  [itensValidos, descontosPorProduto]);

  const descontoEfetivo = modoDescontoGlobal === "percentual" ? subtotal * (descontoGlobalPct / 100) : descontoGlobal;
  const total = Math.max(0, subtotal - descontoEfetivo);
  const saldoAberto = Math.max(0, total - entrada);

  const agrupados = useMemo(() => {
    const map = new Map<string, Item[]>();
    itens.forEach((it) => {
      if (!map.has(it.produtoId)) map.set(it.produtoId, []);
      map.get(it.produtoId)!.push(it);
    });
    return Array.from(map.entries());
  }, [itens]);

  const handleKeyDownProduto = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") { setBuscaProduto(""); return; }
    if (buscaProduto.trim().length < 2) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setIndiceProduto((p) => Math.min(p + 1, produtosVisiveis.length - 1)); return; }
    if (e.key === "ArrowUp") { e.preventDefault(); setIndiceProduto((p) => Math.max(p - 1, 0)); return; }
    if (e.key === "Enter" && indiceProduto >= 0 && produtosVisiveis[indiceProduto]) {
      e.preventDefault(); adicionarProduto(produtosVisiveis[indiceProduto]);
    }
  };

  const handleSalvar = async () => {
    setTentouSalvar(true);
    if (!clienteId) return toast.error("Selecione um cliente.");
    if (!previsao) return toast.error("Informe a previsão de entrega.");
    if (itensValidos.length === 0) return toast.error("Adicione ao menos um item.");

    setSalvando(true);
    try {
      const payload = {
        id: encomenda?.id,
        clienteId,
        previsao,
        total,
        entrada,
        status: encomenda?.status ?? "Aberta" as const,
        items: itensValidos.map((item) => {
          const desc = descontosPorProduto[item.produtoId] ?? ZERO_DESC;
          const precoEfetivoProduto = calcPrecoEfetivo(item.preco, desc);
          if (modoDescontoGlobal === "percentual" && descontoGlobalPct > 0) {
            const pctCombinado = 100 - (1 - (desc.pct > 0 ? desc.pct : 0) / 100) * (1 - descontoGlobalPct / 100) * 100;
            return { produtoId: item.produtoId, tamanho: item.tamanho, quantidade: item.quantidade, precoUnitario: item.preco * (1 - pctCombinado / 100), descontoPct: pctCombinado > 0 ? Number(pctCombinado.toFixed(4)) : undefined };
          }
          if (modoDescontoGlobal === "fixo" && descontoGlobal > 0 && subtotal > 0) {
            const globalPorUnidade = (precoEfetivoProduto * item.quantidade / subtotal) * descontoGlobal / item.quantidade;
            const precoFinal = Math.max(0, precoEfetivoProduto - globalPorUnidade);
            const pctFinal = item.preco > 0 ? (1 - precoFinal / item.preco) * 100 : 0;
            return { produtoId: item.produtoId, tamanho: item.tamanho, quantidade: item.quantidade, precoUnitario: precoFinal, descontoPct: pctFinal > 0 ? Number(pctFinal.toFixed(4)) : undefined };
          }
          return { produtoId: item.produtoId, tamanho: item.tamanho, quantidade: item.quantidade, precoUnitario: precoEfetivoProduto, descontoPct: desc.pct > 0 ? desc.pct : undefined, descontoVal: desc.val > 0 ? desc.val : undefined };
        }),
      };
      if (editando) await api.atualizarEncomenda({ ...payload, id: encomenda!.id });
      else await api.salvarEncomenda(payload, idempotencyKey.current);
      await queryClient.invalidateQueries({ queryKey: ["encomendas"] });
      toast.success(editando ? "Encomenda atualizada com sucesso!" : "Encomenda cadastrada com sucesso!");
      router.push("/encomendas");
    } catch {
      toast.error("Não foi possível salvar a encomenda.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        breadcrumb={breadcrumb}
        title={editando ? "Editar encomenda" : "Nova encomenda"}
        status={editando ? encomenda?.status : "Não salvo"}
        actions={
          <FormHeaderActions
            cancelHref={cancelHref}
            cancelLabel={`Cancelar${cancelShortcutLabel}`}
            onSave={handleSalvar}
            saving={salvando}
            idleLabel={`${editando ? "Salvar alterações" : "Cadastrar encomenda"}${saveShortcutLabel}`}
          />
        }
      />

      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="flex h-full gap-6 overflow-hidden p-6 lg:flex-row">

          {/* ── Coluna esquerda: Cliente/Previsão + Produtos ── */}
          <Card className="flex min-h-0 flex-col overflow-hidden p-5 lg:flex-1">

            {/* Cabeçalho: Cliente + Previsão */}
            <div className="shrink-0 mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:gap-6">
              <label className="flex-1 min-w-0 space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Cliente <span className="text-destructive">*</span>
                </span>
                <AppSelect
                  value={clienteId}
                  onValueChange={setClienteId}
                  placeholder="Informe o cliente"
                  options={clientes.map((c) => ({ value: c.id, label: c.nome }))}
                  className={tentouSalvar && !clienteId ? "border-destructive" : ""}
                />
              </label>
              <label className="shrink-0 space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Previsão <span className="text-destructive">*</span>
                </span>
                <Input
                  type="date"
                  value={previsao}
                  onChange={(e) => setPrevisao(e.target.value)}
                  className={`h-9 w-36 text-sm${tentouSalvar && !previsao ? " border-destructive focus-visible:ring-destructive" : ""}`}
                />
              </label>
            </div>

            <div className="shrink-0 border-b mb-4" />

            {/* Título Produtos */}
            <h3 className="mb-3 shrink-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Produtos <span className="text-destructive">*</span>
            </h3>

            {/* Busca produto */}
            <div ref={refDropdownProduto} className="relative mb-4 shrink-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={refBuscaProduto}
                placeholder="Buscar por nome ou referência... (ou pressione +)"
                className="pl-9"
                value={buscaProduto}
                onChange={(e) => setBuscaProduto(e.target.value)}
                onKeyDown={handleKeyDownProduto}
              />
              {buscaProduto.trim().length >= 2 && (
                <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-lg">
                  {(buscando || aguardandoDebounce) && produtosVisiveis.length === 0 ? (
                    <div className="divide-y">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex animate-pulse items-center gap-3 px-3 py-2.5">
                          <div className="h-12 w-12 shrink-0 rounded bg-muted" />
                          <div className="flex-1 space-y-1.5">
                            <div className="h-3 w-2/3 rounded bg-muted" />
                            <div className="h-2.5 w-1/3 rounded bg-muted" />
                          </div>
                          <div className="h-3 w-12 rounded bg-muted" />
                        </div>
                      ))}
                    </div>
                  ) : produtosVisiveis.length > 0 ? (
                    <div className={`transition-opacity duration-150 ${buscando ? "opacity-50" : "opacity-100"}`}>
                      {produtosVisiveis.map((p, idx) => (
                        <button
                          key={p.id}
                          onClick={() => adicionarProduto(p)}
                          className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted ${indiceProduto === idx ? "bg-muted" : ""}`}
                        >
                          <ProdutoImagem imagemUrl={p.imagemUrl} className="h-12 w-12 shrink-0 rounded object-cover" />
                          <span className="min-w-0 flex-1">{p.nome} <span className="text-xs text-muted-foreground">({p.ref})</span></span>
                          <span className="shrink-0 text-xs font-semibold">{formatBRL(tipoCliente === "atacado" ? p.precoAtacado : p.precoVarejo)}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                      Nenhum produto encontrado
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Lista de produtos */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-0.5">
              {agrupados.length === 0 ? (
                <div className={`rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground${tentouSalvar && itensValidos.length === 0 ? " border-destructive text-destructive" : ""}`}>
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
                      <div key={pid} className="rounded-md border overflow-hidden flex">
                        <ProdutoImagem imagemUrl={p.imagemUrl} className="w-16 shrink-0 self-stretch object-cover" />
                        <div className="flex-1 min-w-0 p-2.5 flex flex-col gap-2">
                          <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="truncate text-sm font-semibold leading-tight">{p.nome}</div>
                              <div className="mt-0.5 text-xs text-muted-foreground">
                                {p.ref} ·{" "}
                                {temDesconto ? (
                                  <><span className="line-through opacity-50">{formatBRL(grupo[0].preco)}</span>{" "}<span className="font-medium text-[hsl(var(--success))]">{formatBRL(precoEfetivo)}/un</span></>
                                ) : (
                                  <span>{formatBRL(grupo[0].preco)}/un</span>
                                )}
                              </div>
                            </div>
                            <div className="shrink-0 flex items-center gap-1">
                              <span className="text-[10px] text-muted-foreground">Desc.</span>
                              <div className="relative w-16">
                                <span className="pointer-events-none absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">R$</span>
                                <Input type="number" min={0} value={descProduto.val || ""} onChange={(e) => { const v = Math.max(0, Number(e.target.value) || 0); setDescontosPorProduto((prev) => ({ ...prev, [pid]: { pct: 0, val: v } })); }} disabled={descProduto.pct > 0} placeholder="0" className="h-6 pl-7 pr-1 text-right text-[11px] disabled:opacity-40" />
                              </div>
                              <div className="relative w-14">
                                <Input type="number" min={0} max={100} step={1} value={descProduto.pct || ""} onChange={(e) => { const v = Math.min(100, Math.max(0, Number(e.target.value) || 0)); setDescontosPorProduto((prev) => ({ ...prev, [pid]: { pct: v, val: 0 } })); }} disabled={descProduto.val > 0} placeholder="0%" className="h-6 pl-1.5 pr-5 text-right text-[11px] disabled:opacity-40" />
                                <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">%</span>
                              </div>
                            </div>
                            <button onClick={() => setItens((prev) => prev.filter((i) => i.produtoId !== pid))} className="shrink-0 text-muted-foreground hover:text-destructive">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="flex items-end gap-2">
                            <div className="flex flex-1 gap-1 overflow-x-auto pb-0.5">
                              {grupo.map((it) => {
                                const idx = itens.indexOf(it);
                                return (
                                  <div key={it.tamanho} className="shrink-0 w-11 text-center">
                                    <div className="text-[10px] font-semibold uppercase text-muted-foreground">{it.tamanho}</div>
                                    <Input type="number" min={0} value={it.quantidade || ""} onChange={(e) => atualizarQuantidade(idx, e.target.value)} className="mt-0.5 h-7 border-muted/60 px-1 text-center text-sm font-semibold" />
                                  </div>
                                );
                              })}
                            </div>
                            <div className="shrink-0 min-w-[58px] pb-0.5 text-right">
                              <div className="text-[10px] text-muted-foreground">Total</div>
                              <div className="text-xs font-semibold">{formatBRL(grupo.reduce((s, it) => s + it.quantidade * precoEfetivo, 0))}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>

          {/* ── Coluna direita: Resumo ── */}
          <div className="flex flex-col gap-3 overflow-y-auto pb-2 lg:w-[300px] lg:shrink-0">
            <Card className="shrink-0 p-4">
              <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resumo</h3>
              <div className="space-y-1.5 text-sm">
                <div className="rounded-md bg-muted/30 px-2.5 py-2 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatBRL(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Peças</span>
                    <span>{itensValidos.reduce((s, i) => s + i.quantidade, 0)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs text-muted-foreground">Desconto</span>
                    <div className="flex rounded border text-[10px] overflow-hidden">
                      <button type="button" onClick={() => setModoDescontoGlobal("fixo")} className={`px-2 py-0.5 transition-colors ${modoDescontoGlobal === "fixo" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>R$</button>
                      <button type="button" onClick={() => setModoDescontoGlobal("percentual")} className={`px-2 py-0.5 border-l transition-colors ${modoDescontoGlobal === "percentual" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>%</button>
                    </div>
                  </div>
                  {modoDescontoGlobal === "fixo" ? (
                    <Input type="number" min={0} value={descontoGlobal || ""} onChange={(e) => setDescontoGlobal(+e.target.value || 0)} placeholder="0" className="h-7 w-24 text-right text-xs" />
                  ) : (
                    <div className="flex items-center gap-1.5">
                      {descontoEfetivo > 0 && <span className="text-xs text-muted-foreground">{formatBRL(descontoEfetivo)}</span>}
                      <div className="relative w-20">
                        <Input type="number" min={0} max={100} step={0.5} value={descontoGlobalPct || ""} onChange={(e) => setDescontoGlobalPct(Math.min(100, +e.target.value || 0))} placeholder="0" className="h-7 pr-6 text-right text-xs" />
                        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">%</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t pt-2">
                  <span className="text-sm font-medium">Total</span>
                  <span className="text-base font-semibold">{formatBRL(total)}</span>
                </div>

                <label className="block space-y-1.5 pt-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Entrada</span>
                  <Input type="number" min={0} step="0.01" value={entrada || ""} onChange={(e) => setEntrada(Number(e.target.value || 0))} placeholder="0,00" className="h-9" />
                </label>

                {saldoAberto > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Saldo em aberto</span>
                    <span className="font-medium text-warning">{formatBRL(saldoAberto)}</span>
                  </div>
                )}

                <p className="pt-1 text-xs text-muted-foreground">O saldo fica em aberto até a entrega ou geração da venda.</p>
              </div>
            </Card>
          </div>

        </div>
      </div>
    </AppShell>
  );
}
