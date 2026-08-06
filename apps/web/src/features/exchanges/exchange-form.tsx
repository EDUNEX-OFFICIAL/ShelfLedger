'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { computeLineTax, roundMoney } from '@shelfledger/domain';
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
import { createExchangeAction } from '@/features/sales/actions';
import { cn } from '@/lib/utils';

type Option = { id: string; label: string };
type VariantOption = AsyncSkuHit;
type SaleOption = {
  id: string;
  label: string;
  customerId: string;
  lines: Array<{
    id: string;
    label: string;
    qty: number;
    unitPrice: number;
    cgstRate: number;
    sgstRate: number;
  }>;
};

type ReturnRow = { originalSaleLineId: string; checked: boolean; qty: string };
type ReplaceLine = { variantId: string; qty: string; unitPrice: string; taxRateId: string };

function rowsFromSaleLines(saleLines: SaleOption['lines']): ReturnRow[] {
  return saleLines.map((l, i) => ({
    originalSaleLineId: l.id,
    checked: i === 0,
    qty: '1',
  }));
}

function lineTotalInclTax(qty: number, unitPrice: number, cgstRate: number, sgstRate: number) {
  if (!(qty > 0)) return 0;
  const taxable = roundMoney(qty * unitPrice);
  const tax = computeLineTax({ taxableAmount: taxable, cgstRate, sgstRate });
  return roundMoney(taxable + tax.taxAmount);
}

