'use client';

import { useTransition, useState } from 'react';
import Link from 'next/link';
import { Button, buttonClassName } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { postSaleAction } from '@/features/sales/actions';

export function PostSaleButton({ saleId }: { saleId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" size="sm" disabled={pending} onClick={() => setOpen(true)}>
        {pending ? 'Posting…' : 'Post'}
      </Button>
      <ConfirmDialog
        open={open}
        title="Post this sale?"
        description="Stock will decrease and an invoice number will be allocated. This cannot be undone except via exchange/return."
        confirmLabel="Post sale"
        pending={pending}
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setError(null);
          startTransition(async () => {
            const result = await postSaleAction(saleId);
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

export function InvoiceLink({ saleId }: { saleId: string }) {
  return (
    <Link
      href={`/sales/${saleId}/invoice`}
      className={buttonClassName({ variant: 'secondary', size: 'sm' })}
    >
      Invoice
    </Link>
  );
}
