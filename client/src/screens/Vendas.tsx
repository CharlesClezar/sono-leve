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
import { useIndexedTabs } from "@/hooks/useIndexedTabs";
import { useDataGrid, type DataGridColumn } from "@/hooks/useDataGrid";
import { usePagination } from "@/hooks/usePagination";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ClipboardList, FileClock, Info, Package2, Pencil, Plus, Receipt, Search } from "lucide-react";

const tabs = ["Histórico", "Faturar encomendas", "Faturar fichas"] as const;
type SalesTab = (typeof tabs)[number];
type SalesTabFilters = {
  query: string;
  type: string;
  payment: string;
  status: string;
  period: string;
};
const tabHints: Partial<Record<SalesTab, string>> = {
  "Faturar encomendas": "Mostra encomendas prontas ou fabricadas parcialmente, aguardando geração de venda.",
  "Faturar fichas": "Mostra fichas com produtos vendidos, aguardando faturamento da revendedora.",
};
const defaultSalesTabFilters: SalesTabFilters = {
  query: "",
  type: "all",
  payment: "all",
  status: "all",
  period: "30d",
};

function withinPeriod(dateIso: string, period: string) {
  if (period === "todos") return true;
  const d = new Date(dateIso + "T00:00:00").getTime();
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  if (period === "hoje") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d >= today.getTime();
  }
  if (period === "7d") return now - d <= 7 * day;
  if (period === "30d") return now - d <= 30 * day;
  return true;
}

function piecesForOrder(total: number) {
  return Math.max(1, Math.round(total / 198));
}

