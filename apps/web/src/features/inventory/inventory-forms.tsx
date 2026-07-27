'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { openingStockAction, stockAdjustmentAction } from '@/features/inventory/actions';

type Option = { id: string; label: string };

export function OpeningStockForm({
  canWrite,
  variants,
}: {
  canWrite: boolean;
  variants: Option[];
}) {
  const [variantId, setVariantId] = useState('');
  const [qty, setQty] = useState('1');
  const [unitCost, setUnitCost] = useState('');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!canWrite) return null;

  return (
    <form
      className="grid gap-3 rounded-md border border-border bg-white p-4 lg:grid-cols-5"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        startTransition(async () => {
          const result = await openingStockAction({
            variantId,
            qty: Number(qty),
            unitCost: Number(unitCost),
            notes,
          });
          if (!result.ok) {
            setMessage(result.error);
            return;
          }
          setMessage('Opening stock posted');
          setVariantId('');
          setQty('1');
          setUnitCost('');
          setNotes('');
        });
      }}
    >
      <div className="space-y-1 lg:col-span-2">
        <Label>Variant</Label>
        <Select value={variantId} onChange={(e) => setVariantId(e.target.value)} required>
          <option value="">Select</option>
          {variants.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Qty</Label>
        <Input value={qty} onChange={(e) => setQty(e.target.value)} required />
      </div>
      <div className="space-y-1">
        <Label>Unit cost</Label>
        <Input value={unitCost} onChange={(e) => setUnitCost(e.target.value)} required />
      </div>
      <div className="flex items-end gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? '…' : 'Post opening'}
        </Button>
      </div>
      {message ? <p className="text-sm text-muted-foreground lg:col-span-5">{message}</p> : null}
    </form>
  );
}

export function AdjustmentForm({
  canWrite,
  variants,
}: {
  canWrite: boolean;
  variants: Option[];
}) {
  const [variantId, setVariantId] = useState('');
  const [qty, setQty] = useState('1');
  const [direction, setDirection] = useState<'IN' | 'OUT' | 'DAMAGE' | 'LOST'>('OUT');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!canWrite) return null;

  return (
    <form
      className="grid gap-3 rounded-md border border-border bg-white p-4 lg:grid-cols-5"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        startTransition(async () => {
          const result = await stockAdjustmentAction({
            variantId,
            qty: Number(qty),
            direction,
            reason,
          });
          if (!result.ok) {
            setMessage(result.error);
            return;
          }
          setMessage('Adjustment posted');
          setReason('');
        });
      }}
    >
      <div className="space-y-1 lg:col-span-2">
        <Label>Variant</Label>
        <Select value={variantId} onChange={(e) => setVariantId(e.target.value)} required>
          <option value="">Select</option>
          {variants.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Direction</Label>
        <Select
          value={direction}
          onChange={(e) => setDirection(e.target.value as typeof direction)}
        >
          <option value="IN">Adjustment in</option>
          <option value="OUT">Adjustment out</option>
          <option value="DAMAGE">Damage</option>
          <option value="LOST">Lost</option>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Qty</Label>
        <Input value={qty} onChange={(e) => setQty(e.target.value)} required />
      </div>
      <div className="space-y-1 lg:col-span-3">
        <Label>Reason</Label>
        <Input value={reason} onChange={(e) => setReason(e.target.value)} required minLength={3} />
      </div>
      <div className="flex items-end">
        <Button type="submit" disabled={pending}>
          {pending ? '…' : 'Post adjustment'}
        </Button>
      </div>
      {message ? <p className="text-sm text-muted-foreground lg:col-span-5">{message}</p> : null}
    </form>
  );
}