export function ExchangeForm({
  canWrite,
  customers,
  sales,
  taxRates,
  initialSaleId = '',
}: {
  canWrite: boolean;
  customers: Option[];
  sales: SaleOption[];
  taxRates: Option[];
  initialSaleId?: string;
}) {
  const router = useRouter();
  const [customerId, setCustomerId] = useState('');
  const [originalSaleId, setOriginalSaleId] = useState('');
  const [notes, setNotes] = useState('');
  const [returnRows, setReturnRows] = useState<ReturnRow[]>([]);
  const [replaceLines, setReplaceLines] = useState<ReplaceLine[]>([]);
  const [showTaxRates, setShowTaxRates] = useState(false);
  const [catalog, setCatalog] = useState<Map<string, VariantOption>>(() => new Map());
  const [message, setMessage] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const mergeHits = (hits: VariantOption[]) => {
    setCatalog((prev) => {
      if (hits.length === 0) return prev;
      const next = new Map(prev);
      for (const h of hits) next.set(h.id, h);
      return next;
    });
  };

  const filteredSales = useMemo(() => {
    if (!customerId) return sales;
    return sales.filter((s) => s.customerId === customerId);
  }, [sales, customerId]);

  const saleLines = useMemo(
    () => sales.find((s) => s.id === originalSaleId)?.lines ?? [],
    [sales, originalSaleId],
  );

  const checkedReturns = returnRows.filter((r) => r.checked && Number(r.qty) > 0);

  const selectInvoice = (id: string) => {
    setOriginalSaleId(id);
    const sale = sales.find((s) => s.id === id);
    if (sale) {
      setCustomerId(sale.customerId);
      setReturnRows(rowsFromSaleLines(sale.lines));
    } else {
      setReturnRows([]);
    }
  };

  useEffect(() => {
    if (!initialSaleId) return;
    const sale = sales.find((s) => s.id === initialSaleId);
    if (!sale) return;
    setOriginalSaleId(sale.id);
    setCustomerId(sale.customerId);
    setReturnRows(rowsFromSaleLines(sale.lines));
  }, [initialSaleId, sales]);

  const preview = useMemo(() => {
    let returnTotal = 0;
    for (const row of checkedReturns) {
      const line = saleLines.find((l) => l.id === row.originalSaleLineId);
      if (!line) continue;
      returnTotal = roundMoney(
        returnTotal +
          lineTotalInclTax(Number(row.qty), line.unitPrice, line.cgstRate, line.sgstRate),
      );
    }
    let replaceTotal = 0;
    for (const rep of replaceLines) {
      if (!rep.variantId || !(Number(rep.qty) > 0)) continue;
      const v = catalog.get(rep.variantId);
      if (!v) continue;
      replaceTotal = roundMoney(
        replaceTotal +
          lineTotalInclTax(
            Number(rep.qty),
            Number(rep.unitPrice) || 0,
            v.cgstRate,
            v.sgstRate,
          ),
      );
    }
    const difference = roundMoney(replaceTotal - returnTotal);
    return { returnTotal, replaceTotal, difference };
  }, [checkedReturns, saleLines, replaceLines, catalog]);

  if (!canWrite) return null;

  const blocked = sales.length === 0;

  const diffHero =
    originalSaleId && (checkedReturns.length > 0 || replaceLines.some((l) => l.variantId)) ? (
      <SurfaceCard
        padding="md"
        className={cn(
          preview.difference > 0 && 'border-primary/30 bg-primary/5',
          preview.difference < 0 && 'border-warning/40 bg-warning/10',
          preview.difference === 0 && 'border-border/80 bg-muted/30',
        )}
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {preview.difference > 0
                ? 'Collect from customer'
                : preview.difference < 0
                  ? 'Refund / credit'
                  : 'Even swap'}
            </p>
            <MoneyText
              value={Math.abs(preview.difference)}
              className="mt-1 text-2xl font-semibold tracking-tight text-foreground"
            />
          </div>
          <div className="space-y-1 text-right text-xs text-muted-foreground">
            <p>
              Return <MoneyText value={preview.returnTotal} className="text-xs" />
            </p>
            <p>
              Replace <MoneyText value={preview.replaceTotal} className="text-xs" />
            </p>
          </div>
        </div>
      </SurfaceCard>
    ) : null;

  return (
    <form
      className={cn('space-y-4', stickyFormPadClass)}
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        startTransition(async () => {
          const sale = sales.find((s) => s.id === originalSaleId);
          const resolvedCustomerId = sale?.customerId || customerId;
          if (!resolvedCustomerId) {
            setMessage({ tone: 'err', text: 'Select an original invoice' });
            return;
          }
          if (checkedReturns.length === 0) {
            setMessage({ tone: 'err', text: 'Select at least one return line' });
            return;
          }
          for (const row of checkedReturns) {
            const line = saleLines.find((l) => l.id === row.originalSaleLineId);
            const qty = Number(row.qty);
            if (!line || !(qty > 0) || qty > line.qty) {
              setMessage({
                tone: 'err',
                text: `Return qty must be between 1 and sold qty for ${line?.label ?? 'line'}`,
              });
              return;
            }
          }
          const result = await createExchangeAction({
            customerId: resolvedCustomerId,
            originalSaleId,
            notes,
            returnLines: checkedReturns.map((l) => ({
              originalSaleLineId: l.originalSaleLineId,
              qty: Number(l.qty),
            })),
            replaceLines: replaceLines.map((l) => ({
              variantId: l.variantId,
              qty: Number(l.qty),
              unitPrice: Number(l.unitPrice),
              taxRateId: l.taxRateId || null,
            })),
          });
          if (!result.ok) {
            setMessage({ tone: 'err', text: result.error });
            return;
          }
          setMessage({
            tone: 'ok',
            text: 'Exchange posted — stock updated for returns and replacements.',
          });
          setCustomerId('');
          setOriginalSaleId('');
          setNotes('');
          setReturnRows([]);
          setReplaceLines([]);
          router.refresh();
        });
      }}
    >
      {diffHero}

      <SurfaceCard padding="none" className="overflow-hidden">
        <div className="space-y-5 p-5">
          {blocked ? (
            <div className="space-y-2 rounded-lg border border-dashed border-border/80 bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground">
              <p>Post a sale first — exchanges need an original invoice.</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/sales/quick" className="font-semibold text-primary hover:underline">
                  Quick Sale
                </Link>
                <Link href="/sales" className="font-semibold text-primary hover:underline">
                  Sales
                </Link>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="ex-sale"
              label="Original invoice"
              required
              hint="Bill in hand — pick the posted sale"
            >
              <Select
                id="ex-sale"
                value={originalSaleId}
                onValueChange={selectInvoice}
                placeholder="Search invoice…"
                required
                searchable
                options={filteredSales.map((s) => ({ value: s.id, label: s.label }))}
              />
            </FormField>
            <FormField
              id="ex-customer"
              label="Customer"
              hint="Optional filter — invoice fills this automatically"
            >
              <Select
                id="ex-customer"
                value={customerId}
                onValueChange={(id) => {
                  setCustomerId(id);
                  const sale = sales.find((s) => s.id === originalSaleId);
                  if (sale && sale.customerId !== id) {
                    setOriginalSaleId('');
                    setReturnRows([]);
                  }
                }}
                placeholder="All customers"
                allowClear
                clearLabel="All customers"
                options={customers.map((c) => ({ value: c.id, label: c.label }))}
              />
            </FormField>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold tracking-tight text-foreground">
                  Return lines
                </h3>
                <p className="text-xs text-muted-foreground">
                  Items coming back into stock (required)
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={!originalSaleId || saleLines.length === 0}
                onClick={() =>
                  setReturnRows(
                    saleLines.map((l) => ({
                      originalSaleLineId: l.id,
                      checked: true,
                      qty: String(l.qty),
                    })),
                  )
                }
              >
                Return all
              </Button>
            </div>
            {!originalSaleId ? (
              <p className="text-xs text-muted-foreground">
                Select an invoice to choose return lines.
              </p>
            ) : saleLines.length === 0 ? (
              <p className="text-xs text-muted-foreground">This invoice has no lines.</p>
            ) : (
              <ul className="space-y-2">
                {returnRows.map((row, index) => {
                  const line = saleLines.find((l) => l.id === row.originalSaleLineId);
                  if (!line) return null;
                  return (
                    <li
                      key={row.originalSaleLineId}
                      className={cn(
                        'grid gap-3 rounded-xl border border-border/70 bg-muted/30 p-3.5 sm:grid-cols-[auto_minmax(0,1fr)_8rem] sm:items-center',
                        row.checked && 'ring-1 ring-primary/25',
                      )}
                    >
                      <label className="flex items-center gap-2 sm:contents">
                        <input
                          type="checkbox"
                          className="h-5 w-5 rounded border-border"
                          checked={row.checked}
                          onChange={(e) =>
                            setReturnRows((rows) =>
                              rows.map((r, i) =>
                                i === index ? { ...r, checked: e.target.checked } : r,
                              ),
                            )
                          }
                          aria-label={`Return ${line.label}`}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">{line.label}</p>
                          <p className="text-xs text-muted-foreground">Sold {line.qty}</p>
                        </div>
                      </label>
                      <FormField
                        id={`ex-ret-qty-${index}`}
                        label="Qty returning"
                        className={cn(!row.checked && 'opacity-50')}
                      >
                        <Input
                          id={`ex-ret-qty-${index}`}
                          type="number"
                          min="0.001"
                          step="any"
                          max={line.qty}
                          inputMode="decimal"
                          className="font-mono tabular-nums"
                          value={row.qty}
                          disabled={!row.checked}
                          onChange={(e) =>
                            setReturnRows((rows) =>
                              rows.map((r, i) =>
                                i === index ? { ...r, qty: e.target.value } : r,
                              ),
                            )
                          }
                          required={row.checked}
                        />
                      </FormField>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold tracking-tight text-foreground">
                  Replacement lines
                </h3>
                <p className="text-xs text-muted-foreground">
                  Optional size/style swap — leave empty for return-only
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {replaceLines.length > 0 ? (
                  <button
                    type="button"
                    className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    onClick={() => setShowTaxRates((v) => !v)}
                    aria-expanded={showTaxRates}
                  >
                    {showTaxRates ? 'Hide tax' : 'Tax override'}
                  </button>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    setReplaceLines((rows) => [
                      ...rows,
                      { variantId: '', qty: '1', unitPrice: '', taxRateId: '' },
                    ])
                  }
                >
                  Add replace
                </Button>
              </div>
            </div>
            {replaceLines.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No replacements — this will be a return only.
              </p>
            ) : (
              replaceLines.map((line, index) => (
                <div
                  key={index}
                  className="grid gap-3 rounded-xl border border-border/70 bg-muted/30 p-3.5 lg:grid-cols-4"
                >
                  <FormField
                    id={`ex-rep-var-${index}`}
                    label="Size & colour"
                    required
                    className="lg:col-span-2"
                  >
                    <AsyncSkuCombobox
                      id={`ex-rep-var-${index}`}
                      value={line.variantId}
                      selectedLabel={catalog.get(line.variantId)?.label ?? null}
                      onHits={mergeHits}
                      onValueChange={(id, hit) => {
                        if (hit) mergeHits([hit]);
                        const v = hit ?? catalog.get(id);
                        setReplaceLines((rows) =>
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
                  <FormField id={`ex-rep-qty-${index}`} label="Qty" required>
                    <Input
                      id={`ex-rep-qty-${index}`}
                      type="number"
                      min="0.001"
                      step="any"
                      inputMode="decimal"
                      className="font-mono tabular-nums"
                      value={line.qty}
                      onChange={(e) =>
                        setReplaceLines((rows) =>
                          rows.map((r, i) => (i === index ? { ...r, qty: e.target.value } : r)),
                        )
                      }
                      required
                    />
                  </FormField>
                  <FormField id={`ex-rep-price-${index}`} label="Unit price" required>
                    <Input
                      id={`ex-rep-price-${index}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.unitPrice}
                      onChange={(e) =>
                        setReplaceLines((rows) =>
                          rows.map((r, i) =>
                            i === index ? { ...r, unitPrice: e.target.value } : r,
                          ),
                        )
                      }
                      required
                    />
                  </FormField>
                  {showTaxRates ? (
                    <FormField
                      id={`ex-rep-tax-${index}`}
                      label="Tax rate"
                      className="lg:col-span-2"
                    >
                      <Select
                        id={`ex-rep-tax-${index}`}
                        value={line.taxRateId}
                        onValueChange={(taxRateId) =>
                          setReplaceLines((rows) =>
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
              ))
            )}
          </div>

          <FormField id="ex-notes" label="Notes" hint="Optional">
            <Textarea
              id="ex-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Wrong size, exchanged same day"
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
          disabled={pending || blocked || !originalSaleId || checkedReturns.length === 0}
          className="h-12 w-full text-base md:h-11 md:w-auto"
        >
          {pending ? 'Posting…' : 'Post exchange'}
        </Button>
      </StickyFormActions>
    </form>
  );
}
