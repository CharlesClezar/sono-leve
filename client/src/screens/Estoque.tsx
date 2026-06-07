import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ClearFiltersShortcutDialog } from "@/components/ClearFiltersShortcutDialog";
import { DataGrid, type GridColumnDef } from "@/components/DataGrid";
import { IndexedTabsNav } from "@/components/IndexedTabsNav";
import { PaginationFooter } from "@/components/PaginationFooter";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useIndexedTabs } from "@/hooks/useIndexedTabs";
import { useDataGrid } from "@/hooks/useDataGrid";
import { useServerPagination } from "@/hooks/usePagination";
import { useProdutosPaginados } from "@/lib/api";
import { Search } from "lucide-react";

const tabs = ["Saldos", "Movimentações", "Ajuste manual"] as const;
const tamanhos = ["P", "M", "G", "GG"];

export default function Estoque() {
  const [aba, setAba] = useState<(typeof tabs)[number]>("Saldos");
  const [busca, setBusca] = useState("");
  const [page, setPage] = useState(1);
  const indexedTabs = useIndexedTabs({ tabs, onTabChange: setAba });

  const { data: response, isLoading } = useProdutosPaginados({
    search: busca || undefined,
    page,
    pageSize: 30,
  });

  const linhasEstoque = useMemo(
    () =>
      (response?.data ?? []).map((produto) => ({
        ...produto,
        estoquePorTamanho: Object.fromEntries(tamanhos.map((tamanho) => [tamanho, Math.floor(produto.estoque / tamanhos.length)])),
        emFichas: 0,
      })),
    [response?.data],
  );

  const colunas = useMemo<GridColumnDef<(typeof linhasEstoque)[number]>[]>(
    () => [
      { id: "nome", label: "Produto", accessor: (p) => p.nome, render: (p) => <span className="font-medium">{p.nome}</span> },
      ...tamanhos.map((tamanho) => ({
        id: tamanho,
        label: tamanho,
        accessor: (p: (typeof linhasEstoque)[number]) => p.estoquePorTamanho[tamanho],
        align: "center" as const,
        render: (p: (typeof linhasEstoque)[number]) => {
          const val = p.estoquePorTamanho[tamanho];
          return <span className={val === 0 ? "text-muted-foreground" : ""}>{val}</span>;
        },
      })),
      {
        id: "emFichas", label: "Em ficha", accessor: (p) => p.emFichas,
        align: "center",
        render: (p) => <span className="text-warning">{p.emFichas}</span>,
      },
      {
        id: "estoque", label: "Total", accessor: (p) => p.estoque,
        align: "center",
        render: (p) => <span className="font-semibold">{p.estoque}</span>,
      },
    ],
    [linhasEstoque],
  );
  const grid = useDataGrid(linhasEstoque, colunas);
  const paginacao = useServerPagination(response, setPage);

  return (
    <AppShell>
      <ClearFiltersShortcutDialog onConfirm={() => { setBusca(""); grid.clearFilters(); setPage(1); }} />
      <PageHeader
        breadcrumb={["Estoque", aba]}
        title="Estoque"
        infoTooltip="Mostra saldos por produto e tamanho, movimentações e ajustes manuais de estoque."
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="shrink-0 space-y-4 border-b px-6 py-4">
          <IndexedTabsNav
            tabs={tabs}
            activeTab={aba}
            onSelect={setAba}
            getTabButtonProps={indexedTabs.getTabButtonProps}
            getShortcutLabel={indexedTabs.getShortcutLabel}
          />

          {aba === "Saldos" && (
            <Card className="p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por produto"
                    className="pl-9"
                    value={busca}
                    onChange={(e) => { setBusca(e.target.value); setPage(1); }}
                  />
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
        {aba === "Saldos" && (
          <div {...indexedTabs.getTabPanelProps("Saldos")}>
            <DataGrid
              grid={grid}
              columns={colunas}
              isLoading={isLoading}
              emptyMessage="Nenhum produto encontrado"
              footer={<PaginationFooter pagination={paginacao} />}
            />
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
