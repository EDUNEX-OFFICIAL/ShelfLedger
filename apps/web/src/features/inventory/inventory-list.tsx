'use client';

import { FilteredDataList } from '@/components/shared/filtered-data-list';
import { SkuText } from '@/components/shared/money-text';
import { Badge } from '@/components/ui/badge';
import { buttonClassName } from '@/components/ui/button';

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
}: {
  rows: BalanceRow[];
  canWrite?: boolean;
}) {
  return (
    <FilteredDataList
      rows={rows}
      searchPlaceholder="Search SKU, article, location…"
      searchFn={(r, q) =>
        r.sku.toLowerCase().includes(q) ||
        r.articleName.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q)
      }
      filters={[
        {
          id: 'stock',
          label: 'Stock',
          options: [
            { value: 'low', label: 'Low stock' },
            { value: 'ok', label: 'OK' },
          ],
          predicate: (r, v) => (v === 'low' ? r.lowStock : !r.lowStock),
        },
      ]}
      emptyTitle="No stock balances yet"
      emptyDescription="Post opening stock or a purchase to create balances."
      emptyAction={
        canWrite ? (
          <a href="#opening-stock" className={buttonClassName({ size: 'md' })}>
            Opening stock
          </a>
        ) : undefined
      }
      mobileTitle={(r) => r.sku}
      mobileMeta={(r) =>
        `${r.articleName} · qty ${r.qty}${r.lowStock ? ' · Low' : ''}`
      }
      columns={[
        { id: 'sku', header: 'SKU', cell: (r) => <SkuText value={r.sku} /> },
        {
          id: 'article',
          header: 'Article',
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
        { id: 'location', header: 'Location', cell: (r) => r.location },
        {
          id: 'qty',
          header: 'Qty',
          cell: (r) => (
            <span className="font-mono text-sm tabular-nums">{r.qty}</span>
          ),
        },
        {
          id: 'avg',
          header: 'Avg cost',
          className: 'text-right',
          cell: (r) => (
            <span className="font-mono text-sm tabular-nums">
              ₹{r.avgUnitCost.toFixed(4)}
            </span>
          ),
        },
      ]}
    />
  );
}
