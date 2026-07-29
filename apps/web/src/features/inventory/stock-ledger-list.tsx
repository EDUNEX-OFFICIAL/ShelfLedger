'use client';

import Link from 'next/link';
import { FilteredDataList } from '@/components/shared/filtered-data-list';
import { SkuText } from '@/components/shared/money-text';
import { Badge } from '@/components/ui/badge';
import { buttonClassName } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type LedgerRow = {
  id: string;
  when: string;
  movementType: string;
  movementLabel: string;
  typeFamily: string;
  sku: string;
  articleName: string;
  sizeColor: string;
  location: string;
  qtyChange: number;
  unitCost: number;
  referenceType: string;
  referenceId: string;
  refLabel: string;
  refHref: string | null;
  notes: string | null;
};

const TYPE_FAMILIES = [
  { value: 'sale', label: 'Sale' },
  { value: 'purchase', label: 'Purchase' },
  { value: 'opening', label: 'Starting' },
  { value: 'adjust', label: 'Adjust / loss' },
  { value: 'exchange', label: 'Exchange' },
  { value: 'transfer', label: 'Transfer' },
] as const;

function formatWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function daysAgo(iso: string, days: number) {
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return false;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  return d >= start.getTime();
}

function QtyDelta({ value, className }: { value: number; className?: string }) {
  return (
    <span
      className={cn(
        'font-mono tabular-nums',
        value > 0 && 'text-success',
        value < 0 && 'text-destructive',
        className,
      )}
    >
      {value > 0 ? '+' : ''}
      {value}
    </span>
  );
}

export function StockLedgerList({
  rows,
  initialSku,
}: {
  rows: LedgerRow[];
  initialSku?: string;
}) {
  return (
    <FilteredDataList
      rows={rows}
      initialSearch={initialSku}
      searchPlaceholder="Search item code, article, type, notes…"
      searchFn={(r, q) =>
        r.sku.toLowerCase().includes(q) ||
        r.articleName.toLowerCase().includes(q) ||
        r.sizeColor.toLowerCase().includes(q) ||
        r.movementLabel.toLowerCase().includes(q) ||
        r.movementType.toLowerCase().includes(q) ||
        r.refLabel.toLowerCase().includes(q) ||
        (r.notes ?? '').toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q)
      }
      filters={[
        {
          id: 'type',
          label: 'Type',
          options: [...TYPE_FAMILIES],
          predicate: (r, v) => r.typeFamily === v,
        },
        {
          id: 'dir',
          label: 'Direction',
          options: [
            { value: 'in', label: 'In (+)' },
            { value: 'out', label: 'Out (−)' },
          ],
          predicate: (r, v) => (v === 'in' ? r.qtyChange > 0 : r.qtyChange < 0),
        },
        {
          id: 'period',
          label: 'When',
          options: [
            { value: 'today', label: 'Today' },
            { value: '7d', label: '7 days' },
            { value: '30d', label: '30 days' },
          ],
          predicate: (r, v) => {
            if (v === 'today') return daysAgo(r.when, 1);
            if (v === '7d') return daysAgo(r.when, 7);
            if (v === '30d') return daysAgo(r.when, 30);
            return true;
          },
        },
      ]}
      emptyTitle="No stock history yet"
      emptyDescription="Post a purchase, sale, starting stock, or adjustment — every qty change writes a row here."
      emptyAction={
        <div className="flex flex-wrap justify-center gap-2">
          <Link href="/inventory" className={buttonClassName({ size: 'md' })}>
            Balances
          </Link>
          <Link
            href="/inventory#opening-stock"
            className={buttonClassName({ variant: 'secondary', size: 'md' })}
          >
            Starting stock
          </Link>
        </div>
      }
      mobileTitle={(r) => (
        <span className="font-mono text-[15px] tracking-tight">{r.sku}</span>
      )}
      mobileMeta={(r) => (
        <span>
          {r.movementLabel} · {formatWhen(r.when)}
          {r.notes ? ` · ${r.notes}` : ''}
        </span>
      )}
      mobileTrailing={(r) => (
        <QtyDelta value={r.qtyChange} className="text-base font-semibold" />
      )}
      mobileHref={(r) => r.refHref}
      columns={[
        {
          id: 'when',
          header: 'When',
          mobile: false,
          cell: (r) => (
            <span className="text-xs text-muted-foreground">{formatWhen(r.when)}</span>
          ),
        },
        {
          id: 'type',
          header: 'Type',
          mobile: false,
          cell: (r) => (
            <Badge variant={r.qtyChange > 0 ? 'success' : 'muted'}>{r.movementLabel}</Badge>
          ),
        },
        {
          id: 'sku',
          header: 'Item code',
          mobile: false,
          cell: (r) => (
            <div>
              <SkuText value={r.sku} />
              <p className="text-xs text-muted-foreground">
                {r.articleName} · {r.sizeColor}
              </p>
            </div>
          ),
        },
        {
          id: 'qty',
          header: 'Qty Δ',
          mobile: false,
          cell: (r) => <QtyDelta value={r.qtyChange} className="text-sm font-semibold" />,
        },
        {
          id: 'cost',
          header: 'Unit cost',
          mobile: false,
          className: 'text-right',
          cell: (r) => (
            <span
              className="font-mono text-sm tabular-nums text-muted-foreground"
              title={`₹${r.unitCost.toFixed(4)}`}
            >
              ₹{r.unitCost.toFixed(2)}
            </span>
          ),
        },
        {
          id: 'ref',
          header: 'Source',
          mobile: false,
          cell: (r) =>
            r.refHref ? (
              <Link
                href={r.refHref}
                className="text-xs font-medium text-primary hover:underline"
              >
                {r.refLabel}
              </Link>
            ) : (
              <span className="text-xs text-muted-foreground">{r.refLabel}</span>
            ),
        },
      ]}
      actions={(r) =>
        r.refHref ? (
          <Link
            href={r.refHref}
            className={buttonClassName({ variant: 'secondary', size: 'sm' })}
          >
            Open
          </Link>
        ) : null
      }
    />
  );
}
