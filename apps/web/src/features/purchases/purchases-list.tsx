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
  status: string;
  lineCount: number;
  totalAmount: number;
  returnLines: Array<{ id: string; label: string; qty: number }>;
};

export function PurchasesList({
  rows,
  canWrite,
}: {
  rows: PurchaseListRow[];
  canWrite: boolean;
}) {
  return (
    <FilteredDataList
      rows={rows}
      searchPlaceholder="Search vendor…"
      searchFn={(r, q) => r.vendorName.toLowerCase().includes(q)}
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
      emptyTitle="No purchases yet"
      emptyDescription="Create a vendor and article variants first, then draft a purchase."
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
      mobileMeta={(r) => `${r.lineCount} lines`}
      mobileTrailing={(r) => <StatusBadge status={r.status} />}
      columns={[
        {
          id: 'vendor',
          header: 'Vendor',
          mobile: false,
          cell: (r) => <span className="font-medium">{r.vendorName}</span>,
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
          cell: (r) => <span className="font-mono tabular-nums text-sm">{r.lineCount}</span>,
        },
        {
          id: 'total',
          header: 'Total',
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
