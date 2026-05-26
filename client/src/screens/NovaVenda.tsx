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
import { formatBRL, type Customer, type ItemVenda, type Product, type Sale } from "@/lib/types";
import { api, useBandeirasCartao, useBuscarClientes, useBuscarProdutos, useClientePorId, useConfiguracoesTaxaCartao, useDadosOperacionais, useFormasPagamento, useItensEncomenda, type VendaSalvar } from "@/lib/api";
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
const PRODUTOS_BUSCA_VAZIOS: Product[] = [];
const CLIENTES_BUSCA_VAZIOS: Customer[] = [];

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
  const { fichas, encomendas, produtos, vendas } = useDadosOperacionais();
  const { data: formasPagamento = [] } = useFormasPagamento();
  const { data: bandeiras = [] } = useBandeirasCartao();
  const { data: configuracoesTaxa = [] } = useConfiguracoesTaxaCartao();
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
  const veioDoDashboard = searchParams.get("from") === "dashboard";
  const breadcrumb = veioDoDashboard
    ? ["Dashboard", "Venda", editando ? "Editar venda" : "Nova venda"]
    : ["Vendas", editando ? "Editar" : "Nova"];
  const cancelHref = veioDoDashboard ? "/" : "/vendas";
  const clienteIdInicial = venda
    ? venda.clienteId
    : encomendaOrigem
      ? encomendaOrigem.clienteId
      : fichaOrigem
        ? fichaOrigem.clienteId
      : null;
  const primeiroProduto = produtos[0];

  // ── Refs de foco ──────────────────────────────────────────────────────────
  const refBuscaProduto  = useRef<HTMLInputElement>(null);
  const refBuscaCliente  = useRef<HTMLInputElement>(null);
  const refDropdownProduto = useRef<HTMLDivElement>(null);
  const refDropdownCliente = useRef<HTMLDivElement>(null);

  // ── Estado de busca clientes ──────────────────────────────────────────────
  const [buscaCliente, setBuscaCliente] = useState("");
  const [termoCliente, setTermoCliente] = useState("");
  const [clienteId, setClienteId] = useState<string | null>(clienteIdInicial);

  // ── Estado de busca produtos ──────────────────────────────────────────────
  const [buscaProduto, setBuscaProduto] = useState("");
  const [termoBusca, setTermoBusca] = useState("");
  const [indiceProduto, setIndiceProduto] = useState(-1);

  // ── Itens e descontos ─────────────────────────────────────────────────────
  const [produtosAdicionados, setProdutosAdicionados] = useState<Record<string, Product>>({});
  const [itens, setItens] = useState<Item[]>(
    venda && primeiroProduto
      ? [{ produtoId: primeiroProduto.id, tamanho: "M", quantidade: venda.pecas, preco: primeiroProduto.precoVarejo }]
      : []
  );
  const [descontoGlobal, setDescontoGlobal] = useState(0);
  const [descontosPorProduto, setDescontosPorProduto] = useState<Record<string, DescProduto>>({});

  // ── Pagamento / datas ─────────────────────────────────────────────────────
  const [formaPagamentoId, setFormaPagamentoId] = useState(venda?.formaPagamentoId ?? "");
  const [bandeiraId, setBandeiraId] = useState("");
  const [numeroParcelas, setNumeroParcelas] = useState<number | null>(null);
  const [valorPago, setValorPago] = useState(0);
  const [dataVenda, setDataVenda] = useState(venda?.data?.substring(0, 10) ?? dataHoje());
  const [modalPagamento, setModalPagamento] = useState(false);
  const [fpModal, setFpModal] = useState("");
  const [valorModal, setValorModal] = useState(0);
  const idempotencyKey = useRef(crypto.randomUUID());
  const [gerando, setGerando] = useState(false);
  const [tentouSalvar, setTentouSalvar] = useState(false);
  const { data: itensEncomendaOrigem } = useItensEncomenda(encomendaOrigemId ?? "");
  const itensPreenchidos = useRef(false);

  const { data: clienteSelecionado } = useClientePorId(clienteId ?? undefined);

  // ── Debounce clientes ─────────────────────────────────────────────────────
  const { data: resultadoClientes = CLIENTES_BUSCA_VAZIOS, isFetching: buscandoCliente } = useBuscarClientes(termoCliente);
  const [clientesVisiveis, setClientesVisiveis] = useState<Customer[]>([]);

  useEffect(() => {
    if (!buscaCliente.trim()) { setTermoCliente(""); setClientesVisiveis([]); return; }
    const t = setTimeout(() => setTermoCliente(buscaCliente.trim()), 300);
    return () => clearTimeout(t);
  }, [buscaCliente]);

  useEffect(() => {
    if (!buscandoCliente) setClientesVisiveis(resultadoClientes);
  }, [resultadoClientes, buscandoCliente]);

  useEffect(() => {
    const fechar = (e: MouseEvent) => {
      if (refDropdownCliente.current && !refDropdownCliente.current.contains(e.target as Node))
        setBuscaCliente("");
    };
    document.addEventListener("mousedown", fechar);
    return () => document.removeEventListener("mousedown", fechar);
  }, []);

  // ── Debounce produtos ─────────────────────────────────────────────────────
  const { data: resultadoBusca = PRODUTOS_BUSCA_VAZIOS, isFetching: buscando } = useBuscarProdutos(termoBusca);
  const [produtosVisiveis, setProdutosVisiveis] = useState<Product[]>([]);

  // True enquanto o debounce ainda não disparou — evita flash de "não encontrado"
  const aguardandoDebounce = buscaProduto.trim() !== termoBusca;

  useEffect(() => {
    if (!buscaProduto.trim()) { setTermoBusca(""); setProdutosVisiveis([]); return; }
    const t = setTimeout(() => setTermoBusca(buscaProduto.trim()), 300);
    return () => clearTimeout(t);
  }, [buscaProduto]);

  useEffect(() => {
    if (!buscando) setProdutosVisiveis(resultadoBusca.filter((p) => p.ativo));
  }, [resultadoBusca, buscando]);

  // Resetar seleção de teclado ao mudar resultados
  useEffect(() => { setIndiceProduto(-1); }, [produtosVisiveis]);

  useEffect(() => {
    const fechar = (e: MouseEvent) => {
      if (refDropdownProduto.current && !refDropdownProduto.current.contains(e.target as Node))
        setBuscaProduto("");
    };
    document.addEventListener("mousedown", fechar);
    return () => document.removeEventListener("mousedown", fechar);
  }, []);

  // ── Tecla "+" foca o campo de produto ────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "+") {
        e.preventDefault();
        refBuscaProduto.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // ── Preencher itens da encomenda/sessão ───────────────────────────────────
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

  const cliente = clienteSelecionado ?? null;
  const tipoCliente = cliente?.tipo ?? "varejo";

  // ── Adicionar produto ─────────────────────────────────────────────────────
  const adicionarProduto = (produto: Product) => {
    if (itens.some((i) => i.produtoId === produto.id)) {
      toast.info("Produto já adicionado. Ajuste as quantidades nos tamanhos.");
      setBuscaProduto("");
      return;
    }
    const preco = tipoCliente === "atacado" ? produto.precoAtacado : produto.precoVarejo;
    const grade = produto.categoriaGrade?.length ? produto.categoriaGrade : GRADE_PADRAO;
    setProdutosAdicionados((prev) => ({ ...prev, [produto.id]: produto }));
    // Quantidade começa vazia (0 internamente, mas exibido como "")
    setItens((prev) => [...prev, ...grade.map((t) => ({ produtoId: produto.id, tamanho: t, quantidade: 0, preco }))]);
    setBuscaProduto("");
    setIndiceProduto(-1);
  };

  const atualizarQuantidade = (idx: number, raw: string | number) => {
    const quantidade = raw === "" ? 0 : Math.max(0, Number(raw) || 0);
    setItens((prev) => prev.map((it, i) => (i === idx ? { ...it, quantidade } : it)));
  };

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
        // ── Snapshot da taxa de cartão → gravado na Conta a Receber ──────────
        bandeiraId:            bandeiraId || undefined,
        numeroParcelas:        numeroParcelas ?? undefined,
        percentualTaxaCartao:  parcelaSelecionada?.percentualTaxa,
        taxaFixaCartao:        parcelaSelecionada?.taxaFixa ?? undefined,
        valorTaxaCartao:       parcelaSelecionada ? valorTaxa : undefined,
        prazoRecebimentoDias:  parcelaSelecionada?.prazoRecebimentoDias,
        valorPago:             vPago > 0 ? vPago : undefined,
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
    setTentouSalvar(true);
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
  const bandeirasAtivas = bandeiras.filter((b) => b.ativo);

  // ── Lookup automático de taxa ─────────────────────────────────────────────
  const formaSelecionada = useMemo(
    () => formasPagamentoAtivas.find((f) => f.id === formaPagamentoId) ?? null,
    [formasPagamentoAtivas, formaPagamentoId],
  );

  const configTaxa = useMemo(() => {
    if (!formaSelecionada?.exigeBandeira || !bandeiraId) return null;
    return configuracoesTaxa.find(
      (c) => c.formaPagamentoId === formaPagamentoId && c.bandeiraId === bandeiraId && c.ativo,
    ) ?? null;
  }, [configuracoesTaxa, formaPagamentoId, bandeiraId, formaSelecionada]);

  const parcelaSelecionada = useMemo(() => {
    if (!configTaxa || !numeroParcelas) return null;
    return configTaxa.parcelas.find((p) => p.numeroParcelas === numeroParcelas) ?? null;
  }, [configTaxa, numeroParcelas]);

  // Para débito (exigeBandeira=true mas permiteParcelamento=false): auto-seleciona 1x
  useEffect(() => {
    if (formaSelecionada && !formaSelecionada.permiteParcelamento && configTaxa) {
      const parcela1x = configTaxa.parcelas.find((p) => p.numeroParcelas === 1);
      setNumeroParcelas(parcela1x ? 1 : null);
    }
  }, [formaSelecionada, configTaxa]);

  const valorTaxa = useMemo(() => {
    if (!parcelaSelecionada) return 0;
    return total * (parcelaSelecionada.percentualTaxa / 100) + (parcelaSelecionada.taxaFixa ?? 0);
  }, [parcelaSelecionada, total]);

  const valorLiquido = total - valorTaxa;

  const previsaoRecebimento = useMemo(() => {
    if (!parcelaSelecionada) return null;
    const d = new Date(dataVenda + "T12:00:00");
    d.setDate(d.getDate() + parcelaSelecionada.prazoRecebimentoDias);
    return d.toLocaleDateString("pt-BR");
  }, [parcelaSelecionada, dataVenda]);

  // ── Navegação via teclado no dropdown de produtos ─────────────────────────
  const handleKeyDownProduto = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const dropdownAberto = buscaProduto.trim().length >= 2;
    if (e.key === "Escape") { setBuscaProduto(""); return; }
    if (e.key === "Tab") {
      // Tab vai para o campo de cliente
      setBuscaProduto("");
      if (!cliente) {
        e.preventDefault();
        refBuscaCliente.current?.focus();
      }
      return;
    }
    if (!dropdownAberto) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndiceProduto((prev) => Math.min(prev + 1, produtosVisiveis.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndiceProduto((prev) => Math.max(prev - 1, 0));
      return;
    }
    if (e.key === "Enter") {
      if (indiceProduto >= 0 && produtosVisiveis[indiceProduto]) {
        e.preventDefault();
        adicionarProduto(produtosVisiveis[indiceProduto]);
      }
      return;
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

      {/* Conteúdo: ocupa o restante da tela sem scroll externo */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="flex h-full flex-col gap-6 overflow-hidden p-6 lg:flex-row">

          {/* ── Coluna esquerda: produtos com scroll interno ── */}
          <Card className="flex min-h-0 flex-col overflow-hidden p-5 lg:flex-1">
            <h3 className="mb-3 shrink-0 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Produtos <span className="text-destructive">*</span>
            </h3>

            {/* Campo de busca (fixo, não rola) */}
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
                    // Skeleton — mostra enquanto debounce ou fetch estiver pendente
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
                          {p.imagemUrl ? (
                            <img src={`${BASE_URL}${p.imagemUrl}`} alt="" className="h-12 w-12 shrink-0 rounded object-cover" />
                          ) : (
                            <div className="h-12 w-12 shrink-0 rounded bg-muted" />
                          )}
                          <span className="min-w-0 flex-1">{p.nome} <span className="text-xs text-muted-foreground">({p.ref})</span></span>
                          <span className="shrink-0 text-xs font-semibold">
                            {formatBRL(tipoCliente === "atacado" ? p.precoAtacado : p.precoVarejo)}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    // Só mostra "não encontrado" quando o termo já está sincronizado
                    <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                      Nenhum produto encontrado para &quot;{termoBusca}&quot;
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Lista de produtos — área com scroll */}
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
                        {/* Imagem — ocupa toda a altura do card */}
                        {p.imagemUrl ? (
                          <img src={`${BASE_URL}${p.imagemUrl}`} alt="" className="w-20 shrink-0 self-stretch object-cover" />
                        ) : (
                          <div className="w-20 shrink-0 self-stretch bg-muted" />
                        )}

                        {/* Conteúdo */}
                        <div className="flex-1 min-w-0 p-3 flex flex-col gap-2.5">
                          {/* Linha superior: nome/preço + desconto + X */}
                          <div className="flex items-start gap-2">
                            {/* Nome e preço */}
                            <div className="flex-1 min-w-0">
                              <div className="truncate font-semibold leading-tight">{p.nome}</div>
                              <div className="mt-0.5 text-xs text-muted-foreground">
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

                            {/* Desconto */}
                            <div className="shrink-0">
                              <div className="mb-1 text-right text-[10px] font-semibold text-muted-foreground">Desconto</div>
                              <div className="flex gap-1">
                                {/* R$ */}
                                <div className="relative w-[72px]">
                                  <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">R$</span>
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
                                    className="h-8 pl-8 pr-1 text-right text-sm disabled:opacity-40"
                                  />
                                </div>
                                {/* % */}
                                <div className="relative w-[54px]">
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
                                    className="h-8 pl-2 pr-6 text-right text-sm disabled:opacity-40"
                                  />
                                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">%</span>
                                </div>
                              </div>
                            </div>

                            {/* Remover */}
                            <button
                              onClick={() => setItens((prev) => prev.filter((i) => i.produtoId !== pid))}
                              className="shrink-0 text-muted-foreground hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Grade de tamanhos — linha completa */}
                          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                            {grupo.map((it) => {
                              const idx = itens.indexOf(it);
                              return (
                                <div key={it.tamanho} className="shrink-0 w-12 text-center">
                                  <div className="text-[10px] font-semibold uppercase text-muted-foreground">{it.tamanho}</div>
                                  <Input
                                    type="number"
                                    min={0}
                                    value={it.quantidade || ""}
                                    onChange={(e) => atualizarQuantidade(idx, e.target.value)}
                                    className="mt-0.5 h-8 border-muted/60 px-1 text-center text-sm font-semibold"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>

          {/* ── Coluna direita: resumo + pagamento (scroll próprio) ── */}
          <div className="flex flex-col gap-4 overflow-y-auto pb-2 lg:w-[360px] lg:shrink-0">
            {/* Resumo (inclui cliente) */}
            <Card className="shrink-0 p-5">
              {/* Cliente */}
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Cliente <span className="text-destructive">*</span>
              </h3>
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
                <div ref={refDropdownCliente} className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    ref={refBuscaCliente}
                    placeholder="Buscar cliente..."
                    className={`pl-9${tentouSalvar && !cliente ? " border-destructive focus-visible:ring-destructive" : ""}`}
                    value={buscaCliente}
                    onChange={(e) => setBuscaCliente(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Escape") setBuscaCliente(""); }}
                  />
                  {buscaCliente.trim().length >= 2 && (
                    <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-lg">
                      {buscandoCliente && clientesVisiveis.length === 0 ? (
                        <div className="divide-y">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="flex animate-pulse items-center justify-between px-3 py-2.5">
                              <div className="space-y-1.5">
                                <div className="h-3 w-32 rounded bg-muted" />
                                <div className="h-2.5 w-20 rounded bg-muted" />
                              </div>
                              <div className="h-2.5 w-12 rounded bg-muted" />
                            </div>
                          ))}
                        </div>
                      ) : clientesVisiveis.length > 0 ? (
                        <div className={`transition-opacity duration-150 ${buscandoCliente ? "opacity-50" : "opacity-100"}`}>
                          {clientesVisiveis.map((c) => (
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
                      ) : (
                        <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                          Nenhum cliente encontrado para &quot;{termoCliente}&quot;
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Origem da venda */}
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
            <Card className="shrink-0 p-5">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <CreditCard className="h-4 w-4" /> Pagamento
              </h3>
              <div className="space-y-3 text-sm">
                <label className="space-y-1.5">
                  <span className="text-xs text-muted-foreground">Forma de pagamento</span>
                  <AppSelect
                    value={formaPagamentoId}
                    onValueChange={(v) => { setFormaPagamentoId(v); setBandeiraId(""); setNumeroParcelas(null); }}
                    placeholder="Selecionar..."
                    options={formasPagamentoAtivas.map((f) => ({ value: f.id, label: f.nome }))}
                  />
                </label>

                {/* Bandeira — só quando a forma exige bandeira */}
                {formaSelecionada?.exigeBandeira && (
                  <label className="space-y-1.5">
                    <span className="text-xs text-muted-foreground">Bandeira</span>
                    <AppSelect
                      value={bandeiraId}
                      onValueChange={(v) => { setBandeiraId(v); setNumeroParcelas(null); }}
                      placeholder="Selecionar..."
                      options={bandeirasAtivas.map((b) => ({ value: b.id, label: b.nome }))}
                    />
                  </label>
                )}

                {/* Parcelas — só quando a forma permite parcelamento e há config de taxa */}
                {formaSelecionada?.permiteParcelamento && configTaxa && (
                  <label className="space-y-1.5">
                    <span className="text-xs text-muted-foreground">Parcelas</span>
                    <AppSelect
                      value={numeroParcelas?.toString() ?? ""}
                      onValueChange={(v) => setNumeroParcelas(Number(v))}
                      placeholder="Selecionar..."
                      options={configTaxa.parcelas.map((p) => ({
                        value: p.numeroParcelas.toString(),
                        label: `${p.numeroParcelas}x — ${p.percentualTaxa.toFixed(2)}%`,
                      }))}
                    />
                  </label>
                )}

                {/* Resumo de taxa calculada */}
                {parcelaSelecionada && (
                  <div className="space-y-1.5 rounded-md border bg-muted/30 px-3 py-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Taxa ({parcelaSelecionada.percentualTaxa.toFixed(2)}%
                        {parcelaSelecionada.taxaFixa ? ` + R$ ${parcelaSelecionada.taxaFixa.toFixed(2)}` : ""})
                      </span>
                      <span className="font-medium text-destructive">− {formatBRL(valorTaxa)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Valor líquido</span>
                      <span className="font-semibold text-[hsl(var(--success))]">{formatBRL(valorLiquido)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Previsão de recebimento</span>
                      <span>{previsaoRecebimento}</span>
                    </div>
                  </div>
                )}

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
                options={formasPagamentoAtivas.map((f) => ({ value: f.id, label: f.nome }))}
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
