'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import type { ActionResult } from '@/server/action-result';

export function DeleteButton({
  action,
  label = 'Delete',
  title = 'Soft-delete this record?',
  description = 'It will be hidden from new documents. Past invoices remain.',
}: {
  action: () => Promise<ActionResult>;
  label?: string;
  title?: string;
  description?: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <Button type="button" variant="danger" size="sm" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <ConfirmDialog
        open={open}
        title={title}
        description={description}
        confirmLabel="Delete"
        danger
        pending={pending}
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setError(null);
          startTransition(async () => {
            const result = await action();
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
