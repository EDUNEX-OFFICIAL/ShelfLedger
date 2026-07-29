'use client';

import Link from 'next/link';
import { FilteredDataList } from '@/components/shared/filtered-data-list';
import { MoneyText } from '@/components/shared/money-text';
import { StatusBadge } from '@/components/ui/badge';
import { buttonClassName } from '@/components/ui/button';
import {
  PostPurchaseButton,
  ReturnPurchaseButton,
} from '@/features/purchases/purchase-actions';

export type PurchaseListRow = {
  id: string;
  vendorName: string;
  vendorInvoiceNo: string | null;
  vendorInvoiceDate: Date | string | null;
  status: string;
  lineCount: number;
  totalAmount: number;
  returnLines: Array<{ id: string; label: string; qty: number }>;
};

function formatBillDate(d: Date | string | null) {
  if (!d) return null;
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function billMeta(r: PurchaseListRow) {
  const inv = r.vendorInvoiceNo?.trim() || 'No invoice #';
  const date = formatBillDate(r.vendorInvoiceDate);
  const lines = `${r.lineCount} line${r.lineCount === 1 ? '' : 's'}`;
  return date ? `${inv} · ${date} · ${lines}` : `${inv} · ${lines}`;
}

export function PurchasesList({
  rows,
  canWrite,
  initialStatus,
}: {
  rows: PurchaseListRow[];
  canWrite: boolean;
  initialStatus?: string;
}) {
  return (
    <FilteredDataList
      rows={rows}
      searchPlaceholder="Search vendor or invoice #…"
      searchFn={(r, q) => {
        const inv = (r.vendorInvoiceNo ?? '').toLowerCase();
        const date = (formatBillDate(r.vendorInvoiceDate) ?? '').toLowerCase();
        return (
          r.vendorName.toLowerCase().includes(q) ||
          inv.includes(q) ||
          date.includes(q)
        );
      }}
      initialFilters={initialStatus ? { status: initialStatus } : undefined}
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
      emptyTitle="No purchases yet"
      emptyDescription="Add a vendor and item codes, then enter the vendor’s bill below to receive stock."
      emptyAction={
        canWrite ? (
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/vendors" className={buttonClassName({ variant: 'secondary', size: 'md' })}>
              Vendors
            </Link>
            <a href="#new-purchase" className={buttonClassName({ size: 'md' })}>
              New purchase
            </a>
          </div>
        ) : undefined
      }
      mobileTitle={(r) => r.vendorName}
      mobileMeta={(r) => billMeta(r)}
      mobileTrailing={(r) => (
        <div className="flex flex-col items-end gap-1">
          <MoneyText value={r.totalAmount} className="text-sm font-semibold" />
          <StatusBadge status={r.status} />
        </div>
      )}
      columns={[
        {
          id: 'vendor',
          header: 'Vendor',
          mobile: false,
          cell: (r) => <span className="font-medium">{r.vendorName}</span>,
        },
        {
          id: 'invoice',
          header: 'Vendor invoice',
          mobile: false,
          cell: (r) => (
            <span className="font-mono text-xs">
              {r.vendorInvoiceNo?.trim() || (
                <span className="text-muted-foreground">—</span>
              )}
            </span>
          ),
        },
        {
          id: 'date',
          header: 'Bill date',
          mobile: false,
          cell: (r) => (
            <span className="text-xs text-muted-foreground">
              {formatBillDate(r.vendorInvoiceDate) ?? '—'}
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
          id: 'lines',
          header: 'Lines',
          mobile: false,
          cell: (r) => <span className="font-mono tabular-nums text-sm">{r.lineCount}</span>,
        },
        {
          id: 'total',
          header: 'Total',
          mobile: false,
          className: 'text-right',
          cell: (r) => <MoneyText value={r.totalAmount} />,
        },
      ]}
      actions={(r) =>
        canWrite ? (
          <>
            {r.status === 'DRAFT' ? <PostPurchaseButton purchaseId={r.id} /> : null}
            {r.status === 'POSTED' ? (
              <ReturnPurchaseButton purchaseId={r.id} lines={r.returnLines} />
            ) : null}
          </>
        ) : null
      }
    />
  );
}
