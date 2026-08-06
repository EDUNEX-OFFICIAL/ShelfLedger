'use client';

import { FilteredDataList } from '@/components/shared/filtered-data-list';
import { DeleteButton } from '@/components/shared/delete-button';
import { deleteTaxRateAction } from '@/features/admin/actions';

export type TaxRateRow = {
  id: string;
  name: string;
  totalRate: number;
  cgstRate: number;
  sgstRate: number;
};

export function TaxRatesList({
  rows,
  canWrite,
}: {
  rows: TaxRateRow[];
  canWrite: boolean;
}) {
  return (
    <FilteredDataList
      rows={rows}
      searchPlaceholder="Search tax rate…"
      searchFn={(r, q) => r.name.toLowerCase().includes(q)}
      emptyTitle="No tax rates yet"
      emptyDescription="Add CGST+SGST rates (e.g. 5%, 12%, 18%) for articles and sale lines."
      mobileTitle={(r) => r.name}
      mobileMeta={(r) => `CGST ${r.cgstRate}% · SGST ${r.sgstRate}%`}
      mobileAmount={(r) => (
        <span className="font-mono text-base font-semibold tabular-nums">{r.totalRate}%</span>
      )}
      mobileHint={() => 'total GST'}
      columns={[
        {
          id: 'name',
          header: 'Name',
          mobile: false,
          cell: (r) => <span className="font-medium">{r.name}</span>,
        },
        {
          id: 'total',
          header: 'Total',
          mobile: false,
          cell: (r) => (
            <span className="font-mono text-sm tabular-nums">{r.totalRate}%</span>
          ),
        },
        {
          id: 'cgst',
          header: 'CGST',
          mobile: false,
          cell: (r) => (
            <span className="font-mono text-sm tabular-nums text-muted-foreground">
              {r.cgstRate}%
            </span>
          ),
        },
        {
          id: 'sgst',
          header: 'SGST',
          mobile: false,
          cell: (r) => (
            <span className="font-mono text-sm tabular-nums text-muted-foreground">
              {r.sgstRate}%
            </span>
          ),
        },
      ]}
      actions={(r) =>
        canWrite ? <DeleteButton action={() => deleteTaxRateAction(r.id)} /> : null
      }
    />
  );
}
