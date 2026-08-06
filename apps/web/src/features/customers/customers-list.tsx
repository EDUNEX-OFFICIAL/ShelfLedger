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

function digitsOnly(phone: string) {
  return phone.replace(/\D/g, '');
}

function waHref(phone: string) {
  let d = digitsOnly(phone);
  if (d.length === 10) d = `91${d}`;
  if (d.length < 10) return null;
  return `https://wa.me/${d}`;
}

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
      searchPlaceholder="Search name or phone…"
      searchFn={(r, q) => {
        const phone = (r.phone ?? '').toLowerCase();
        const digits = digitsOnly(r.phone ?? '');
        return (
          r.name.toLowerCase().includes(q) ||
          phone.includes(q) ||
          digits.includes(q.replace(/\D/g, '')) ||
          (r.gstin ?? '').toLowerCase().includes(q)
        );
      }}
      filters={[
        {
          id: 'type',
          label: 'Type',
          options: [
            { value: 'named', label: 'Named' },
            { value: 'walkin', label: 'Walk-in' },
          ],
          predicate: (r, v) => (v === 'walkin' ? r.isWalkIn : !r.isWalkIn),
        },
      ]}
      emptyTitle="No customers yet"
      emptyDescription="Add named buyers for invoices and WhatsApp. Walk-in is seeded for counter sales."
      emptyAction={
        canWrite ? (
          <a href="#new-customer" className={buttonClassName({ size: 'md' })}>
            Add customer
          </a>
        ) : undefined
      }
      mobileTitle={(r) => r.name}
      mobileMeta={(r) => (r.gstin ? `GSTIN ${r.gstin}` : r.isWalkIn ? 'Default counter customer' : null)}
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
      mobileStatus={(r) =>
        r.isWalkIn ? (
          <Badge variant="muted" className="text-[10px]">
            Walk-in
          </Badge>
        ) : null
      }
      columns={[
        {
          id: 'name',
          header: 'Name',
          mobile: false,
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
          mobile: false,
          cell: (r) =>
            r.phone ? (
              <a href={`tel:${digitsOnly(r.phone)}`} className="font-mono text-xs text-primary hover:underline">
                {r.phone}
              </a>
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            ),
        },
        {
          id: 'gstin',
          header: 'GSTIN',
          mobile: false,
          cell: (r) => (
            <span className="font-mono text-xs text-muted-foreground">{r.gstin ?? '—'}</span>
          ),
        },
      ]}
      actions={(r) => (
        <div className="flex items-center justify-end gap-1">
          {r.phone && waHref(r.phone) ? (
            <a
              href={waHref(r.phone)!}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClassName({ variant: 'secondary', size: 'sm' })}
            >
              WhatsApp
            </a>
          ) : null}
          {canDelete && !r.isWalkIn ? (
            <DeleteButton action={() => deleteCustomerAction(r.id)} />
          ) : null}
        </div>
      )}
    />
  );
}
