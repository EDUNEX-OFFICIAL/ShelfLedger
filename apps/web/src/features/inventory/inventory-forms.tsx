'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { SurfaceCard } from '@/components/shared/surface-card';
import { openingStockAction, stockAdjustmentAction } from '@/features/inventory/actions';

type Option = { id: string; label: string };

const DIRECTION_OPTIONS = [
  { value: 'IN', label: 'Adjustment in' },
  { value: 'OUT', label: 'Adjustment out' },
  { value: 'DAMAGE', label: 'Damage' },
  { value: 'LOST', label: 'Lost' },
] as const;

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

  const blocked = variants.length === 0;

  return (
    <SurfaceCard padding="none" className="overflow-hidden">
      <form
        className="space-y-5 p-5"
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
        {blocked ? (
          <p className="rounded-lg border border-dashed border-border/80 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
            Create article variants (SKUs) before posting opening stock.
          </p>
        ) : null}
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="space-y-1 lg:col-span-2">
            <Label>Variant</Label>
            <Select
              value={variantId}
              onValueChange={setVariantId}
              placeholder="Select SKU"
              required
              searchable
              options={variants.map((v) => ({ value: v.id, label: v.label }))}
            />
          </div>
          <div className="space-y-1">
            <Label>Qty</Label>
            <Input
              type="number"
              min="0.001"
              step="1"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Unit cost</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1 lg:col-span-2">
            <Label>Notes (optional)</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        <Button type="submit" size="lg" disabled={pending || blocked} className="w-full sm:w-auto">
          {pending ? 'Posting…' : 'Post opening'}
        </Button>
      </form>
    </SurfaceCard>
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

  const blocked = variants.length === 0;

  return (
    <SurfaceCard padding="none" className="overflow-hidden">
      <form
        className="space-y-5 p-5"
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
        {blocked ? (
          <p className="rounded-lg border border-dashed border-border/80 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
            Create article variants (SKUs) before posting adjustments.
          </p>
        ) : null}
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="space-y-1 lg:col-span-2">
            <Label>Variant</Label>
            <Select
              value={variantId}
              onValueChange={setVariantId}
              placeholder="Select SKU"
              required
              searchable
              options={variants.map((v) => ({ value: v.id, label: v.label }))}
            />
          </div>
          <div className="space-y-1">
            <Label>Direction</Label>
            <Select
              value={direction}
              onValueChange={(v) => setDirection(v as typeof direction)}
              options={[...DIRECTION_OPTIONS]}
            />
          </div>
          <div className="space-y-1">
            <Label>Qty</Label>
            <Input
              type="number"
              min="0.001"
              step="1"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1 lg:col-span-3">
            <Label>Reason</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              minLength={3}
              placeholder="Required (min 3 characters)"
            />
          </div>
        </div>
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        <Button type="submit" size="lg" disabled={pending || blocked} className="w-full sm:w-auto">
          {pending ? 'Posting…' : 'Post adjustment'}
        </Button>
      </form>
    </SurfaceCard>
  );
}
