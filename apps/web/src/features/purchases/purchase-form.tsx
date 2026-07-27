'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createPurchaseAction } from '@/features/inventory/actions';

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

  return (
    <form
      className="space-y-4 rounded-md border border-border bg-white p-4"
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
          setMessage(`Draft created (${result.data.id.slice(0, 8)}…). Post it from the list.`);
          setVendorId('');
          setVendorInvoiceNo('');
          setVendorInvoiceDate('');
          setNotes('');
          setLines([emptyLine()]);
        });
      }}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label>Vendor</Label>
          <Select value={vendorId} onChange={(e) => setVendorId(e.target.value)} required>
            <option value="">Select vendor</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Vendor invoice #</Label>
          <Input value={vendorInvoiceNo} onChange={(e) => setVendorInvoiceNo(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Invoice date</Label>
          <Input
            type="date"
            value={vendorInvoiceDate}
            onChange={(e) => setVendorInvoiceDate(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Lines (ex-GST rate)</h3>
          <Button type="button" size="sm" variant="secondary" onClick={() => setLines((l) => [...l, emptyLine()])}>
            Add line
          </Button>
        </div>
        {lines.map((line, index) => (
          <div key={index} className="grid gap-2 rounded-md border border-border p-3 lg:grid-cols-5">
            <div className="space-y-1 lg:col-span-2">
              <Label>Variant</Label>
              <Select
                value={line.variantId}
                onChange={(e) =>
                  setLines((rows) =>
                    rows.map((r, i) => (i === index ? { ...r, variantId: e.target.value } : r)),
                  )
                }
                required
              >
                <option value="">Select SKU</option>
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Qty</Label>
              <Input
                value={line.qty}
                onChange={(e) =>
                  setLines((rows) =>
                    rows.map((r, i) => (i === index ? { ...r, qty: e.target.value } : r)),
                  )
                }
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Unit rate</Label>
              <Input
                value={line.unitRate}
                onChange={(e) =>
                  setLines((rows) =>
                    rows.map((r, i) => (i === index ? { ...r, unitRate: e.target.value } : r)),
                  )
                }
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Tax</Label>
              <Select
                value={line.taxRateId}
                onChange={(e) =>
                  setLines((rows) =>
                    rows.map((r, i) => (i === index ? { ...r, taxRateId: e.target.value } : r)),
                  )
                }
              >
                <option value="">Default / none</option>
                {taxRates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-1">
        <Label>Notes</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending || vendors.length === 0 || variants.length === 0}>
          {pending ? 'Saving…' : 'Save draft'}
        </Button>
        {message ? <span className="text-sm text-muted-foreground">{message}</span> : null}
      </div>
    </form>
  );
}
