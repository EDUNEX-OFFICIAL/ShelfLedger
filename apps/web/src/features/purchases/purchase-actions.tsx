'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { postPurchaseAction, postPurchaseReturnAction } from '@/features/inventory/actions';

export function PostPurchaseButton({ purchaseId }: { purchaseId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <Button
        size="sm"
        disabled={pending}
        onClick={() => {
          if (!confirm('Post this purchase? Stock and average cost will update.')) return;
          startTransition(async () => {
            const result = await postPurchaseAction(purchaseId);
            if (!result.ok) setError(result.error);
          });
        }}
      >
        {pending ? 'Posting…' : 'Post'}
      </Button>
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
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <Button
        size="sm"
        variant="secondary"
        disabled={pending || lines.length === 0}
        onClick={() => {
          const first = lines[0];
          if (!first) return;
          const raw = prompt(
            `Return qty for first line (${first.label}). Max ${first.qty}. Leave blank to cancel.`,
            '1',
          );
          if (!raw) return;
          const qty = Number(raw);
          if (!(qty > 0)) {
            setError('Invalid qty');
            return;
          }
          startTransition(async () => {
            const result = await postPurchaseReturnAction({
              purchaseId,
              lines: [{ purchaseLineId: first.id, qty }],
              notes: 'UI return',
            });
            if (!result.ok) setError(result.error);
          });
        }}
      >
        {pending ? '…' : 'Return'}
      </Button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
