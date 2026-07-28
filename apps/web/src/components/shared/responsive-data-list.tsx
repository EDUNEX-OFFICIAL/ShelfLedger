import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import { EmptyState } from '@/components/shared/empty-state';

export type DataColumn<T> = {
  id: string;
  header: string;
  className?: string;
  cell: (row: T) => ReactNode;
  /** Shown on mobile chip; defaults to true for first 4 columns */
  mobile?: boolean;
};

export function ResponsiveDataList<T extends { id: string }>({
  rows,
  columns,
  mobileTitle,
  mobileMeta,
  actions,
  emptyTitle = 'No data found',
  emptyDescription,
  emptyAction,
  noResultsTitle,
  noResultsDescription,
  isFiltered,
  className,
}: {
  rows: T[];
  columns: DataColumn<T>[];
  mobileTitle: (row: T) => ReactNode;
  mobileMeta?: (row: T) => ReactNode;
  actions?: (row: T) => ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  noResultsTitle?: string;
  noResultsDescription?: string;
  isFiltered?: boolean;
  className?: string;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title={isFiltered ? (noResultsTitle ?? 'No results match your filters') : emptyTitle}
        description={
          isFiltered
            ? (noResultsDescription ?? 'Try clearing search or changing filters.')
            : emptyDescription
        }
        action={isFiltered ? undefined : emptyAction}
        className={className}
      />
    );
  }

  const mobileCols = columns.filter((c) => c.mobile !== false).slice(0, 4);

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-border/80 bg-card shadow-card',
        className,
      )}
    >
      {/* Desktop table */}
      <div className="hidden md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/60 text-muted-foreground">
            <tr>
              {columns.map((col) => (
                <th key={col.id} className={cn('px-3 py-2 font-medium', col.className)}>
                  {col.header}
                </th>
              ))}
              {actions ? <th className="px-3 py-2 text-right font-medium">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border last:border-0">
                {columns.map((col) => (
                  <td key={col.id} className={cn('px-3 py-2', col.className)}>
                    {col.cell(row)}
                  </td>
                ))}
                {actions ? (
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-2">{actions(row)}</div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile chips */}
      <ul className="divide-y divide-border md:hidden">
        {rows.map((row) => (
          <li key={row.id} className="space-y-2 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-medium text-foreground">{mobileTitle(row)}</div>
                {mobileMeta ? (
                  <div className="mt-0.5 text-xs text-muted-foreground">{mobileMeta(row)}</div>
                ) : null}
              </div>
              {actions ? <div className="flex shrink-0 gap-1">{actions(row)}</div> : null}
            </div>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              {mobileCols.map((col) => (
                <div key={col.id}>
                  <dt className="text-muted-foreground">{col.header}</dt>
                  <dd className="mt-0.5 text-foreground">{col.cell(row)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
