'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { computeLineTax, computeRoundOff, roundMoney } from '@shelfledger/domain';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { SurfaceCard } from '@/components/shared/surface-card';
import { MoneyText } from '@/components/shared/money-text';
import {
  StickyFormActions,
  stickyFormPadClass,
} from '@/components/shared/sticky-form-actions';
import { createAndPostQuickSaleAction } from '@/features/sales/actions';
import { cn } from '@/lib/utils';

type VariantOption = {
  id: string;
  label: string;
  sellingPrice: number;
  cgstRate: number;
  sgstRate: number;
};

type Line = {
  variantId: string;
  qty: string;
  unitPrice: string;
};

const PAY_OPTIONS = [
  { value: 'CASH' as const, label: 'Cash' },
  { value: 'UPI' as const, label: 'UPI' },
  { value: 'CARD' as const, label: 'Card' },
];

const emptyLine = (): Line => ({
  variantId: '',
  qty: '1',
  unitPrice: '',
});

function estimateTotal(
  lines: Line[],
  variants: VariantOption[],
): { subtotal: number; tax: number; roundOff: number; total: number } {
  let subtotal = 0;
  let tax = 0;
  for (const line of lines) {
    if (!line.variantId) continue;
    const v = variants.find((x) => x.id === line.variantId);
    if (!v) continue;
    const qty = Number(line.qty) || 0;
    const unitPrice = Number(line.unitPrice) || 0;
    if (qty <= 0) continue;
    const taxable = roundMoney(qty * unitPrice);
    const lineTax = computeLineTax({
      taxableAmount: taxable,
      cgstRate: v.cgstRate,
      sgstRate: v.sgstRate,
    });
    subtotal = roundMoney(subtotal + taxable);
    tax = roundMoney(tax + lineTax.taxAmount);
  }
  const beforeRound = roundMoney(subtotal + tax);
  const roundOff = computeRoundOff(beforeRound);
  return {
    subtotal,
    tax,
    roundOff,
    total: roundMoney(beforeRound + roundOff),
  };
}

