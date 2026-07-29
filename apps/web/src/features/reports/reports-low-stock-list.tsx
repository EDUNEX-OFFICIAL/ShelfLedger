'use client';

import Link from 'next/link';
import { FilteredDataList } from '@/components/shared/filtered-data-list';
import { SkuText } from '@/components/shared/money-text';
import { buttonClassName } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ReportLowStockRow = {
  id: string;
  sku: string;
  articleName: string;
  location: string;
  qty: number;
  threshold: number;
};

export function ReportsLowStockList({ rows }: { rows: ReportLowStockRow[] }) {
  return (
    <FilteredDataList
      rows={rows}
      searchPlaceholder="Search item code or article…"
      searchFn={(r, q) =>
        r.sku.toLowerCase().includes(q) ||
        r.articleName.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q)
      }
      emptyTitle="No variants below threshold"
      emptyDescription="Healthy stock — or set low-stock thresholds on articles."
      emptyAction={
        <Link href="/inventory" className={buttonClassName({ size: 'md' })}>
          Inventory
        </Link>
      }
      mobileTitle={(r) => <span className="font-mono text-[15px] tracking-tight">{r.sku}</span>}
      mobileMeta={(r) => `${r.articleName} · need ≤ ${r.threshold}`}
      mobileTrailing={(r) => (
        <span className="font-mono text-base font-semibold tabular-nums text-destructive">
          {r.qty}
        </span>
      )}
      mobileHref={(r) => `/stock-ledger?sku=${encodeURIComponent(r.sku)}`}
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
          cell: (r) => r.articleName,
        },
        {
          id: 'location',
          header: 'Location',
          mobile: false,
          cell: (r) => <span className="text-muted-foreground">{r.location}</span>,
        },
        {
          id: 'qty',
          header: 'Qty',
          mobile: false,
          cell: (r) => (
            <span
              className={cn(
                'font-mono text-sm font-semibold tabular-nums',
                r.qty <= 0 ? 'text-destructive' : 'text-warning',
              )}
            >
              {r.qty}
            </span>
          ),
        },
        {
          id: 'threshold',
          header: 'Threshold',
          mobile: false,
          cell: (r) => (
            <span className="font-mono text-sm tabular-nums text-muted-foreground">
              {r.threshold}
            </span>
          ),
        },
      ]}
      actions={(r) => (
        <div className="flex justify-end gap-1">
          <Link
            href={`/inventory?stock=low`}
            className={buttonClassName({ variant: 'ghost', size: 'sm' })}
          >
            Balances
          </Link>
          <Link
            href={`/stock-ledger?sku=${encodeURIComponent(r.sku)}`}
            className={buttonClassName({ variant: 'secondary', size: 'sm' })}
          >
            History
          </Link>
        </div>
      )}
    />
  );
}
