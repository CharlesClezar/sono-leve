import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PaginationState } from "@/hooks/usePagination";

type PaginationFooterProps<T> = {
  pagination: PaginationState<T>;
  className?: string;
};

export function PaginationFooter<T>({ pagination, className }: PaginationFooterProps<T>) {
  const scrollToRecordsTop = () => {
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const goToPreviousPage = () => {
    pagination.previousPage();
    scrollToRecordsTop();
  };

  const goToNextPage = () => {
    pagination.nextPage();
    scrollToRecordsTop();
  };

  return (
    <div className={cn("flex flex-col gap-3 border-t bg-card px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between", className)}>
      <div>
        {pagination.totalItems === 0
          ? `0 itens`
          : `${pagination.startItem}-${pagination.endItem} de ${pagination.totalItems} itens`}
        <span className="ml-2 text-xs">({pagination.pageSize} por página)</span>
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <span className="text-xs font-medium">
          Página {pagination.page} de {pagination.pageCount}
        </span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={goToPreviousPage}
            disabled={!pagination.canPrevious}
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={!pagination.canNext}
          >
            Avançar
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
