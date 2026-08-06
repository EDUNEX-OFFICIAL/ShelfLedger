'use client';

import Link from 'next/link';
import { FilteredDataList } from '@/components/shared/filtered-data-list';
import { MoneyText } from '@/components/shared/money-text';
import { StatusBadge } from '@/components/ui/badge';
import { buttonClassName } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ExchangeListRow = {
  id: string;
  customerName: string;
  invoiceNo: string;
  originalSaleId: string | null;
  status: string;
  differenceAmount: number;
  lineCount: number;
  postedAt: Date | string | null;
};

function formatWhen(d: Date | string | null) {
  if (!d) return null;
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function diffHint(amount: number) {
  if (amount > 0) return 'Customer pays';
  if (amount < 0) return 'Refund / credit';
  return 'Even swap';
}

export function ExchangesList({
  rows,
  canWrite = false,
}: {
  rows: ExchangeListRow[];
  canWrite?: boolean;
}) {
  return (
    <FilteredDataList
      rows={rows}
      searchPlaceholder="Search customer or invoice…"
      searchFn={(r, q) =>
        r.customerName.toLowerCase().includes(q) ||
        r.invoiceNo.toLowerCase().includes(q) ||
        (formatWhen(r.postedAt) ?? '').toLowerCase().includes(q)
      }
      filters={[
        {
          id: 'status',
          label: 'Status',
          options: [
            { value: 'DRAFT', label: 'Draft' },
            { value: 'POSTED', label: 'Posted' },
          ],
          predicate: (r, v) => r.status === v,
        },
      ]}
      emptyTitle="No exchanges yet"
      emptyDescription="When a customer returns or swaps size, post an exchange against their invoice."
      emptyAction={
        canWrite ? (
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/sales/quick" className={buttonClassName({ variant: 'secondary', size: 'md' })}>
              Quick Sale
            </Link>
            <a href="#new-exchange" className={buttonClassName({ size: 'md' })}>
              New exchange
            </a>
          </div>
        ) : undefined
      }
      mobileTitle={(r) => r.customerName}
      mobileMeta={(r) => {
        const when = formatWhen(r.postedAt);
        const inv = r.invoiceNo;
        return when ? `${inv} · ${when}` : inv;
      }}
      mobileAmount={(r) => (
        <MoneyText
          value={r.differenceAmount}
          className={cn(
            'text-base font-semibold',
            r.differenceAmount > 0 && 'text-warning',
            r.differenceAmount < 0 && 'text-success',
          )}
        />
      )}
      mobileStatus={(r) => <StatusBadge status={r.status} />}
      mobileHint={(r) => diffHint(r.differenceAmount)}
      columns={[
        {
          id: 'customer',
          header: 'Customer',
          mobile: false,
          cell: (r) => <span className="font-medium">{r.customerName}</span>,
        },
        {
          id: 'invoice',
          header: 'Original invoice',
          mobile: false,
          cell: (r) =>
            r.originalSaleId ? (
              <Link
                href={`/sales/${r.originalSaleId}/invoice`}
                className="font-mono text-xs hover:underline"
              >
                {r.invoiceNo}
              </Link>
            ) : (
              <span className="font-mono text-xs">{r.invoiceNo}</span>
            ),
        },
        {
          id: 'when',
          header: 'Date',
          mobile: false,
          cell: (r) => (
            <span className="text-xs text-muted-foreground">
              {formatWhen(r.postedAt) ?? '—'}
            </span>
          ),
        },
        {
          id: 'status',
          header: 'Status',
          mobile: false,
          cell: (r) => <StatusBadge status={r.status} />,
        },
        {
          id: 'diff',
          header: 'Difference',
          mobile: false,
          className: 'text-right',
          cell: (r) => (
            <div className="flex flex-col items-end gap-0.5">
              <MoneyText value={r.differenceAmount} />
              <span className="text-[10px] text-muted-foreground">
                {diffHint(r.differenceAmount)}
              </span>
            </div>
          ),
        },
        {
          id: 'lines',
          header: 'Lines',
          mobile: false,
          cell: (r) => (
            <span className="font-mono text-sm tabular-nums">{r.lineCount}</span>
          ),
        },
      ]}
    />
  );
}
