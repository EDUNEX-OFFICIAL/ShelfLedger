'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ConfirmDialog,
  shouldSkipConfirm,
} from '@/components/shared/confirm-dialog';
import { postPurchaseAction, postPurchaseReturnAction } from '@/features/inventory/actions';
import { OPS_KEYS } from '@/lib/ops-prefs';
import { cn } from '@/lib/utils';

export function PostPurchaseButton({ purchaseId }: { purchaseId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const runPost = () => {
    setError(null);
    startTransition(async () => {
      const result = await postPurchaseAction(purchaseId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
    });
  };

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <Button
        size="sm"
        disabled={pending}
        onClick={() => {
          if (shouldSkipConfirm(OPS_KEYS.skipPostPurchaseConfirm)) {
            runPost();
            return;
          }
          setOpen(true);
        }}
      >
        {pending ? 'Posting…' : 'Post'}
      </Button>
      <ConfirmDialog
        open={open}
        title="Post this purchase?"
        description="Stock and average cost will update in stock history."
        confirmLabel="Post purchase"
        pending={pending}
        skipConfirmKey={OPS_KEYS.skipPostPurchaseConfirm}
        onCancel={() => setOpen(false)}
        onConfirm={runPost}
      />
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}

type ReturnRow = { id: string; checked: boolean; qty: string };

export function ReturnPurchaseButton({
  purchaseId,
  lines,
}: {
  purchaseId: string;
  lines: Array<{ id: string; label: string; qty: number }>;
}) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ReturnRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const openDialog = () => {
    setError(null);
    setRows(
      lines.map((l, i) => ({
        id: l.id,
        checked: i === 0,
        qty: '1',
      })),
    );
    setOpen(true);
  };

  const checked = rows.filter((r) => r.checked && Number(r.qty) > 0);

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <Button
        size="sm"
        variant="secondary"
        disabled={pending || lines.length === 0}
        onClick={openDialog}
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
          if (checked.length === 0) {
            setError('Select at least one line');
            return;
          }
          for (const row of checked) {
            const line = lines.find((l) => l.id === row.id);
            const n = Number(row.qty);
            if (!line || !(n > 0) || n > line.qty) {
              setError(`Qty must be 1–${line?.qty ?? '?'} for ${line?.label ?? 'line'}`);
              return;
            }
          }
          setError(null);
          startTransition(async () => {
            const result = await postPurchaseReturnAction({
              purchaseId,
              lines: checked.map((r) => ({
                purchaseLineId: r.id,
                qty: Number(r.qty),
              })),
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
        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() =>
              setRows(
                lines.map((l) => ({
                  id: l.id,
                  checked: true,
                  qty: String(l.qty),
                })),
              )
            }
          >
            Return all
          </Button>
        </div>
        <ul className="max-h-60 space-y-2 overflow-y-auto">
          {rows.map((row, index) => {
            const line = lines.find((l) => l.id === row.id);
            if (!line) return null;
            return (
              <li
                key={row.id}
                className={cn(
                  'grid gap-2 rounded-lg border border-border/70 bg-muted/20 p-2.5 sm:grid-cols-[auto_minmax(0,1fr)_5.5rem] sm:items-center',
                  row.checked && 'ring-1 ring-primary/25',
                )}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border"
                  checked={row.checked}
                  onChange={(e) =>
                    setRows((prev) =>
                      prev.map((r, i) =>
                        i === index ? { ...r, checked: e.target.checked } : r,
                      ),
                    )
                  }
                  aria-label={`Return ${line.label}`}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{line.label}</p>
                  <p className="text-xs text-muted-foreground">Purchased {line.qty}</p>
                </div>
                <div className="space-y-0.5">
                  <Label htmlFor={`ret-qty-${row.id}`} className="sr-only">
                    Qty
                  </Label>
                  <Input
                    id={`ret-qty-${row.id}`}
                    type="number"
                    min="0.001"
                    step="any"
                    max={line.qty}
                    disabled={!row.checked}
                    value={row.qty}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((r, i) =>
                          i === index ? { ...r, qty: e.target.value } : r,
                        ),
                      )
                    }
                  />
                </div>
              </li>
            );
          })}
        </ul>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </ConfirmDialog>
      {error && !open ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
