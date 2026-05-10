import { useMemo, useState } from "react";

export type GridSortDirection = "asc" | "desc";

export type GridSort = {
  id: string;
  direction: GridSortDirection;
};

export type DataGridColumn<T> = {
  id: string;
  label: string;
  accessor: (row: T) => unknown;
  filterAccessor?: (row: T) => unknown;
};

function normalizeValue(value: unknown) {
  if (value == null) return "";
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  return String(value).toLocaleLowerCase("pt-BR");
}

function compareValues(a: unknown, b: unknown) {
  const normalizedA = normalizeValue(a);
  const normalizedB = normalizeValue(b);

  if (typeof normalizedA === "number" && typeof normalizedB === "number") {
    return normalizedA - normalizedB;
  }

  return String(normalizedA).localeCompare(String(normalizedB), "pt-BR", {
    numeric: true,
    sensitivity: "base",
  });
}

export function useDataGrid<T>(rows: T[], columns: DataGridColumn<T>[]) {
  const [sorting, setSorting] = useState<GridSort[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const columnById = useMemo(() => new Map(columns.map((column) => [column.id, column])), [columns]);

  const filteredRows = useMemo(() => {
    const activeFilters = Object.entries(filters).filter(([, value]) => value.trim());
    if (activeFilters.length === 0) return rows;

    return rows.filter((row) =>
      activeFilters.every(([columnId, rawFilter]) => {
        const column = columnById.get(columnId);
        if (!column) return true;
        const value = column.filterAccessor?.(row) ?? column.accessor(row);
        return String(value ?? "").toLocaleLowerCase("pt-BR").includes(rawFilter.trim().toLocaleLowerCase("pt-BR"));
      }),
    );
  }, [columnById, filters, rows]);

  const gridRows = useMemo(() => {
    if (sorting.length === 0) return filteredRows;

    return [...filteredRows].sort((a, b) => {
      for (const sort of sorting) {
        const column = columnById.get(sort.id);
        if (!column) continue;

        const result = compareValues(column.accessor(a), column.accessor(b));
        if (result !== 0) return sort.direction === "asc" ? result : -result;
      }

      return 0;
    });
  }, [columnById, filteredRows, sorting]);

  const setFilter = (id: string, value: string) => {
    setFilters((current) => {
      if (!value.trim()) {
        const next = { ...current };
        delete next[id];
        return next;
      }

      return { ...current, [id]: value };
    });
  };

  const toggleSort = (id: string, multiSort: boolean) => {
    setSorting((current) => {
      const existing = current.find((item) => item.id === id);
      const nextDirection: GridSortDirection = existing?.direction === "desc" ? "asc" : "desc";
      const nextSort = { id, direction: nextDirection };

      if (!multiSort) return [nextSort];
      if (!existing) return [...current, nextSort];

      return current.map((item) => (item.id === id ? nextSort : item));
    });
  };

  return {
    rows: gridRows,
    sorting,
    filters,
    setFilter,
    clearFilters: () => setFilters({}),
    toggleSort,
    getSort: (id: string) => sorting.find((item) => item.id === id),
    getSortIndex: (id: string) => sorting.findIndex((item) => item.id === id),
  };
}

export type DataGridState<T> = ReturnType<typeof useDataGrid<T>>;
