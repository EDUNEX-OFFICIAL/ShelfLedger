'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { ListToolbar, type FilterOption } from '@/components/shared/list-toolbar';
import {
  ResponsiveDataList,
  type DataColumn,
} from '@/components/shared/responsive-data-list';

export function FilteredDataList<T extends { id: string }>({
  rows,
  columns,
  mobileTitle,
  mobileMeta,
  mobileAmount,
  mobileStatus,
  mobileHint,
  mobileTrailing,
  mobileHref,
  actions,
  searchPlaceholder,
  searchFn,
  filters,
  initialFilters,
  initialSearch,
  emptyTitle,
  emptyDescription,
  emptyAction,
  loading,
}: {
  rows: T[];
  columns: DataColumn<T>[];
  mobileTitle: (row: T) => ReactNode;
  mobileMeta?: (row: T) => ReactNode;
  mobileAmount?: (row: T) => ReactNode;
  mobileStatus?: (row: T) => ReactNode;
  mobileHint?: (row: T) => ReactNode;
  mobileTrailing?: (row: T) => ReactNode;
  mobileHref?: (row: T) => string | null | undefined;
  actions?: (row: T) => ReactNode;
  searchPlaceholder?: string;
  searchFn: (row: T, q: string) => boolean;
  filters?: Array<{
    id: string;
    label: string;
    options: FilterOption[];
    predicate: (row: T, value: string) => boolean;
  }>;
  /** Prefill filter values from URL / deep links. */
  initialFilters?: Record<string, string>;
  /** Prefill search from URL / deep links (e.g. stock-ledger?sku=). */
  initialSearch?: string;
  emptyTitle: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  loading?: boolean;
}) {
  const [search, setSearch] = useState(initialSearch ?? '');
  const [filterValues, setFilterValues] = useState<Record<string, string>>(() => {
    const base = Object.fromEntries((filters ?? []).map((f) => [f.id, '']));
    if (!initialFilters) return base;
    for (const [k, v] of Object.entries(initialFilters)) {
      if (k in base && v) base[k] = v;
    }
    return base;
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (q && !searchFn(row, q)) return false;
      for (const f of filters ?? []) {
        const v = filterValues[f.id] ?? '';
        if (v && !f.predicate(row, v)) return false;
      }
      return true;
    });
  }, [rows, search, filterValues, searchFn, filters]);

  const hasActive = Boolean(search.trim()) || Object.values(filterValues).some(Boolean);

  return (
    <div className="space-y-3">
      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={searchPlaceholder}
        resultCount={filtered.length}
        totalCount={rows.length}
        hasActiveFilters={hasActive}
        onClear={() => {
          setSearch('');
          setFilterValues(Object.fromEntries((filters ?? []).map((f) => [f.id, ''])));
        }}
        filters={(filters ?? []).map((f) => ({
          id: f.id,
          label: f.label,
          value: filterValues[f.id] ?? '',
          options: f.options,
          allowClear: true,
          clearLabel: 'All',
          onChange: (value: string) => setFilterValues((prev) => ({ ...prev, [f.id]: value })),
        }))}
      />
      <ResponsiveDataList
        rows={filtered}
        columns={columns}
        mobileTitle={mobileTitle}
        mobileMeta={mobileMeta}
        mobileAmount={mobileAmount}
        mobileStatus={mobileStatus}
        mobileHint={mobileHint}
        mobileTrailing={mobileTrailing}
        mobileHref={mobileHref}
        actions={actions}
        loading={loading}
        isFiltered={hasActive}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        emptyAction={emptyAction}
      />
    </div>
  );
}
