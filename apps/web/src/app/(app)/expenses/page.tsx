import { Wallet } from 'lucide-react';
import { canManageExpenses } from '@shelfledger/db';
import { requireSession } from '@/server/auth/guards';
import { expenseService } from '@/server/services/expense';
import { PageHeader } from '@/components/shared/page-header';
import { SectionHeader } from '@/components/shared/section-header';
import { buttonClassName } from '@/components/ui/button';
import { ExpenseForm } from '@/features/expenses/expense-form';
import { ExpensesList } from '@/features/expenses/expenses-list';
import { ExpenseCategoryChart } from '@/features/reports/charts';

export default async function ExpensesPage() {
  const user = await requireSession();
  const canWrite = canManageExpenses(user.role);
  const [expenses, categories] = await Promise.all([
    expenseService.list(user),
    expenseService.listCategories(user),
  ]);

  const byCategoryMap = new Map<string, number>();
  for (const e of expenses) {
    const name = e.category.name;
    byCategoryMap.set(
      name,
      Math.round(((byCategoryMap.get(name) ?? 0) + Number(e.amount)) * 100) / 100,
    );
  }
  const byCategory = Array.from(byCategoryMap.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description="Shop expenses — do not affect inventory. Soft-delete only."
        actions={
          canWrite ? (
            <a href="#new-expense" className={buttonClassName({ size: 'lg' })}>
              <Wallet className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              Add expense
            </a>
          ) : null
        }
      />

      {canWrite ? (
        <section id="new-expense" className="scroll-mt-24 space-y-3">
          <SectionHeader
            title="Record expense"
            description="Add a category if needed, then log amount and payment method."
          />
          <ExpenseForm
            canWrite={canWrite}
            categories={categories.map((c) => ({ id: c.id, label: c.name }))}
          />
        </section>
      ) : null}

      {byCategory.length > 0 ? (
        <section className="space-y-3">
          <SectionHeader
            title="By category"
            description="Totals across all recorded expenses."
          />
          <div className="max-w-xl">
            <ExpenseCategoryChart data={byCategory} />
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <SectionHeader title="All expenses" description="Search and soft-delete entries." />
        <ExpensesList
          canWrite={canWrite}
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
    </div>
  );
}
