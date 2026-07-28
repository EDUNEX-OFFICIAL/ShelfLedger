'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { postPurchaseAction, postPurchaseReturnAction } from '@/features/inventory/actions';

export function PostPurchaseButton({ purchaseId }: { purchaseId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <Button size="sm" disabled={pending} onClick={() => setOpen(true)}>
        {pending ? 'Posting…' : 'Post'}
      </Button>
      <ConfirmDialog
        open={open}
        title="Post this purchase?"
        description="Stock and average cost will update via the stock ledger."
        confirmLabel="Post purchase"
        pending={pending}
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setError(null);
          startTransition(async () => {
            const result = await postPurchaseAction(purchaseId);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            setOpen(false);
          });
        }}
      />
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}

export function ReturnPurchaseButton({
  purchaseId,
  lines,
}: {
  purchaseId: string;
  lines: Array<{ id: string; label: string; qty: number }>;
}) {
  const first = lines[0];
  const [open, setOpen] = useState(false);
  const [lineId, setLineId] = useState(first?.id ?? '');
  const [qty, setQty] = useState('1');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selected = lines.find((l) => l.id === lineId) ?? first;

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <Button
        size="sm"
        variant="secondary"
        disabled={pending || lines.length === 0}
        onClick={() => {
          setError(null);
          setLineId(first?.id ?? '');
          setQty('1');
          setOpen(true);
        }}
      >
        Return
      </Button>
      <ConfirmDialog
        open={open}
        title="Return purchase lines"
        description="Stock will decrease (outbound) without changing average cost on remaining qty."
        confirmLabel="Post return"
        pending={pending}
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          if (!selected) return;
          const n = Number(qty);
          if (!(n > 0)) {
            setError('Enter a qty greater than 0');
            return;
          }
          if (n > selected.qty) {
            setError(`Max qty for this line is ${selected.qty}`);
            return;
          }
          setError(null);
          startTransition(async () => {
            const result = await postPurchaseReturnAction({
              purchaseId,
              lines: [{ purchaseLineId: selected.id, qty: n }],
              notes: 'UI return',
            });
            if (!result.ok) {
              setError(result.error);
              return;
            }
            setOpen(false);
          });
        }}
      >
        <div className="space-y-1">
          <Label htmlFor="return-line">Line</Label>
          <Select
            id="return-line"
            value={lineId}
            onValueChange={setLineId}
            options={lines.map((l) => ({
              value: l.id,
              label: `${l.label} (max ${l.qty})`,
            }))}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="return-qty">Qty to return</Label>
          <Input
            id="return-qty"
            type="number"
            min="0.001"
            step="1"
            max={selected?.qty}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
        </div>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </ConfirmDialog>
      {error && !open ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
