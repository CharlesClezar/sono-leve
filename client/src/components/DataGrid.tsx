"use client";

import { memo, useCallback, useState, type ReactNode } from "react";
import Link from "next/link";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataGridColumnHeader } from "@/components/DataGridColumnHeader";
import { TableSkeleton } from "@/components/TableSkeleton";
import { cn } from "@/lib/utils";
import type { DataGridColumn, DataGridState } from "@/hooks/useDataGrid";

// ── Tipos públicos ────────────────────────────────────────────────────────────

/** Coluna da grid com suporte a renderização customizada e alinhamento. */
export type GridColumnDef<T> = DataGridColumn<T> & {
  align?: "left" | "center" | "right";
  /** Função de renderização da célula. Sem ela, usa String(accessor(row)). */
  render?: (row: T) => ReactNode;
};

type DataGridProps<T extends { id?: unknown }> = {
  grid: DataGridState<T>;
  columns: GridColumnDef<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
  footer?: ReactNode;

  // Ações padrão (geram a coluna AÇÕES sticky à direita)
  onView?: (row: T) => void;
  editHref?: (row: T) => string;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => Promise<void> | void;

  /** Substitui os botões padrão por conteúdo customizado na coluna AÇÕES. */
  renderActions?: (row: T) => ReactNode;

  /** Coluna líder opcional (ex.: miniatura de imagem). */
  leadingHeaderCell?: ReactNode;
  leadingCell?: (row: T) => ReactNode;

  /** Props extras propagadas para o <Link> de edição (ex.: indexedTabs.getActionProps). */
  actionLinkProps?: Record<string, unknown>;

  className?: string;
};

// ── Classes reutilizáveis ─────────────────────────────────────────────────────

const STICKY_TH = "sticky right-0 z-20 bg-muted/50 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground [box-shadow:-2px_0_5px_rgba(0,0,0,0.06)]";
const STICKY_TD = "sticky right-0 z-10 bg-card px-4 py-3 [box-shadow:-2px_0_5px_rgba(0,0,0,0.06)]";
const DATA_TD = "px-4 py-3 border-r border-border/40";

// ── Componente de ações por linha ─────────────────────────────────────────────

type RowActionsProps = {
  onView?: () => void;
  editHref?: string;
  onEdit?: () => void;
  onDelete?: () => Promise<void> | void;
  renderActionsContent?: ReactNode;
  actionLinkProps?: Record<string, unknown>;
};

const RowActions = memo(function RowActions({
  onView,
  editHref,
  onEdit,
  onDelete,
  renderActionsContent,
  actionLinkProps,
}: RowActionsProps) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (renderActionsContent !== undefined) {
    return <div className="flex items-center justify-end gap-0.5">{renderActionsContent}</div>;
  }

  if (confirming) {
    const handleConfirm = async () => {
      setDeleting(true);
      await onDelete?.();
      setDeleting(false);
      setConfirming(false);
    };
    return (
      <div className="flex items-center justify-end gap-1">
        <span className="mr-1 whitespace-nowrap text-xs text-muted-foreground">Confirmar?</span>
        <Button
          variant="destructive"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={handleConfirm}
          disabled={deleting}
        >
          {deleting ? "..." : "Excluir"}
        </Button>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setConfirming(false)}>
          Cancelar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-0.5">
      {onView && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-sky-500 hover:bg-sky-50 hover:text-sky-700"
          onClick={onView}
          aria-label="Visualizar"
        >
          <Eye className="h-4 w-4" />
        </Button>
      )}
      {editHref ? (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          asChild
        >
          <Link {...actionLinkProps} href={editHref} aria-label="Editar">
            <Pencil className="h-4 w-4" />
          </Link>
        </Button>
      ) : onEdit ? (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={onEdit}
          aria-label="Editar"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      ) : null}
      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => setConfirming(true)}
          aria-label="Excluir"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
});

// ── Componente principal ──────────────────────────────────────────────────────

export function DataGrid<T extends { id?: unknown }>({
  grid,
  columns,
  isLoading,
  emptyMessage = "Nenhum registro encontrado",
  footer,
  onView,
  editHref,
  onEdit,
  onDelete,
  renderActions,
  leadingHeaderCell,
  leadingCell,
  actionLinkProps,
  className,
}: DataGridProps<T>) {
  const [widths, setWidths] = useState<Record<string, number>>({});

  const setColumnWidth = useCallback((id: string, w: number) => {
    setWidths((prev) => ({ ...prev, [id]: w }));
  }, []);

  const hasActions = !!(onView || editHref || onEdit || onDelete || renderActions);
  const colCount =
    (leadingHeaderCell ? 1 : 0) + columns.length + (hasActions ? 1 : 0);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              {leadingHeaderCell && (
                <th className="border-r border-border/40 px-4 py-3">{leadingHeaderCell}</th>
              )}
              {columns.map((col) => (
                <DataGridColumnHeader
                  key={col.id}
                  grid={grid}
                  columnId={col.id}
                  label={col.label}
                  align={col.align}
                  width={widths[col.id]}
                  onResize={(w) => setColumnWidth(col.id, w)}
                />
              ))}
              {hasActions && <th className={STICKY_TH}>Ações</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <TableSkeleton cols={colCount} />
            ) : grid.rows.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              grid.rows.map((row) => {
                const rowId = String((row as { id: unknown }).id);
                return (
                  <tr key={rowId} className="group hover:bg-muted/30">
                    {leadingCell && (
                      <td className={DATA_TD}>{leadingCell(row)}</td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.id}
                        className={cn(
                          DATA_TD,
                          col.align === "center" && "text-center",
                          col.align === "right" && "text-right",
                        )}
                      >
                        {col.render ? col.render(row) : (col.accessor(row) as ReactNode) ?? ""}
                      </td>
                    ))}
                    {hasActions && (
                      <td className={cn(STICKY_TD, "group-hover:bg-muted/30")}>
                        <RowActions
                          onView={onView ? () => onView(row) : undefined}
                          editHref={editHref ? editHref(row) : undefined}
                          onEdit={onEdit ? () => onEdit(row) : undefined}
                          onDelete={onDelete ? async () => onDelete(row) : undefined}
                          renderActionsContent={renderActions ? renderActions(row) : undefined}
                          actionLinkProps={actionLinkProps}
                        />
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {footer}
    </Card>
  );
}
