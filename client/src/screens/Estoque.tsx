import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ClearFiltersShortcutDialog } from "@/components/ClearFiltersShortcutDialog";
import { DataGridColumnHeader } from "@/components/DataGridColumnHeader";
import { IndexedTabsNav } from "@/components/IndexedTabsNav";
import { PaginationFooter } from "@/components/PaginationFooter";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { useIndexedTabs } from "@/hooks/useIndexedTabs";
import { TableSkeleton } from "@/components/TableSkeleton";
import { useDataGrid, type DataGridColumn } from "@/hooks/useDataGrid";
import { useServerPagination } from "@/hooks/usePagination";
import { useProdutosPaginados } from "@/lib/api";

const tabs = ["Saldos", "Movimentações", "Ajuste manual"] as const;
const tamanhos = ["P", "M", "G", "GG"];

export default function Estoque() {
  const [aba, setAba] = useState<(typeof tabs)[number]>("Saldos");
  const [page, setPage] = useState(1);
  const indexedTabs = useIndexedTabs({ tabs, onTabChange: setAba });

  const { data: response, isLoading } = useProdutosPaginados({ page, pageSize: 30 });

  const linhasEstoque = useMemo(
    () =>
      (response?.data ?? []).map((produto, index) => ({
        ...produto,
        estoquePorTamanho: Object.fromEntries(tamanhos.map((tamanho, i) => [tamanho, Math.max(0, Math.floor(produto.estoque / 4) + (i - 1) + index)])),
        emFichas: index * 2,
      })),
    [response?.data],
  );

  const colunas = useMemo<DataGridColumn<(typeof linhasEstoque)[number]>[]>(
    () => [
      { id: "nome", label: "Produto", accessor: (p) => p.nome },
      ...tamanhos.map((tamanho) => ({
        id: tamanho,
        label: tamanho,
        accessor: (p: (typeof linhasEstoque)[number]) => p.estoquePorTamanho[tamanho],
      })),
      { id: "emFichas", label: "Em ficha", accessor: (p) => p.emFichas },
      { id: "estoque", label: "Total", accessor: (p) => p.estoque },
    ],
    [linhasEstoque],
  );
  const grid = useDataGrid(linhasEstoque, colunas);
  const paginacao = useServerPagination(response, setPage);

  return (
    <AppShell>
      <ClearFiltersShortcutDialog onConfirm={() => { grid.clearFilters(); setPage(1); }} />
      <PageHeader
        breadcrumb={["Estoque", aba]}
        title="Estoque"
        infoTooltip="Mostra saldos por produto e tamanho, movimentações e ajustes manuais de estoque."
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="shrink-0 border-b px-6 py-4">
          <IndexedTabsNav
            tabs={tabs}
            activeTab={aba}
            onSelect={setAba}
            getTabButtonProps={indexedTabs.getTabButtonProps}
            getShortcutLabel={indexedTabs.getShortcutLabel}
            className="flex gap-1 border-b"
            listClassName="flex min-w-max gap-1"
            buttonClassName="relative flex items-center gap-1 px-4 py-2 text-sm font-medium leading-tight transition"
            activeClassName="text-primary"
            inactiveClassName="text-muted-foreground hover:text-foreground"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-6">
        {aba === "Saldos" && (
          <div {...indexedTabs.getTabPanelProps("Saldos")}>
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  {colunas.map((coluna) => (
                    <DataGridColumnHeader
                      key={coluna.id}
                      grid={grid}
                      columnId={coluna.id}
                      label={coluna.label}
                      align={coluna.id === "nome" ? "left" : "center"}
                    />
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <TableSkeleton cols={7} />
                ) : linhasEstoque.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{p.nome}</td>
                    {tamanhos.map((t) => {
                      const val = p.estoquePorTamanho[t];
                      return (
                        <td key={t} className={`px-4 py-3 text-center ${val === 0 ? "text-muted-foreground" : ""}`}>
                          {val}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center text-warning">{p.emFichas}</td>
                    <td className="px-4 py-3 text-center font-semibold">{p.estoque}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <PaginationFooter pagination={paginacao} />
          </Card>
          </div>
        )}

        {aba === "Movimentações" && (
          <Card {...indexedTabs.getTabPanelProps("Movimentações")} className="p-10 text-center text-sm text-muted-foreground">
            Histórico de entradas, vendas, envios e devoluções aparecerá aqui.
          </Card>
        )}
        {aba === "Ajuste manual" && (
          <Card {...indexedTabs.getTabPanelProps("Ajuste manual")} className="p-10 text-center text-sm text-muted-foreground">
            Formulário de ajuste manual com justificativa obrigatória.
          </Card>
        )}
        </div>
      </div>
    </AppShell>
  );
}
