'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { SurfaceCard } from '@/components/shared/surface-card';
import { createExpenseAction, createExpenseCategoryAction } from '@/features/admin/actions';

type Option = { id: string; label: string };

const PAY_OPTIONS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'UPI', label: 'UPI' },
  { value: 'CARD', label: 'Card' },
  { value: 'OTHER', label: 'Other' },
] as const;

export function ExpenseForm({
  canWrite,
  categories,
}: {
  canWrite: boolean;
  categories: Option[];
}) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD' | 'OTHER'>('CASH');
  const [notes, setNotes] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!canWrite) return null;

  return (
    <div className="space-y-4">
      <SurfaceCard padding="sm">
        <form
          className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            setMessage(null);
            startTransition(async () => {
              const result = await createExpenseCategoryAction({ name: newCategory });
              if (!result.ok) {
                setMessage(result.error);
                return;
              }
              setMessage('Category created — refresh if it does not appear yet.');
              setNewCategory('');
            });
          }}
        >
          <div className="min-w-[12rem] flex-1 space-y-1">
            <Label htmlFor="exp-new-cat">New category</Label>
            <Input
              id="exp-new-cat"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="e.g. Rent, Utilities"
              required
            />
          </div>
          <Button type="submit" size="md" variant="secondary" disabled={pending}>
            Add category
          </Button>
        </form>
      </SurfaceCard>

      <SurfaceCard padding="none" className="overflow-hidden">
        <form
          className="space-y-5 p-5"
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
                setMessage(result.error);
                return;
              }
              setMessage('Expense saved');
              setAmount('');
              setNotes('');
            });
          }}
        >
          {categories.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border/80 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              Add a category above before recording an expense.
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <Label>Category</Label>
              <Select
                value={categoryId}
                onValueChange={setCategoryId}
                placeholder="Select"
                required
                options={categories.map((c) => ({ value: c.id, label: c.label }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Amount</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Date</Label>
              <Input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Payment</Label>
              <Select
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as typeof paymentMethod)}
                options={[...PAY_OPTIONS]}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
          <Button
            type="submit"
            size="lg"
            disabled={pending || categories.length === 0}
            className="w-full sm:w-auto"
          >
            {pending ? 'Saving…' : 'Add expense'}
          </Button>
        </form>
      </SurfaceCard>
    </div>
  );
}
