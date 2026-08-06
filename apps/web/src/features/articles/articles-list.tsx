'use client';

import Link from 'next/link';
import { FilteredDataList } from '@/components/shared/filtered-data-list';
import { DeleteButton } from '@/components/shared/delete-button';
import { buttonClassName } from '@/components/ui/button';
import { deleteArticleAction } from '@/features/masters/actions';

export type ArticleListRow = {
  id: string;
  name: string;
  articleCode: string;
  brandName: string;
  categoryName: string;
  variantSummary: string;
  variantCount: number;
  /** Space-joined SKUs + size/color for search */
  searchBlob: string;
};

export function ArticlesList({
  rows,
  canWrite,
  brands,
  categories,
}: {
  rows: ArticleListRow[];
  canWrite: boolean;
  brands: string[];
  categories: string[];
}) {
  return (
    <FilteredDataList
      rows={rows}
      searchPlaceholder="Search name, code, item code, size…"
      searchFn={(r, q) =>
        r.name.toLowerCase().includes(q) ||
        r.articleCode.toLowerCase().includes(q) ||
        r.brandName.toLowerCase().includes(q) ||
        r.categoryName.toLowerCase().includes(q) ||
        r.searchBlob.toLowerCase().includes(q) ||
        r.variantSummary.toLowerCase().includes(q)
      }
      filters={[
        ...(brands.length > 1
          ? [
              {
                id: 'brand',
                label: 'Brand',
                options: brands.map((b) => ({ value: b, label: b })),
                predicate: (r: ArticleListRow, v: string) => r.brandName === v,
              },
            ]
          : []),
        ...(categories.length > 1
          ? [
              {
                id: 'category',
                label: 'Category',
                options: categories.map((c) => ({ value: c, label: c })),
                predicate: (r: ArticleListRow, v: string) => r.categoryName === v,
              },
            ]
          : []),
      ]}
      emptyTitle="No articles yet"
      emptyDescription="Create a brand and category, then add styles with size & colour item codes."
      emptyAction={
        canWrite ? (
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/brands" className={buttonClassName({ variant: 'secondary', size: 'md' })}>
              Brands
            </Link>
            <Link
              href="/categories"
              className={buttonClassName({ variant: 'secondary', size: 'md' })}
            >
              Categories
            </Link>
            <a href="#new-article" className={buttonClassName({ size: 'md' })}>
              Add article
            </a>
          </div>
        ) : undefined
      }
      mobileTitle={(r) => r.name}
      mobileMeta={(r) => `${r.articleCode} · ${r.brandName}`}
      mobileAmount={(r) => (
        <span className="font-mono text-base font-semibold tabular-nums">{r.variantCount}</span>
      )}
      mobileHint={() => 'item codes'}
      mobileStatus={(r) =>
        r.variantSummary ? (
          <span className="max-w-[10rem] truncate rounded-md bg-muted/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground ring-1 ring-inset ring-border/60">
            {r.variantSummary}
          </span>
        ) : null
      }
      columns={[
        {
          id: 'article',
          header: 'Article',
          mobile: false,
          cell: (r) => (
            <div>
              <div className="font-medium">{r.name}</div>
              <div className="font-mono text-xs text-muted-foreground">{r.articleCode}</div>
            </div>
          ),
        },
        {
          id: 'brand',
          header: 'Brand',
          mobile: false,
          cell: (r) => r.brandName,
        },
        {
          id: 'category',
          header: 'Category',
          mobile: false,
          cell: (r) => r.categoryName,
        },
        {
          id: 'variants',
          header: 'Size & colour',
          mobile: false,
          cell: (r) => (
            <span className="font-mono text-xs">
              <span className="font-semibold tabular-nums">{r.variantCount}</span>
              {r.variantSummary ? (
                <span className="text-muted-foreground"> — {r.variantSummary}</span>
              ) : null}
            </span>
          ),
        },
      ]}
      actions={(r) =>
        canWrite ? (
          <div className="flex items-center justify-end gap-1">
            <Link
              href="/inventory"
              className={buttonClassName({ variant: 'secondary', size: 'sm' })}
            >
              Stock
            </Link>
            <DeleteButton action={() => deleteArticleAction(r.id)} />
          </div>
        ) : null
      }
    />
  );
}
