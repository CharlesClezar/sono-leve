import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AppSelect } from "@/components/AppSelect";
import { ClearFiltersShortcutDialog } from "@/components/ClearFiltersShortcutDialog";
import { DataGrid, type GridColumnDef } from "@/components/DataGrid";
import { IndexedTabsNav } from "@/components/IndexedTabsNav";
import { PaginationFooter } from "@/components/PaginationFooter";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { PiecesDetailsDialog } from "@/components/PiecesDetailsDialog";
import { CardsSkeleton } from "@/components/TableSkeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatBRL, formatDate, type Ficha, type Order, type Sale } from "@/lib/types";
import {
  useVendasPaginadas, useEncomendasPaginadas, useFichasPaginadas,
  useItensVenda,
} from "@/lib/api";
import { useIndexedTabs } from "@/hooks/useIndexedTabs";
import { useDataGrid } from "@/hooks/useDataGrid";
import { useServerPagination } from "@/hooks/usePagination";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ClipboardList, FileClock, Info, Package2, Plus, Receipt, Search } from "lucide-react";

const abas = ["Histórico", "Faturar encomendas", "Faturar fichas"] as const;
type AbaVendas = (typeof abas)[number];
type FiltrosAba = {
  busca: string;
  tipo: string;
  pagamento: string;
  status: string;
  periodo: string;
};
const dicasAba: Partial<Record<AbaVendas, string>> = {
  "Faturar encomendas": "Mostra encomendas prontas ou fabricadas parcialmente, aguardando geração de venda.",
  "Faturar fichas": "Mostra fichas com produtos vendidos, aguardando faturamento da revendedora.",
};
const filtrosPadraoAba: FiltrosAba = {
  busca: "",
  tipo: "all",
  pagamento: "all",
  status: "all",
  periodo: "30d",
};

const PRECO_MEDIO_PECA = 198;

function pecasPorEncomenda(total: number) {
  return Math.max(1, Math.round(total / PRECO_MEDIO_PECA));
}

