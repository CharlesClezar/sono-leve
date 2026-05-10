import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ClearFiltersShortcutDialog } from "@/components/ClearFiltersShortcutDialog";
import { DataGridColumnHeader } from "@/components/DataGridColumnHeader";
import { IndexedTabsNav } from "@/components/IndexedTabsNav";
import { PaginationFooter } from "@/components/PaginationFooter";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { useIndexedTabs } from "@/hooks/useIndexedTabs";
import { useDataGrid, type DataGridColumn } from "@/hooks/useDataGrid";
import { usePagination } from "@/hooks/usePagination";
import { useProdutos } from "@/lib/api";

const tabs = ["Saldos", "Movimentações", "Ajuste manual"] as const;
const sizes = ["P", "M", "G", "GG"];

export default function Estoque() {
  const { data: products } = useProdutos();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Saldos");
  const indexedTabs = useIndexedTabs({ tabs, onTabChange: setTab });
  const stockRows = useMemo(
    () =>
      products.map((product, index) => ({
        ...product,
        sizeStock: Object.fromEntries(sizes.map((size, sizeIndex) => [size, Math.max(0, Math.floor(product.stock / 4) + (sizeIndex - 1) + index)])),
        inFichas: index * 2,
      })),
    [products],
  );
  const columns = useMemo<DataGridColumn<(typeof stockRows)[number]>[]>(
    () => [
      { id: "name", label: "Produto", accessor: (product) => product.name },
      ...sizes.map((size) => ({
        id: size,
        label: size,
        accessor: (product: (typeof stockRows)[number]) => product.sizeStock[size],
      })),
      { id: "inFichas", label: "Em ficha", accessor: (product) => product.inFichas },
      { id: "stock", label: "Total", accessor: (product) => product.stock },
    ],
    [stockRows],
  );
  const grid = useDataGrid(stockRows, columns);
  const pagination = usePagination(grid.rows);
  return (
    <AppShell>
      <ClearFiltersShortcutDialog onConfirm={() => grid.clearFilters()} />
      <PageHeader
        breadcrumb={["Estoque", tab]}
        title="Estoque"
        infoTooltip="Mostra saldos por produto e tamanho, movimentações e ajustes manuais de estoque."
      />
      <div className="space-y-4 p-6">
        <div className="sticky top-20 z-20 -mx-6 border-b bg-background/95 px-6 pb-4 pt-4 backdrop-blur">
          <IndexedTabsNav
            tabs={tabs}
            activeTab={tab}
            onSelect={setTab}
            getTabButtonProps={indexedTabs.getTabButtonProps}
            getShortcutLabel={indexedTabs.getShortcutLabel}
            className="flex gap-1 border-b"
            listClassName="flex min-w-max gap-1"
            buttonClassName="relative flex items-center gap-1 px-4 py-2 text-sm font-medium leading-tight transition"
            activeClassName="text-primary"
            inactiveClassName="text-muted-foreground hover:text-foreground"
          />
        </div>

        {tab === "Saldos" && (
          <div {...indexedTabs.getTabPanelProps("Saldos")}>
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  {columns.map((column) => (
                    <DataGridColumnHeader
                      key={column.id}
                      grid={grid}
                      columnId={column.id}
                      label={column.label}
                      align={column.id === "name" ? "left" : "center"}
                    />
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {pagination.items.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    {sizes.map((s) => {
                      const val = p.sizeStock[s];
                      return (
                        <td key={s} className={`px-4 py-3 text-center ${val === 0 ? "text-muted-foreground" : ""}`}>
                          {val}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center text-warning">{p.inFichas}</td>
                    <td className="px-4 py-3 text-center font-semibold">{p.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <PaginationFooter pagination={pagination} />
          </Card>
          </div>
        )}

        {tab === "Movimentações" && (
          <Card {...indexedTabs.getTabPanelProps("Movimentações")} className="p-10 text-center text-sm text-muted-foreground">
            Histórico de entradas, vendas, envios e devoluções aparecerá aqui.
          </Card>
        )}
        {tab === "Ajuste manual" && (
          <Card {...indexedTabs.getTabPanelProps("Ajuste manual")} className="p-10 text-center text-sm text-muted-foreground">
            Formulário de ajuste manual com justificativa obrigatória.
          </Card>
        )}
      </div>
    </AppShell>
  );
}
