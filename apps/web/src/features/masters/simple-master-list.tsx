'use client';

import type { ReactNode } from 'react';
import { FilteredDataList } from '@/components/shared/filtered-data-list';
import { DeleteButton } from '@/components/shared/delete-button';
import { SkuText } from '@/components/shared/money-text';
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
}: {
  rows: SimpleRow[];
  canWrite: boolean;
  searchPlaceholder: string;
  emptyTitle: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  secondaryHeader: string;
  onDelete: (id: string) => Promise<ActionResult>;
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
      mobileMeta={(r) => r.secondary || undefined}
      columns={[
        { id: 'name', header: 'Name', cell: (r) => <span className="font-medium">{r.name}</span> },
        {
          id: 'secondary',
          header: secondaryHeader,
          cell: (r) =>
            r.secondary ? (
              <SkuText value={r.secondary} />
            ) : (
              <span className="text-muted-foreground">—</span>
            ),
        },
      ]}
      actions={(r) => (canWrite ? <DeleteButton action={() => onDelete(r.id)} /> : null)}
    />
  );
}
