import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AppSelect } from "@/components/AppSelect";
import { ClearFiltersShortcutDialog } from "@/components/ClearFiltersShortcutDialog";
import { DataGridColumnHeader } from "@/components/DataGridColumnHeader";
import { PaginationFooter } from "@/components/PaginationFooter";
import { IndexedTabsNav } from "@/components/IndexedTabsNav";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { useIndexedTabs } from "@/hooks/useIndexedTabs";
import { formatBRL, formatDate, type Account } from "@/lib/types";
import { useContasReceber } from "@/lib/api";
import { TableSkeleton } from "@/components/TableSkeleton";
import { useDataGrid, type DataGridColumn } from "@/hooks/useDataGrid";
import { usePagination } from "@/hooks/usePagination";
import { Search } from "lucide-react";

const tabs = ["Contas a receber", "Recebimentos"] as const;

export default function Financeiro() {
  const { data: contas = [], isLoading } = useContasReceber();
  const [aba, setAba] = useState<(typeof tabs)[number]>("Contas a receber");
  const indexedTabs = useIndexedTabs({ tabs, onTabChange: setAba });
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("all");
  const colunas = useMemo<DataGridColumn<Account>[]>(
    () => [
      { id: "cliente", label: "Cliente", accessor: (conta) => conta.clienteNome },
      { id: "origem", label: "Origem", accessor: (conta) => conta.origem },
      { id: "total", label: "Total", accessor: (conta) => conta.total },
      { id: "recebido", label: "Recebido", accessor: (conta) => conta.recebido },
      { id: "balance", label: "Saldo", accessor: (conta) => conta.total - conta.recebido },
      { id: "vencimento", label: "Vencimento", accessor: (conta) => conta.vencimento, filterAccessor: (conta) => formatDate(conta.vencimento) },
      { id: "status", label: "Status", accessor: (conta) => conta.status },
    ],
    [],
  );

  const contasFiltradas = useMemo(
    () =>
      contas.filter((c) => {
        if (filtroStatus !== "all" && c.status !== filtroStatus) return false;
        if (busca && !c.clienteNome.toLowerCase().includes(busca.toLowerCase()) && !c.origem.toLowerCase().includes(busca.toLowerCase()))
          return false;
        return true;
      }),
    [busca, filtroStatus, contas]
  );
  const grid = useDataGrid(contasFiltradas, colunas);
  const paginacao = usePagination(grid.rows);

  const totalFaturado = contas.reduce((s, c) => s + c.total, 0);
  const totalRecebido = contas.reduce((s, c) => s + c.recebido, 0);
  const emAberto = totalFaturado - totalRecebido;

  return (
    <AppShell>
      <ClearFiltersShortcutDialog
        onConfirm={() => {
          setBusca("");
          setFiltroStatus("all");
          grid.clearFilters();
        }}
      />
      <PageHeader
        breadcrumb={["Financeiro", aba]}
        title="Financeiro"
        infoTooltip="Concentra contas a receber, recebimentos e acompanhamento financeiro das vendas e encomendas."
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="shrink-0 space-y-4 border-b px-6 py-4">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: "Total faturado", value: totalFaturado, tone: "primary" },
              { label: "Recebido", value: totalRecebido, tone: "success" },
              { label: "Em aberto", value: emAberto, tone: "warning" },
            ].map((k) => (
              <Card key={k.label} className="p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{k.label}</div>
                <div className={`mt-1 text-2xl font-semibold ${
                  k.tone === "success" ? "text-[hsl(var(--success))]" : k.tone === "warning" ? "text-warning" : "text-primary"
                }`}>{formatBRL(k.value)}</div>
              </Card>
            ))}
          </div>

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

          {aba === "Contas a receber" && (
            <Card className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Buscar por cliente ou origem" className="pl-9" value={busca} onChange={(e) => setBusca(e.target.value)} />
                </div>
                <AppSelect
                  className="w-[170px]"
                  value={filtroStatus}
                  onValueChange={setFiltroStatus}
                  options={[
                    { value: "all", label: "Todos status" },
                    { value: "Aberto", label: "Aberto" },
                    { value: "Parcial", label: "Parcial" },
                    { value: "Pago", label: "Pago" },
                    { value: "Atrasado", label: "Atrasado" },
                    { value: "Cancelado", label: "Cancelado" },
                  ]}
                />
              </div>
            </Card>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {aba === "Contas a receber" && (
            <div {...indexedTabs.getTabPanelProps("Contas a receber")}>
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
                          align={["total", "recebido", "balance"].includes(coluna.id) ? "right" : "left"}
                        />
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {isLoading ? (
                      <TableSkeleton cols={7} />
                    ) : paginacao.items.length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">Nenhuma conta encontrada</td></tr>
                    ) : paginacao.items.map((a) => (
                      <tr key={a.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{a.clienteNome}</td>
                        <td className="px-4 py-3 text-muted-foreground">{a.origem}</td>
                        <td className="px-4 py-3 text-right">{formatBRL(a.total)}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{formatBRL(a.recebido)}</td>
                        <td className="px-4 py-3 text-right font-semibold">{formatBRL(a.total - a.recebido)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(a.vencimento)}</td>
                        <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <PaginationFooter pagination={paginacao} />
              </Card>
            </div>
          )}
          {aba === "Recebimentos" && (
            <Card {...indexedTabs.getTabPanelProps("Recebimentos")} className="p-10 text-center text-sm text-muted-foreground">
              Histórico de recebimentos com taxa, líquido e forma de pagamento.
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}
