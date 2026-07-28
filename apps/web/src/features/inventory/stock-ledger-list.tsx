'use client';

import Link from 'next/link';
import { FilteredDataList } from '@/components/shared/filtered-data-list';
import { SkuText } from '@/components/shared/money-text';
import { Badge } from '@/components/ui/badge';
import { buttonClassName } from '@/components/ui/button';

export type LedgerRow = {
  id: string;
  when: string;
  movementType: string;
  sku: string;
  qtyChange: number;
  unitCost: number;
  ref: string;
};

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

export function StockLedgerList({ rows }: { rows: LedgerRow[] }) {
  return (
    <FilteredDataList
      rows={rows}
      searchPlaceholder="Search type, SKU, ref…"
      searchFn={(r, q) =>
        r.movementType.toLowerCase().includes(q) ||
        r.sku.toLowerCase().includes(q) ||
        r.ref.toLowerCase().includes(q)
      }
      emptyTitle="No ledger entries yet"
      emptyDescription="Post a purchase, sale, opening, or adjustment to write ledger rows."
      emptyAction={
        <Link href="/inventory" className={buttonClassName({ size: 'md' })}>
          Inventory
        </Link>
      }
      mobileTitle={(r) => r.sku}
      mobileMeta={(r) => `${r.movementType} · ${formatWhen(r.when)}`}
      columns={[
        {
          id: 'when',
          header: 'When',
          cell: (r) => (
            <span className="text-xs text-muted-foreground">{formatWhen(r.when)}</span>
          ),
        },
        {
          id: 'type',
          header: 'Type',
          cell: (r) => <Badge variant="muted">{r.movementType}</Badge>,
        },
        { id: 'sku', header: 'SKU', cell: (r) => <SkuText value={r.sku} /> },
        {
          id: 'qty',
          header: 'Qty Δ',
          cell: (r) => (
            <span className="font-mono text-sm tabular-nums">
              {r.qtyChange > 0 ? '+' : ''}
              {r.qtyChange}
            </span>
          ),
        },
        {
          id: 'cost',
          header: 'Unit cost',
          className: 'text-right',
          cell: (r) => (
            <span className="font-mono text-sm tabular-nums">₹{r.unitCost.toFixed(4)}</span>
          ),
        },
        {
          id: 'ref',
          header: 'Ref',
          cell: (r) => (
            <span className="font-mono text-xs text-muted-foreground">{r.ref}</span>
          ),
        },
      ]}
    />
  );
}
