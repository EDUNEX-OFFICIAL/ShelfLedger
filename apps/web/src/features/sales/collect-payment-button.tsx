'use client';

import { useEffect, useId, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Banknote, CreditCard, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatInr } from '@/components/shared/money-text';
import { addSalePaymentAction } from '@/features/sales/actions';
import { cn } from '@/lib/utils';

const PAY_OPTIONS = [
  { value: 'CASH' as const, label: 'Cash', Icon: Banknote },
  { value: 'UPI' as const, label: 'UPI', Icon: Smartphone },
  { value: 'CARD' as const, label: 'Card', Icon: CreditCard },
];

export function CollectPaymentButton({
  saleId,
  invoiceLabel,
  customerName,
  dueAmount,
}: {
  saleId: string;
  invoiceLabel: string;
  customerName: string;
  dueAmount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<'CASH' | 'UPI' | 'CARD'>('CASH');
  const [amount, setAmount] = useState(String(dueAmount));
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    setAmount(String(dueAmount));
    setMessage(null);
    setMethod('CASH');
  }, [open, dueAmount]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (dueAmount <= 0.001) return null;

  return (
    <>
      <Button
        type="button"
        size="sm"
        className="min-h-11 px-3"
        onClick={() => setOpen(true)}
      >
        Collect
      </Button>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-foreground/40 sm:items-center sm:justify-center sm:p-4"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="w-full rounded-t-2xl border border-border/80 bg-card p-4 shadow-md sm:max-w-md sm:rounded-xl sm:p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id={titleId} className="text-base font-semibold tracking-tight">
              Collect payment
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="font-mono text-foreground">{invoiceLabel}</span>
              {' · '}
              {customerName}
            </p>
            <p className="mt-2 text-sm">
              Due{' '}
              <span className="font-mono text-base font-semibold tabular-nums">
                {formatInr(dueAmount)}
              </span>
            </p>

            <div className="mt-4 space-y-2">
              <Label>Method</Label>
              <div className="grid grid-cols-3 gap-2">
                {PAY_OPTIONS.map((opt) => {
                  const selected = method === opt.value;
                  const Icon = opt.Icon;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setMethod(opt.value)}
                      className={cn(
                        'flex h-12 items-center justify-center gap-1.5 rounded-lg border text-sm font-semibold transition',
                        selected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border/80 bg-card text-muted-foreground hover:bg-muted',
                      )}
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor={`pay-${saleId}`}>Amount (₹)</Label>
                <button
                  type="button"
                  className="text-xs font-semibold text-primary"
                  onClick={() => setAmount(String(dueAmount))}
                >
                  Full due
                </button>
              </div>
              <Input
                id={`pay-${saleId}`}
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                className="h-12 font-mono text-base tabular-nums"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            {message ? (
              <p className="mt-3 text-sm text-destructive" role="alert">
                {message}
              </p>
            ) : null}

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                className="h-12 w-full sm:w-auto"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="lg"
                className="h-12 w-full sm:w-auto"
                disabled={pending}
                onClick={() => {
                  setMessage(null);
                  const n = Number(amount);
                  if (!(n > 0)) {
                    setMessage('Enter an amount');
                    return;
                  }
                  startTransition(async () => {
                    const result = await addSalePaymentAction({
                      saleId,
                      method,
                      amount: n,
                      reference: '',
                    });
                    if (!result.ok) {
                      setMessage(result.error);
                      return;
                    }
                    setOpen(false);
                    router.refresh();
                  });
                }}
              >
                {pending ? 'Saving…' : 'Collect'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