export default function Vendas() {
  const { customers, fichas, orders, sales } = useDadosOperacionais();
  const allOrders = orders;
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<SalesTab>("Histórico");
  const [filtersByTab, setFiltersByTab] = useState<Record<SalesTab, SalesTabFilters>>(
    () => Object.fromEntries(tabs.map((item) => [item, defaultSalesTabFilters])) as Record<SalesTab, SalesTabFilters>,
  );
  const [clearFiltersSignal, setClearFiltersSignal] = useState(0);
  const filters = filtersByTab[tab];
  const updateTabFilters = (patch: Partial<SalesTabFilters>) => {
    setFiltersByTab((current) => ({ ...current, [tab]: { ...current[tab], ...patch } }));
  };
  const selectTab = (nextTab: SalesTab) => setTab(nextTab);
  const indexedTabs = useIndexedTabs({ tabs, onTabChange: selectTab });

  const customerType = (name: string) => customers.find((c) => c.name === name)?.type;
  const isHistoryTab = tab === "Histórico";

  useEffect(() => {
    const from = searchParams.get("from");
    if (from === "encomenda") setTab("Faturar encomendas");
    if (from === "ficha") setTab("Faturar fichas");
  }, [searchParams]);

  useEffect(() => {
    const handleSalesShortcut = (event: Event) => {
      const customEvent = event as CustomEvent<{ shortcut?: "contextual" | "orders" | "fichas" }>;
      const shortcut = customEvent.detail?.shortcut;
      if (!shortcut) return;

      if (shortcut === "contextual") {
        if (tab === "Faturar encomendas" || tab === "Faturar fichas") {
          customEvent.preventDefault();
          indexedTabs.focusFirstAction(tab);
        }
        return;
      }

      if (shortcut === "orders") {
        customEvent.preventDefault();
        if (tab !== "Faturar encomendas") {
          setTab("Faturar encomendas");
          return;
        }
        indexedTabs.focusFirstAction("Faturar encomendas");
        return;
      }

      if (shortcut === "fichas") {
        customEvent.preventDefault();
        if (tab !== "Faturar fichas") {
          setTab("Faturar fichas");
          return;
        }
        indexedTabs.focusFirstAction("Faturar fichas");
      }
    };

    window.addEventListener("app:vendas:shortcut", handleSalesShortcut as EventListener);
    return () => {
      window.removeEventListener("app:vendas:shortcut", handleSalesShortcut as EventListener);
    };
  }, [indexedTabs, tab]);

  const historicalSales = useMemo(() => {
    return sales.filter((s) => {
      const historyFilters = filtersByTab.Histórico;
      if (!withinPeriod(s.date, historyFilters.period)) return false;
      if (historyFilters.type !== "all" && customerType(s.customer) !== historyFilters.type) return false;
      if (historyFilters.payment !== "all" && !s.payment.toLowerCase().includes(historyFilters.payment.toLowerCase())) return false;
      if (historyFilters.status !== "all" && s.status !== historyFilters.status) return false;
      if (historyFilters.query) {
        const q = historyFilters.query.toLowerCase();
        const match =
          s.customer.toLowerCase().includes(q) ||
          s.total.toString().includes(q) ||
          formatDate(s.date).includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [filtersByTab]);

  const ordersToBill = useMemo(() => {
    const orderFilters = filtersByTab["Faturar encomendas"];
    return allOrders.filter((order) => {
      if (!["Pronta", "Fabricado parcialmente"].includes(order.status)) return false;
      if (orderFilters.type !== "all" && customerType(order.customer) !== orderFilters.type) return false;
      if (orderFilters.query) {
        const q = orderFilters.query.toLowerCase();
        const match =
          order.customer.toLowerCase().includes(q) ||
          order.id.toLowerCase().includes(q) ||
          formatDate(order.dueDate).includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [allOrders, filtersByTab]);

  const fichasToBill = useMemo(() => {
    const fichaFilters = filtersByTab["Faturar fichas"];
    return fichas.filter((ficha) => {
      if (ficha.sold <= 0) return false;
      if (ficha.status === "Cancelada") return false;
      if (fichaFilters.query) {
        const q = fichaFilters.query.toLowerCase();
        const match =
          ficha.reseller.toLowerCase().includes(q) ||
          ficha.id.toLowerCase().includes(q) ||
          formatDate(ficha.openedAt).includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [filtersByTab]);

  return (
    <AppShell>
      <ClearFiltersShortcutDialog
        onConfirm={() => {
          setFiltersByTab(Object.fromEntries(tabs.map((item) => [item, defaultSalesTabFilters])) as Record<SalesTab, SalesTabFilters>);
          setClearFiltersSignal((current) => current + 1);
        }}
      />
      <PageHeader
        breadcrumb={["Vendas", tab]}
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

      <div className="space-y-4 p-6">
        <div className="sticky top-20 z-20 -mx-6 space-y-4 border-b bg-background/95 px-6 pb-4 pt-4 backdrop-blur">
          <TooltipProvider>
            <IndexedTabsNav
              tabs={tabs}
              activeTab={tab}
              onSelect={selectTab}
              getTabButtonProps={indexedTabs.getTabButtonProps}
              getShortcutLabel={indexedTabs.getShortcutLabel}
              renderAccessory={(currentTab) =>
                tabHints[currentTab] ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="ml-2 inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full text-current/70 transition hover:text-current">
                        <Info className="h-3.5 w-3.5" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">
                      {tabHints[currentTab]}
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
                  tab === "Histórico"
                    ? "Buscar por cliente, valor ou data"
                    : tab === "Faturar encomendas"
                      ? "Buscar por cliente, código ou entrega"
                      : "Buscar por revendedora, ficha ou abertura"
                }
                className="pl-9"
                value={filters.query}
                onChange={(e) => updateTabFilters({ query: e.target.value })}
              />
            </div>
            {tab !== "Faturar fichas" && (
              <AppSelect
                className="w-full lg:w-[170px]"
                value={filters.type}
                onValueChange={(value) => updateTabFilters({ type: value })}
                options={[
                  { value: "all", label: "Todos os tipos" },
                  { value: "varejo", label: "Varejo" },
                  { value: "atacado", label: "Atacado" },
                ]}
              />
            )}
            {isHistoryTab && (
              <>
                <AppSelect
                  className="w-full lg:w-[160px]"
                  value={filters.payment}
                  onValueChange={(value) => updateTabFilters({ payment: value })}
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
                  value={filters.status}
                  onValueChange={(value) => updateTabFilters({ status: value })}
                  options={[
                    { value: "all", label: "Todos status" },
                    { value: "Gerada", label: "Gerada" },
                    { value: "Cancelada", label: "Cancelada" },
                  ]}
                />
                <AppSelect
                  className="w-full lg:w-[170px]"
                  value={filters.period}
                  onValueChange={(value) => updateTabFilters({ period: value })}
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

        {tab === "Histórico" && (
          <div {...indexedTabs.getTabPanelProps("Histórico")}>
            <HistoricalSalesView rows={historicalSales} actionProps={indexedTabs.getActionProps("Histórico")} clearFiltersSignal={clearFiltersSignal} />
          </div>
        )}
        {tab === "Faturar encomendas" && (
          <div {...indexedTabs.getTabPanelProps("Faturar encomendas")}>
            <OrdersBillingView rows={ordersToBill} actionProps={indexedTabs.getActionProps("Faturar encomendas")} clearFiltersSignal={clearFiltersSignal} />
          </div>
        )}
        {tab === "Faturar fichas" && (
          <div {...indexedTabs.getTabPanelProps("Faturar fichas")}>
            <FichasBillingView rows={fichasToBill} actionProps={indexedTabs.getActionProps("Faturar fichas")} clearFiltersSignal={clearFiltersSignal} />
          </div>
        )}
      </div>
    </AppShell>
  );
}

function HistoricalSalesView({
  rows,
  actionProps,
  clearFiltersSignal,
}: {
  rows: Sale[];
  actionProps: Record<string, unknown>;
  clearFiltersSignal: number;
}) {
  const columns = useMemo<DataGridColumn<Sale>[]>(
    () => [
      { id: "customer", label: "Cliente", accessor: (sale) => sale.customer },
      { id: "origin", label: "Origem", accessor: (sale) => sale.origin },
      { id: "date", label: "Data", accessor: (sale) => sale.date, filterAccessor: (sale) => formatDate(sale.date) },
      { id: "pieces", label: "Peças", accessor: (sale) => sale.pieces },
      { id: "payment", label: "Pagamento", accessor: (sale) => sale.payment },
      { id: "total", label: "Total", accessor: (sale) => sale.total },
      { id: "status", label: "Status", accessor: (sale) => sale.status },
    ],
    [],
  );
  const grid = useDataGrid(rows, columns);
  useEffect(() => {
    grid.clearFilters();
  }, [clearFiltersSignal]);
  const pagination = usePagination(grid.rows);

  return (
    <>
      <div className="grid gap-3 lg:hidden">
        {pagination.items.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            Nenhuma venda encontrada com esses filtros
          </Card>
        ) : (
          pagination.items.map((sale) => (
            <Card key={sale.id} className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{sale.customer}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(sale.date)}</div>
                </div>
                <StatusBadge status={sale.status} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Origem</div>
                  <div>{sale.origin}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Peças</div>
                  <SalePiecesDetails sale={sale} triggerClassName="rounded-md bg-primary-soft px-2.5 py-1 text-sm font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Pagamento</div>
                  <div>{sale.payment}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Total</div>
                  <div className="font-semibold">{formatBRL(sale.total)}</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                  <FileClock className="h-3.5 w-3.5" />
                  {sale.origin}
                </span>
                <Button variant="ghost" size="icon" asChild aria-label={`Editar venda ${sale.id}`}>
                  <Link {...actionProps} href={`/vendas/${sale.id}/editar`}><Pencil className="h-4 w-4" /></Link>
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
      <PaginationFooter pagination={pagination} className="mt-3 rounded-md border lg:hidden" />

      <Card className="hidden overflow-hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                {columns.map((column) => (
                  <DataGridColumnHeader
                    key={column.id}
                    grid={grid}
                    columnId={column.id}
                    label={column.label}
                    align={column.id === "pieces" ? "center" : column.id === "total" ? "right" : "left"}
                  />
                ))}
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pagination.items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    Nenhuma venda encontrada com esses filtros
                  </td>
                </tr>
              ) : pagination.items.map((sale) => (
                <tr key={sale.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{sale.customer}</td>
                  <td className="px-4 py-3 text-muted-foreground">{sale.origin}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(sale.date)}</td>
                  <td className="px-4 py-3 text-center">
                    <SalePiecesDetails sale={sale} triggerClassName="rounded-md bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground" />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{sale.payment}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatBRL(sale.total)}</td>
                  <td className="px-4 py-3"><StatusBadge status={sale.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" asChild aria-label={`Editar venda ${sale.id}`}>
                      <Link {...actionProps} href={`/vendas/${sale.id}/editar`}><Pencil className="h-4 w-4" /></Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <PaginationFooter pagination={pagination} />
        </div>
      </Card>
    </>
  );
}

function SalePiecesDetails({ sale, triggerClassName }: { sale: Sale; triggerClassName: string }) {
  const { data: items } = useItensVenda(sale.id);

  return (
    <PiecesDetailsDialog
      pieces={sale.pieces}
      title={`Peças da venda ${sale.id}`}
      description={`Detalhamento dos produtos e tamanhos da venda para ${sale.customer}.`}
      items={items}
      triggerClassName={triggerClassName}
    />
  );
}

function OrdersBillingView({
  rows,
  actionProps,
  clearFiltersSignal,
}: {
  rows: Order[];
  actionProps: Record<string, unknown>;
  clearFiltersSignal: number;
}) {
  const columns = useMemo<DataGridColumn<Order>[]>(
    () => [
      { id: "id", label: "Encomenda", accessor: (order) => order.id },
      { id: "customer", label: "Cliente", accessor: (order) => order.customer },
      { id: "createdAt", label: "Cadastro", accessor: (order) => order.createdAt, filterAccessor: (order) => formatDate(order.createdAt) },
      { id: "dueDate", label: "Entrega", accessor: (order) => order.dueDate, filterAccessor: (order) => formatDate(order.dueDate) },
      { id: "pieces", label: "Peças", accessor: (order) => piecesForOrder(order.total) },
      { id: "total", label: "Total", accessor: (order) => order.total },
      { id: "balance", label: "Saldo", accessor: (order) => order.total - order.entry },
      { id: "status", label: "Status", accessor: (order) => order.status },
    ],
    [],
  );
  const grid = useDataGrid(rows, columns);
  useEffect(() => {
    grid.clearFilters();
  }, [clearFiltersSignal]);
  const pagination = usePagination(grid.rows);

  return (
    <>
      <div className="grid gap-3 lg:hidden">
        {pagination.items.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            Nenhuma encomenda pronta para faturar
          </Card>
        ) : (
          pagination.items.map((order) => (
            <Card key={order.id} className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{order.customer}</div>
                  <div className="font-mono text-xs text-muted-foreground">{order.id}</div>
                </div>
                <BillingOrderStatus status={order.status} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Cadastro</div>
                  <div>{formatDate(order.createdAt)}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Entrega</div>
                  <div>{formatDate(order.dueDate)}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Peças</div>
                  <div className="font-semibold">{piecesForOrder(order.total)}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Saldo</div>
                  <div>{formatBRL(order.total - order.entry)}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Total</div>
                  <div className="font-semibold">{formatBRL(order.total)}</div>
                </div>
              </div>
              <BillingActionButton
                href={`/vendas/nova?from=encomenda&id=${order.id}`}
                className="w-full"
                actionProps={actionProps}
              >
                <>
                  <Receipt className="h-4 w-4" />
                  Gerar venda
                </>
              </BillingActionButton>
            </Card>
          ))
        )}
      </div>
      <PaginationFooter pagination={pagination} className="mt-3 rounded-md border lg:hidden" />

      <Card className="hidden overflow-hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                {columns.map((column) => (
                  <DataGridColumnHeader
                    key={column.id}
                    grid={grid}
                    columnId={column.id}
                    label={column.label}
                    align={column.id === "pieces" ? "center" : ["total", "balance"].includes(column.id) ? "right" : "left"}
                  />
                ))}
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pagination.items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    Nenhuma encomenda pronta para faturar
                  </td>
                </tr>
              ) : pagination.items.map((order) => (
                <tr key={order.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{order.id}</td>
                  <td className="px-4 py-3 font-medium">{order.customer}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(order.dueDate)}</td>
                  <td className="px-4 py-3 text-center font-semibold">{piecesForOrder(order.total)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatBRL(order.total)}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{formatBRL(order.total - order.entry)}</td>
                  <td className="px-4 py-3">
                    <BillingOrderStatus status={order.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <BillingActionButton
                      href={`/vendas/nova?from=encomenda&id=${order.id}`}
                      size="sm"
                      actionProps={actionProps}
                    >
                      <>
                        <Receipt className="h-4 w-4" />
                        Gerar venda
                      </>
                    </BillingActionButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <PaginationFooter pagination={pagination} />
        </div>
      </Card>
    </>
  );
}

function BillingOrderStatus({ status }: { status: Order["status"] }) {
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

function FichasBillingView({
  rows,
  actionProps,
  clearFiltersSignal,
}: {
  rows: Ficha[];
  actionProps: Record<string, unknown>;
  clearFiltersSignal: number;
}) {
  const columns = useMemo<DataGridColumn<Ficha>[]>(
    () => [
      { id: "id", label: "Ficha", accessor: (ficha) => ficha.id },
      { id: "reseller", label: "Revendedora", accessor: (ficha) => ficha.reseller },
      { id: "openedAt", label: "Abertura", accessor: (ficha) => ficha.openedAt, filterAccessor: (ficha) => formatDate(ficha.openedAt) },
      { id: "sold", label: "Vendidas", accessor: (ficha) => ficha.sold },
      { id: "sent", label: "Enviadas", accessor: (ficha) => ficha.sent },
      { id: "returned", label: "Devolvidas", accessor: (ficha) => ficha.returned },
      { id: "totalSold", label: "Total vendido", accessor: (ficha) => ficha.totalSold },
      { id: "status", label: "Status", accessor: (ficha) => ficha.status },
    ],
    [],
  );
  const grid = useDataGrid(rows, columns);
  useEffect(() => {
    grid.clearFilters();
  }, [clearFiltersSignal]);
  const pagination = usePagination(grid.rows);

  return (
    <>
      <div className="grid gap-3 lg:hidden">
        {pagination.items.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            Nenhuma ficha com faturamento pendente
          </Card>
        ) : (
          pagination.items.map((ficha) => (
            <Card key={ficha.id} className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{ficha.reseller}</div>
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
                  <div>{formatDate(ficha.openedAt)}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Peças vendidas</div>
                  <div className="font-semibold text-primary">{ficha.sold}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Enviadas</div>
                  <div>{ficha.sent}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Devolvidas</div>
                  <div>{ficha.returned}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Total vendido</div>
                  <div className="font-semibold">{formatBRL(ficha.totalSold)}</div>
                </div>
              </div>
              <BillingActionButton
                href={`/vendas/nova?from=ficha&id=${ficha.id}`}
                className="w-full"
                actionProps={actionProps}
              >
                <>
                  <Receipt className="h-4 w-4" />
                  Gerar venda
                </>
              </BillingActionButton>
            </Card>
          ))
        )}
      </div>
      <PaginationFooter pagination={pagination} className="mt-3 rounded-md border lg:hidden" />

      <Card className="hidden overflow-hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                {columns.map((column) => (
                  <DataGridColumnHeader
                    key={column.id}
                    grid={grid}
                    columnId={column.id}
                    label={column.label}
                    align={
                      ["sold", "sent", "returned"].includes(column.id)
                        ? "center"
                        : column.id === "totalSold"
                          ? "right"
                          : "left"
                    }
                  />
                ))}
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pagination.items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    Nenhuma ficha com faturamento pendente
                  </td>
                </tr>
              ) : pagination.items.map((ficha) => (
                <tr key={ficha.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{ficha.id}</td>
                  <td className="px-4 py-3 font-medium">{ficha.reseller}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(ficha.openedAt)}</td>
                  <td className="px-4 py-3 text-center font-semibold text-primary">{ficha.sold}</td>
                  <td className="px-4 py-3 text-center">{ficha.sent}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{ficha.returned}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatBRL(ficha.totalSold)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      <ClipboardList className="h-3.5 w-3.5" />
                      {ficha.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <BillingActionButton
                      href={`/vendas/nova?from=ficha&id=${ficha.id}`}
                      size="sm"
                      actionProps={actionProps}
                    >
                      <>
                        <Receipt className="h-4 w-4" />
                        Gerar venda
                      </>
                    </BillingActionButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <PaginationFooter pagination={pagination} />
        </div>
      </Card>
    </>
  );
}

const BillingActionButton = ({
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
      <Link
        {...actionProps}
        href={href}
      >
        {children}
      </Link>
    </Button>
  );
};
