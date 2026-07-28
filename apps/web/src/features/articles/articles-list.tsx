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
};

export function ArticlesList({ rows, canWrite }: { rows: ArticleListRow[]; canWrite: boolean }) {
  return (
    <FilteredDataList
      rows={rows}
      searchPlaceholder="Search article, code, brand…"
      searchFn={(r, q) =>
        r.name.toLowerCase().includes(q) ||
        r.articleCode.toLowerCase().includes(q) ||
        r.brandName.toLowerCase().includes(q) ||
        r.categoryName.toLowerCase().includes(q)
      }
      emptyTitle="No articles yet"
      emptyDescription="Create brands and categories first, then add articles with variants."
      emptyAction={
        canWrite ? (
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/brands" className={buttonClassName({ variant: 'secondary', size: 'md' })}>
              Brands
            </Link>
            <a href="#new-article" className={buttonClassName({ size: 'md' })}>
              Add article
            </a>
          </div>
        ) : undefined
      }
      mobileTitle={(r) => r.name}
      mobileMeta={(r) => `${r.articleCode} · ${r.variantCount} variants`}
      columns={[
        {
          id: 'article',
          header: 'Article',
          cell: (r) => (
            <div>
              <div className="font-medium">{r.name}</div>
              <div className="font-mono text-xs text-muted-foreground">{r.articleCode}</div>
            </div>
          ),
        },
        { id: 'brand', header: 'Brand', cell: (r) => r.brandName },
        { id: 'category', header: 'Category', cell: (r) => r.categoryName },
        {
          id: 'variants',
          header: 'Variants',
          cell: (r) => (
            <span className="font-mono text-xs">
              {r.variantCount} — {r.variantSummary}
            </span>
          ),
        },
      ]}
      actions={(r) => (canWrite ? <DeleteButton action={() => deleteArticleAction(r.id)} /> : null)}
    />
  );
}
