'use client';

import Link from 'next/link';
import { FilteredDataList } from '@/components/shared/filtered-data-list';
import { MoneyText } from '@/components/shared/money-text';
import { StatusBadge } from '@/components/ui/badge';
import { buttonClassName } from '@/components/ui/button';

export type ExchangeListRow = {
  id: string;
  customerName: string;
  invoiceNo: string;
  status: string;
  differenceAmount: number;
  lineCount: number;
};

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
        r.customerName.toLowerCase().includes(q) || r.invoiceNo.toLowerCase().includes(q)
      }
      filters={[
        {
          id: 'status',
          label: 'Status',
          options: [
            { value: 'DRAFT', label: 'DRAFT' },
            { value: 'POSTED', label: 'POSTED' },
          ],
          predicate: (r, v) => r.status === v,
        },
      ]}
      emptyTitle="No exchanges yet"
      emptyDescription="Post a sale first, then create a return/replace exchange."
      emptyAction={
        canWrite ? (
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/sales" className={buttonClassName({ variant: 'secondary', size: 'md' })}>
              Sales
            </Link>
            <a href="#new-exchange" className={buttonClassName({ size: 'md' })}>
              New exchange
            </a>
          </div>
        ) : undefined
      }
      mobileTitle={(r) => r.customerName}
      mobileMeta={(r) => `${r.invoiceNo} · ${r.status}`}
      columns={[
        {
          id: 'customer',
          header: 'Customer',
          cell: (r) => <span className="font-medium">{r.customerName}</span>,
        },
        {
          id: 'invoice',
          header: 'Original invoice',
          cell: (r) => <span className="font-mono text-xs">{r.invoiceNo}</span>,
        },
        { id: 'status', header: 'Status', cell: (r) => <StatusBadge status={r.status} /> },
        {
          id: 'diff',
          header: 'Difference',
          className: 'text-right',
          cell: (r) => <MoneyText value={r.differenceAmount} />,
        },
        {
          id: 'lines',
          header: 'Lines',
          cell: (r) => (
            <span className="font-mono text-sm tabular-nums">{r.lineCount}</span>
          ),
        },
      ]}
    />
  );
}
