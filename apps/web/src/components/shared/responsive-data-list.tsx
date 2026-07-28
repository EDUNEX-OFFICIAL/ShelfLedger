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
  mobileTrailing,
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
  /** High-priority signal opposite the title (status, amount) */
  mobileTrailing?: (row: T) => ReactNode;
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
          <li key={row.id} className="space-y-3 p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-semibold tracking-tight text-foreground">
                  {mobileTitle(row)}
                </div>
                {mobileMeta ? (
                  <div className="mt-0.5 truncate text-xs leading-snug text-muted-foreground">
                    {mobileMeta(row)}
                  </div>
                ) : null}
              </div>
              <div className="flex shrink-0 items-start gap-2">
                {mobileTrailing ? (
                  <div className="pt-0.5">{mobileTrailing(row)}</div>
                ) : null}
                {actions ? <div className="flex gap-1">{actions(row)}</div> : null}
              </div>
            </div>
            {mobileCols.length > 0 ? (
              <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5 border-t border-border/70 pt-2.5">
                {mobileCols.map((col) => (
                  <div key={col.id} className="min-w-0">
                    <dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/75">
                      {col.header}
                    </dt>
                    <dd className="mt-1 text-sm font-medium leading-snug text-foreground">
                      {col.cell(row)}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
