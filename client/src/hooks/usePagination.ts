import { useEffect, useMemo, useState } from "react";

export const DEFAULT_PAGE_SIZE = 30;

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

type ServerResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
} | undefined;

export function useServerPagination<T>(
  response: ServerResponse<T>,
  setPage: (page: number) => void,
) {
  const page = response?.page ?? 1;
  const pageCount = response?.totalPages ?? 1;
  const pageSize = response?.pageSize ?? DEFAULT_PAGE_SIZE;
  const totalItems = response?.total ?? 0;
  const items = (response?.data ?? []) as T[];

  return {
    items,
    page,
    pageCount,
    pageSize,
    totalItems,
    startItem: totalItems === 0 ? 0 : (page - 1) * pageSize + 1,
    endItem: Math.min(page * pageSize, totalItems),
    canPrevious: page > 1,
    canNext: page < pageCount,
    previousPage: () => setPage(Math.max(1, page - 1)),
    nextPage: () => setPage(Math.min(pageCount, page + 1)),
  };
}
