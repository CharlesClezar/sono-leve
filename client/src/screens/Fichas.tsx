import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ClearFiltersShortcutDialog } from "@/components/ClearFiltersShortcutDialog";
import { DataGridColumnHeader } from "@/components/DataGridColumnHeader";
import { IndexedTabsNav } from "@/components/IndexedTabsNav";
import { PaginationFooter } from "@/components/PaginationFooter";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { formatBRL, formatDate, type Ficha } from "@/lib/types";
import { useFichas } from "@/lib/api";
import { useIndexedTabs } from "@/hooks/useIndexedTabs";
import { useShortcutLabel } from "@/hooks/useShortcutLabel";
import { useDataGrid, type DataGridColumn } from "@/hooks/useDataGrid";
import { usePagination } from "@/hooks/usePagination";
import { TableSkeleton } from "@/components/TableSkeleton";
import { Pencil, Plus, Search } from "lucide-react";
import Link from "next/link";

const tabs = ["Histórico", "Aberta", "Parcial", "Finalizada", "Cancelada"] as const;

export default function Fichas() {
  const { data: fichas = [], isLoading } = useFichas();
  const newShortcutLabel = useShortcutLabel("new_contextual");
  const [tab, setTab] = useState<(typeof tabs)[number]>("Histórico");
  const [queryByTab, setQueryByTab] = useState<Record<(typeof tabs)[number], string>>(
    () => Object.fromEntries(tabs.map((item) => [item, ""])) as Record<(typeof tabs)[number], string>,
  );
  const selectTab = (nextTab: (typeof tabs)[number]) => setTab(nextTab);
  const indexedTabs = useIndexedTabs({ tabs, onTabChange: selectTab });
  const query = queryByTab[tab];
  const setTabQuery = (nextQuery: string) => {
    setQueryByTab((current) => ({ ...current, [tab]: nextQuery }));
  };
  const columns = useMemo<DataGridColumn<Ficha>[]>(
    () => [
      { id: "id", label: "Ficha", accessor: (ficha) => ficha.id },
      { id: "revendedora", label: "Revendedora", accessor: (ficha) => ficha.revendedoraNome },
      { id: "dataAbertura", label: "Abertura", accessor: (ficha) => ficha.dataAbertura, filterAccessor: (ficha) => formatDate(ficha.dataAbertura) },
      { id: "enviadas", label: "Enviadas", accessor: (ficha) => ficha.enviadas },
      { id: "devolvidas", label: "Devolvidas", accessor: (ficha) => ficha.devolvidas },
      { id: "vendidas", label: "Vendidas", accessor: (ficha) => ficha.vendidas },
      { id: "totalVendido", label: "Total vendido", accessor: (ficha) => ficha.totalVendido },
      { id: "status", label: "Status", accessor: (ficha) => ficha.status },
    ],
    [],
  );

  const filtered = useMemo(
    () =>
      fichas.filter((f) => {
        if (tab !== "Histórico" && f.status !== tab) return false;
        if (query && !f.revendedoraNome.toLowerCase().includes(query.toLowerCase()) && !f.id.toLowerCase().includes(query.toLowerCase()))
          return false;
        return true;
      }),
    [query, tab, fichas]
  );
  const grid = useDataGrid(filtered, columns);
  const pagination = usePagination(grid.rows);

  return (
    <AppShell>
      <ClearFiltersShortcutDialog
        onConfirm={() => {
          setQueryByTab(Object.fromEntries(tabs.map((item) => [item, ""])) as Record<(typeof tabs)[number], string>);
          grid.clearFilters();
        }}
      />
      <PageHeader
        breadcrumb={["Fichas"]}
        title="Fichas / Consignado"
        infoTooltip="Controle de peças enviadas para revendedoras, com acompanhamento de envio, devolução, venda e faturamento."
        actions={
          <Button asChild>
            <Link href="/fichas/nova"><Plus className="mr-1.5 h-4 w-4" />{`Nova ficha${newShortcutLabel}`}</Link>
          </Button>
        }
      />
      <div className="space-y-4 p-6">
        <div className="sticky top-20 z-20 -mx-6 space-y-4 border-b bg-background/95 px-6 pb-4 pt-4 backdrop-blur">
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

        <div {...indexedTabs.getTabPanelProps(tab)} className="space-y-4">
        <div className="grid gap-3 lg:hidden">
          {pagination.items.length === 0 ? (
            <Card className="p-6 text-center text-sm text-muted-foreground">Nenhuma ficha encontrada</Card>
          ) : (
            pagination.items.map((f) => (
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
            ))
          )}
        </div>
        <PaginationFooter pagination={pagination} className="rounded-md border lg:hidden" />

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
                    align={["enviadas", "devolvidas", "vendidas"].includes(column.id) ? "center" : column.id === "totalVendido" ? "right" : "left"}
                  />
                ))}
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <TableSkeleton cols={9} />
              ) : pagination.items.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-sm text-muted-foreground">Nenhuma ficha encontrada</td></tr>
              ) : pagination.items.map((f) => (
                <tr key={f.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{f.id}</td>
                  <td className="px-4 py-3 font-medium">{f.revendedoraNome}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(f.dataAbertura)}</td>
                  <td className="px-4 py-3 text-center">{f.enviadas}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{f.devolvidas}</td>
                  <td className="px-4 py-3 text-center font-semibold text-primary">{f.vendidas}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatBRL(f.totalVendido)}</td>
                  <td className="px-4 py-3"><StatusBadge status={f.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" asChild aria-label={`Editar ${f.id}`}>
                      <Link {...indexedTabs.getActionProps(tab)} href={`/fichas/${f.id}/editar`}><Pencil className="h-4 w-4" /></Link>
                    </Button>
                  </td>
                </tr>
              ))}
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
