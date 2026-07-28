'use client';

import Link from 'next/link';
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
import { createPurchaseAction } from '@/features/inventory/actions';
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
  variants,
  taxRates,
}: {
  canWrite: boolean;
  vendors: Option[];
  variants: Option[];
  taxRates: Option[];
}) {
  const [vendorId, setVendorId] = useState('');
  const [vendorInvoiceNo, setVendorInvoiceNo] = useState('');
  const [vendorInvoiceDate, setVendorInvoiceDate] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!canWrite) return null;

  const blocked = vendors.length === 0 || variants.length === 0;

  return (
    <form
      className={cn('space-y-4', stickyFormPadClass)}
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        startTransition(async () => {
          const result = await createPurchaseAction({
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
          if (!result.ok) {
            setMessage(result.error);
            return;
          }
          setMessage('ok');
          setVendorId('');
          setVendorInvoiceNo('');
          setVendorInvoiceDate('');
          setNotes('');
          setLines([emptyLine()]);
        });
      }}
    >
      <SurfaceCard padding="none" className="overflow-hidden">
        <div className="space-y-5 p-5">
          {blocked ? (
            <div className="space-y-2 rounded-lg border border-dashed border-border/80 bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground">
              <p>
                {vendors.length === 0
                  ? 'Add a vendor before creating a purchase.'
                  : 'Add article variants (SKUs) before creating a purchase.'}
              </p>
              <div className="flex flex-wrap gap-2">
                {vendors.length === 0 ? (
                  <Link href="/vendors" className="font-semibold text-primary hover:underline">
                    Go to Vendors
                  </Link>
                ) : (
                  <Link href="/articles" className="font-semibold text-primary hover:underline">
                    Go to Articles
                  </Link>
                )}
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField id="po-vendor" label="Vendor" required>
              <Select
                id="po-vendor"
                value={vendorId}
                onValueChange={setVendorId}
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
                <p className="text-xs text-muted-foreground">Unit rate excl. GST</p>
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
                  id={`po-var-${index}`}
                  label="Variant"
                  required
                  className="lg:col-span-2"
                >
                  <Select
                    id={`po-var-${index}`}
                    value={line.variantId}
                    onValueChange={(variantId) =>
                      setLines((rows) =>
                        rows.map((r, i) => (i === index ? { ...r, variantId } : r)),
                      )
                    }
                    placeholder="Select SKU"
                    required
                    searchable
                    options={variants.map((v) => ({ value: v.id, label: v.label }))}
                  />
                </FormField>
                <FormField id={`po-qty-${index}`} label="Qty" required>
                  <Input
                    id={`po-qty-${index}`}
                    type="number"
                    min="0.001"
                    step="1"
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

          {message === 'ok' ? (
            <p className="text-sm font-medium text-success" role="status">
              Draft saved.{' '}
              <a
                href="#all-purchases"
                className="underline underline-offset-2 hover:text-success/90"
              >
                Post it from All purchases
              </a>{' '}
              to receive stock on the shelf.
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
          disabled={pending || blocked}
          className="h-12 w-full text-base md:h-11 md:w-auto"
        >
          {pending ? 'Saving…' : 'Create draft purchase'}
        </Button>
      </StickyFormActions>
    </form>
  );
}
