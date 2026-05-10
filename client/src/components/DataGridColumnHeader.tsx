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
};

export function DataGridColumnHeader<T>({
  grid,
  columnId,
  label,
  className,
  align = "left",
}: DataGridColumnHeaderProps<T>) {
  const sort = grid.getSort(columnId);
  const sortIndex = grid.getSortIndex(columnId);
  const filter = grid.filters[columnId] ?? "";

  return (
    <th className={cn("px-4 py-3", className)}>
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
          {sort && sortIndex > 0 && (
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
    </th>
  );
}
