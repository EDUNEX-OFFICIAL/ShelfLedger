'use client';

import { useMemo, useState, useTransition } from 'react';
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
import { createExchangeAction } from '@/features/sales/actions';
import { cn } from '@/lib/utils';

type Option = { id: string; label: string };
type VariantOption = Option & { sellingPrice: number };
type SaleOption = {
  id: string;
  label: string;
  customerId: string;
  lines: Array<{ id: string; label: string; qty: number; unitPrice: number }>;
};

type ReturnLine = { originalSaleLineId: string; qty: string };
type ReplaceLine = { variantId: string; qty: string; unitPrice: string; taxRateId: string };

export function ExchangeForm({
  canWrite,
  customers,
  sales,
  variants,
  taxRates,
}: {
  canWrite: boolean;
  customers: Option[];
  sales: SaleOption[];
  variants: VariantOption[];
  taxRates: Option[];
}) {
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? '');
  const [originalSaleId, setOriginalSaleId] = useState('');
  const [notes, setNotes] = useState('');
  const [returnLines, setReturnLines] = useState<ReturnLine[]>([
    { originalSaleLineId: '', qty: '1' },
  ]);
  const [replaceLines, setReplaceLines] = useState<ReplaceLine[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const saleLines = useMemo(
    () => sales.find((s) => s.id === originalSaleId)?.lines ?? [],
    [sales, originalSaleId],
  );

  if (!canWrite) return null;

  const blocked = sales.length === 0;

  return (
    <form
      className={cn('space-y-4', stickyFormPadClass)}
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        startTransition(async () => {
          const result = await createExchangeAction({
            customerId,
            originalSaleId,
            notes,
            returnLines: returnLines.map((l) => ({
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
            setMessage(result.error);
            return;
          }
          setMessage(`Exchange posted (${result.data.id.slice(0, 8)}…).`);
          setOriginalSaleId('');
          setNotes('');
          setReturnLines([{ originalSaleLineId: '', qty: '1' }]);
          setReplaceLines([]);
        });
      }}
    >
      <SurfaceCard padding="none" className="overflow-hidden">
        <div className="space-y-5 p-5">
          {blocked ? (
            <p className="rounded-lg border border-dashed border-border/80 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              Post a sale first — exchanges need an original invoice.
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="ex-customer" label="Customer" required>
              <Select
                id="ex-customer"
                value={customerId}
                onValueChange={setCustomerId}
                placeholder="Select"
                required
                options={customers.map((c) => ({ value: c.id, label: c.label }))}
              />
            </FormField>
            <FormField id="ex-sale" label="Original posted sale" required>
              <Select
                id="ex-sale"
                value={originalSaleId}
                onValueChange={(id) => {
                  setOriginalSaleId(id);
                  const sale = sales.find((s) => s.id === id);
                  if (sale) setCustomerId(sale.customerId);
                  setReturnLines([{ originalSaleLineId: '', qty: '1' }]);
                }}
                placeholder="Select invoice"
                required
                searchable
                options={sales.map((s) => ({ value: s.id, label: s.label }))}
              />
            </FormField>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold tracking-tight text-foreground">
                  Return lines
                </h3>
                <p className="text-xs text-muted-foreground">Items coming back into stock</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() =>
                  setReturnLines((rows) => [...rows, { originalSaleLineId: '', qty: '1' }])
                }
              >
                Add return
              </Button>
            </div>
            {returnLines.map((line, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-xl border border-border/70 bg-muted/30 p-3.5 sm:grid-cols-2"
              >
                <FormField id={`ex-ret-line-${index}`} label="Original sale line" required>
                  <Select
                    id={`ex-ret-line-${index}`}
                    value={line.originalSaleLineId}
                    onValueChange={(originalSaleLineId) =>
                      setReturnLines((rows) =>
                        rows.map((r, i) => (i === index ? { ...r, originalSaleLineId } : r)),
                      )
                    }
                    placeholder="Select line"
                    required
                    options={saleLines.map((l) => ({
                      value: l.id,
                      label: `${l.label} (sold ${l.qty})`,
                    }))}
                  />
                </FormField>
                <FormField id={`ex-ret-qty-${index}`} label="Qty" required>
                  <Input
                    id={`ex-ret-qty-${index}`}
                    type="number"
                    min="0.001"
                    step="1"
                    value={line.qty}
                    onChange={(e) =>
                      setReturnLines((rows) =>
                        rows.map((r, i) => (i === index ? { ...r, qty: e.target.value } : r)),
                      )
                    }
                    required
                  />
                </FormField>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold tracking-tight text-foreground">
                  Replacement lines
                </h3>
                <p className="text-xs text-muted-foreground">Optional — price excl. GST</p>
              </div>
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
            {replaceLines.map((line, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-xl border border-border/70 bg-muted/30 p-3.5 lg:grid-cols-4"
              >
                <FormField
                  id={`ex-rep-var-${index}`}
                  label="Variant"
                  required
                  className="lg:col-span-2"
                >
                  <Select
                    id={`ex-rep-var-${index}`}
                    value={line.variantId}
                    onValueChange={(id) => {
                      const v = variants.find((x) => x.id === id);
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
                    placeholder="Select SKU"
                    required
                    searchable
                    options={variants.map((v) => ({ value: v.id, label: v.label }))}
                  />
                </FormField>
                <FormField id={`ex-rep-qty-${index}`} label="Qty" required>
                  <Input
                    id={`ex-rep-qty-${index}`}
                    type="number"
                    min="0.001"
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
              </div>
            ))}
          </div>

          <FormField id="ex-notes" label="Notes">
            <Textarea
              id="ex-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </FormField>

          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        </div>
      </SurfaceCard>

      <StickyFormActions>
        <Button
          type="submit"
          size="lg"
          disabled={pending || blocked}
          className="h-12 w-full text-base md:h-11 md:w-auto"
        >
          {pending ? 'Posting…' : 'Post exchange'}
        </Button>
      </StickyFormActions>
    </form>
  );
}
