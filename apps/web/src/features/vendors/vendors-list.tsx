'use client';

import { FilteredDataList } from '@/components/shared/filtered-data-list';
import { DeleteButton } from '@/components/shared/delete-button';
import { buttonClassName } from '@/components/ui/button';
import { deleteVendorAction } from '@/features/masters/actions';

export type VendorListRow = {
  id: string;
  name: string;
  phone: string | null;
  gstin: string | null;
};

export function VendorsList({ rows, canWrite }: { rows: VendorListRow[]; canWrite: boolean }) {
  return (
    <FilteredDataList
      rows={rows}
      searchPlaceholder="Search vendor, phone, GSTIN…"
      searchFn={(r, q) =>
        r.name.toLowerCase().includes(q) ||
        (r.phone ?? '').toLowerCase().includes(q) ||
        (r.gstin ?? '').toLowerCase().includes(q)
      }
      emptyTitle="No vendors yet"
      emptyDescription="Add a supplier before creating purchases."
      emptyAction={
        canWrite ? (
          <a href="#new-vendor" className={buttonClassName({ size: 'md' })}>
            Add vendor
          </a>
        ) : undefined
      }
      mobileTitle={(r) => r.name}
      mobileMeta={(r) => r.phone ?? r.gstin ?? undefined}
      columns={[
        { id: 'name', header: 'Name', cell: (r) => <span className="font-medium">{r.name}</span> },
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
      actions={(r) => (canWrite ? <DeleteButton action={() => deleteVendorAction(r.id)} /> : null)}
    />
  );
}
