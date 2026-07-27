'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createBrandAction, updateBrandAction } from '@/features/masters/actions';

export function BrandForm({
  initial,
  brandId,
  canWrite,
}: {
  initial?: { name: string; code: string | null };
  brandId?: string;
  canWrite: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [code, setCode] = useState(initial?.code ?? '');
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!canWrite) return null;

  return (
    <form
      className="grid gap-3 rounded-md border border-border bg-white p-4 sm:grid-cols-[1fr_160px_auto]"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        startTransition(async () => {
          const result = brandId
            ? await updateBrandAction(brandId, { name, code })
            : await createBrandAction({ name, code });
          if (!result.ok) {
            setMessage(result.error);
            return;
          }
          setMessage(brandId ? 'Updated' : 'Created');
          if (!brandId) {
            setName('');
            setCode('');
          }
        });
      }}
    >
      <div className="space-y-1">
        <Label htmlFor="brand-name">Name</Label>
        <Input id="brand-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="brand-code">Code</Label>
        <Input id="brand-code" value={code} onChange={(e) => setCode(e.target.value)} />
      </div>
      <div className="flex items-end gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : brandId ? 'Update' : 'Add brand'}
        </Button>
        {message ? <span className="text-xs text-muted-foreground">{message}</span> : null}
      </div>
    </form>
  );
}