export function QuickSaleForm({
  canWrite,
  variants,
}: {
  canWrite: boolean;
  variants: VariantOption[];
}) {
  const router = useRouter();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [payMethod, setPayMethod] = useState<'CASH' | 'UPI' | 'CARD'>('CASH');
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const totals = useMemo(() => estimateTotal(lines, variants), [lines, variants]);
  const readyLines = lines.filter(
    (l) => l.variantId && Number(l.qty) > 0 && Number(l.unitPrice) >= 0,
  );

  if (!canWrite) {
    return (
      <SurfaceCard padding="md">
        <p className="text-sm text-muted-foreground">Your role cannot punch sales.</p>
      </SurfaceCard>
    );
  }

  return (
    <form
      className={cn('space-y-4', stickyFormPadClass)}
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        if (!customerName.trim()) {
          setMessage('Customer name is required.');
          return;
        }
        if (!customerPhone.trim()) {
          setMessage('Mobile number is required.');
          return;
        }
        if (readyLines.length === 0) {
          setMessage('Add at least one SKU.');
          return;
        }
        startTransition(async () => {
          const result = await createAndPostQuickSaleAction({
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim(),
            payMethod,
            lines: readyLines.map((l) => ({
              variantId: l.variantId,
              qty: Number(l.qty),
              unitPrice: Number(l.unitPrice),
              discountAmount: 0,
              taxRateId: null,
            })),
          });
          if (!result.ok) {
            setMessage(result.error);
            return;
          }
          setCustomerName('');
          setCustomerPhone('');
          setLines([emptyLine()]);
          router.push(`/sales/${result.data.id}/invoice`);
        });
      }}
    >
      <SurfaceCard padding="md" className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-foreground">Customer</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Name &amp; mobile save to your customer list for offers and WhatsApp.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="qs-name">Name</Label>
            <Input
              id="qs-name"
              className="h-11"
              autoComplete="name"
              placeholder="Customer name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="qs-phone">Mobile</Label>
            <Input
              id="qs-phone"
              type="tel"
              inputMode="tel"
              className="h-11"
              autoComplete="tel"
              placeholder="10-digit mobile"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              required
            />
          </div>
        </div>
      </SurfaceCard>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-foreground">Items</h3>
            <p className="text-xs text-muted-foreground">Price excl. GST</p>
          </div>
          <Button type="button" size="sm" variant="secondary" onClick={() => setLines((rows) => [...rows, emptyLine()])}>
            Add line
          </Button>
        </div>

        {lines.map((line, index) => (
          <SurfaceCard key={index} padding="sm" className="space-y-3">
            <div className="space-y-1">
              <Label>SKU</Label>
              <Select
                value={line.variantId}
                onValueChange={(id) => {
                  const v = variants.find((x) => x.id === id);
                  setLines((rows) =>
                    rows.map((r, i) =>
                      i === index
                        ? {
                            ...r,
                            variantId: id,
                            unitPrice: v ? String(v.sellingPrice) : r.unitPrice,
                          }
                        : r,
                    ),
                  );
                }}
                placeholder="Search SKU…"
                required
                searchable
                options={variants.map((v) => ({ value: v.id, label: v.label }))}
              />
            </div>

            <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
              <div className="space-y-1">
                <Label>Qty</Label>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="lg"
                    variant="secondary"
                    className="w-11 shrink-0 px-0"
                    aria-label="Decrease qty"
                    onClick={() =>
                      setLines((rows) =>
                        rows.map((r, i) => {
                          if (i !== index) return r;
                          const next = Math.max(1, (Number(r.qty) || 1) - 1);
                          return { ...r, qty: String(next) };
                        }),
                      )
                    }
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    className="h-11 text-center"
                    value={line.qty}
                    onChange={(e) =>
                      setLines((rows) =>
                        rows.map((r, i) => (i === index ? { ...r, qty: e.target.value } : r)),
                      )
                    }
                    required
                  />
                  <Button
                    type="button"
                    size="lg"
                    variant="secondary"
                    className="w-11 shrink-0 px-0"
                    aria-label="Increase qty"
                    onClick={() =>
                      setLines((rows) =>
                        rows.map((r, i) => {
                          if (i !== index) return r;
                          const next = (Number(r.qty) || 0) + 1;
                          return { ...r, qty: String(next) };
                        }),
                      )
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Price</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  className="h-11"
                  value={line.unitPrice}
                  onChange={(e) =>
                    setLines((rows) =>
                      rows.map((r, i) =>
                        i === index ? { ...r, unitPrice: e.target.value } : r,
                      ),
                    )
                  }
                  required
                />
              </div>
              {lines.length > 1 ? (
                <Button
                  type="button"
                  size="lg"
                  variant="ghost"
                  className="w-11 shrink-0 px-0 text-destructive hover:text-destructive"
                  aria-label="Remove line"
                  onClick={() => setLines((rows) => rows.filter((_, i) => i !== index))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : (
                <span className="w-11" aria-hidden />
              )}
            </div>
          </SurfaceCard>
        ))}
      </div>

      <div className="space-y-2">
        <Label>Payment</Label>
        <div className="grid grid-cols-3 gap-2">
          {PAY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={cn(
                'flex h-11 items-center justify-center rounded-lg border text-sm font-medium transition',
                payMethod === opt.value
                  ? 'border-primary bg-accent text-accent-foreground shadow-sm'
                  : 'border-border/80 bg-card text-muted-foreground hover:bg-muted',
              )}
              onClick={() => setPayMethod(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <SurfaceCard padding="sm" className="space-y-1.5">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Taxable</span>
          <MoneyText value={totals.subtotal} />
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>GST</span>
          <MoneyText value={totals.tax} />
        </div>
        {totals.roundOff !== 0 ? (
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Round off</span>
            <MoneyText value={totals.roundOff} />
          </div>
        ) : null}
        <div className="flex justify-between border-t border-border/80 pt-2 text-base font-semibold text-foreground">
          <span>Total</span>
          <MoneyText value={totals.total} className="text-base font-semibold" />
        </div>
      </SurfaceCard>

      {message ? <p className="text-sm text-destructive">{message}</p> : null}

      <StickyFormActions contentClassName="max-w-lg md:max-w-none">
        <Button
          type="submit"
          size="lg"
          disabled={pending || readyLines.length === 0}
          className="h-12 w-full text-base"
        >
          {pending ? (
            'Punching…'
          ) : (
            <>
              Punch sale · <MoneyText value={totals.total} className="font-semibold" />
            </>
          )}
        </Button>
      </StickyFormActions>
    </form>
  );
}
