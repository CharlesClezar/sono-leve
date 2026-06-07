import { memo, useCallback } from "react";
import { ArrowDown, ArrowUp, MoreVertical, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { DataGridState } from "@/hooks/useDataGrid";

type DataGridColumnHeaderProps<T> = {
  grid: DataGridState<T>;
  columnId: string;
  label: string;
  className?: string;
  align?: "left" | "center" | "right";
  /** Largura fixa em px (gerenciada pelo DataGrid) */
  width?: number;
  /** Callback de redimensionamento (quando fornecido, exibe o handle de drag) */
  onResize?: (newWidth: number) => void;
};

function DataGridColumnHeaderBase<T>({
  grid,
  columnId,
  label,
  className,
  align = "left",
  width,
  onResize,
}: DataGridColumnHeaderProps<T>) {
  const sort = grid.getSort(columnId);
  const sortIndex = grid.getSortIndex(columnId);
  const filter = grid.filters[columnId] ?? "";
  const isMultiSort = grid.sorting.length > 1;

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const th = (e.currentTarget as HTMLElement).closest("th") as HTMLElement | null;
      if (!th || !onResize) return;
      const startX = e.clientX;
      const startWidth = th.getBoundingClientRect().width;

      const onMove = (ev: MouseEvent) => {
        onResize(Math.max(60, startWidth + (ev.clientX - startX)));
      };
      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [onResize],
  );

  return (
    <th
      className={cn("relative px-4 py-3 border-r border-border/40", className)}
      style={width !== undefined ? { width, minWidth: width } : undefined}
    >
      <div
        className={cn(
          "flex items-center gap-1.5",
          align === "center" && "justify-center",
          align === "right" && "justify-end",
        )}
      >
        <button
          type="button"
          className={cn(
            "inline-flex min-w-0 items-center gap-1 rounded-sm text-left font-semibold transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            align === "right" && "text-right",
          )}
          aria-label={`Ordenar por ${label}`}
          onClick={(event) => grid.toggleSort(columnId, event.shiftKey)}
        >
          <span className="truncate">{label}</span>
          {sort?.direction === "desc" && <ArrowDown className="h-3.5 w-3.5 shrink-0" />}
          {sort?.direction === "asc" && <ArrowUp className="h-3.5 w-3.5 shrink-0" />}
          {/* Bolinha de prioridade aparece para todas colunas ordenadas quando há multi-sort */}
          {sort && isMultiSort && (
            <span className="inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 px-1 text-[10px] font-semibold text-primary">
              {sortIndex + 1}
            </span>
          )}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn("h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground", filter && "text-primary")}
              aria-label={`Filtrar ${label}`}
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={align === "right" ? "end" : "start"} className="w-64 p-2" onClick={(event) => event.stopPropagation()}>
            <DropdownMenuLabel className="px-1.5 py-1 text-xs uppercase tracking-wide text-muted-foreground">
              Filtrar {label}
            </DropdownMenuLabel>
            <div className="px-1.5 py-2">
              <Input
                value={filter}
                onChange={(event) => grid.setFilter(columnId, event.target.value)}
                placeholder="Digite para filtrar"
                className="h-9"
              />
            </div>
            {filter && (
              <>
                <DropdownMenuSeparator />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-full justify-start px-1.5"
                  onClick={() => grid.setFilter(columnId, "")}
                >
                  <X className="h-4 w-4" />
                  Limpar filtro
                </Button>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Handle de redimensionamento — aparece só quando onResize é fornecido */}
      {onResize && (
        <div
          className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize select-none opacity-0 hover:opacity-100 hover:bg-primary/40 active:bg-primary/60 transition-opacity z-10"
          onMouseDown={handleResizeMouseDown}
          aria-hidden
        />
      )}
    </th>
  );
}

export const DataGridColumnHeader = memo(DataGridColumnHeaderBase) as typeof DataGridColumnHeaderBase;
