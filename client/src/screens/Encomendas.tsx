import { Fragment, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import { PiecesDetailsDialog } from "@/components/PiecesDetailsDialog";
import { formatBRL, formatDate, type Order } from "@/lib/types";
import { api, useEncomendas, useItensEncomenda } from "@/lib/api";
import { useIndexedTabs } from "@/hooks/useIndexedTabs";
import { useShortcutLabel } from "@/hooks/useShortcutLabel";
import { useDataGrid, type DataGridColumn } from "@/hooks/useDataGrid";
import { usePagination } from "@/hooks/usePagination";
import { CircleCheck, Pencil, Play, Plus, Search, ShoppingCart } from "lucide-react";
import Link from "next/link";

type OrderListStatus = "Novo" | "Em produção" | "Fabricado parcialmente" | "Pronta" | "Entregue" | "Cancelada";
type OrderTab = "Histórico" | OrderListStatus;
type OrderViewMode = "list" | "grouped";
type OrderSortKey = "createdAt" | "dueDate" | "total" | "customer" | "status";
type SortDirection = "asc" | "desc";
type OrderTabFilters = {
  query: string;
  viewMode: OrderViewMode;
  sortBy: OrderSortKey;
  sortDirection: SortDirection;
};

const statusOrder: OrderListStatus[] = ["Novo", "Em produção", "Fabricado parcialmente", "Pronta", "Entregue", "Cancelada"];
const tabs: OrderTab[] = ["Histórico", ...statusOrder];
const defaultOrderTabFilters: OrderTabFilters = {
  query: "",
  viewMode: "list",
  sortBy: "dueDate",
  sortDirection: "asc",
};

const normalizeStatus = (status: string): OrderListStatus => (status === "Aberta" ? "Novo" : status as OrderListStatus);

const statusClass: Record<OrderListStatus, string> = {
  Novo: "border-primary/20 bg-primary/10 text-primary",
  "Em produção": "border-amber-200 bg-amber-50 text-amber-600",
  "Fabricado parcialmente": "border-[rgb(var(--partial))/0.28] bg-[rgb(var(--partial-soft))] text-[rgb(var(--partial-foreground))]",
  Pronta: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Entregue: "border-slate-200 bg-slate-50 text-slate-600",
  Cancelada: "border-red-200 bg-red-50 text-red-600",
};

function statusLabel(status: OrderListStatus) {
  return status === "Pronta" ? "Pronto" : status;
}

function piecesFor(total: number) {
  return Math.max(1, Math.round(total / 198));
}

function isOverdue(dueDate: string, status: OrderListStatus) {
  if (status === "Pronta" || status === "Entregue" || status === "Cancelada") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dueDate + "T00:00:00").getTime() < today.getTime();
}

