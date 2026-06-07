import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ClearFiltersShortcutDialog } from "@/components/ClearFiltersShortcutDialog";
import { DataGrid, type GridColumnDef } from "@/components/DataGrid";
import { IndexedTabsNav } from "@/components/IndexedTabsNav";
import { AppSelect } from "@/components/AppSelect";
import { PaginationFooter } from "@/components/PaginationFooter";
import { PageHeader } from "@/components/PageHeader";
import { CardsSkeleton } from "@/components/TableSkeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatBRL, type Customer } from "@/lib/types";
import { useClientesPaginados } from "@/lib/api";
import { useIndexedTabs } from "@/hooks/useIndexedTabs";
import { useDataGrid } from "@/hooks/useDataGrid";
import { useServerPagination } from "@/hooks/usePagination";
import { Pencil, Plus, Search } from "lucide-react";
import Link from "next/link";

const tabs = ["Todos", "Varejo", "Atacado"] as const;
type AbaCliente = (typeof tabs)[number];

const abaParaTipo = (aba: AbaCliente): string | undefined => {
  if (aba === "Varejo") return "varejo";
  if (aba === "Atacado") return "atacado";
  return undefined;
};

export default function Clientes() {
  const [aba, setAba] = useState<AbaCliente>("Todos");
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("all");
  const [page, setPage] = useState(1);
  const indexedTabs = useIndexedTabs({ tabs, onTabChange: (novaAba) => { setAba(novaAba); setPage(1); } });

  const { data: response, isLoading } = useClientesPaginados({
    search: busca || undefined,
    tipo: abaParaTipo(aba),
    status: filtroStatus !== "all" ? filtroStatus : undefined,
    page,
    pageSize: 30,
  });

  const colunas = useMemo<GridColumnDef<Customer>[]>(
    () => [
      { id: "nome", label: "Nome", accessor: (c) => c.nome, render: (c) => <span className="font-medium">{c.nome}</span> },
      { id: "telefone", label: "Telefone", accessor: (c) => c.telefone, render: (c) => <span className="text-muted-foreground">{c.telefone}</span> },
      { id: "cpf", label: "CPF", accessor: (c) => c.cpf, render: (c) => <span className="font-mono text-xs">{c.cpf}</span> },
      {
        id: "tipo", label: "Tipo", accessor: (c) => c.tipo,
        render: (c) => (
          <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium uppercase">{c.tipo}</span>
        ),
      },
      {
        id: "credito", label: "Crédito", accessor: (c) => c.credito,
        align: "right",
        render: (c) => formatBRL(c.credito),
      },
    ],
    [],
  );

  const grid = useDataGrid(response?.data ?? [], colunas);
  const paginacao = useServerPagination(response, setPage);

  const resetFiltros = () => {
    setBusca("");
    setFiltroStatus("all");
    setAba("Todos");
    setPage(1);
    grid.clearFilters();
  };

  return (
    <AppShell>
      <ClearFiltersShortcutDialog onConfirm={resetFiltros} />
      <PageHeader
        breadcrumb={["Clientes", aba]}
        title="Clientes"
        infoTooltip="Gerencia cadastro de clientes, perfis de varejo e atacado, status e crédito disponível."
        actions={
          <Button asChild>
            <Link href="/clientes/novo"><Plus className="mr-1.5 h-4 w-4" />Novo cliente</Link>
          </Button>
        }
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="shrink-0 space-y-4 border-b px-6 py-4">
          <IndexedTabsNav
            tabs={tabs}
            activeTab={aba}
            onSelect={(novaAba) => { setAba(novaAba); setPage(1); }}
            getTabButtonProps={indexedTabs.getTabButtonProps}
            getShortcutLabel={indexedTabs.getShortcutLabel}
          />

          <Card className="p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, telefone ou CPF"
                  className="pl-9"
                  value={busca}
                  onChange={(e) => { setBusca(e.target.value); setPage(1); }}
                />
              </div>
              <AppSelect
                className="w-full lg:w-[150px]"
                value={filtroStatus}
                onValueChange={(v) => { setFiltroStatus(v); setPage(1); }}
                options={[
                  { value: "all", label: "Todos status" },
                  { value: "Ativo", label: "Ativos" },
                  { value: "Inativo", label: "Inativos" },
                ]}
              />
            </div>
          </Card>
        </div>

        <div {...indexedTabs.getTabPanelProps(aba)} className="flex-1 overflow-y-auto p-6">
          {/* Mobile */}
          <div className="grid gap-3 lg:hidden">
            {isLoading ? (
              <CardsSkeleton />
            ) : paginacao.items.length === 0 ? (
              <Card className="p-6 text-center text-sm text-muted-foreground">Nenhum cliente encontrado</Card>
            ) : paginacao.items.map((c) => (
              <Card key={c.id} className="space-y-2 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium">{c.nome}</div>
                  <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium uppercase">{c.tipo}</span>
                </div>
                <div className="text-sm text-muted-foreground">{c.telefone} · {c.cpf}</div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{formatBRL(c.credito)}</span>
                  <Button variant="ghost" size="icon" asChild>
                    <Link {...indexedTabs.getActionProps(aba)} href={`/clientes/${c.id}/editar`}><Pencil className="h-4 w-4" /></Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          <PaginationFooter pagination={paginacao} className="mt-3 rounded-md border lg:hidden" />

          {/* Desktop */}
          <div className="hidden lg:block">
            <DataGrid
              grid={grid}
              columns={colunas}
              isLoading={isLoading}
              emptyMessage="Nenhum cliente encontrado"
              editHref={(c) => `/clientes/${c.id}/editar`}
              actionLinkProps={indexedTabs.getActionProps(aba)}
              footer={<PaginationFooter pagination={paginacao} />}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
