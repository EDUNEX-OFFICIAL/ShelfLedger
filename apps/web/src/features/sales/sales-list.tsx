'use client';

import Link from 'next/link';
import { FilteredDataList } from '@/components/shared/filtered-data-list';
import { MoneyText } from '@/components/shared/money-text';
import { StatusBadge } from '@/components/ui/badge';
import { buttonClassName } from '@/components/ui/button';
import { PostSaleButton, InvoiceLink } from '@/features/sales/sale-actions';
import { CollectPaymentButton } from '@/features/sales/collect-payment-button';

export type SaleListRow = {
  id: string;
  invoiceLabel: string;
  customerName: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  dueAmount: number;
  invoiceDate: Date | string;
};

function formatInvoiceDate(d: Date | string) {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function SalesList({
  rows,
  canWrite,
  initialPayment,
  initialStatus,
}: {
  rows: SaleListRow[];
  canWrite: boolean;
  initialPayment?: string;
  initialStatus?: string;
}) {
  const initialFilters =
    initialPayment || initialStatus
      ? {
          ...(initialStatus ? { status: initialStatus } : {}),
          ...(initialPayment
            ? {
                payment: initialPayment,
                ...(initialPayment === 'OPEN' ||
                initialPayment === 'UNPAID' ||
                initialPayment === 'PARTIAL'
                  ? { status: initialStatus ?? 'POSTED' }
                  : {}),
              }
            : {}),
        }
      : undefined;

  return (
    <FilteredDataList
      rows={rows}
      searchPlaceholder="Search invoice or customer…"
      searchFn={(r, q) =>
        r.invoiceLabel.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        formatInvoiceDate(r.invoiceDate).toLowerCase().includes(q)
      }
      initialFilters={initialFilters}
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
        {
          id: 'payment',
          label: 'Payment',
          options: [
            { value: 'OPEN', label: 'Open (unpaid/partial)' },
            { value: 'PAID', label: 'Paid' },
            { value: 'PARTIAL', label: 'Partial' },
            { value: 'UNPAID', label: 'Unpaid' },
          ],
          predicate: (r, v) =>
            v === 'OPEN'
              ? r.paymentStatus === 'UNPAID' || r.paymentStatus === 'PARTIAL'
              : r.paymentStatus === v,
        },
      ]}
      emptyTitle="No sales yet"
      emptyDescription="Punch a Quick Sale for walk-in bills, or open Advanced draft for unpaid / overrides."
      emptyAction={
        canWrite ? (
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/sales/quick" className={buttonClassName({ size: 'md' })}>
              Quick Sale
            </Link>
            <a href="#new-draft" className={buttonClassName({ variant: 'secondary', size: 'md' })}>
              New draft
            </a>
          </div>
        ) : undefined
      }
      mobileHref={(r) => {
        // Open dues need Collect on the chip — whole-row link would hide actions.
        if (r.status !== 'POSTED') return null;
        if (r.paymentStatus === 'UNPAID' || r.paymentStatus === 'PARTIAL') return null;
        return `/sales/${r.id}/invoice`;
      }}
      mobileTitle={(r) => r.invoiceLabel}
      mobileMeta={(r) => `${r.customerName} · ${formatInvoiceDate(r.invoiceDate)}`}
      mobileTrailing={(r) => (
        <div className="flex flex-col items-end gap-1">
          <MoneyText value={r.totalAmount} className="text-sm font-semibold" />
          <StatusBadge status={r.status === 'DRAFT' ? r.status : r.paymentStatus} />
          {r.status === 'POSTED' &&
          (r.paymentStatus === 'UNPAID' || r.paymentStatus === 'PARTIAL') &&
          r.dueAmount > 0.001 ? (
            <span className="text-[10px] font-medium text-muted-foreground">
              Due <MoneyText value={r.dueAmount} className="text-[10px] font-semibold" />
            </span>
          ) : null}
        </div>
      )}
      columns={[
        {
          id: 'invoice',
          header: 'Invoice',
          mobile: false,
          cell: (r) =>
            r.status === 'POSTED' ? (
              <Link
                href={`/sales/${r.id}/invoice`}
                className="font-mono text-xs hover:underline"
              >
                {r.invoiceLabel}
              </Link>
            ) : (
              <span className="font-mono text-xs text-muted-foreground">{r.invoiceLabel}</span>
            ),
        },
        {
          id: 'customer',
          header: 'Customer',
          mobile: false,
          cell: (r) => <span className="font-medium">{r.customerName}</span>,
        },
        {
          id: 'date',
          header: 'Date',
          mobile: false,
          cell: (r) => (
            <span className="text-xs text-muted-foreground">{formatInvoiceDate(r.invoiceDate)}</span>
          ),
        },
        {
          id: 'status',
          header: 'Status',
          mobile: false,
          cell: (r) => <StatusBadge status={r.status} />,
        },
        {
          id: 'payment',
          header: 'Payment',
          mobile: false,
          cell: (r) => <StatusBadge status={r.paymentStatus} />,
        },
        {
          id: 'total',
          header: 'Total',
          mobile: false,
          className: 'text-right',
          cell: (r) => <MoneyText value={r.totalAmount} />,
        },
      ]}
      actions={(r) => (
        <>
          {r.status === 'DRAFT' && canWrite ? <PostSaleButton saleId={r.id} /> : null}
          {r.status === 'POSTED' &&
          canWrite &&
          (r.paymentStatus === 'UNPAID' || r.paymentStatus === 'PARTIAL') &&
          r.dueAmount > 0.001 ? (
            <CollectPaymentButton
              saleId={r.id}
              invoiceLabel={r.invoiceLabel}
              customerName={r.customerName}
              dueAmount={r.dueAmount}
            />
          ) : null}
          {r.status === 'POSTED' ? <InvoiceLink saleId={r.id} /> : null}
        </>
      )}
    />
  );
}
