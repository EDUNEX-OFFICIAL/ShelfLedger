'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { FilteredDataList } from '@/components/shared/filtered-data-list';
import { DeleteButton } from '@/components/shared/delete-button';
import { SkuText } from '@/components/shared/money-text';
import { buttonClassName } from '@/components/ui/button';
import type { ActionResult } from '@/server/action-result';

type SimpleRow = { id: string; name: string; secondary: string };

export function SimpleMasterList({
  rows,
  canWrite,
  searchPlaceholder,
  emptyTitle,
  emptyDescription,
  emptyAction,
  secondaryHeader,
  onDelete,
  rowActionHref,
  rowActionLabel,
}: {
  rows: SimpleRow[];
  canWrite: boolean;
  searchPlaceholder: string;
  emptyTitle: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  secondaryHeader: string;
  onDelete: (id: string) => Promise<ActionResult>;
  /** Optional secondary action (e.g. Brands → Articles) */
  rowActionHref?: string;
  rowActionLabel?: string;
}) {
  return (
    <FilteredDataList
      rows={rows}
      searchPlaceholder={searchPlaceholder}
      searchFn={(r, q) =>
        r.name.toLowerCase().includes(q) || r.secondary.toLowerCase().includes(q)
      }
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      emptyAction={emptyAction}
      mobileTitle={(r) => r.name}
      mobileMeta={(r) => (r.secondary ? undefined : 'No short code')}
      mobileTrailing={(r) =>
        r.secondary ? (
          <SkuText value={r.secondary} className="text-sm font-semibold" />
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )
      }
      columns={[
        {
          id: 'name',
          header: 'Name',
          mobile: false,
          cell: (r) => <span className="font-medium">{r.name}</span>,
        },
        {
          id: 'secondary',
          header: secondaryHeader,
          mobile: false,
          cell: (r) =>
            r.secondary ? (
              <SkuText value={r.secondary} />
            ) : (
              <span className="text-muted-foreground">—</span>
            ),
        },
      ]}
      actions={(r) =>
        canWrite || rowActionHref ? (
          <div className="flex items-center justify-end gap-1">
            {rowActionHref && rowActionLabel ? (
              <Link
                href={rowActionHref}
                className={buttonClassName({ variant: 'secondary', size: 'sm' })}
              >
                {rowActionLabel}
              </Link>
            ) : null}
            {canWrite ? <DeleteButton action={() => onDelete(r.id)} /> : null}
          </div>
        ) : null
      }
    />
  );
}
