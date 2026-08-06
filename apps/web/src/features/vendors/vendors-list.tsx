'use client';

import Link from 'next/link';
import { FilteredDataList } from '@/components/shared/filtered-data-list';
import { DeleteButton } from '@/components/shared/delete-button';
import { buttonClassName } from '@/components/ui/button';
import { deleteVendorAction } from '@/features/masters/actions';

export type VendorListRow = {
  id: string;
  name: string;
  phone: string | null;
  gstin: string | null;
  paymentTermsDays: number | null;
};

function digitsOnly(phone: string) {
  return phone.replace(/\D/g, '');
}

function termsLabel(days: number | null) {
  if (days == null) return null;
  if (days === 0) return 'COD / immediate';
  return `Net ${days}`;
}

export function VendorsList({ rows, canWrite }: { rows: VendorListRow[]; canWrite: boolean }) {
  return (
    <FilteredDataList
      rows={rows}
      searchPlaceholder="Search name, GSTIN, phone…"
      searchFn={(r, q) => {
        const digits = digitsOnly(r.phone ?? '');
        return (
          r.name.toLowerCase().includes(q) ||
          (r.phone ?? '').toLowerCase().includes(q) ||
          digits.includes(q.replace(/\D/g, '')) ||
          (r.gstin ?? '').toLowerCase().includes(q) ||
          (termsLabel(r.paymentTermsDays) ?? '').toLowerCase().includes(q)
        );
      }}
      filters={[
        {
          id: 'gstin',
          label: 'GSTIN',
          options: [
            { value: 'yes', label: 'Has GSTIN' },
            { value: 'no', label: 'No GSTIN' },
          ],
          predicate: (r, v) =>
            v === 'yes' ? Boolean(r.gstin?.trim()) : !r.gstin?.trim(),
        },
      ]}
      emptyTitle="No vendors yet"
      emptyDescription="Add a supplier before creating a purchase bill."
      emptyAction={
        canWrite ? (
          <div className="flex flex-wrap justify-center gap-2">
            <a href="#new-vendor" className={buttonClassName({ size: 'md' })}>
              Add vendor
            </a>
            <Link
              href="/purchases#new-purchase"
              className={buttonClassName({ variant: 'secondary', size: 'md' })}
            >
              New purchase
            </Link>
          </div>
        ) : undefined
      }
      mobileTitle={(r) => r.name}
      mobileMeta={(r) => {
        const terms = termsLabel(r.paymentTermsDays);
        const gst = r.gstin?.trim();
        if (gst && terms) return `${gst} · ${terms}`;
        if (gst) return gst;
        if (terms) return terms;
        return 'No GSTIN';
      }}
      mobileAmount={(r) =>
        r.phone ? (
          <a
            href={`tel:${digitsOnly(r.phone)}`}
            className="font-mono text-base font-semibold text-primary"
            onClick={(e) => e.stopPropagation()}
          >
            {r.phone}
          </a>
        ) : (
          <span className="text-xs font-medium text-muted-foreground">No phone</span>
        )
      }
      columns={[
        {
          id: 'name',
          header: 'Vendor',
          mobile: false,
          cell: (r) => <span className="font-medium">{r.name}</span>,
        },
        {
          id: 'gstin',
          header: 'GSTIN',
          mobile: false,
          cell: (r) => (
            <span className="font-mono text-xs">{r.gstin?.trim() || '—'}</span>
          ),
        },
        {
          id: 'phone',
          header: 'Phone',
          mobile: false,
          cell: (r) =>
            r.phone ? (
              <a
                href={`tel:${digitsOnly(r.phone)}`}
                className="font-mono text-xs text-primary hover:underline"
              >
                {r.phone}
              </a>
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            ),
        },
        {
          id: 'terms',
          header: 'Terms',
          mobile: false,
          cell: (r) => (
            <span className="text-xs text-muted-foreground">
              {termsLabel(r.paymentTermsDays) ?? '—'}
            </span>
          ),
        },
      ]}
      actions={(r) =>
        canWrite ? (
          <div className="flex items-center justify-end gap-1">
            <Link
              href="/purchases#new-purchase"
              className={buttonClassName({ variant: 'secondary', size: 'sm' })}
            >
              Purchase
            </Link>
            <DeleteButton action={() => deleteVendorAction(r.id)} />
          </div>
        ) : null
      }
    />
  );
}
