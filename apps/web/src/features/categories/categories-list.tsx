'use client';

import Link from 'next/link';
import { FilteredDataList } from '@/components/shared/filtered-data-list';
import { DeleteButton } from '@/components/shared/delete-button';
import { buttonClassName } from '@/components/ui/button';
import { deleteCategoryAction } from '@/features/masters/actions';
import { cn } from '@/lib/utils';

export type CategoryListRow = {
  id: string;
  name: string;
  parentName: string | null;
  depth: number;
  childCount: number;
};

export function CategoriesList({
  rows,
  canWrite,
}: {
  rows: CategoryListRow[];
  canWrite: boolean;
}) {
  return (
    <FilteredDataList
      rows={rows}
      searchPlaceholder="Search category or parent…"
      searchFn={(r, q) =>
        r.name.toLowerCase().includes(q) ||
        (r.parentName ?? '').toLowerCase().includes(q)
      }
      filters={[
        {
          id: 'level',
          label: 'Level',
          options: [
            { value: 'root', label: 'Root only' },
            { value: 'child', label: 'Subcategories' },
          ],
          predicate: (r, v) => (v === 'root' ? r.depth === 0 : r.depth > 0),
        },
      ]}
      emptyTitle="No categories yet"
      emptyDescription="Add roots like Men / Women, then optional subcategories (e.g. Sports)."
      emptyAction={
        canWrite ? (
          <div className="flex flex-wrap justify-center gap-2">
            <a href="#new-category" className={buttonClassName({ size: 'md' })}>
              Add category
            </a>
            <Link
              href="/articles"
              className={buttonClassName({ variant: 'secondary', size: 'md' })}
            >
              Articles
            </Link>
          </div>
        ) : undefined
      }
      mobileTitle={(r) => (
        <span className={cn(r.depth > 0 && 'pl-2')}>
          {r.depth > 0 ? (
            <span className="mr-1 text-muted-foreground" aria-hidden>
              └
            </span>
          ) : null}
          {r.name}
        </span>
      )}
      mobileMeta={(r) =>
        r.parentName
          ? `Under ${r.parentName}`
          : r.childCount > 0
            ? `${r.childCount} subcategor${r.childCount === 1 ? 'y' : 'ies'}`
            : 'Root'
      }
      mobileTrailing={(r) =>
        r.depth === 0 ? (
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Root
          </span>
        ) : (
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Sub
          </span>
        )
      }
      columns={[
        {
          id: 'name',
          header: 'Category',
          mobile: false,
          cell: (r) => (
            <span
              className={cn('font-medium', r.depth > 0 && 'pl-4 text-foreground')}
            >
              {r.depth > 0 ? (
                <span className="mr-1.5 text-muted-foreground" aria-hidden>
                  └
                </span>
              ) : null}
              {r.name}
            </span>
          ),
        },
        {
          id: 'parent',
          header: 'Parent',
          mobile: false,
          cell: (r) =>
            r.parentName ? (
              <span className="text-sm text-muted-foreground">{r.parentName}</span>
            ) : (
              <span className="text-xs text-muted-foreground">— root —</span>
            ),
        },
        {
          id: 'children',
          header: 'Subs',
          mobile: false,
          cell: (r) => (
            <span className="font-mono text-sm tabular-nums text-muted-foreground">
              {r.depth === 0 ? r.childCount : '—'}
            </span>
          ),
        },
      ]}
      actions={(r) =>
        canWrite ? (
          <div className="flex items-center justify-end gap-1">
            <Link
              href="/articles"
              className={buttonClassName({ variant: 'secondary', size: 'sm' })}
            >
              Articles
            </Link>
            <DeleteButton action={() => deleteCategoryAction(r.id)} />
          </div>
        ) : null
      }
    />
  );
}
