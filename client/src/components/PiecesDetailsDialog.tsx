"use client";

import { useMemo } from "react";
import { PackageSearch } from "lucide-react";
import { DataGridColumnHeader } from "@/components/DataGridColumnHeader";
import { PaginationFooter } from "@/components/PaginationFooter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ItemVenda } from "@/lib/types";
import { formatBRL } from "@/lib/types";
import { useDataGrid, type DataGridColumn } from "@/hooks/useDataGrid";
import { usePagination } from "@/hooks/usePagination";

export function PiecesDetailsDialog({
  triggerClassName,
  pieces,
  title,
  description,
  items,
}: {
  triggerClassName: string;
  pieces: number;
  title: string;
  description: string;
  items: ItemVenda[];
}) {
  const total = useMemo(() => items.reduce((sum, item) => sum + item.quantidade, 0), [items]);
  const totalValue = useMemo(
    () => items.reduce((sum, item) => sum + item.quantidade * item.precoUnitario, 0),
    [items]
  );
  const columns = useMemo<DataGridColumn<ItemVenda>[]>(
    () => [
      { id: "produtoNome", label: "Produto", accessor: (item) => item.produtoNome },
      { id: "produtoRef", label: "Ref.", accessor: (item) => item.produtoRef },
      { id: "tamanho", label: "Tam.", accessor: (item) => item.tamanho },
      { id: "quantidade", label: "Qtd.", accessor: (item) => item.quantidade },
      { id: "precoUnitario", label: "Valor un.", accessor: (item) => item.precoUnitario },
      { id: "total", label: "Total", accessor: (item) => item.quantidade * item.precoUnitario },
    ],
    [],
  );
  const grid = useDataGrid(items, columns);
  const pagination = usePagination(grid.rows);
  const hasItems = items.length > 0;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className={triggerClassName}>
          {pieces}
        </button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[85vh] max-w-5xl flex-col overflow-hidden p-0">
        <div className="border-b px-6 py-5">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border bg-muted/30 p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Peças</div>
              <div className="mt-1 text-2xl font-semibold">{hasItems ? total : pieces}</div>
            </div>
            <div className="rounded-xl border bg-muted/30 p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Modelos</div>
              <div className="mt-1 text-2xl font-semibold">{items.length}</div>
            </div>
            <div className="rounded-xl border bg-muted/30 p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Tamanhos</div>
              <div className="mt-1 text-2xl font-semibold">
                {new Set(items.map((item) => item.tamanho)).size}
              </div>
            </div>
            {hasItems && (
              <div className="rounded-xl border bg-muted/30 p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Valor total</div>
                <div className="mt-1 text-2xl font-semibold">{formatBRL(totalValue)}</div>
              </div>
            )}
          </div>

          {hasItems ? (
            <div className="mt-5 overflow-hidden rounded-xl border">
              <div className="max-h-[44vh] overflow-auto">
                <table className="w-full min-w-[820px] text-sm">
                  <thead className="sticky top-0 z-10 bg-muted/95 text-left text-xs uppercase tracking-wide text-muted-foreground backdrop-blur">
                    <tr>
                      {columns.map((column) => (
                        <DataGridColumnHeader
                          key={column.id}
                          grid={grid}
                          columnId={column.id}
                          label={column.label}
                          align={column.id === "size" ? "center" : ["quantity", "unitPrice", "total"].includes(column.id) ? "right" : "left"}
                        />
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pagination.items.map((item, index) => (
                      <tr key={`${item.produtoRef}-${item.tamanho}-${index}`}>
                        <td className="px-4 py-3 font-medium">{item.produtoNome}</td>
                        <td className="px-4 py-3 text-muted-foreground">{item.produtoRef}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex min-w-12 justify-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                            {item.tamanho}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">{item.quantidade}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{formatBRL(item.precoUnitario)}</td>
                        <td className="px-4 py-3 text-right font-semibold">{formatBRL(item.quantidade * item.precoUnitario)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationFooter pagination={pagination} />
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
              O detalhamento de produtos e tamanhos ainda não foi cadastrado para este registro.
            </div>
          )}

          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <PackageSearch className="h-4 w-4" />
            {hasItems
              ? "Quando houver muitos itens, a tabela rola dentro do modal sem expandir a janela."
              : "Quando os itens forem cadastrados, este modal mostrará os produtos e tamanhos reais."}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
