'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { AsyncSkuCombobox } from '@/components/ui/async-sku-combobox';
import { FormField } from '@/components/shared/form-field';
import { SurfaceCard } from '@/components/shared/surface-card';
import {
  StickyFormActions,
  stickyFormPadClass,
} from '@/components/shared/sticky-form-actions';
import { openingStockAction, stockAdjustmentAction } from '@/features/inventory/actions';
import { cn } from '@/lib/utils';

const DIRECTION_OPTIONS = [
  { value: 'IN', label: 'Adjustment in' },
  { value: 'OUT', label: 'Adjustment out' },
  { value: 'DAMAGE', label: 'Damage' },
  { value: 'LOST', label: 'Lost' },
] as const;

export function OpeningStockForm({ canWrite }: { canWrite: boolean }) {
  const router = useRouter();
  const [variantId, setVariantId] = useState('');
  const [qty, setQty] = useState('1');
  const [unitCost, setUnitCost] = useState('');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  if (!canWrite) return null;

  return (
    <form
      className={cn('space-y-4', stickyFormPadClass)}
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
            setMessage({ tone: 'err', text: result.error });
            return;
          }
          setMessage({ tone: 'ok', text: 'Starting stock saved to stock history' });
          setVariantId('');
          setQty('1');
          setUnitCost('');
          setNotes('');
          router.refresh();
        });
      }}
    >
      <SurfaceCard padding="none" className="overflow-hidden">
        <div className="space-y-5 p-5">
          <div className="grid gap-4 lg:grid-cols-5">
            <FormField id="open-var" label="Size & colour" required className="lg:col-span-2">
              <AsyncSkuCombobox
                id="open-var"
                value={variantId}
                onValueChange={setVariantId}
                placeholder="Search item code…"
                required
              />
            </FormField>
            <FormField id="open-qty" label="Qty" required>
              <Input
                id="open-qty"
                type="number"
                min="0.001"
                step="any"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                required
              />
            </FormField>
            <FormField id="open-cost" label="Unit cost" required hint="Sets opening avg cost">
              <Input
                id="open-cost"
                type="number"
                min="0"
                step="0.01"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                required
              />
            </FormField>
            <FormField id="open-notes" label="Notes" className="lg:col-span-2">
              <Input
                id="open-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional"
              />
            </FormField>
          </div>
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
          disabled={pending}
          className="h-12 w-full text-base md:h-11 md:w-auto"
        >
          {pending ? 'Saving…' : 'Save starting stock'}
        </Button>
      </StickyFormActions>
    </form>
  );
}

export function AdjustmentForm({ canWrite }: { canWrite: boolean }) {
  const router = useRouter();
  const [variantId, setVariantId] = useState('');
  const [qty, setQty] = useState('1');
  const [direction, setDirection] = useState<'IN' | 'OUT' | 'DAMAGE' | 'LOST'>('OUT');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  if (!canWrite) return null;

  return (
    <form
      className={cn('space-y-4', stickyFormPadClass)}
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
            setMessage({ tone: 'err', text: result.error });
            return;
          }
          setMessage({ tone: 'ok', text: 'Adjustment saved to stock history' });
          setReason('');
          router.refresh();
        });
      }}
    >
      <SurfaceCard padding="none" className="overflow-hidden">
        <div className="space-y-5 p-5">
          <div className="grid gap-4 lg:grid-cols-5">
            <FormField id="adj-var" label="Size & colour" required className="lg:col-span-2">
              <AsyncSkuCombobox
                id="adj-var"
                value={variantId}
                onValueChange={setVariantId}
                placeholder="Search item code…"
                required
              />
            </FormField>
            <FormField id="adj-dir" label="Type" required>
              <Select
                id="adj-dir"
                value={direction}
                onValueChange={(v) => setDirection(v as typeof direction)}
                options={[...DIRECTION_OPTIONS]}
              />
            </FormField>
            <FormField id="adj-qty" label="Qty" required>
              <Input
                id="adj-qty"
                type="number"
                min="0.001"
                step="any"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                required
              />
            </FormField>
            <FormField
              id="adj-reason"
              label="Reason"
              required
              hint="Min 3 characters — required for audit"
              className="lg:col-span-3"
            >
              <Input
                id="adj-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                minLength={3}
                placeholder="e.g. Damaged box on shelf"
              />
            </FormField>
          </div>
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
          disabled={pending}
          className="h-12 w-full text-base md:h-11 md:w-auto"
        >
          {pending ? 'Posting…' : 'Post adjustment'}
        </Button>
      </StickyFormActions>
    </form>
  );
}
