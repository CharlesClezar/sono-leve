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
import { useDataGrid, type DataGridColumn } from "@/hooks/useDataGrid";
import { usePagination } from "@/hooks/usePagination";
import { Search } from "lucide-react";

const tabs = ["Contas a receber", "Recebimentos", "Formas de pagamento"] as const;

export default function Financeiro() {
  const { data: accounts } = useContasReceber();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Contas a receber");
  const indexedTabs = useIndexedTabs({ tabs, onTabChange: setTab });
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const columns = useMemo<DataGridColumn<Account>[]>(
    () => [
      { id: "customer", label: "Cliente", accessor: (account) => account.customer },
      { id: "origin", label: "Origem", accessor: (account) => account.origin },
      { id: "total", label: "Total", accessor: (account) => account.total },
      { id: "received", label: "Recebido", accessor: (account) => account.received },
      { id: "balance", label: "Saldo", accessor: (account) => account.total - account.received },
      { id: "dueDate", label: "Vencimento", accessor: (account) => account.dueDate, filterAccessor: (account) => formatDate(account.dueDate) },
      { id: "status", label: "Status", accessor: (account) => account.status },
    ],
    [],
  );

  const filtered = useMemo(
    () =>
      accounts.filter((a) => {
        if (status !== "all" && a.status !== status) return false;
        if (query && !a.customer.toLowerCase().includes(query.toLowerCase()) && !a.origin.toLowerCase().includes(query.toLowerCase()))
          return false;
        return true;
      }),
    [query, status]
  );
  const grid = useDataGrid(filtered, columns);
  const pagination = usePagination(grid.rows);

  const total = accounts.reduce((s, a) => s + a.total, 0);
  const received = accounts.reduce((s, a) => s + a.received, 0);
  const open = total - received;

  return (
    <AppShell>
      <ClearFiltersShortcutDialog
        onConfirm={() => {
          setQuery("");
          setStatus("all");
          grid.clearFilters();
        }}
      />
      <PageHeader
        breadcrumb={["Financeiro", tab]}
        title="Financeiro"
        infoTooltip="Concentra contas a receber, recebimentos e acompanhamento financeiro das vendas e encomendas."
      />
      <div className="space-y-4 p-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Total faturado", value: total, tone: "primary" },
            { label: "Recebido", value: received, tone: "success" },
            { label: "Em aberto", value: open, tone: "warning" },
          ].map((k) => (
            <Card key={k.label} className="p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{k.label}</div>
              <div className={`mt-1 text-2xl font-semibold ${
                k.tone === "success" ? "text-[hsl(var(--success))]" : k.tone === "warning" ? "text-warning" : "text-primary"
              }`}>{formatBRL(k.value)}</div>
            </Card>
          ))}
        </div>

        {tab === "Contas a receber" && (
          <div {...indexedTabs.getTabPanelProps("Contas a receber")} className="space-y-4">
            <div className="sticky top-20 z-20 -mx-6 space-y-4 border-b bg-background/95 px-6 pb-4 pt-4 backdrop-blur">
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

              <Card className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Buscar por cliente ou origem" className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
                </div>
                <AppSelect
                  className="w-[170px]"
                  value={status}
                  onValueChange={setStatus}
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
            </div>

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
                        align={["total", "received", "balance"].includes(column.id) ? "right" : "left"}
                      />
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pagination.items.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">Nenhuma conta encontrada</td></tr>
                  ) : pagination.items.map((a) => (
                    <tr key={a.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{a.customer}</td>
                      <td className="px-4 py-3 text-muted-foreground">{a.origin}</td>
                      <td className="px-4 py-3 text-right">{formatBRL(a.total)}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{formatBRL(a.received)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatBRL(a.total - a.received)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(a.dueDate)}</td>
                      <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <PaginationFooter pagination={pagination} />
            </Card>
          </div>
        )}

        {tab === "Recebimentos" && (
          <div {...indexedTabs.getTabPanelProps("Recebimentos")} className="space-y-4">
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
            <Card className="p-10 text-center text-sm text-muted-foreground">
              Histórico de recebimentos com taxa, líquido e forma de pagamento.
            </Card>
          </div>
        )}
        {tab === "Formas de pagamento" && (
          <div {...indexedTabs.getTabPanelProps("Formas de pagamento")} className="space-y-4">
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
            <Card className="p-10 text-center text-sm text-muted-foreground">
              Cadastro de formas de pagamento, taxas e parcelamentos.
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
