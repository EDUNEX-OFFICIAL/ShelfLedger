import { Wallet } from 'lucide-react';
import { canManageExpenses } from '@shelfledger/db';
import { requireSession } from '@/server/auth/guards';
import { expenseService } from '@/server/services/expense';
import { PageHeader } from '@/components/shared/page-header';
import { SectionHeader } from '@/components/shared/section-header';
import { MoneyText } from '@/components/shared/money-text';
import { buttonClassName } from '@/components/ui/button';
import { ExpenseForm } from '@/features/expenses/expense-form';
import { ExpensesList } from '@/features/expenses/expenses-list';
import {
  ExpenseRangeFilter,
  type ExpenseRange,
} from '@/features/expenses/expense-range-filter';
import { ExpenseCategoryChart } from '@/features/reports/charts';

function rangeBounds(range: ExpenseRange): {
  from?: Date;
  to?: Date;
  label: string;
} {
  const now = new Date();
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999),
  );
  const startDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  if (range === 'all') {
    return { label: 'All time' };
  }
  if (range === 'today') {
    return { from: startDay, to: end, label: 'Today' };
  }
  if (range === '30d') {
    const from = new Date(startDay);
    from.setUTCDate(from.getUTCDate() - 29);
    return { from, to: end, label: 'Last 30 days' };
  }
  // month (default)
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return { from, to: end, label: 'This month' };
}

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const user = await requireSession();
  const canWrite = canManageExpenses(user.role);
  const params = await searchParams;
  const range: ExpenseRange =
    params.range === 'today' ||
    params.range === '30d' ||
    params.range === 'month' ||
    params.range === 'all'
      ? params.range
      : 'month';
  const bounds = rangeBounds(range);

  const [expenses, categories] = await Promise.all([
    expenseService.list(user, { from: bounds.from, to: bounds.to }),
    expenseService.listCategories(user),
  ]);

  let periodTotal = 0;
  const byCategoryMap = new Map<string, number>();
  for (const e of expenses) {
    const amt = Number(e.amount);
    periodTotal += amt;
    const name = e.category.name;
    byCategoryMap.set(name, Math.round(((byCategoryMap.get(name) ?? 0) + amt) * 100) / 100);
  }
  periodTotal = Math.round((periodTotal + Number.EPSILON) * 100) / 100;
  const byCategory = Array.from(byCategoryMap.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  const categoryNames = Array.from(
    new Set(expenses.map((e) => e.category.name)),
  ).sort((a, b) => a.localeCompare(b));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description="Shop costs only — rent, utilities, petty cash. Does not touch inventory."
        actions={
          <div className="flex w-full flex-col items-start gap-2 sm:w-auto sm:items-end">
            {canWrite ? (
              <a href="#new-expense" className={buttonClassName({ size: 'lg' })}>
                <Wallet className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                Add expense
              </a>
            ) : null}
            <ExpenseRangeFilter range={range} />
          </div>
        }
      />

      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{bounds.label}</span>
        {' · '}
        <MoneyText value={periodTotal} className="font-semibold text-foreground" />
        {expenses.length > 0
          ? ` · ${expenses.length} entr${expenses.length === 1 ? 'y' : 'ies'}`
          : null}
      </p>

      {canWrite ? (
        <section id="new-expense" className="scroll-mt-24 space-y-3">
          <SectionHeader
            title="Log expense"
            description="Amount first — date defaults to today. Categories are managed below the form."
          />
          <ExpenseForm
            canWrite={canWrite}
            categories={categories.map((c) => ({ id: c.id, label: c.name }))}
          />
        </section>
      ) : null}

      <section id="all-expenses" className="scroll-mt-24 space-y-3">
        <SectionHeader
          title="Expenses"
          description={`${bounds.label} — search, filter by category, soft-delete mistakes.`}
        />
        <ExpensesList
          canWrite={canWrite}
          categories={categoryNames}
          rows={expenses.map((e) => ({
            id: e.id,
            date: e.expenseDate.toISOString().slice(0, 10),
            category: e.category.name,
            paymentMethod: e.paymentMethod,
            amount: Number(e.amount),
            notes: e.notes,
          }))}
        />
      </section>

      {byCategory.length > 0 ? (
        <section className="space-y-3">
          <SectionHeader
            title="By category"
            description={`Spend mix · ${bounds.label}`}
          />
          <div className="max-w-xl">
            <ExpenseCategoryChart data={byCategory} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
