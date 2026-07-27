'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import type { ActionResult } from '@/server/action-result';

export function DeleteButton({
  action,
  label = 'Delete',
}: {
  action: () => Promise<ActionResult>;
  label?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="danger"
        size="sm"
        disabled={pending}
        onClick={() => {
          if (!confirm('Soft-delete this record? It will be hidden from new documents.')) return;
          startTransition(async () => {
            const result = await action();
            if (!result.ok) setError(result.error);
          });
        }}
      >
        {pending ? '…' : label}
      </Button>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
