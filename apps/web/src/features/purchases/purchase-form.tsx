'use client';

import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { AsyncSkuCombobox } from '@/components/ui/async-sku-combobox';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/shared/form-field';
import { SurfaceCard } from '@/components/shared/surface-card';
import {
  StickyFormActions,
  stickyFormPadClass,
} from '@/components/shared/sticky-form-actions';
import {
  createAndPostPurchaseAction,
  createPurchaseAction,
} from '@/features/inventory/actions';
import { OPS_KEYS, writeLocal } from '@/lib/ops-prefs';
import { cn } from '@/lib/utils';

type Option = { id: string; label: string };

type Line = {
  variantId: string;
  qty: string;
  unitRate: string;
  discountAmount: string;
  taxRateId: string;
};

const emptyLine = (): Line => ({
  variantId: '',
  qty: '1',
  unitRate: '',
  discountAmount: '0',
  taxRateId: '',
});

export function PurchaseForm({
  canWrite,
  vendors,
  taxRates,
  lastRatesByVendor = {},
}: {
  canWrite: boolean;
  vendors: Option[];
  taxRates: Option[];
  lastRatesByVendor?: Record<string, Record<string, number>>;
}) {
  const [vendorId, setVendorId] = useState('');
  const [vendorInvoiceNo, setVendorInvoiceNo] = useState('');
  const [vendorInvoiceDate, setVendorInvoiceDate] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const [showTaxRates, setShowTaxRates] = useState(false);
  const [skuLabels, setSkuLabels] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ tone: 'ok' | 'err'; text: string } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(OPS_KEYS.lastPurchaseVendor);
      if (saved && vendors.some((v) => v.id === saved)) {
        setVendorId(saved);
      }
    } catch {
      /* ignore */
    }
  }, [vendors]);

  if (!canWrite) return null;

  const blocked = vendors.length === 0;
  const vendorRates = vendorId ? (lastRatesByVendor[vendorId] ?? {}) : {};

  const buildPayload = () => ({
    vendorId,
    vendorInvoiceNo,
    vendorInvoiceDate,
    notes,
    lines: lines.map((l) => ({
      variantId: l.variantId,
      qty: Number(l.qty),
      unitRate: Number(l.unitRate),
      discountAmount: Number(l.discountAmount || 0),
      taxRateId: l.taxRateId || null,
    })),
  });

  const resetForm = () => {
    setVendorInvoiceNo('');
    setVendorInvoiceDate('');
    setNotes('');
    setLines([emptyLine()]);
    setSkuLabels({});
  };

  const rememberVendor = (id: string) => {
    setVendorId(id);
    if (id) writeLocal(OPS_KEYS.lastPurchaseVendor, id);
  };

  const setLineVariant = (index: number, variantId: string) => {
    const suggested = vendorRates[variantId];
    setLines((rows) =>
      rows.map((r, i) => {
        if (i !== index) return r;
        const nextRate =
          r.unitRate.trim() === '' && suggested != null ? String(suggested) : r.unitRate;
        return { ...r, variantId, unitRate: nextRate };
      }),
    );
  };

  const submit = (mode: 'draft' | 'receive') => {
    setMessage(null);
    startTransition(async () => {
      const payload = buildPayload();
      const result =
        mode === 'receive'
          ? await createAndPostPurchaseAction(payload)
          : await createPurchaseAction(payload);
      if (!result.ok) {
        setMessage({ tone: 'err', text: result.error });
        return;
      }
      rememberVendor(vendorId);
      resetForm();
      setMessage({
        tone: 'ok',
        text:
          mode === 'receive'
            ? 'Purchase received — stock and average cost updated.'
            : 'Draft saved. Post it from All purchases to receive stock on the shelf.',
      });
    });
  };

  return (
    <form
      className={cn('space-y-4', stickyFormPadClass)}
      onSubmit={(e) => {
        e.preventDefault();
        submit('receive');
      }}
    >
      <SurfaceCard padding="none" className="overflow-hidden">
        <div className="space-y-5 p-5">
          {blocked ? (
            <div className="space-y-2 rounded-lg border border-dashed border-border/80 bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground">
              <p>Add a vendor before creating a purchase.</p>
              <div className="flex flex-wrap gap-2">
                <Link href="/vendors" className="font-semibold text-primary hover:underline">
                  Go to Vendors
                </Link>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField id="po-vendor" label="Vendor" required>
              <Select
                id="po-vendor"
                value={vendorId}
                onValueChange={rememberVendor}
                placeholder="Select vendor"
                required
                options={vendors.map((v) => ({ value: v.id, label: v.label }))}
              />
            </FormField>
            <FormField id="po-inv-no" label="Vendor invoice #">
              <Input
                id="po-inv-no"
                value={vendorInvoiceNo}
                onChange={(e) => setVendorInvoiceNo(e.target.value)}
              />
            </FormField>
            <FormField id="po-inv-date" label="Invoice date">
              <Input
                id="po-inv-date"
                type="date"
                value={vendorInvoiceDate}
                onChange={(e) => setVendorInvoiceDate(e.target.value)}
              />
            </FormField>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold tracking-tight text-foreground">Lines</h3>
                <p className="text-xs text-muted-foreground">
                  Unit rate excl. GST
                  {vendorId && Object.keys(vendorRates).length > 0
                    ? ' · last rates autofill when empty'
                    : null}
                </p>
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
                  id={`po-var-${index}`}
                  label="Size & colour"
                  required
                  className="lg:col-span-2"
                >
                  <AsyncSkuCombobox
                    id={`po-var-${index}`}
                    value={line.variantId}
                    selectedLabel={skuLabels[line.variantId] ?? null}
                    onValueChange={(variantId, hit) => {
                      if (hit?.label) {
                        setSkuLabels((prev) => ({ ...prev, [variantId]: hit.label }));
                      }
                      setLineVariant(index, variantId);
                    }}
                    placeholder="Search item…"
                    required
                  />
                </FormField>
                <FormField id={`po-qty-${index}`} label="Qty" required>
                  <Input
                    id={`po-qty-${index}`}
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
                <FormField id={`po-rate-${index}`} label="Unit rate" required>
                  <Input
                    id={`po-rate-${index}`}
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    className="font-mono tabular-nums"
                    value={line.unitRate}
                    onChange={(e) =>
                      setLines((rows) =>
                        rows.map((r, i) =>
                          i === index ? { ...r, unitRate: e.target.value } : r,
                        ),
                      )
                    }
                    required
                  />
                </FormField>
                <FormField id={`po-disc-${index}`} label="Line discount">
                  <Input
                    id={`po-disc-${index}`}
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
                  <FormField id={`po-tax-${index}`} label="Tax rate" className="lg:col-span-2">
                    <Select
                      id={`po-tax-${index}`}
                      value={line.taxRateId}
                      onValueChange={(taxRateId) =>
                        setLines((rows) =>
                          rows.map((r, i) => (i === index ? { ...r, taxRateId } : r)),
                        )
                      }
                      placeholder="Default / none"
                      allowClear
                      clearLabel="Default / none"
                      options={taxRates.map((t) => ({ value: t.id, label: t.label }))}
                    />
                  </FormField>
                ) : null}
              </div>
            ))}
          </div>

          <FormField id="po-notes" label="Notes">
            <Textarea
              id="po-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
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
              {message.tone === 'ok' && message.text.includes('Draft saved') ? (
                <>
                  Draft saved.{' '}
                  <a
                    href="#all-purchases"
                    className="underline underline-offset-2 hover:text-success/90"
                  >
                    Post it from All purchases
                  </a>{' '}
                  to receive stock on the shelf.
                </>
              ) : (
                message.text
              )}
            </p>
          ) : null}
        </div>
      </SurfaceCard>

      <StickyFormActions>
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row-reverse">
          <Button
            type="submit"
            size="lg"
            disabled={pending || blocked}
            className="h-12 w-full text-base md:h-11 md:w-auto"
          >
            {pending ? 'Saving…' : 'Save & receive stock'}
          </Button>
          <Button
            type="button"
            size="lg"
            variant="secondary"
            disabled={pending || blocked}
            className="h-12 w-full text-base md:h-11 md:w-auto"
            onClick={() => submit('draft')}
          >
            Save draft
          </Button>
        </div>
      </StickyFormActions>
    </form>
  );
}
