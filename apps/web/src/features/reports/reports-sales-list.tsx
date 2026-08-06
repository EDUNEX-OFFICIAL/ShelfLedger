'use client';

import Link from 'next/link';
import { FilteredDataList } from '@/components/shared/filtered-data-list';
import { MoneyText } from '@/components/shared/money-text';
import { StatusBadge } from '@/components/ui/badge';
import { buttonClassName } from '@/components/ui/button';

export type ReportSaleRow = {
  id: string;
  invoiceNo: string;
  invoiceDateLabel: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paymentStatus: string;
};

export function ReportsSalesList({ rows }: { rows: ReportSaleRow[] }) {
  return (
    <FilteredDataList
      rows={rows}
      searchPlaceholder="Search invoice…"
      searchFn={(r, q) =>
        r.invoiceNo.toLowerCase().includes(q) || r.paymentStatus.toLowerCase().includes(q)
      }
      filters={[
        {
          id: 'pay',
          label: 'Payment',
          options: [
            { value: 'PAID', label: 'Paid' },
            { value: 'PARTIAL', label: 'Partial' },
            { value: 'UNPAID', label: 'Unpaid' },
          ],
          predicate: (r, v) => r.paymentStatus === v,
        },
      ]}
      emptyTitle="No posted sales in range"
      emptyDescription="Punch a Quick Sale or post a draft to fill this report."
      emptyAction={
        <Link href="/sales/quick" className={buttonClassName({ size: 'md' })}>
          Quick Sale
        </Link>
      }
      mobileTitle={(r) => (
        <span className="font-mono text-[15px] tracking-tight">{r.invoiceNo}</span>
      )}
      mobileMeta={(r) => r.invoiceDateLabel}
      mobileAmount={(r) => <MoneyText value={r.totalAmount} className="text-base font-semibold" />}
      mobileStatus={(r) => <StatusBadge status={r.paymentStatus} />}
      mobileHint={(r) => `Tax ₹${r.taxAmount.toFixed(2)}`}
      mobileHref={(r) => `/sales/${r.id}/invoice`}
      columns={[
        {
          id: 'invoice',
          header: 'Invoice',
          mobile: false,
          cell: (r) => (
            <Link
              href={`/sales/${r.id}/invoice`}
              className="font-mono text-xs font-medium text-primary hover:underline"
            >
              {r.invoiceNo}
            </Link>
          ),
        },
        {
          id: 'date',
          header: 'Date',
          mobile: false,
          cell: (r) => (
            <span className="text-xs text-muted-foreground">{r.invoiceDateLabel}</span>
          ),
        },
        {
          id: 'pay',
          header: 'Pay',
          mobile: false,
          cell: (r) => <StatusBadge status={r.paymentStatus} />,
        },
        {
          id: 'taxable',
          header: 'Taxable',
          mobile: false,
          className: 'text-right',
          cell: (r) => <MoneyText value={r.subtotal} />,
        },
        {
          id: 'tax',
          header: 'Tax',
          mobile: false,
          className: 'text-right',
          cell: (r) => <MoneyText value={r.taxAmount} />,
        },
        {
          id: 'total',
          header: 'Total',
          mobile: false,
          className: 'text-right',
          cell: (r) => <MoneyText value={r.totalAmount} className="font-medium" />,
        },
      ]}
    />
  );
}
