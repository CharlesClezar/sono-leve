import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AppSelect } from "@/components/AppSelect";
import { ClearFiltersShortcutDialog } from "@/components/ClearFiltersShortcutDialog";
import { DataGridColumnHeader } from "@/components/DataGridColumnHeader";
import { IndexedTabsNav } from "@/components/IndexedTabsNav";
import { PaginationFooter } from "@/components/PaginationFooter";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { PiecesDetailsDialog } from "@/components/PiecesDetailsDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatBRL, formatDate, type Ficha, type Order, type Sale } from "@/lib/types";
import { useDadosOperacionais, useItensVenda } from "@/lib/api";
import { TableSkeleton, CardsSkeleton } from "@/components/TableSkeleton";
import { useIndexedTabs } from "@/hooks/useIndexedTabs";
import { useDataGrid, type DataGridColumn } from "@/hooks/useDataGrid";
import { usePagination } from "@/hooks/usePagination";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ClipboardList, FileClock, Info, Package2, Pencil, Plus, Receipt, Search } from "lucide-react";

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

function dentroDoPeriodo(dataIso: string, periodo: string) {
  if (periodo === "todos") return true;
  const d = new Date(dataIso.substring(0, 10) + "T00:00:00").getTime();
  const now = Date.now();
  const dia = 24 * 60 * 60 * 1000;
  if (periodo === "hoje") {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return d >= hoje.getTime();
  }
  if (periodo === "7d") return now - d <= 7 * dia;
  if (periodo === "30d") return now - d <= 30 * dia;
  return true;
}

function pecasPorEncomenda(total: number) {
  return Math.max(1, Math.round(total / 198));
}

