'use client';

import { FilteredDataList } from '@/components/shared/filtered-data-list';
import { DeleteButton } from '@/components/shared/delete-button';
import { MoneyText } from '@/components/shared/money-text';
import { buttonClassName } from '@/components/ui/button';
import { deleteExpenseAction } from '@/features/admin/actions';

export type ExpenseListRow = {
  id: string;
  date: string;
  category: string;
  paymentMethod: string;
  amount: number;
  notes: string | null;
};

function formatExpenseDate(iso: string) {
  const d = new Date(`${iso}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function ExpensesList({ rows, canWrite }: { rows: ExpenseListRow[]; canWrite: boolean }) {
  return (
    <FilteredDataList
      rows={rows}
      searchPlaceholder="Search category, notes, payment…"
      searchFn={(r, q) =>
        r.category.toLowerCase().includes(q) ||
        r.paymentMethod.toLowerCase().includes(q) ||
        (r.notes ?? '').toLowerCase().includes(q)
      }
      emptyTitle="No expenses yet"
      emptyDescription="Log rent, utilities, and other shop costs here."
      emptyAction={
        canWrite ? (
          <a href="#new-expense" className={buttonClassName({ size: 'md' })}>
            Add expense
          </a>
        ) : undefined
      }
      mobileTitle={(r) => r.category}
      mobileMeta={(r) => `${formatExpenseDate(r.date)} · ${r.paymentMethod}`}
      columns={[
        {
          id: 'date',
          header: 'Date',
          cell: (r) => (
            <span className="text-xs text-muted-foreground">{formatExpenseDate(r.date)}</span>
          ),
        },
        {
          id: 'category',
          header: 'Category',
          cell: (r) => <span className="font-medium">{r.category}</span>,
        },
        {
          id: 'payment',
          header: 'Payment',
          cell: (r) => <span className="font-mono text-xs">{r.paymentMethod}</span>,
        },
        {
          id: 'amount',
          header: 'Amount',
          className: 'text-right',
          cell: (r) => <MoneyText value={r.amount} />,
        },
      ]}
      actions={(r) => (canWrite ? <DeleteButton action={() => deleteExpenseAction(r.id)} /> : null)}
    />
  );
}
