'use client';

import Link from 'next/link';
import { FilteredDataList } from '@/components/shared/filtered-data-list';
import { MoneyText } from '@/components/shared/money-text';
import { StatusBadge } from '@/components/ui/badge';
import { buttonClassName } from '@/components/ui/button';
import { PostSaleButton, InvoiceLink } from '@/features/sales/sale-actions';

export type SaleListRow = {
  id: string;
  invoiceLabel: string;
  customerName: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
};

export function SalesList({
  rows,
  canWrite,
  initialPayment,
}: {
  rows: SaleListRow[];
  canWrite: boolean;
  initialPayment?: string;
}) {
  return (
    <FilteredDataList
      rows={rows}
      searchPlaceholder="Search invoice or customer…"
      searchFn={(r, q) =>
        r.invoiceLabel.toLowerCase().includes(q) || r.customerName.toLowerCase().includes(q)
      }
      initialFilters={
        initialPayment
          ? {
              payment: initialPayment,
              ...(initialPayment === 'OPEN' || initialPayment === 'UNPAID' || initialPayment === 'PARTIAL'
                ? { status: 'POSTED' }
                : {}),
            }
          : undefined
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
        {
          id: 'payment',
          label: 'Payment',
          options: [
            { value: 'OPEN', label: 'Open (unpaid/partial)' },
            { value: 'PAID', label: 'PAID' },
            { value: 'PARTIAL', label: 'PARTIAL' },
            { value: 'UNPAID', label: 'UNPAID' },
          ],
          predicate: (r, v) =>
            v === 'OPEN'
              ? r.paymentStatus === 'UNPAID' || r.paymentStatus === 'PARTIAL'
              : r.paymentStatus === v,
        },
      ]}
      emptyTitle="No sales yet"
      emptyDescription="Ensure stock exists via purchase or opening, then punch a Quick Sale or create a draft."
      emptyAction={
        canWrite ? (
          <Link href="/sales/quick" className={buttonClassName({ size: 'md' })}>
            Quick Sale
          </Link>
        ) : undefined
      }
      mobileTitle={(r) => r.invoiceLabel}
      mobileMeta={(r) => r.customerName}
      columns={[
        {
          id: 'invoice',
          header: 'Invoice',
          cell: (r) => <span className="font-mono text-xs">{r.invoiceLabel}</span>,
        },
        {
          id: 'customer',
          header: 'Customer',
          cell: (r) => <span className="font-medium">{r.customerName}</span>,
        },
        { id: 'status', header: 'Status', cell: (r) => <StatusBadge status={r.status} /> },
        { id: 'payment', header: 'Payment', cell: (r) => <StatusBadge status={r.paymentStatus} /> },
        {
          id: 'total',
          header: 'Total',
          className: 'text-right',
          cell: (r) => <MoneyText value={r.totalAmount} />,
        },
      ]}
      actions={(r) => (
        <>
          {r.status === 'DRAFT' && canWrite ? <PostSaleButton saleId={r.id} /> : null}
          {r.status === 'POSTED' ? <InvoiceLink saleId={r.id} /> : null}
        </>
      )}
    />
  );
}
