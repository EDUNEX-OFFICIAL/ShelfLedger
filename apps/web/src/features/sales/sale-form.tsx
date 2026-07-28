'use client';

import { useState, useTransition } from 'react';
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
import { createSaleAction } from '@/features/sales/actions';
import { cn } from '@/lib/utils';

type Option = { id: string; label: string };
type VariantOption = Option & { sellingPrice: number };

type Line = {
  variantId: string;
  qty: string;
  unitPrice: string;
  discountAmount: string;
  taxRateId: string;
};

const emptyLine = (): Line => ({
  variantId: '',
  qty: '1',
  unitPrice: '',
  discountAmount: '0',
  taxRateId: '',
});

const PAY_OPTIONS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'UPI', label: 'UPI' },
  { value: 'CARD', label: 'Card' },
  { value: 'OTHER', label: 'Other' },
] as const;

export function SaleForm({
  canWrite,
  canOverride,
  customers,
  variants,
  taxRates,
}: {
  canWrite: boolean;
  canOverride: boolean;
  customers: Option[];
  variants: VariantOption[];
  taxRates: Option[];
}) {
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? '');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [notes, setNotes] = useState('');
  const [billDiscount, setBillDiscount] = useState('0');
  const [stockOverride, setStockOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [payMethod, setPayMethod] = useState<'CASH' | 'UPI' | 'CARD' | 'OTHER'>('CASH');
  const [payAmount, setPayAmount] = useState('');
  const [payRef, setPayRef] = useState('');
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!canWrite) return null;

  return (
    <form
      className={cn('space-y-4', stickyFormPadClass)}
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        startTransition(async () => {
          const payments =
            payAmount && Number(payAmount) > 0
              ? [{ method: payMethod, amount: Number(payAmount), reference: payRef }]
              : [];
          const result = await createSaleAction({
            customerId,
            invoiceDate,
            notes,
            billDiscount: Number(billDiscount || 0),
            stockOverride: canOverride ? stockOverride : false,
            overrideReason: canOverride ? overrideReason : '',
            lines: lines.map((l) => ({
              variantId: l.variantId,
              qty: Number(l.qty),
              unitPrice: Number(l.unitPrice),
              discountAmount: Number(l.discountAmount || 0),
              taxRateId: l.taxRateId || null,
            })),
            payments,
          });
          if (!result.ok) {
            setMessage(result.error);
            return;
          }
          setMessage('ok');
          setNotes('');
          setBillDiscount('0');
          setStockOverride(false);
          setOverrideReason('');
          setPayAmount('');
          setPayRef('');
          setLines([emptyLine()]);
        });
      }}
    >
      <SurfaceCard padding="none" className="overflow-hidden">
        <div className="space-y-5 p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField id="sale-customer" label="Customer" required>
              <Select
                id="sale-customer"
                value={customerId}
                onValueChange={setCustomerId}
                placeholder="Select customer"
                required
                options={customers.map((c) => ({ value: c.id, label: c.label }))}
              />
            </FormField>
            <FormField id="sale-date" label="Invoice date">
              <Input
                id="sale-date"
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
            </FormField>
            <FormField id="sale-bill-disc" label="Bill discount (₹)">
              <Input
                id="sale-bill-disc"
                type="number"
                min="0"
                step="0.01"
                value={billDiscount}
                onChange={(e) => setBillDiscount(e.target.value)}
              />
            </FormField>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold tracking-tight text-foreground">Lines</h3>
                <p className="text-xs text-muted-foreground">Unit price excl. GST</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setLines((l) => [...l, emptyLine()])}
              >
                Add line
              </Button>
            </div>
            {lines.map((line, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-xl border border-border/70 bg-muted/30 p-3.5 lg:grid-cols-5"
              >
                <FormField
                  id={`sale-var-${index}`}
                  label="Variant"
                  required
                  className="lg:col-span-2"
                >
                  <Select
                    id={`sale-var-${index}`}
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
                    placeholder="Select SKU"
                    required
                    searchable
                    options={variants.map((v) => ({ value: v.id, label: v.label }))}
                  />
                </FormField>
                <FormField id={`sale-qty-${index}`} label="Qty" required>
                  <Input
                    id={`sale-qty-${index}`}
                    type="number"
                    min="0.001"
                    step="any"
                    value={line.qty}
                    onChange={(e) =>
                      setLines((rows) =>
                        rows.map((r, i) => (i === index ? { ...r, qty: e.target.value } : r)),
                      )
                    }
                    required
                  />
                </FormField>
                <FormField id={`sale-price-${index}`} label="Unit price" required>
                  <Input
                    id={`sale-price-${index}`}
                    type="number"
                    min="0"
                    step="0.01"
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
                </FormField>
                <FormField id={`sale-disc-${index}`} label="Line discount">
                  <Input
                    id={`sale-disc-${index}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.discountAmount}
                    onChange={(e) =>
                      setLines((rows) =>
                        rows.map((r, i) =>
                          i === index ? { ...r, discountAmount: e.target.value } : r,
                        ),
                      )
                    }
                  />
                </FormField>
                <FormField
                  id={`sale-tax-${index}`}
                  label="Tax rate"
                  className="lg:col-span-2"
                >
                  <Select
                    id={`sale-tax-${index}`}
                    value={line.taxRateId}
                    onValueChange={(taxRateId) =>
                      setLines((rows) =>
                        rows.map((r, i) => (i === index ? { ...r, taxRateId } : r)),
                      )
                    }
                    placeholder="Article default"
                    allowClear
                    clearLabel="Article default"
                    options={taxRates.map((t) => ({ value: t.id, label: t.label }))}
                  />
                </FormField>
              </div>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField id="sale-pay-method" label="Payment method">
              <Select
                id="sale-pay-method"
                value={payMethod}
                onValueChange={(v) => setPayMethod(v as typeof payMethod)}
                options={[...PAY_OPTIONS]}
              />
            </FormField>
            <FormField id="sale-pay-amt" label="Payment amount" hint="Leave empty to create unpaid draft">
              <Input
                id="sale-pay-amt"
                type="number"
                min="0"
                step="0.01"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="Optional"
              />
            </FormField>
            <FormField id="sale-pay-ref" label="Payment ref">
              <Input
                id="sale-pay-ref"
                value={payRef}
                onChange={(e) => setPayRef(e.target.value)}
              />
            </FormField>
          </div>

          {canOverride ? (
            <div className="space-y-2 rounded-xl border border-dashed border-border/80 bg-muted/20 p-3.5">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={stockOverride}
                  onChange={(e) => setStockOverride(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                Allow negative stock (manager override)
              </label>
              {stockOverride ? (
                <FormField id="sale-override" label="Override reason" required>
                  <Input
                    id="sale-override"
                    placeholder="Override reason"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    required
                  />
                </FormField>
              ) : null}
            </div>
          ) : null}

          <FormField id="sale-notes" label="Notes">
            <Textarea
              id="sale-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </FormField>

          {message === 'ok' ? (
            <p className="text-sm font-medium text-success" role="status">
              Draft saved.{' '}
              <a href="#all-sales" className="underline underline-offset-2 hover:text-success/90">
                Post it from All sales
              </a>{' '}
              to allocate an invoice and cut stock.
            </p>
          ) : message ? (
            <p className="text-sm text-destructive" role="alert">
              {message}
            </p>
          ) : null}
        </div>
      </SurfaceCard>

      <StickyFormActions>
        <Button
          type="submit"
          size="lg"
          disabled={pending}
          className="h-12 w-full text-base md:h-11 md:w-auto"
        >
          {pending ? 'Saving…' : 'Create draft sale'}
        </Button>
      </StickyFormActions>
    </form>
  );
}
