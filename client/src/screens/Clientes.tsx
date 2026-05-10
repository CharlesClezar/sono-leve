import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AppSelect } from "@/components/AppSelect";
import { ClearFiltersShortcutDialog } from "@/components/ClearFiltersShortcutDialog";
import { DataGridColumnHeader } from "@/components/DataGridColumnHeader";
import { PaginationFooter } from "@/components/PaginationFooter";
import { PageHeader } from "@/components/PageHeader";
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
  const { data: customers } = useClientes();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const columns = useMemo<DataGridColumn<Customer>[]>(
    () => [
      { id: "name", label: "Nome", accessor: (customer) => customer.name },
      { id: "phone", label: "Telefone", accessor: (customer) => customer.phone },
      { id: "cpf", label: "CPF", accessor: (customer) => customer.cpf },
      { id: "type", label: "Tipo", accessor: (customer) => customer.type },
      { id: "credit", label: "Crédito", accessor: (customer) => customer.credit },
    ],
    [],
  );

  const filtered = useMemo(
    () =>
      customers.filter((c) => {
        if (type !== "all" && c.type !== type) return false;
        if (status !== "all" && c.status !== status) return false;
        if (query) {
          const q = query.toLowerCase();
          if (!c.name.toLowerCase().includes(q) && !c.phone.includes(q) && !c.cpf.includes(q)) return false;
        }
        return true;
      }),
    [query, type, status]
  );
  const grid = useDataGrid(filtered, columns);
  const pagination = usePagination(grid.rows);

  return (
    <AppShell>
      <ClearFiltersShortcutDialog
        onConfirm={() => {
          setQuery("");
          setType("all");
          setStatus("all");
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
      <div className="space-y-4 p-6">
        <Card className="sticky top-20 z-20 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por nome, telefone ou CPF" className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <AppSelect
              className="w-[150px]"
              value={type}
              onValueChange={setType}
              options={[
                { value: "all", label: "Todos tipos" },
                { value: "varejo", label: "Varejo" },
                { value: "atacado", label: "Atacado" },
              ]}
            />
            <AppSelect
              className="w-[130px]"
              value={status}
              onValueChange={setStatus}
              options={[
                { value: "all", label: "Todos" },
                { value: "Ativo", label: "Ativos" },
                { value: "Inativo", label: "Inativos" },
              ]}
            />
          </div>
        </Card>

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
                    align={column.id === "credit" ? "right" : "left"}
                  />
                ))}
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pagination.items.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">Nenhum cliente encontrado</td></tr>
              ) : pagination.items.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.phone}</td>
                  <td className="px-4 py-3 font-mono text-xs">{c.cpf}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium uppercase">{c.type}</span>
                  </td>
                  <td className="px-4 py-3 text-right">{formatBRL(c.credit)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" asChild aria-label={`Editar ${c.name}`}>
                      <Link href={`/clientes/${c.id}/editar`}><Pencil className="h-4 w-4" /></Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <PaginationFooter pagination={pagination} />
        </Card>
      </div>
    </AppShell>
  );
}
