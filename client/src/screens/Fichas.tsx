import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ClearFiltersShortcutDialog } from "@/components/ClearFiltersShortcutDialog";
import { DataGrid, type GridColumnDef } from "@/components/DataGrid";
import { IndexedTabsNav } from "@/components/IndexedTabsNav";
import { PaginationFooter } from "@/components/PaginationFooter";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { CardsSkeleton } from "@/components/TableSkeleton";
import { formatBRL, formatDate, type Ficha } from "@/lib/types";
import { useFichasPaginadas } from "@/lib/api";
import { useIndexedTabs } from "@/hooks/useIndexedTabs";
import { useShortcutLabel } from "@/hooks/useShortcutLabel";
import { useDataGrid } from "@/hooks/useDataGrid";
import { useServerPagination } from "@/hooks/usePagination";
import { Pencil, Plus, Search } from "lucide-react";
import Link from "next/link";

const tabs = ["Histórico", "Aberta", "Parcial", "Finalizada", "Cancelada"] as const;

export default function Fichas() {
  const newShortcutLabel = useShortcutLabel("new_contextual");
  const [tab, setTab] = useState<(typeof tabs)[number]>("Histórico");
  const [queryByTab, setQueryByTab] = useState<Record<(typeof tabs)[number], string>>(
    () => Object.fromEntries(tabs.map((item) => [item, ""])) as Record<(typeof tabs)[number], string>,
  );
  const [pageByTab, setPageByTab] = useState<Record<(typeof tabs)[number], number>>(
    () => Object.fromEntries(tabs.map((item) => [item, 1])) as Record<(typeof tabs)[number], number>,
  );
  const selectTab = (nextTab: (typeof tabs)[number]) => setTab(nextTab);
  const indexedTabs = useIndexedTabs({ tabs, onTabChange: selectTab });
  const query = queryByTab[tab];
  const page = pageByTab[tab];

  const setTabQuery = (nextQuery: string) => {
    setQueryByTab((current) => ({ ...current, [tab]: nextQuery }));
    setPageByTab((current) => ({ ...current, [tab]: 1 }));
  };
  const setTabPage = (p: number) => setPageByTab((current) => ({ ...current, [tab]: p }));

  const { data: response, isLoading } = useFichasPaginadas({
    search: query || undefined,
    status: tab !== "Histórico" ? tab : undefined,
    page,
    pageSize: 30,
  });

  const columns = useMemo<GridColumnDef<Ficha>[]>(
    () => [
      { id: "id", label: "Ficha", accessor: (f) => f.id, render: (f) => <span className="font-mono text-xs">{f.id}</span> },
      { id: "revendedora", label: "Revendedora", accessor: (f) => f.revendedoraNome, render: (f) => <span className="font-medium">{f.revendedoraNome}</span> },
      {
        id: "dataAbertura", label: "Abertura", accessor: (f) => f.dataAbertura,
        filterAccessor: (f) => formatDate(f.dataAbertura),
        render: (f) => <span className="text-muted-foreground">{formatDate(f.dataAbertura)}</span>,
      },
      { id: "enviadas", label: "Enviadas", accessor: (f) => f.enviadas, align: "center" },
      { id: "devolvidas", label: "Devolvidas", accessor: (f) => f.devolvidas, align: "center", render: (f) => <span className="text-muted-foreground">{f.devolvidas}</span> },
      { id: "vendidas", label: "Vendidas", accessor: (f) => f.vendidas, align: "center", render: (f) => <span className="font-semibold text-primary">{f.vendidas}</span> },
      {
        id: "totalVendido", label: "Total vendido", accessor: (f) => f.totalVendido,
        align: "right",
        render: (f) => <span className="font-semibold">{formatBRL(f.totalVendido)}</span>,
      },
      { id: "status", label: "Status", accessor: (f) => f.status, render: (f) => <StatusBadge status={f.status} /> },
    ],
    [],
  );

  const grid = useDataGrid(response?.data ?? [], columns);
  const pagination = useServerPagination(response, setTabPage);

  return (
    <AppShell>
      <ClearFiltersShortcutDialog
        onConfirm={() => {
          setQueryByTab(Object.fromEntries(tabs.map((item) => [item, ""])) as Record<(typeof tabs)[number], string>);
          setPageByTab(Object.fromEntries(tabs.map((item) => [item, 1])) as Record<(typeof tabs)[number], number>);
          grid.clearFilters();
        }}
      />
      <PageHeader
        breadcrumb={["Fichas", tab]}
        title="Fichas / Consignado"
        infoTooltip="Controle de peças enviadas para revendedoras, com acompanhamento de envio, devolução, venda e faturamento."
        actions={
          <Button asChild>
            <Link href="/fichas/nova"><Plus className="mr-1.5 h-4 w-4" />{`Nova ficha${newShortcutLabel}`}</Link>
          </Button>
        }
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="shrink-0 space-y-4 border-b px-6 py-4">
          <IndexedTabsNav tabs={tabs} activeTab={tab} onSelect={selectTab} getTabButtonProps={indexedTabs.getTabButtonProps} getShortcutLabel={indexedTabs.getShortcutLabel} />
          <Card className="p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Buscar por revendedora ou código" className="pl-9" value={query} onChange={(e) => setTabQuery(e.target.value)} />
              </div>
            </div>
          </Card>
        </div>

        <div {...indexedTabs.getTabPanelProps(tab)} className="flex-1 overflow-y-auto p-6">
          {/* Mobile */}
          <div className="grid gap-3 lg:hidden">
            {isLoading ? (
              <CardsSkeleton />
            ) : pagination.items.length === 0 ? (
              <Card className="p-6 text-center text-sm text-muted-foreground">Nenhuma ficha encontrada</Card>
            ) : pagination.items.map((f) => (
              <Card key={f.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{f.revendedoraNome}</div>
                    <div className="font-mono text-xs text-muted-foreground">{f.id}</div>
                  </div>
                  <StatusBadge status={f.status} />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><div className="text-xs uppercase tracking-wide text-muted-foreground">Abertura</div><div>{formatDate(f.dataAbertura)}</div></div>
                  <div><div className="text-xs uppercase tracking-wide text-muted-foreground">Enviadas</div><div>{f.enviadas}</div></div>
                  <div><div className="text-xs uppercase tracking-wide text-muted-foreground">Devolvidas</div><div>{f.devolvidas}</div></div>
                  <div><div className="text-xs uppercase tracking-wide text-muted-foreground">Vendidas</div><div className="font-semibold text-primary">{f.vendidas}</div></div>
                  <div className="col-span-2"><div className="text-xs uppercase tracking-wide text-muted-foreground">Total vendido</div><div className="font-semibold">{formatBRL(f.totalVendido)}</div></div>
                </div>
                <div className="flex justify-end">
                  <Button variant="ghost" size="icon" asChild aria-label={`Editar ${f.id}`}>
                    <Link {...indexedTabs.getActionProps(tab)} href={`/fichas/${f.id}/editar`}><Pencil className="h-4 w-4" /></Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          <PaginationFooter pagination={pagination} className="mt-3 rounded-md border lg:hidden" />

          {/* Desktop */}
          <div className="hidden lg:block">
            <DataGrid
              grid={grid}
              columns={columns}
              isLoading={isLoading}
              emptyMessage="Nenhuma ficha encontrada"
              editHref={(f) => `/fichas/${f.id}/editar`}
              actionLinkProps={indexedTabs.getActionProps(tab)}
              footer={<PaginationFooter pagination={pagination} />}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
