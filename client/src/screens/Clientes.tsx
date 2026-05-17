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
import { useClientes } from "@/lib/api";
import { useDataGrid, type DataGridColumn } from "@/hooks/useDataGrid";
import { usePagination } from "@/hooks/usePagination";
import { Pencil, Plus, Search } from "lucide-react";
import Link from "next/link";

export default function Clientes() {
  const { data: clientes = [], isLoading } = useClientes();
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("all");
  const [filtroStatus, setFiltroStatus] = useState("all");
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

  const clientesFiltrados = useMemo(
    () =>
      clientes.filter((c) => {
        if (filtroTipo !== "all" && c.tipo !== filtroTipo) return false;
        if (filtroStatus !== "all" && c.status !== filtroStatus) return false;
        if (busca) {
          const q = busca.toLowerCase();
          if (!c.nome.toLowerCase().includes(q) && !c.telefone.includes(q) && !c.cpf.includes(q)) return false;
        }
        return true;
      }),
    [busca, filtroTipo, filtroStatus]
  );
  const grid = useDataGrid(clientesFiltrados, colunas);
  const paginacao = usePagination(grid.rows);

  return (
    <AppShell>
      <ClearFiltersShortcutDialog
        onConfirm={() => {
          setBusca("");
          setFiltroTipo("all");
          setFiltroStatus("all");
          grid.clearFilters();
        }}
      />
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
              <Input placeholder="Buscar por nome, telefone ou CPF" className="pl-9" value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>
            <AppSelect
              className="w-[150px]"
              value={filtroTipo}
              onValueChange={setFiltroTipo}
              options={[
                { value: "all", label: "Todos tipos" },
                { value: "varejo", label: "Varejo" },
                { value: "atacado", label: "Atacado" },
              ]}
            />
            <AppSelect
              className="w-[130px]"
              value={filtroStatus}
              onValueChange={setFiltroStatus}
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
                    align={coluna.id === "credito" ? "right" : "left"}
                  />
                ))}
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <TableSkeleton cols={6} />
              ) : paginacao.items.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">Nenhum cliente encontrado</td></tr>
              ) : paginacao.items.map((c) => (
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
