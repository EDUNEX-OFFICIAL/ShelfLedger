'use client';

import { useMemo, useState, useTransition } from 'react';
import { computeLineTax, computeRoundOff, distributeBillDiscount, roundMoney } from '@shelfledger/domain';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  AsyncSkuCombobox,
  type AsyncSkuHit,
} from '@/components/ui/async-sku-combobox';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/shared/form-field';
import { MoneyText } from '@/components/shared/money-text';
import { SurfaceCard } from '@/components/shared/surface-card';
import {
  StickyFormActions,
  stickyFormPadClass,
} from '@/components/shared/sticky-form-actions';
import { createSaleAction } from '@/features/sales/actions';
import { cn } from '@/lib/utils';

type Option = { id: string; label: string };
type VariantOption = AsyncSkuHit;
type TaxOption = Option & { cgstRate: number; sgstRate: number };

function mergeCatalog(
  prev: Map<string, VariantOption>,
  hits: VariantOption[],
): Map<string, VariantOption> {
  if (hits.length === 0) return prev;
  const next = new Map(prev);
  for (const h of hits) next.set(h.id, h);
  return next;
}

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

function estimateDraftTotal(
  lines: Line[],
  catalog: Map<string, VariantOption>,
  taxRates: TaxOption[],
  billDiscount: number,
) {
  const prepared: Array<{ gross: number; cgstRate: number; sgstRate: number }> = [];
  for (const line of lines) {
    if (!line.variantId) continue;
    const v = catalog.get(line.variantId);
    if (!v) continue;
    const qty = Number(line.qty) || 0;
    const unitPrice = Number(line.unitPrice) || 0;
    const lineDisc = Number(line.discountAmount) || 0;
    if (!(qty > 0)) continue;
    const gross = roundMoney(qty * unitPrice - lineDisc);
    if (gross < 0) continue;
    const tax = line.taxRateId ? taxRates.find((t) => t.id === line.taxRateId) : null;
    prepared.push({
      gross,
      cgstRate: tax ? tax.cgstRate : v.cgstRate,
      sgstRate: tax ? tax.sgstRate : v.sgstRate,
    });
  }
  const shares = distributeBillDiscount(
    prepared.map((p) => p.gross),
    billDiscount,
  );
  let subtotal = 0;
  let taxAmt = 0;
  for (let i = 0; i < prepared.length; i++) {
    const row = prepared[i]!;
    const taxable = roundMoney(row.gross - (shares[i] ?? 0));
    if (taxable < 0) continue;
    const tax = computeLineTax({
      taxableAmount: taxable,
      cgstRate: row.cgstRate,
      sgstRate: row.sgstRate,
    });
    subtotal = roundMoney(subtotal + taxable);
    taxAmt = roundMoney(taxAmt + tax.taxAmount);
  }
  const beforeRound = roundMoney(subtotal + taxAmt);
  const roundOff = computeRoundOff(beforeRound);
  return {
    subtotal,
    tax: taxAmt,
    roundOff,
    total: roundMoney(beforeRound + roundOff),
  };
}

export function SaleForm({
  canWrite,
  canOverride,
  customers,
  taxRates,
}: {
  canWrite: boolean;
  canOverride: boolean;
  customers: Option[];
  taxRates: TaxOption[];
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
  const [showTaxRates, setShowTaxRates] = useState(false);
  const [catalog, setCatalog] = useState<Map<string, VariantOption>>(() => new Map());
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const mergeHits = (hits: VariantOption[]) => {
    setCatalog((prev) => mergeCatalog(prev, hits));
  };

  const totals = useMemo(
    () => estimateDraftTotal(lines, catalog, taxRates, Number(billDiscount) || 0),
    [lines, catalog, taxRates, billDiscount],
  );

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
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                  onClick={() => setShowTaxRates((v) => !v)}
                  aria-expanded={showTaxRates}
                >
                  {showTaxRates ? 'Hide tax' : 'Tax override'}
                </button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setLines((l) => [...l, emptyLine()])}
                >
                  Add line
                </Button>
              </div>
            </div>
            {lines.map((line, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-xl border border-border/70 bg-muted/30 p-3.5 lg:grid-cols-5"
              >
                <FormField
                  id={`sale-var-${index}`}
                  label="Size & colour"
                  required
                  className="lg:col-span-2"
                >
                  <AsyncSkuCombobox
                    id={`sale-var-${index}`}
                    value={line.variantId}
                    selectedLabel={catalog.get(line.variantId)?.label ?? null}
                    onHits={mergeHits}
                    onValueChange={(id, hit) => {
                      if (hit) setCatalog((prev) => mergeCatalog(prev, [hit]));
                      const v = hit ?? catalog.get(id);
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
                    placeholder="Search item…"
                    required
                  />
                </FormField>
                <FormField id={`sale-qty-${index}`} label="Qty" required>
                  <Input
                    id={`sale-qty-${index}`}
                    type="number"
                    min="0.001"
                    step="any"
                    inputMode="decimal"
                    className="font-mono tabular-nums"
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
                    inputMode="decimal"
                    className="font-mono tabular-nums"
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
                {showTaxRates ? (
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
                ) : null}
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border/70 bg-muted/20 px-3.5 py-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex justify-between gap-6">
                  <span>Taxable</span>
                  <MoneyText value={totals.subtotal} />
                </div>
                <div className="flex justify-between gap-6">
                  <span>GST</span>
                  <MoneyText value={totals.tax} />
                </div>
                {totals.roundOff !== 0 ? (
                  <div className="flex justify-between gap-6">
                    <span>Round off</span>
                    <MoneyText value={totals.roundOff} />
                  </div>
                ) : null}
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-muted-foreground">Total</p>
                <MoneyText
                  value={totals.total}
                  className="text-xl font-semibold tracking-tight text-foreground"
                />
              </div>
            </div>
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
            <FormField
              id="sale-pay-amt"
              label="Payment amount"
              hint="Leave empty for unpaid draft"
            >
              <div className="flex gap-2">
                <Input
                  id="sale-pay-amt"
                  type="number"
                  min="0"
                  step="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="Optional"
                />
                <Button
                  type="button"
                  size="md"
                  variant="secondary"
                  className="shrink-0"
                  disabled={!(totals.total > 0)}
                  onClick={() => setPayAmount(String(totals.total))}
                >
                  Pay full
                </Button>
              </div>
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
