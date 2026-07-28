'use client';

import { FilteredDataList } from '@/components/shared/filtered-data-list';
import { DeleteButton } from '@/components/shared/delete-button';
import { Badge } from '@/components/ui/badge';
import { buttonClassName } from '@/components/ui/button';
import { deleteCustomerAction } from '@/features/sales/actions';

export type CustomerListRow = {
  id: string;
  name: string;
  phone: string | null;
  gstin: string | null;
  isWalkIn: boolean;
};

export function CustomersList({
  rows,
  canWrite = false,
  canDelete,
}: {
  rows: CustomerListRow[];
  canWrite?: boolean;
  canDelete: boolean;
}) {
  return (
    <FilteredDataList
      rows={rows}
      searchPlaceholder="Search name, phone, GSTIN…"
      searchFn={(r, q) =>
        r.name.toLowerCase().includes(q) ||
        (r.phone ?? '').toLowerCase().includes(q) ||
        (r.gstin ?? '').toLowerCase().includes(q)
      }
      emptyTitle="No customers yet"
      emptyDescription="Add a named customer or use the seeded walk-in customer on sales."
      emptyAction={
        canWrite ? (
          <a href="#new-customer" className={buttonClassName({ size: 'md' })}>
            Add customer
          </a>
        ) : undefined
      }
      mobileTitle={(r) => r.name}
      mobileMeta={(r) => r.phone ?? 'No phone'}
      columns={[
        {
          id: 'name',
          header: 'Name',
          cell: (r) => (
            <span className="font-medium">
              {r.name}
              {r.isWalkIn ? (
                <Badge variant="muted" className="ml-2">
                  walk-in
                </Badge>
              ) : null}
            </span>
          ),
        },
        {
          id: 'phone',
          header: 'Phone',
          cell: (r) => <span className="font-mono text-xs">{r.phone ?? '—'}</span>,
        },
        {
          id: 'gstin',
          header: 'GSTIN',
          cell: (r) => <span className="font-mono text-xs">{r.gstin ?? '—'}</span>,
        },
      ]}
      actions={(r) =>
        canDelete && !r.isWalkIn ? (
          <DeleteButton action={() => deleteCustomerAction(r.id)} />
        ) : null
      }
    />
  );
}