export default function Encomendas() {
  const queryClient = useQueryClient();
  const { data: orders } = useEncomendas();
  const allOrders = orders;
  const newShortcutLabel = useShortcutLabel("new_contextual");
  const [tab, setTab] = useState<OrderTab>("Histórico");
  const [filtersByTab, setFiltersByTab] = useState<Record<OrderTab, OrderTabFilters>>(
    () => Object.fromEntries(tabs.map((item) => [item, defaultOrderTabFilters])) as Record<OrderTab, OrderTabFilters>,
  );
  const filters = filtersByTab[tab];
  const updateTabFilters = (patch: Partial<OrderTabFilters>) => {
    setFiltersByTab((current) => ({ ...current, [tab]: { ...current[tab], ...patch } }));
  };
  const selectTab = (nextTab: OrderTab) => setTab(nextTab);
  const indexedTabs = useIndexedTabs({ tabs, onTabChange: selectTab });
  const [statusById, setStatusById] = useState<Record<string, OrderListStatus>>(
    () => Object.fromEntries(allOrders.map((order) => [order.id, normalizeStatus(order.status)]))
  );

  useEffect(() => {
    const orderFilter = new URLSearchParams(window.location.search).get("encomenda");
    if (!orderFilter) return;
    setTab("Histórico");
    setFiltersByTab((current) => ({ ...current, Histórico: { ...current.Histórico, query: orderFilter } }));
  }, []);

  const filtered = useMemo(() => {
    const result = allOrders
      .filter((o) => {
        const currentStatus = statusById[o.id] ?? normalizeStatus(o.status);
        if (tab !== "Histórico" && currentStatus !== tab) return false;
        if (filters.query && !o.customer.toLowerCase().includes(filters.query.toLowerCase()) && !o.id.toLowerCase().includes(filters.query.toLowerCase()))
          return false;
        return true;
      })
      .sort((a, b) => {
        const aStatus = statusById[a.id] ?? normalizeStatus(a.status);
        const bStatus = statusById[b.id] ?? normalizeStatus(b.status);
        let value = 0;

        if (filters.sortBy === "createdAt") value = a.createdAt.localeCompare(b.createdAt);
        if (filters.sortBy === "dueDate") value = a.dueDate.localeCompare(b.dueDate);
        if (filters.sortBy === "total") value = a.total - b.total;
        if (filters.sortBy === "customer") value = a.customer.localeCompare(b.customer);
        if (filters.sortBy === "status") value = statusOrder.indexOf(aStatus) - statusOrder.indexOf(bStatus);

        return filters.sortDirection === "asc" ? value : -value;
      });

    return result;
  }, [allOrders, filters.query, filters.sortBy, filters.sortDirection, statusById, tab]);

  const columns = useMemo<DataGridColumn<Order>[]>(
    () => [
      { id: "id", label: "Código", accessor: (order) => order.id },
      { id: "customer", label: "Cliente", accessor: (order) => order.customer },
      { id: "createdAt", label: "Cadastro", accessor: (order) => order.createdAt, filterAccessor: (order) => formatDate(order.createdAt) },
      { id: "dueDate", label: "Entrega", accessor: (order) => order.dueDate, filterAccessor: (order) => formatDate(order.dueDate) },
      { id: "pieces", label: "Peças", accessor: (order) => piecesFor(order.total) },
      { id: "total", label: "Total", accessor: (order) => order.total },
      { id: "balance", label: "Saldo", accessor: (order) => order.total - order.entry },
      { id: "status", label: "Status", accessor: (order) => statusById[order.id] ?? normalizeStatus(order.status) },
    ],
    [statusById],
  );
  const grid = useDataGrid(filtered, columns);
  const pagination = usePagination(grid.rows);

  const grouped = useMemo(
    () =>
      statusOrder
        .map((groupStatus) => ({
          status: groupStatus,
          orders: pagination.items.filter((order) => (statusById[order.id] ?? normalizeStatus(order.status)) === groupStatus),
        }))
        .filter((group) => group.orders.length > 0),
    [pagination.items, statusById]
  );

  const moveStatus = async (id: string, nextStatus: OrderListStatus) => {
    setStatusById((prev) => ({ ...prev, [id]: nextStatus }));
    await api.atualizarStatusEncomenda(id, nextStatus === "Novo" ? "Aberta" : nextStatus);
    await queryClient.invalidateQueries({ queryKey: ["encomendas"] });
  };

  return (
    <AppShell>
      <ClearFiltersShortcutDialog
        onConfirm={() => {
          setFiltersByTab(Object.fromEntries(tabs.map((item) => [item, defaultOrderTabFilters])) as Record<OrderTab, OrderTabFilters>);
          grid.clearFilters();
        }}
      />
      <PageHeader
        breadcrumb={["Encomendas"]}
        title="Encomendas"
        infoTooltip="Acompanha pedidos sob encomenda desde a abertura até produção, entrega e faturamento."
        actions={
          <Button asChild>
            <Link href="/encomendas/nova"><Plus className="mr-1.5 h-4 w-4" />{`Nova encomenda${newShortcutLabel}`}</Link>
          </Button>
        }
      />
      <div className="space-y-4 p-6">
        <div className="sticky top-20 z-20 -mx-6 space-y-4 border-b bg-background/95 px-6 pb-4 pt-4 backdrop-blur">
          <IndexedTabsNav
            tabs={tabs}
            activeTab={tab}
            onSelect={selectTab}
            getTabButtonProps={indexedTabs.getTabButtonProps}
            getShortcutLabel={indexedTabs.getShortcutLabel}
          />

          <Card className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por cliente ou código" className="pl-9" value={filters.query} onChange={(e) => updateTabFilters({ query: e.target.value })} />
            </div>
            <AppSelect
              className="w-full lg:w-[190px]"
              value={filters.viewMode}
              onValueChange={(value) => updateTabFilters({ viewMode: value as OrderViewMode })}
              options={[
                { value: "list", label: "Lista em colunas" },
                { value: "grouped", label: "Agrupado por status" },
              ]}
            />
            <AppSelect
              className="w-full lg:w-[210px]"
              value={filters.sortBy}
              onValueChange={(value) => updateTabFilters({ sortBy: value as OrderSortKey })}
              options={[
                { value: "dueDate", label: "Ordenar por entrega" },
                { value: "createdAt", label: "Ordenar por cadastro" },
                { value: "total", label: "Ordenar por valor" },
                { value: "customer", label: "Ordenar por cliente" },
                { value: "status", label: "Ordenar por status" },
              ]}
            />
            <AppSelect
              className="w-full lg:w-[150px]"
              value={filters.sortDirection}
              onValueChange={(value) => updateTabFilters({ sortDirection: value as SortDirection })}
              options={[
                { value: "asc", label: "Crescente" },
                { value: "desc", label: "Decrescente" },
              ]}
            />
          </div>
          </Card>
        </div>

        <div {...indexedTabs.getTabPanelProps(tab)} className="space-y-4">

        <div className="grid gap-3 lg:hidden">
          {pagination.items.length === 0 ? (
            <Card className="p-6 text-center text-sm text-muted-foreground">
              Nenhuma encomenda encontrada
            </Card>
          ) : (
            pagination.items.map((order) => {
              const currentStatus = statusById[order.id] ?? normalizeStatus(order.status);
              const overdue = isOverdue(order.dueDate, currentStatus);

              return (
                <Card key={order.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{order.customer}</div>
                      <div className="font-mono text-xs text-muted-foreground">{order.id}</div>
                    </div>
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClass[currentStatus]}`}>
                      {statusLabel(currentStatus)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">Cadastro</div>
                      <div>{formatDate(order.createdAt)}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">Entrega</div>
                      <div>{formatDate(order.dueDate)}</div>
                      {overdue && <div className="text-xs font-semibold text-destructive">Atrasada</div>}
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">Peças</div>
                      <OrderPiecesDetails order={order} triggerClassName="rounded-md bg-primary-soft px-2.5 py-1 text-sm font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground" />
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
                  <div className="flex items-center justify-between gap-2">
                    <OrderActionButton
                      id={order.id}
                      status={currentStatus}
                      onMove={moveStatus}
                      actionProps={indexedTabs.getActionProps(tab)}
                    />
                    <Button variant="ghost" size="icon" asChild aria-label={`Editar ${order.id}`}>
                      <Link {...indexedTabs.getActionProps(tab)} href={`/encomendas/${order.id}/editar`}><Pencil className="h-4 w-4" /></Link>
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>
        <PaginationFooter pagination={pagination} className="rounded-md border lg:hidden" />

        <Card className="hidden overflow-hidden lg:block">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Ação</th>
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
                  <td colSpan={10} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    Nenhuma encomenda encontrada
                  </td>
                </tr>
              ) : filters.viewMode === "grouped" ? (
                grouped.map((group) => (
                  <Fragment key={group.status}>
                    <tr className="bg-muted/30">
                      <td colSpan={10} className="px-4 py-2">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClass[group.status]}`}>
                          {statusLabel(group.status)} · {group.orders.length}
                        </span>
                      </td>
                    </tr>
                    {group.orders.map((order) => (
                      <OrderRow
                        key={order.id}
                        order={order}
                        status={statusById[order.id] ?? normalizeStatus(order.status)}
                        onMove={moveStatus}
                        actionProps={indexedTabs.getActionProps(tab)}
                      />
                    ))}
                  </Fragment>
                ))
              ) : (
                pagination.items.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    status={statusById[order.id] ?? normalizeStatus(order.status)}
                    onMove={moveStatus}
                    actionProps={indexedTabs.getActionProps(tab)}
                  />
                ))
              )}
            </tbody>
          </table>
          <PaginationFooter pagination={pagination} />
          </div>
        </Card>
        </div>
      </div>
    </AppShell>
  );
}