export default function Vendas() {
  const { clientes, fichas, encomendas, vendas, carregando } = useDadosOperacionais();
  const todasEncomendas = encomendas;
  const searchParams = useSearchParams();
  const [aba, setAba] = useState<AbaVendas>("Histórico");
  const [filtrosPorAba, setFiltrosPorAba] = useState<Record<AbaVendas, FiltrosAba>>(
    () => Object.fromEntries(abas.map((item) => [item, filtrosPadraoAba])) as Record<AbaVendas, FiltrosAba>,
  );
  const [sinalLimparFiltros, setSinalLimparFiltros] = useState(0);
  const filtros = filtrosPorAba[aba];
  const atualizarFiltrosAba = (patch: Partial<FiltrosAba>) => {
    setFiltrosPorAba((current) => ({ ...current, [aba]: { ...current[aba], ...patch } }));
  };
  const selecionarAba = (proximaAba: AbaVendas) => setAba(proximaAba);
  const abasIndexadas = useIndexedTabs({ tabs: abas, onTabChange: selecionarAba });

  const tipoCliente = (nome: string) => clientes.find((c) => c.nome === nome)?.tipo;
  const ehAbaHistorico = aba === "Histórico";

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
        if (aba !== "Faturar encomendas") {
          setAba("Faturar encomendas");
          return;
        }
        abasIndexadas.focusFirstAction("Faturar encomendas");
        return;
      }

      if (shortcut === "fichas") {
        customEvent.preventDefault();
        if (aba !== "Faturar fichas") {
          setAba("Faturar fichas");
          return;
        }
        abasIndexadas.focusFirstAction("Faturar fichas");
      }
    };

    window.addEventListener("app:vendas:shortcut", handleVendasShortcut as EventListener);
    return () => {
      window.removeEventListener("app:vendas:shortcut", handleVendasShortcut as EventListener);
    };
  }, [abasIndexadas, aba]);

  const vendasHistorico = useMemo(() => {
    return vendas.filter((v) => {
      const f = filtrosPorAba.Histórico;
      if (!dentroDoPeriodo(v.data, f.periodo)) return false;
      if (f.tipo !== "all" && tipoCliente(v.clienteNome) !== f.tipo) return false;
      if (f.pagamento !== "all" && !(v.formaPagamentoNome ?? "").toLowerCase().includes(f.pagamento.toLowerCase())) return false;
      if (f.status !== "all" && v.status !== f.status) return false;
      if (f.busca) {
        const q = f.busca.toLowerCase();
        const match =
          v.clienteNome.toLowerCase().includes(q) ||
          v.total.toString().includes(q) ||
          formatDate(v.data).includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [filtrosPorAba]);

  const encomendasParaFaturar = useMemo(() => {
    const f = filtrosPorAba["Faturar encomendas"];
    return todasEncomendas.filter((encomenda) => {
      if (!["Pronta", "Fabricado parcialmente"].includes(encomenda.status)) return false;
      if (f.tipo !== "all" && tipoCliente(encomenda.clienteNome) !== f.tipo) return false;
      if (f.busca) {
        const q = f.busca.toLowerCase();
        const match =
          encomenda.clienteNome.toLowerCase().includes(q) ||
          encomenda.id.toLowerCase().includes(q) ||
          formatDate(encomenda.previsao).includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [todasEncomendas, filtrosPorAba]);

  const fichasParaFaturar = useMemo(() => {
    const f = filtrosPorAba["Faturar fichas"];
    return fichas.filter((ficha) => {
      if (ficha.vendidas <= 0) return false;
      if (ficha.status === "Cancelada") return false;
      if (f.busca) {
        const q = f.busca.toLowerCase();
        const match =
          ficha.revendedoraNome.toLowerCase().includes(q) ||
          ficha.id.toLowerCase().includes(q) ||
          formatDate(ficha.dataAbertura).includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [filtrosPorAba]);

  return (
    <AppShell>
      <ClearFiltersShortcutDialog
        onConfirm={() => {
          setFiltrosPorAba(Object.fromEntries(abas.map((item) => [item, filtrosPadraoAba])) as Record<AbaVendas, FiltrosAba>);
          setSinalLimparFiltros((current) => current + 1);
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
                    <TooltipContent className="text-xs">
                      {dicasAba[abaAtual]}
                    </TooltipContent>
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
                    ? "Buscar por cliente, valor ou data"
                    : aba === "Faturar encomendas"
                      ? "Buscar por cliente, código ou entrega"
                      : "Buscar por revendedora, ficha ou abertura"
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
              <VisualizacaoHistorico linhas={vendasHistorico} actionProps={abasIndexadas.getActionProps("Histórico")} sinalLimparFiltros={sinalLimparFiltros} carregando={carregando} />
            </div>
          )}
          {aba === "Faturar encomendas" && (
            <div {...abasIndexadas.getTabPanelProps("Faturar encomendas")}>
              <VisualizacaoFaturarEncomendas linhas={encomendasParaFaturar} actionProps={abasIndexadas.getActionProps("Faturar encomendas")} sinalLimparFiltros={sinalLimparFiltros} carregando={carregando} />
            </div>
          )}
          {aba === "Faturar fichas" && (
            <div {...abasIndexadas.getTabPanelProps("Faturar fichas")}>
              <VisualizacaoFaturarFichas linhas={fichasParaFaturar} actionProps={abasIndexadas.getActionProps("Faturar fichas")} sinalLimparFiltros={sinalLimparFiltros} carregando={carregando} />
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function VisualizacaoHistorico({
  linhas,
  actionProps,
  sinalLimparFiltros,
  carregando,
}: {
  linhas: Sale[];
  actionProps: Record<string, unknown>;
  sinalLimparFiltros: number;
  carregando: boolean;
}) {
  const colunas = useMemo<DataGridColumn<Sale>[]>(
    () => [
      { id: "clienteNome", label: "Cliente", accessor: (v) => v.clienteNome },
      { id: "origem", label: "Origem", accessor: (v) => v.origem },
      { id: "data", label: "Data", accessor: (v) => v.data, filterAccessor: (v) => formatDate(v.data) },
      { id: "pecas", label: "Peças", accessor: (v) => v.pecas },
      { id: "formaPagamentoNome", label: "Pagamento", accessor: (v) => v.formaPagamentoNome },
      { id: "total", label: "Total", accessor: (v) => v.total },
      { id: "status", label: "Status", accessor: (v) => v.status },
    ],
    [],
  );
  const grid = useDataGrid(linhas, colunas);
  useEffect(() => {
    grid.clearFilters();
  }, [sinalLimparFiltros]);
  const paginacao = usePagination(grid.rows);

  return (
    <>
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
                <Button variant="ghost" size="icon" asChild aria-label={`Editar venda ${venda.id}`}>
                  <Link {...actionProps} href={`/vendas/${venda.id}/editar`}><Pencil className="h-4 w-4" /></Link>
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
      <PaginationFooter pagination={paginacao} className="mt-3 rounded-md border lg:hidden" />

      <Card className="hidden overflow-hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                {colunas.map((coluna) => (
                  <DataGridColumnHeader
                    key={coluna.id}
                    grid={grid}
                    columnId={coluna.id}
                    label={coluna.label}
                    align={coluna.id === "pecas" ? "center" : coluna.id === "total" ? "right" : "left"}
                  />
                ))}
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {carregando ? (
                <TableSkeleton cols={8} />
              ) : paginacao.items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    Nenhuma venda encontrada com esses filtros
                  </td>
                </tr>
              ) : paginacao.items.map((venda) => (
                <tr key={venda.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{venda.clienteNome}</td>
                  <td className="px-4 py-3 text-muted-foreground">{venda.origem}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(venda.data)}</td>
                  <td className="px-4 py-3 text-center">
                    <DetalhePecasVenda venda={venda} triggerClassName="rounded-md bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground" />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{venda.formaPagamentoNome}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatBRL(venda.total)}</td>
                  <td className="px-4 py-3"><StatusBadge status={venda.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" asChild aria-label={`Editar venda ${venda.id}`}>
                      <Link {...actionProps} href={`/vendas/${venda.id}/editar`}><Pencil className="h-4 w-4" /></Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <PaginationFooter pagination={paginacao} />
        </div>
      </Card>
    </>
  );
}

function DetalhePecasVenda({ venda, triggerClassName }: { venda: Sale; triggerClassName: string }) {
  const { data: itens } = useItensVenda(venda.id);

  return (
    <PiecesDetailsDialog
      pieces={venda.pecas}
      title={`Peças da venda ${venda.id}`}
      description={`Detalhamento dos produtos e tamanhos da venda para ${venda.clienteNome}.`}
      items={itens ?? []}
      triggerClassName={triggerClassName}
    />
  );
}

function VisualizacaoFaturarEncomendas({
  linhas,
  actionProps,
  sinalLimparFiltros,
  carregando,
}: {
  linhas: Order[];
  actionProps: Record<string, unknown>;
  sinalLimparFiltros: number;
  carregando: boolean;
}) {
  const colunas = useMemo<DataGridColumn<Order>[]>(
    () => [
      { id: "id", label: "Encomenda", accessor: (e) => e.id },
      { id: "clienteNome", label: "Cliente", accessor: (e) => e.clienteNome },
      { id: "criadoEm", label: "Cadastro", accessor: (e) => e.criadoEm, filterAccessor: (e) => formatDate(e.criadoEm) },
      { id: "previsao", label: "Entrega", accessor: (e) => e.previsao, filterAccessor: (e) => formatDate(e.previsao) },
      { id: "pecas", label: "Peças", accessor: (e) => pecasPorEncomenda(e.total) },
      { id: "total", label: "Total", accessor: (e) => e.total },
      { id: "saldo", label: "Saldo", accessor: (e) => e.total - e.entrada },
      { id: "status", label: "Status", accessor: (e) => e.status },
    ],
    [],
  );
  const grid = useDataGrid(linhas, colunas);
  useEffect(() => {
    grid.clearFilters();
  }, [sinalLimparFiltros]);
  const paginacao = usePagination(grid.rows);

  return (
    <>
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
                <StatusEncomendaFatura status={encomenda.status} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Cadastro</div>
                  <div>{formatDate(encomenda.criadoEm)}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Entrega</div>
                  <div>{formatDate(encomenda.previsao)}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Peças</div>
                  <div className="font-semibold">{pecasPorEncomenda(encomenda.total)}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Saldo</div>
                  <div>{formatBRL(encomenda.total - encomenda.entrada)}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Total</div>
                  <div className="font-semibold">{formatBRL(encomenda.total)}</div>
                </div>
              </div>
              <BotaoAcaoFatura
                href={`/vendas/nova?from=encomenda&id=${encomenda.id}`}
                className="w-full"
                actionProps={actionProps}
              >
                <>
                  <Receipt className="h-4 w-4" />
                  Gerar venda
                </>
              </BotaoAcaoFatura>
            </Card>
          ))
        )}
      </div>
      <PaginationFooter pagination={paginacao} className="mt-3 rounded-md border lg:hidden" />

      <Card className="hidden overflow-hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                {colunas.map((coluna) => (
                  <DataGridColumnHeader
                    key={coluna.id}
                    grid={grid}
                    columnId={coluna.id}
                    label={coluna.label}
                    align={coluna.id === "pecas" ? "center" : ["total", "saldo"].includes(coluna.id) ? "right" : "left"}
                  />
                ))}
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {carregando ? (
                <TableSkeleton cols={9} />
              ) : paginacao.items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    Nenhuma encomenda pronta para faturar
                  </td>
                </tr>
              ) : paginacao.items.map((encomenda) => (
                <tr key={encomenda.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{encomenda.id}</td>
                  <td className="px-4 py-3 font-medium">{encomenda.clienteNome}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(encomenda.criadoEm)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(encomenda.previsao)}</td>
                  <td className="px-4 py-3 text-center font-semibold">{pecasPorEncomenda(encomenda.total)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatBRL(encomenda.total)}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{formatBRL(encomenda.total - encomenda.entrada)}</td>
                  <td className="px-4 py-3">
                    <StatusEncomendaFatura status={encomenda.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <BotaoAcaoFatura
                      href={`/vendas/nova?from=encomenda&id=${encomenda.id}`}
                      size="sm"
                      actionProps={actionProps}
                    >
                      <>
                        <Receipt className="h-4 w-4" />
                        Gerar venda
                      </>
                    </BotaoAcaoFatura>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <PaginationFooter pagination={paginacao} />
        </div>
      </Card>
    </>
  );
}

function StatusEncomendaFatura({ status }: { status: Order["status"] }) {
  if (status === "Pronta") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        <Package2 className="h-3.5 w-3.5" />
        Pronta
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
      <Package2 className="h-3.5 w-3.5" />
      Fabricado parcialmente
    </span>
  );
}

function VisualizacaoFaturarFichas({
  linhas,
  actionProps,
  sinalLimparFiltros,
  carregando,
}: {
  linhas: Ficha[];
  actionProps: Record<string, unknown>;
  sinalLimparFiltros: number;
  carregando: boolean;
}) {
  const colunas = useMemo<DataGridColumn<Ficha>[]>(
    () => [
      { id: "id", label: "Ficha", accessor: (f) => f.id },
      { id: "revendedoraNome", label: "Revendedora", accessor: (f) => f.revendedoraNome },
      { id: "dataAbertura", label: "Abertura", accessor: (f) => f.dataAbertura, filterAccessor: (f) => formatDate(f.dataAbertura) },
      { id: "vendidas", label: "Vendidas", accessor: (f) => f.vendidas },
      { id: "enviadas", label: "Enviadas", accessor: (f) => f.enviadas },
      { id: "devolvidas", label: "Devolvidas", accessor: (f) => f.devolvidas },
      { id: "totalVendido", label: "Total vendido", accessor: (f) => f.totalVendido },
      { id: "status", label: "Status", accessor: (f) => f.status },
    ],
    [],
  );
  const grid = useDataGrid(linhas, colunas);
  useEffect(() => {
    grid.clearFilters();
  }, [sinalLimparFiltros]);
  const paginacao = usePagination(grid.rows);

  return (
    <>
      <div className="grid gap-3 lg:hidden">
        {carregando ? (
          <CardsSkeleton />
        ) : paginacao.items.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            Nenhuma ficha com faturamento pendente
          </Card>
        ) : (
          paginacao.items.map((ficha) => (
            <Card key={ficha.id} className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{ficha.revendedoraNome}</div>
                  <div className="font-mono text-xs text-muted-foreground">{ficha.id}</div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                  <ClipboardList className="h-3.5 w-3.5" />
                  {ficha.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Abertura</div>
                  <div>{formatDate(ficha.dataAbertura)}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Peças vendidas</div>
                  <div className="font-semibold text-primary">{ficha.vendidas}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Enviadas</div>
                  <div>{ficha.enviadas}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Devolvidas</div>
                  <div>{ficha.devolvidas}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Total vendido</div>
                  <div className="font-semibold">{formatBRL(ficha.totalVendido)}</div>
                </div>
              </div>
              <BotaoAcaoFatura
                href={`/vendas/nova?from=ficha&id=${ficha.id}`}
                className="w-full"
                actionProps={actionProps}
              >
                <>
                  <Receipt className="h-4 w-4" />
                  Gerar venda
                </>
              </BotaoAcaoFatura>
            </Card>
          ))
        )}
      </div>
      <PaginationFooter pagination={paginacao} className="mt-3 rounded-md border lg:hidden" />

      <Card className="hidden overflow-hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                {colunas.map((coluna) => (
                  <DataGridColumnHeader
                    key={coluna.id}
                    grid={grid}
                    columnId={coluna.id}
                    label={coluna.label}
                    align={
                      ["vendidas", "enviadas", "devolvidas"].includes(coluna.id)
                        ? "center"
                        : coluna.id === "totalVendido"
                          ? "right"
                          : "left"
                    }
                  />
                ))}
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {carregando ? (
                <TableSkeleton cols={9} />
              ) : paginacao.items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    Nenhuma ficha com faturamento pendente
                  </td>
                </tr>
              ) : paginacao.items.map((ficha) => (
                <tr key={ficha.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{ficha.id}</td>
                  <td className="px-4 py-3 font-medium">{ficha.revendedoraNome}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(ficha.dataAbertura)}</td>
                  <td className="px-4 py-3 text-center font-semibold text-primary">{ficha.vendidas}</td>
                  <td className="px-4 py-3 text-center">{ficha.enviadas}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{ficha.devolvidas}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatBRL(ficha.totalVendido)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      <ClipboardList className="h-3.5 w-3.5" />
                      {ficha.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <BotaoAcaoFatura
                      href={`/vendas/nova?from=ficha&id=${ficha.id}`}
                      size="sm"
                      actionProps={actionProps}
                    >
                      <>
                        <Receipt className="h-4 w-4" />
                        Gerar venda
                      </>
                    </BotaoAcaoFatura>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <PaginationFooter pagination={paginacao} />
        </div>
      </Card>
    </>
  );
}

const BotaoAcaoFatura = ({
  href,
  className,
  size,
  children,
  actionProps,
}: {
  href: string;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  children: React.ReactNode;
  actionProps: Record<string, unknown>;
}) => {
  return (
    <Button asChild className={className} size={size}>
      <Link {...actionProps} href={href}>
        {children}
      </Link>
    </Button>
  );
};
