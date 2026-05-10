import { useEffect, useMemo, useState } from "react";

export const DEFAULT_PAGE_SIZE = 50;

export function usePagination<T>(items: T[], pageSize = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    setPage((current) => Math.min(current, pageCount));
  }, [pageCount]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  return {
    items: paginatedItems,
    page,
    pageCount,
    pageSize,
    totalItems: items.length,
    startItem: items.length === 0 ? 0 : (page - 1) * pageSize + 1,
    endItem: Math.min(page * pageSize, items.length),
    canPrevious: page > 1,
    canNext: page < pageCount,
    previousPage: () => setPage((current) => Math.max(1, current - 1)),
    nextPage: () => setPage((current) => Math.min(pageCount, current + 1)),
  };
}

export type PaginationState<T> = ReturnType<typeof usePagination<T>>;