function OrderRow({
  order,
  status,
  onMove,
  actionProps,
}: {
  order: Order;
  status: OrderListStatus;
  onMove: (id: string, nextStatus: OrderListStatus) => void;
  actionProps: Record<string, unknown>;
}) {
  const overdue = isOverdue(order.dueDate, status);

  return (
    <tr className="hover:bg-muted/30">
      <td className="px-4 py-3">
        <OrderActionButton id={order.id} status={status} onMove={onMove} actionProps={actionProps} />
      </td>
      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{order.id}</td>
      <td className="px-4 py-3 font-medium">{order.customer}</td>
      <td className="px-4 py-3 text-muted-foreground">{formatDate(order.createdAt)}</td>
      <td className="px-4 py-3">
        <div className="text-muted-foreground">{formatDate(order.dueDate)}</div>
        {overdue && <div className="text-xs font-semibold text-destructive">Atrasada</div>}
      </td>
      <td className="px-4 py-3 text-center font-medium">
        <OrderPiecesDetails order={order} triggerClassName="rounded-md bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground" />
      </td>
      <td className="px-4 py-3 text-right font-semibold">{formatBRL(order.total)}</td>
      <td className="px-4 py-3 text-right text-muted-foreground">{formatBRL(order.total - order.entry)}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClass[status]}`}>
          {statusLabel(status)}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <Button variant="ghost" size="icon" asChild aria-label={`Editar ${order.id}`}>
          <Link {...actionProps} href={`/encomendas/${order.id}/editar`}><Pencil className="h-4 w-4" /></Link>
        </Button>
      </td>
    </tr>
  );
}

function OrderPiecesDetails({ order, triggerClassName }: { order: Order; triggerClassName: string }) {
  const { data: items } = useItensEncomenda(order.id);

  return (
    <PiecesDetailsDialog
      pieces={piecesFor(order.total)}
      title={`Peças da encomenda ${order.id}`}
      description={`Detalhamento dos produtos e tamanhos reservados para ${order.customer}.`}
      items={items}
      triggerClassName={triggerClassName}
    />
  );
}

function OrderActionButton({
  id,
  status,
  onMove,
  actionProps,
}: {
  id: string;
  status: OrderListStatus;
  onMove: (id: string, nextStatus: OrderListStatus) => void;
  actionProps: Record<string, unknown>;
}) {
  if (status === "Novo") {
    return (
      <button
        {...actionProps}
        onClick={() => onMove(id, "Em produção")}
        className="inline-flex h-10 w-36 items-center justify-center gap-2 rounded-md border border-primary/25 bg-primary/10 text-sm font-medium text-primary transition hover:bg-primary/15"
      >
        <Play className="h-4 w-4" />
        Iniciar
      </button>
    );
  }

  if (status === "Em produção") {
    return (
      <button
        {...actionProps}
        onClick={() => onMove(id, "Fabricado parcialmente")}
        className="inline-flex h-10 w-36 items-center justify-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
      >
        <CircleCheck className="h-4 w-4" />
        Concluir
      </button>
    );
  }

  if (status === "Fabricado parcialmente") {
    return (
      <button
        {...actionProps}
        onClick={() => onMove(id, "Pronta")}
        className="inline-flex h-10 w-36 items-center justify-center gap-2 rounded-md border border-[rgb(var(--partial))/0.35] bg-[rgb(var(--partial-soft))] text-sm font-medium text-[rgb(var(--partial-foreground))] transition hover:bg-[rgb(var(--partial-soft))/0.8]"
      >
        <CircleCheck className="h-4 w-4" />
        Concluir
      </button>
    );
  }

  if (status === "Pronta") {
    return (
      <Link
        {...actionProps}
        href={`/vendas/nova?from=encomenda&id=${id}`}
        className="inline-flex h-10 w-36 items-center justify-center gap-2 rounded-md bg-emerald-600 text-sm font-semibold text-white transition hover:bg-emerald-700"
      >
        <ShoppingCart className="h-4 w-4" />
        Vender
      </Link>
    );
  }

  if (status === "Entregue") {
    return (
      <span className="inline-flex h-10 w-36 items-center justify-center rounded-md bg-primary text-xs font-semibold uppercase tracking-wide text-primary-foreground">
        Já faturado
      </span>
    );
  }

  return <div className="h-10 w-36" />;
}
