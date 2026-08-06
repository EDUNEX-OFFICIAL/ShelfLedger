import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import { EmptyState } from '@/components/shared/empty-state';
import { DataListSkeleton } from '@/components/shared/data-list-skeleton';

export type DataColumn<T> = {
  id: string;
  header: string;
  className?: string;
  cell: (row: T) => ReactNode;
  /** Shown on mobile chip facts strip; defaults to true for first 4 columns */
  mobile?: boolean;
};

export function ResponsiveDataList<T extends { id: string }>({
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
  emptyTitle = 'No data found',
  emptyDescription,
  emptyAction,
  noResultsTitle,
  noResultsDescription,
  isFiltered,
  loading = false,
  className,
}: {
  rows: T[];
  columns: DataColumn<T>[];
  mobileTitle: (row: T) => ReactNode;
  mobileMeta?: (row: T) => ReactNode;
  /** Hero number on the right (amount / qty) — preferred over mobileTrailing */
  mobileAmount?: (row: T) => ReactNode;
  /** Status badge on the meta row */
  mobileStatus?: (row: T) => ReactNode;
  /** Tiny line under the amount (due, diff hint) */
  mobileHint?: (row: T) => ReactNode;
  /** Legacy trailing slot; used when mobileAmount is omitted */
  mobileTrailing?: (row: T) => ReactNode;
  /** When set, the chip body navigates here (actions stay outside the link). */
  mobileHref?: (row: T) => string | null | undefined;
  actions?: (row: T) => ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  noResultsTitle?: string;
  noResultsDescription?: string;
  isFiltered?: boolean;
  loading?: boolean;
  className?: string;
}) {
  if (loading) {
    return <DataListSkeleton className={className} />;
  }

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
    <div className={cn(className)}>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-border/80 bg-card shadow-card md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/60 text-muted-foreground">
            <tr>
              {columns.map((col) => (
                <th key={col.id} className={cn('px-3 py-2.5 font-medium', col.className)}>
                  {col.header}
                </th>
              ))}
              {actions ? <th className="px-3 py-2.5 text-right font-medium">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border/80 transition-colors last:border-0 hover:bg-muted/30"
              >
                {columns.map((col) => (
                  <td key={col.id} className={cn('px-3 py-2.5', col.className)}>
                    {col.cell(row)}
                  </td>
                ))}
                {actions ? (
                  <td className="px-3 py-2.5">
                    <div className="flex justify-end gap-2">{actions(row)}</div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile chips */}
      <ul className="space-y-2.5 md:hidden">
        {rows.map((row) => {
          const href = mobileHref?.(row) ?? null;
          const amount = mobileAmount?.(row) ?? mobileTrailing?.(row);
          const status = mobileStatus?.(row);
          const hint = mobileHint?.(row);
          const actionNode = actions?.(row);
          const hasActions = Boolean(actionNode);

          const body = (
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="truncate text-[15px] font-semibold leading-snug tracking-tight text-foreground">
                    {mobileTitle(row)}
                  </div>
                  {mobileMeta || status ? (
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      {mobileMeta ? (
                        <p className="min-w-0 truncate text-xs leading-snug text-muted-foreground">
                          {mobileMeta(row)}
                        </p>
                      ) : null}
                      {status ? <div className="shrink-0">{status}</div> : null}
                    </div>
                  ) : null}
                </div>
                {amount || hint ? (
                  <div className="flex shrink-0 flex-col items-end gap-0.5 pt-0.5 text-right">
                    {amount ? (
                      <div className="text-base font-semibold leading-none tracking-tight text-foreground [&_.font-mono]:text-base">
                        {amount}
                      </div>
                    ) : null}
                    {hint ? (
                      <div className="max-w-[9rem] text-[10px] font-medium leading-snug text-muted-foreground">
                        {hint}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {mobileCols.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {mobileCols.map((col) => (
                    <div
                      key={col.id}
                      className="inline-flex max-w-full items-baseline gap-1.5 rounded-md bg-muted/70 px-2 py-1 ring-1 ring-inset ring-border/60"
                    >
                      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                        {col.header}
                      </span>
                      <span className="min-w-0 truncate text-xs font-medium text-foreground">
                        {col.cell(row)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );

          return (
            <li
              key={row.id}
              className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-card"
            >
              {href ? (
                <Link
                  href={href}
                  className="block p-3.5 transition-colors active:bg-muted/40"
                >
                  {body}
                </Link>
              ) : (
                <div className="p-3.5">{body}</div>
              )}
              {hasActions ? (
                <div className="flex flex-wrap items-center gap-2 border-t border-border/70 bg-muted/25 px-3.5 py-2.5">
                  {actionNode}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