export default function Vendas() {
  const searchParams = useSearchParams();
  const [aba, setAba] = useState<AbaVendas>("Histórico");
  const [filtrosPorAba, setFiltrosPorAba] = useState<Record<AbaVendas, FiltrosAba>>(
    () => Object.fromEntries(abas.map((item) => [item, filtrosPadraoAba])) as Record<AbaVendas, FiltrosAba>,
  );
  const [sinalLimparFiltros, setSinalLimparFiltros] = useState(0);
  const [pageHistorico, setPageHistorico] = useState(1);
  const [pageEncomendas, setPageEncomendas] = useState(1);
  const [pageFichas, setPageFichas] = useState(1);
  const filtros = filtrosPorAba[aba];
  const atualizarFiltrosAba = (patch: Partial<FiltrosAba>) => {
    setFiltrosPorAba((current) => ({ ...current, [aba]: { ...current[aba], ...patch } }));
    if (aba === "Histórico") setPageHistorico(1);
    if (aba === "Faturar encomendas") setPageEncomendas(1);
    if (aba === "Faturar fichas") setPageFichas(1);
  };
  const selecionarAba = (proximaAba: AbaVendas) => setAba(proximaAba);
  const abasIndexadas = useIndexedTabs({ tabs: abas, onTabChange: selecionarAba });

  const ehAbaHistorico = aba === "Histórico";
  const f = filtrosPorAba["Histórico"];

  const { data: resVendas, isLoading: carregandoVendas } = useVendasPaginadas({
    search: f.busca || undefined,
    status: f.status !== "all" ? f.status : undefined,
    tipoCliente: f.tipo !== "all" ? f.tipo : undefined,
    formaPagamento: f.pagamento !== "all" ? f.pagamento : undefined,
    periodo: f.periodo !== "todos" ? f.periodo : undefined,
    page: pageHistorico,
    pageSize: 30,
  });

  const fEncomendas = filtrosPorAba["Faturar encomendas"];
  const { data: resEncomendas, isLoading: carregandoEncomendas } = useEncomendasPaginadas(
    {
      search: fEncomendas.busca || undefined,
      status: "Pronta,Fabricado parcialmente",
      page: pageEncomendas,
      pageSize: 30,
    },
    aba === "Faturar encomendas",
  );

  const fFichas = filtrosPorAba["Faturar fichas"];
  const { data: resFichas, isLoading: carregandoFichas } = useFichasPaginadas(
    {
      search: fFichas.busca || undefined,
      status: "Aberta,Parcial,Finalizada",
      minVendidas: 1,
      page: pageFichas,
      pageSize: 30,
    },
    aba === "Faturar fichas",
  );

  useEffect(() => {
    const from = searchParams.get("from");
    if (from === "encomenda") setAba("Faturar encomendas");
    if (from === "ficha") setAba("Faturar fichas");
  }, [searchParams]);

  useEffect(() => {
    const handleVendasShortcut = (event: Event) => {
      const customEvent = event as CustomEvent<{ shortcut?: "contextual" | "encomendas" | "fichas" }>;
      const shortcut = customEvent.detail?.shortcut;
      if (!shortcut) return;

      if (shortcut === "contextual") {
        if (aba === "Faturar encomendas" || aba === "Faturar fichas") {
          customEvent.preventDefault();
          abasIndexadas.focusFirstAction(aba);
        }
        return;
      }

      if (shortcut === "encomendas") {
        customEvent.preventDefault();
        if (aba !== "Faturar encomendas") { setAba("Faturar encomendas"); return; }
        abasIndexadas.focusFirstAction("Faturar encomendas");
        return;
      }

      if (shortcut === "fichas") {
        customEvent.preventDefault();
        if (aba !== "Faturar fichas") { setAba("Faturar fichas"); return; }
        abasIndexadas.focusFirstAction("Faturar fichas");
      }
    };

    window.addEventListener("app:vendas:shortcut", handleVendasShortcut as EventListener);
    return () => { window.removeEventListener("app:vendas:shortcut", handleVendasShortcut as EventListener); };
  }, [abasIndexadas, aba]);

  return (
    <AppShell>
      <ClearFiltersShortcutDialog
        onConfirm={() => {
          setFiltrosPorAba(Object.fromEntries(abas.map((item) => [item, filtrosPadraoAba])) as Record<AbaVendas, FiltrosAba>);
          setSinalLimparFiltros((current) => current + 1);
          setPageHistorico(1);
          setPageEncomendas(1);
          setPageFichas(1);
        }}
      />
      <PageHeader
        breadcrumb={["Vendas", aba]}
        title="Vendas"
        infoTooltip="Centraliza o histórico de vendas e as filas de faturamento de encomendas e fichas."
        actions={
          <Button asChild>
            <Link href="/vendas/nova">
              <Plus className="mr-1.5 h-4 w-4" />
              Nova venda
            </Link>
          </Button>
        }
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="shrink-0 space-y-4 border-b px-6 py-4">
          <TooltipProvider>
            <IndexedTabsNav
              tabs={abas}
              activeTab={aba}
              onSelect={selecionarAba}
              getTabButtonProps={abasIndexadas.getTabButtonProps}
              getShortcutLabel={abasIndexadas.getShortcutLabel}
              renderAccessory={(abaAtual) =>
                dicasAba[abaAtual] ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="ml-2 inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full text-current/70 transition hover:text-current">
                        <Info className="h-3.5 w-3.5" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">{dicasAba[abaAtual]}</TooltipContent>
                  </Tooltip>
                ) : null
              }
            />
          </TooltipProvider>

          <Card className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={
                  aba === "Histórico"
                    ? "Buscar por cliente"
                    : aba === "Faturar encomendas"
                      ? "Buscar por cliente"
                      : "Buscar por revendedora"
                }
                className="pl-9"
                value={filtros.busca}
                onChange={(e) => atualizarFiltrosAba({ busca: e.target.value })}
              />
            </div>
            {aba !== "Faturar fichas" && (
              <AppSelect
                className="w-full lg:w-[170px]"
                value={filtros.tipo}
                onValueChange={(value) => atualizarFiltrosAba({ tipo: value })}
                options={[
                  { value: "all", label: "Todos os tipos" },
                  { value: "varejo", label: "Varejo" },
                  { value: "atacado", label: "Atacado" },
                ]}
              />
            )}
            {ehAbaHistorico && (
              <>
                <AppSelect
                  className="w-full lg:w-[160px]"
                  value={filtros.pagamento}
                  onValueChange={(value) => atualizarFiltrosAba({ pagamento: value })}
                  options={[
                    { value: "all", label: "Todas formas" },
                    { value: "Pix", label: "Pix" },
                    { value: "Crédito", label: "Crédito" },
                    { value: "Débito", label: "Débito" },
                    { value: "Dinheiro", label: "Dinheiro" },
                    { value: "Boleto", label: "Boleto" },
                  ]}
                />
                <AppSelect
                  className="w-full lg:w-[150px]"
                  value={filtros.status}
                  onValueChange={(value) => atualizarFiltrosAba({ status: value })}
                  options={[
                    { value: "all", label: "Todos status" },
                    { value: "Gerada", label: "Gerada" },
                    { value: "Cancelada", label: "Cancelada" },
                  ]}
                />
                <AppSelect
                  className="w-full lg:w-[170px]"
                  value={filtros.periodo}
                  onValueChange={(value) => atualizarFiltrosAba({ periodo: value })}
                  options={[
                    { value: "hoje", label: "Hoje" },
                    { value: "7d", label: "Últimos 7 dias" },
                    { value: "30d", label: "Últimos 30 dias" },
                    { value: "todos", label: "Todos" },
                  ]}
                />
              </>
            )}
          </div>
          </Card>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {aba === "Histórico" && (
            <div {...abasIndexadas.getTabPanelProps("Histórico")}>
              <VisualizacaoHistorico
                response={resVendas}
                setPage={setPageHistorico}
                actionProps={abasIndexadas.getActionProps("Histórico")}
                sinalLimparFiltros={sinalLimparFiltros}
                carregando={carregandoVendas}
              />
            </div>
          )}
          {aba === "Faturar encomendas" && (
            <div {...abasIndexadas.getTabPanelProps("Faturar encomendas")}>
              <VisualizacaoFaturarEncomendas
                response={resEncomendas}
                setPage={setPageEncomendas}
                actionProps={abasIndexadas.getActionProps("Faturar encomendas")}
                sinalLimparFiltros={sinalLimparFiltros}
                carregando={carregandoEncomendas}
              />
            </div>
          )}
          {aba === "Faturar fichas" && (
            <div {...abasIndexadas.getTabPanelProps("Faturar fichas")}>
              <VisualizacaoFaturarFichas
                response={resFichas}
                setPage={setPageFichas}
                actionProps={abasIndexadas.getActionProps("Faturar fichas")}
                sinalLimparFiltros={sinalLimparFiltros}
                carregando={carregandoFichas}
              />
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

type ListaResponse<T> = { data: T[]; total: number; page: number; pageSize: number; totalPages: number };

function VisualizacaoHistorico({
  response,
  setPage,
  actionProps,
  sinalLimparFiltros,
  carregando,
}: {
  response: ListaResponse<Sale> | undefined;
  setPage: (p: number) => void;
  actionProps: Record<string, unknown>;
  sinalLimparFiltros: number;
  carregando: boolean;
}) {
  const colunas = useMemo<GridColumnDef<Sale>[]>(
    () => [
      { id: "clienteNome", label: "Cliente", accessor: (v) => v.clienteNome, render: (v) => <span className="font-medium">{v.clienteNome}</span> },
      { id: "origem", label: "Origem", accessor: (v) => v.origem, render: (v) => <span className="text-muted-foreground">{v.origem}</span> },
      {
        id: "data", label: "Data", accessor: (v) => v.data, filterAccessor: (v) => formatDate(v.data),
        render: (v) => <span className="text-muted-foreground">{formatDate(v.data)}</span>,
      },
      {
        id: "pecas", label: "Peças", accessor: (v) => v.pecas,
        align: "center",
        render: (v) => <DetalhePecasVenda venda={v} triggerClassName="rounded-md bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground" />,
      },
      { id: "formaPagamentoNome", label: "Pagamento", accessor: (v) => v.formaPagamentoNome, render: (v) => <span className="text-muted-foreground">{v.formaPagamentoNome}</span> },
      { id: "total", label: "Total", accessor: (v) => v.total, align: "right", render: (v) => <span className="font-semibold">{formatBRL(v.total)}</span> },
      { id: "status", label: "Status", accessor: (v) => v.status, render: (v) => <StatusBadge status={v.status} /> },
    ],
    [],
  );
  const linhas = response?.data ?? [];
  const grid = useDataGrid(linhas, colunas);
  useEffect(() => { grid.clearFilters(); }, [sinalLimparFiltros]);
  const paginacao = useServerPagination(response, setPage);

  return (
    <>
      {/* Mobile */}
      <div className="grid gap-3 lg:hidden">
        {carregando ? (
          <CardsSkeleton />
        ) : paginacao.items.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            Nenhuma venda encontrada com esses filtros
          </Card>
        ) : (
          paginacao.items.map((venda) => (
            <Card key={venda.id} className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{venda.clienteNome}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(venda.data)}</div>
                </div>
                <StatusBadge status={venda.status} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Origem</div>
                  <div>{venda.origem}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Peças</div>
                  <DetalhePecasVenda venda={venda} triggerClassName="rounded-md bg-primary-soft px-2.5 py-1 text-sm font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Pagamento</div>
                  <div>{venda.formaPagamentoNome}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Total</div>
                  <div className="font-semibold">{formatBRL(venda.total)}</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                  <FileClock className="h-3.5 w-3.5" />
                  {venda.origem}
                </span>
                <Button variant="ghost" size="icon" asChild>
                  <Link {...actionProps} href={`/vendas/${venda.id}/editar`} aria-label="Editar venda" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
      <PaginationFooter pagination={paginacao} className="mt-3 rounded-md border lg:hidden" />

      {/* Desktop */}
      <div className="hidden lg:block">
        <DataGrid
          grid={grid}
          columns={colunas}
          isLoading={carregando}
          emptyMessage="Nenhuma venda encontrada com esses filtros"
          editHref={(v) => `/vendas/${v.id}/editar`}
          actionLinkProps={actionProps}
          footer={<PaginationFooter pagination={paginacao} />}
        />
      </div>
    </>
  );
}

function DetalhePecasVenda({ venda, triggerClassName }: { venda: Sale; triggerClassName: string }) {
  const [open, setOpen] = useState(false);
  const { data: itens } = useItensVenda(open ? venda.id : "");

  return (
    <PiecesDetailsDialog
      open={open}
      onOpenChange={setOpen}
      pieces={venda.pecas}
      title={`Peças da venda ${venda.id}`}
      description={`Detalhamento dos produtos e tamanhos da venda para ${venda.clienteNome}.`}
      items={itens ?? []}
      triggerClassName={triggerClassName}
    />
  );
}

function VisualizacaoFaturarEncomendas({
  response,
  setPage,
  actionProps,
  sinalLimparFiltros,
  carregando,
}: {
  response: ListaResponse<Order> | undefined;
  setPage: (p: number) => void;
  actionProps: Record<string, unknown>;
  sinalLimparFiltros: number;
  carregando: boolean;
}) {
  const colunas = useMemo<GridColumnDef<Order>[]>(
    () => [
      { id: "id", label: "Encomenda", accessor: (e) => e.id, render: (e) => <span className="font-mono text-xs">{e.id}</span> },
      { id: "clienteNome", label: "Cliente", accessor: (e) => e.clienteNome, render: (e) => <span className="font-medium">{e.clienteNome}</span> },
      {
        id: "criadoEm", label: "Cadastro", accessor: (e) => e.criadoEm, filterAccessor: (e) => formatDate(e.criadoEm),
        render: (e) => <span className="text-muted-foreground">{formatDate(e.criadoEm)}</span>,
      },
      {
        id: "previsao", label: "Entrega", accessor: (e) => e.previsao, filterAccessor: (e) => formatDate(e.previsao),
        render: (e) => <span className="text-muted-foreground">{formatDate(e.previsao)}</span>,
      },
      { id: "pecas", label: "Peças", accessor: (e) => pecasPorEncomenda(e.total), align: "center", render: (e) => <span className="font-semibold">{pecasPorEncomenda(e.total)}</span> },
      { id: "total", label: "Total", accessor: (e) => e.total, align: "right", render: (e) => <span className="font-semibold">{formatBRL(e.total)}</span> },
      { id: "saldo", label: "Saldo", accessor: (e) => e.total - e.entrada, align: "right", render: (e) => <span className="text-muted-foreground">{formatBRL(e.total - e.entrada)}</span> },
      {
        id: "status", label: "Status", accessor: (e) => e.status,
        render: (e) => (
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${e.status === "Pronta" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
            <Package2 className="h-3.5 w-3.5" />{e.status === "Pronta" ? "Pronta" : "Fabricado parcialmente"}
          </span>
        ),
      },
    ],
    [],
  );
  const linhas = response?.data ?? [];
  const grid = useDataGrid(linhas, colunas);
  useEffect(() => { grid.clearFilters(); }, [sinalLimparFiltros]);
  const paginacao = useServerPagination(response, setPage);

  return (
    <>
      {/* Mobile */}
      <div className="grid gap-3 lg:hidden">
        {carregando ? (
          <CardsSkeleton />
        ) : paginacao.items.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            Nenhuma encomenda pronta para faturar
          </Card>
        ) : (
          paginacao.items.map((encomenda) => (
            <Card key={encomenda.id} className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{encomenda.clienteNome}</div>
                  <div className="font-mono text-xs text-muted-foreground">{encomenda.id}</div>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${encomenda.status === "Pronta" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                  <Package2 className="h-3.5 w-3.5" />{encomenda.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><div className="text-xs uppercase tracking-wide text-muted-foreground">Cadastro</div><div>{formatDate(encomenda.criadoEm)}</div></div>
                <div><div className="text-xs uppercase tracking-wide text-muted-foreground">Entrega</div><div>{formatDate(encomenda.previsao)}</div></div>
                <div><div className="text-xs uppercase tracking-wide text-muted-foreground">Peças</div><div className="font-semibold">{pecasPorEncomenda(encomenda.total)}</div></div>
                <div><div className="text-xs uppercase tracking-wide text-muted-foreground">Saldo</div><div>{formatBRL(encomenda.total - encomenda.entrada)}</div></div>
                <div className="col-span-2"><div className="text-xs uppercase tracking-wide text-muted-foreground">Total</div><div className="font-semibold">{formatBRL(encomenda.total)}</div></div>
              </div>
              <Button asChild className="w-full" size="sm">
                <Link {...actionProps} href={`/vendas/nova?from=encomenda&id=${encomenda.id}`}>
                  <Receipt className="h-4 w-4" />Gerar venda
                </Link>
              </Button>
            </Card>
          ))
        )}
      </div>
      <PaginationFooter pagination={paginacao} className="mt-3 rounded-md border lg:hidden" />

      {/* Desktop */}
      <div className="hidden lg:block">
        <DataGrid
          grid={grid}
          columns={colunas}
          isLoading={carregando}
          emptyMessage="Nenhuma encomenda pronta para faturar"
          renderActions={(e) => (
            <Button asChild size="sm">
              <Link {...actionProps} href={`/vendas/nova?from=encomenda&id=${e.id}`}>
                <Receipt className="h-4 w-4" />Gerar venda
              </Link>
            </Button>
          )}
          footer={<PaginationFooter pagination={paginacao} />}
        />
      </div>
    </>
  );
}

function VisualizacaoFaturarFichas({
  response,
  setPage,
  actionProps,
  sinalLimparFiltros,
  carregando,
}: {
  response: ListaResponse<Ficha> | undefined;
  setPage: (p: number) => void;
  actionProps: Record<string, unknown>;
  sinalLimparFiltros: number;
  carregando: boolean;
}) {
  const colunas = useMemo<GridColumnDef<Ficha>[]>(
    () => [
      { id: "id", label: "Ficha", accessor: (f) => f.id, render: (f) => <span className="font-mono text-xs">{f.id}</span> },
      { id: "revendedoraNome", label: "Revendedora", accessor: (f) => f.revendedoraNome, render: (f) => <span className="font-medium">{f.revendedoraNome}</span> },
      {
        id: "dataAbertura", label: "Abertura", accessor: (f) => f.dataAbertura, filterAccessor: (f) => formatDate(f.dataAbertura),
        render: (f) => <span className="text-muted-foreground">{formatDate(f.dataAbertura)}</span>,
      },
      { id: "vendidas", label: "Vendidas", accessor: (f) => f.vendidas, align: "center", render: (f) => <span className="font-semibold text-primary">{f.vendidas}</span> },
      { id: "enviadas", label: "Enviadas", accessor: (f) => f.enviadas, align: "center" },
      { id: "devolvidas", label: "Devolvidas", accessor: (f) => f.devolvidas, align: "center", render: (f) => <span className="text-muted-foreground">{f.devolvidas}</span> },
      { id: "totalVendido", label: "Total vendido", accessor: (f) => f.totalVendido, align: "right", render: (f) => <span className="font-semibold">{formatBRL(f.totalVendido)}</span> },
      {
        id: "status", label: "Status", accessor: (f) => f.status,
        render: (f) => (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
            <ClipboardList className="h-3.5 w-3.5" />{f.status}
          </span>
        ),
      },
    ],
    [],
  );
  const linhas = response?.data ?? [];
  const grid = useDataGrid(linhas, colunas);
  useEffect(() => { grid.clearFilters(); }, [sinalLimparFiltros]);
  const paginacao = useServerPagination(response, setPage);

  return (
    <>
      {/* Mobile */}
      <div className="grid gap-3 lg:hidden">
        {carregando ? (
          <CardsSkeleton />
        ) : paginacao.items.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">Nenhuma ficha com faturamento pendente</Card>
        ) : (
          paginacao.items.map((ficha) => (
            <Card key={ficha.id} className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{ficha.revendedoraNome}</div>
                  <div className="font-mono text-xs text-muted-foreground">{ficha.id}</div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                  <ClipboardList className="h-3.5 w-3.5" />{ficha.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><div className="text-xs uppercase tracking-wide text-muted-foreground">Abertura</div><div>{formatDate(ficha.dataAbertura)}</div></div>
                <div><div className="text-xs uppercase tracking-wide text-muted-foreground">Peças vendidas</div><div className="font-semibold text-primary">{ficha.vendidas}</div></div>
                <div><div className="text-xs uppercase tracking-wide text-muted-foreground">Enviadas</div><div>{ficha.enviadas}</div></div>
                <div><div className="text-xs uppercase tracking-wide text-muted-foreground">Devolvidas</div><div>{ficha.devolvidas}</div></div>
                <div className="col-span-2"><div className="text-xs uppercase tracking-wide text-muted-foreground">Total vendido</div><div className="font-semibold">{formatBRL(ficha.totalVendido)}</div></div>
              </div>
              <Button asChild className="w-full" size="sm">
                <Link {...actionProps} href={`/vendas/nova?from=ficha&id=${ficha.id}`}>
                  <Receipt className="h-4 w-4" />Gerar venda
                </Link>
              </Button>
            </Card>
          ))
        )}
      </div>
      <PaginationFooter pagination={paginacao} className="mt-3 rounded-md border lg:hidden" />

      {/* Desktop */}
      <div className="hidden lg:block">
        <DataGrid
          grid={grid}
          columns={colunas}
          isLoading={carregando}
          emptyMessage="Nenhuma ficha com faturamento pendente"
          renderActions={(f) => (
            <Button asChild size="sm">
              <Link {...actionProps} href={`/vendas/nova?from=ficha&id=${f.id}`}>
                <Receipt className="h-4 w-4" />Gerar venda
              </Link>
            </Button>
          )}
          footer={<PaginationFooter pagination={paginacao} />}
        />
      </div>
    </>
  );
}
