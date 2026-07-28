'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/shared/form-field';
import { SurfaceCard } from '@/components/shared/surface-card';
import {
  StickyFormActions,
  stickyFormPadClass,
} from '@/components/shared/sticky-form-actions';
import { createExpenseAction, createExpenseCategoryAction } from '@/features/admin/actions';
import { cn } from '@/lib/utils';

type Option = { id: string; label: string };

const PAY_OPTIONS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'UPI', label: 'UPI' },
  { value: 'CARD', label: 'Card' },
  { value: 'OTHER', label: 'Other' },
] as const;

function todayIsoUtc() {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()))
    .toISOString()
    .slice(0, 10);
}

export function ExpenseForm({
  canWrite,
  categories: initialCategories,
}: {
  canWrite: boolean;
  categories: Option[];
}) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [categoryId, setCategoryId] = useState(initialCategories[0]?.id ?? '');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(todayIsoUtc);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD' | 'OTHER'>('CASH');
  const [notes, setNotes] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [categoryOpen, setCategoryOpen] = useState(initialCategories.length === 0);
  const [message, setMessage] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);
  const [catMessage, setCatMessage] = useState<{ tone: 'ok' | 'err'; text: string } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setCategories(initialCategories);
    if (initialCategories.length === 0) {
      setCategoryOpen(true);
      return;
    }
    if (!initialCategories.some((c) => c.id === categoryId)) {
      setCategoryId(initialCategories[0]!.id);
    }
  }, [initialCategories, categoryId]);

  if (!canWrite) return null;

  return (
    <div className="space-y-4">
      <form
        className={cn('space-y-4', stickyFormPadClass)}
        onSubmit={(e) => {
          e.preventDefault();
          setMessage(null);
          startTransition(async () => {
            const result = await createExpenseAction({
              categoryId,
              amount: Number(amount),
              expenseDate,
              paymentMethod,
              notes,
            });
            if (!result.ok) {
              setMessage({ tone: 'err', text: result.error });
              return;
            }
            setMessage({ tone: 'ok', text: 'Expense saved' });
            setAmount('');
            setNotes('');
            setExpenseDate(todayIsoUtc());
            router.refresh();
          });
        }}
      >
        <SurfaceCard padding="none" className="overflow-hidden">
          <div className="space-y-5 p-5">
            {categories.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border/80 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                Add a category below before recording an expense.
              </p>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <FormField id="exp-category" label="Category" required>
                <Select
                  id="exp-category"
                  value={categoryId}
                  onValueChange={setCategoryId}
                  placeholder="Select"
                  required
                  options={categories.map((c) => ({ value: c.id, label: c.label }))}
                />
              </FormField>
              <FormField id="exp-amount" label="Amount (₹)" required>
                <Input
                  id="exp-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  autoFocus
                />
              </FormField>
              <FormField id="exp-date" label="Date" required>
                <Input
                  id="exp-date"
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  required
                />
              </FormField>
              <FormField id="exp-pay" label="Paid by">
                <Select
                  id="exp-pay"
                  value={paymentMethod}
                  onValueChange={(v) => setPaymentMethod(v as typeof paymentMethod)}
                  options={[...PAY_OPTIONS]}
                />
              </FormField>
            </div>

            <FormField id="exp-notes" label="Notes" hint="Optional">
              <Textarea
                id="exp-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="e.g. Shop rent March"
              />
            </FormField>

            {message ? (
              <p
                className={
                  message.tone === 'ok'
                    ? 'text-sm font-medium text-success'
                    : 'text-sm text-destructive'
                }
                role={message.tone === 'ok' ? 'status' : 'alert'}
              >
                {message.text}
              </p>
            ) : null}
          </div>
        </SurfaceCard>

        <StickyFormActions>
          <Button
            type="submit"
            size="lg"
            disabled={pending || categories.length === 0}
            className="h-12 w-full text-base md:h-11 md:w-auto"
          >
            {pending ? 'Saving…' : 'Add expense'}
          </Button>
        </StickyFormActions>
      </form>

      <div className="rounded-xl border border-border/70 bg-card/70">
        <button
          type="button"
          aria-expanded={categoryOpen}
          onClick={() => setCategoryOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm"
        >
          <span className="font-medium text-foreground">Manage categories</span>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground transition',
              categoryOpen && 'rotate-180',
            )}
            strokeWidth={1.75}
            aria-hidden
          />
        </button>
        {categoryOpen ? (
          <form
            className="flex flex-col gap-3 border-t border-border/70 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              setCatMessage(null);
              startTransition(async () => {
                const result = await createExpenseCategoryAction({ name: newCategory });
                if (!result.ok) {
                  setCatMessage({ tone: 'err', text: result.error });
                  return;
                }
                const id = result.data.id;
                const label = newCategory.trim();
                setCategories((prev) =>
                  prev.some((c) => c.id === id)
                    ? prev
                    : [...prev, { id, label }].sort((a, b) => a.label.localeCompare(b.label)),
                );
                setCategoryId(id);
                setNewCategory('');
                setCatMessage({ tone: 'ok', text: `Category “${label}” added` });
                router.refresh();
              });
            }}
          >
            <FormField id="exp-new-cat" label="New category" className="min-w-[12rem] flex-1">
              <Input
                id="exp-new-cat"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="e.g. Rent, Utilities"
                required
              />
            </FormField>
            <Button type="submit" size="md" variant="secondary" disabled={pending}>
              Add category
            </Button>
            {catMessage ? (
              <p
                className={
                  catMessage.tone === 'ok'
                    ? 'w-full text-sm font-medium text-success'
                    : 'w-full text-sm text-destructive'
                }
                role={catMessage.tone === 'ok' ? 'status' : 'alert'}
              >
                {catMessage.text}
              </p>
            ) : null}
          </form>
        ) : null}
      </div>
    </div>
  );
}
