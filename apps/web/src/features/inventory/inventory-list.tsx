'use client';

import Link from 'next/link';
import { FilteredDataList } from '@/components/shared/filtered-data-list';
import { SkuText } from '@/components/shared/money-text';
import { Badge } from '@/components/ui/badge';
import { buttonClassName } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type BalanceRow = {
  id: string;
  sku: string;
  articleName: string;
  sizeColor: string;
  location: string;
  qty: number;
  avgUnitCost: number;
  lowStock: boolean;
};

export function InventoryBalancesList({
  rows,
  canWrite = false,
  initialStock,
}: {
  rows: BalanceRow[];
  canWrite?: boolean;
  initialStock?: 'low' | 'ok';
}) {
  return (
    <FilteredDataList
      rows={rows}
      searchPlaceholder="Search item code, article, size, location…"
      searchFn={(r, q) =>
        r.sku.toLowerCase().includes(q) ||
        r.articleName.toLowerCase().includes(q) ||
        r.sizeColor.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q)
      }
      initialFilters={initialStock ? { stock: initialStock } : undefined}
      filters={[
        {
          id: 'stock',
          label: 'Stock',
          options: [
            { value: 'low', label: 'Low stock' },
            { value: 'ok', label: 'Healthy' },
          ],
          predicate: (r, v) => (v === 'low' ? r.lowStock : !r.lowStock),
        },
      ]}
      emptyTitle="No stock balances yet"
      emptyDescription="Post starting stock or a purchase to put qty on the shelf."
      emptyAction={
        canWrite ? (
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/articles" className={buttonClassName({ variant: 'secondary', size: 'md' })}>
              Articles / item codes
            </Link>
            <a href="#opening-stock" className={buttonClassName({ size: 'md' })}>
              Starting stock
            </a>
          </div>
        ) : undefined
      }
      mobileTitle={(r) => r.articleName}
      mobileMeta={(r) => (
        <span className="font-mono">
          {r.sku}
          <span className="font-sans text-muted-foreground">
            {' '}
            · {r.sizeColor} · {r.location}
          </span>
        </span>
      )}
      mobileAmount={(r) => (
        <span
          className={cn(
            'font-mono text-base font-semibold tabular-nums',
            r.lowStock ? 'text-destructive' : 'text-foreground',
          )}
        >
          {r.qty}
        </span>
      )}
      mobileStatus={(r) =>
        r.lowStock ? (
          <Badge variant="warning" className="text-[10px]">
            Low
          </Badge>
        ) : null
      }
      mobileHint={() => <span className="text-muted-foreground">on hand</span>}
      columns={[
        {
          id: 'sku',
          header: 'Item code',
          mobile: false,
          cell: (r) => <SkuText value={r.sku} />,
        },
        {
          id: 'article',
          header: 'Article',
          mobile: false,
          cell: (r) => (
            <span>
              {r.articleName}{' '}
              <span className="text-muted-foreground">({r.sizeColor})</span>
              {r.lowStock ? (
                <Badge variant="warning" className="ml-2">
                  Low
                </Badge>
              ) : null}
            </span>
          ),
        },
        {
          id: 'location',
          header: 'Location',
          mobile: false,
          cell: (r) => r.location,
        },
        {
          id: 'qty',
          header: 'Qty',
          mobile: false,
          cell: (r) => (
            <span
              className={cn(
                'font-mono text-sm font-semibold tabular-nums',
                r.lowStock && 'text-destructive',
              )}
            >
              {r.qty}
            </span>
          ),
        },
        {
          id: 'avg',
          header: 'Avg cost',
          mobile: false,
          className: 'text-right',
          cell: (r) => (
            <span className="font-mono text-sm tabular-nums" title={`₹${r.avgUnitCost.toFixed(4)}`}>
              ₹{r.avgUnitCost.toFixed(2)}
            </span>
          ),
        },
      ]}
      actions={(r) => (
        <Link
          href={`/stock-ledger?sku=${encodeURIComponent(r.sku)}`}
          className={buttonClassName({ variant: 'secondary', size: 'sm' })}
        >
          History
        </Link>
      )}
    />
  );
}
