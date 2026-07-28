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

const PAY_LABEL: Record<string, string> = {
  CASH: 'Cash',
  UPI: 'UPI',
  CARD: 'Card',
  OTHER: 'Other',
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

function payLabel(method: string) {
  return PAY_LABEL[method] ?? method;
}

export function ExpensesList({
  rows,
  canWrite,
  categories,
}: {
  rows: ExpenseListRow[];
  canWrite: boolean;
  categories: string[];
}) {
  return (
    <FilteredDataList
      rows={rows}
      searchPlaceholder="Search category, notes, payment…"
      searchFn={(r, q) =>
        r.category.toLowerCase().includes(q) ||
        payLabel(r.paymentMethod).toLowerCase().includes(q) ||
        r.paymentMethod.toLowerCase().includes(q) ||
        formatExpenseDate(r.date).toLowerCase().includes(q) ||
        (r.notes ?? '').toLowerCase().includes(q)
      }
      filters={
        categories.length > 1
          ? [
              {
                id: 'category',
                label: 'Category',
                options: categories.map((c) => ({ value: c, label: c })),
                predicate: (r, v) => r.category === v,
              },
            ]
          : undefined
      }
      emptyTitle="No expenses in this period"
      emptyDescription="Log rent, utilities, and other shop costs — they do not affect inventory."
      emptyAction={
        canWrite ? (
          <a href="#new-expense" className={buttonClassName({ size: 'md' })}>
            Add expense
          </a>
        ) : undefined
      }
      mobileTitle={(r) => r.category}
      mobileMeta={(r) => {
        const note = r.notes?.trim();
        const base = `${formatExpenseDate(r.date)} · ${payLabel(r.paymentMethod)}`;
        return note ? `${base} · ${note}` : base;
      }}
      mobileTrailing={(r) => (
        <MoneyText value={r.amount} className="text-sm font-semibold" />
      )}
      columns={[
        {
          id: 'date',
          header: 'Date',
          mobile: false,
          cell: (r) => (
            <span className="text-xs text-muted-foreground">{formatExpenseDate(r.date)}</span>
          ),
        },
        {
          id: 'category',
          header: 'Category',
          mobile: false,
          cell: (r) => <span className="font-medium">{r.category}</span>,
        },
        {
          id: 'payment',
          header: 'Paid by',
          mobile: false,
          cell: (r) => <span className="text-xs">{payLabel(r.paymentMethod)}</span>,
        },
        {
          id: 'notes',
          header: 'Notes',
          mobile: false,
          cell: (r) => (
            <span className="line-clamp-1 text-xs text-muted-foreground">
              {r.notes?.trim() || '—'}
            </span>
          ),
        },
        {
          id: 'amount',
          header: 'Amount',
          mobile: false,
          className: 'text-right',
          cell: (r) => <MoneyText value={r.amount} />,
        },
      ]}
      actions={(r) => (canWrite ? <DeleteButton action={() => deleteExpenseAction(r.id)} /> : null)}
    />
  );
}
