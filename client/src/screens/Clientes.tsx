import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AppSelect } from "@/components/AppSelect";
import { ClearFiltersShortcutDialog } from "@/components/ClearFiltersShortcutDialog";
import { DataGridColumnHeader } from "@/components/DataGridColumnHeader";
import { PaginationFooter } from "@/components/PaginationFooter";
import { PageHeader } from "@/components/PageHeader";
import { TableSkeleton, CardsSkeleton } from "@/components/TableSkeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatBRL, type Customer } from "@/lib/types";
import { useClientesPaginados } from "@/lib/api";
import { useDataGrid, type DataGridColumn } from "@/hooks/useDataGrid";
import { useServerPagination } from "@/hooks/usePagination";
import { Pencil, Plus, Search } from "lucide-react";
import Link from "next/link";

export default function Clientes() {
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("all");
  const [filtroStatus, setFiltroStatus] = useState("all");
  const [page, setPage] = useState(1);

  const { data: response, isLoading } = useClientesPaginados({
    search: busca || undefined,
    tipo: filtroTipo !== "all" ? filtroTipo : undefined,
    status: filtroStatus !== "all" ? filtroStatus : undefined,
    page,
    pageSize: 30,
  });

  const colunas = useMemo<DataGridColumn<Customer>[]>(
    () => [
      { id: "nome", label: "Nome", accessor: (c) => c.nome },
      { id: "telefone", label: "Telefone", accessor: (c) => c.telefone },
      { id: "cpf", label: "CPF", accessor: (c) => c.cpf },
      { id: "tipo", label: "Tipo", accessor: (c) => c.tipo },
      { id: "credito", label: "Crédito", accessor: (c) => c.credito },
    ],
    [],
  );

  const grid = useDataGrid(response?.data ?? [], colunas);
  const paginacao = useServerPagination(response, setPage);

  const resetFiltros = () => {
    setBusca("");
    setFiltroTipo("all");
    setFiltroStatus("all");
    setPage(1);
    grid.clearFilters();
  };

  return (
    <AppShell>
      <ClearFiltersShortcutDialog onConfirm={resetFiltros} />
      <PageHeader
        breadcrumb={["Clientes"]}
        title="Clientes"
        infoTooltip="Gerencia cadastro de clientes, perfis de varejo e atacado, status e crédito disponível."
        actions={
          <Button asChild>
            <Link href="/clientes/novo"><Plus className="mr-1.5 h-4 w-4" />Novo cliente</Link>
          </Button>
        }
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="shrink-0 border-b px-6 py-4">
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, telefone ou CPF"
                className="pl-9"
                value={busca}
                onChange={(e) => { setBusca(e.target.value); setPage(1); }}
              />
            </div>
            <AppSelect
              className="w-[150px]"
              value={filtroTipo}
              onValueChange={(v) => { setFiltroTipo(v); setPage(1); }}
              options={[
                { value: "all", label: "Todos tipos" },
                { value: "varejo", label: "Varejo" },
                { value: "atacado", label: "Atacado" },
              ]}
            />
            <AppSelect
              className="w-[130px]"
              value={filtroStatus}
              onValueChange={(v) => { setFiltroStatus(v); setPage(1); }}
              options={[
                { value: "all", label: "Todos" },
                { value: "Ativo", label: "Ativos" },
                { value: "Inativo", label: "Inativos" },
              ]}
            />
          </div>
        </Card>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
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
                  <Button variant="ghost" size="icon" asChild><Link href={`/clientes/${c.id}/editar`}><Pencil className="h-4 w-4" /></Link></Button>
                </div>
              </Card>
            ))}
          </div>
          <PaginationFooter pagination={paginacao} className="mt-3 rounded-md border lg:hidden" />

          <Card className="hidden overflow-hidden lg:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  {colunas.map((coluna) => (
                    <DataGridColumnHeader
                      key={coluna.id}
                      grid={grid}
                      columnId={coluna.id}
                      label={coluna.label}
                      align={coluna.id === "credito" ? "right" : "left"}
                    />
                  ))}
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <TableSkeleton cols={6} />
                ) : grid.rows.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">Nenhum cliente encontrado</td></tr>
                ) : grid.rows.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{c.nome}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.telefone}</td>
                    <td className="px-4 py-3 font-mono text-xs">{c.cpf}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium uppercase">{c.tipo}</span>
                    </td>
                    <td className="px-4 py-3 text-right">{formatBRL(c.credito)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon" asChild aria-label={`Editar ${c.nome}`}>
                        <Link href={`/clientes/${c.id}/editar`}><Pencil className="h-4 w-4" /></Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <PaginationFooter pagination={paginacao} />
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
