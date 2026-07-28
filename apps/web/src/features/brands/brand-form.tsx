'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/shared/form-field';
import { SurfaceCard } from '@/components/shared/surface-card';
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
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!canWrite) return null;

  return (
    <SurfaceCard padding="none" className="overflow-hidden">
      <form
        className="grid gap-4 p-5 sm:grid-cols-[1fr_160px_auto] sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          setMessage(null);
          setError(null);
          startTransition(async () => {
            const result = brandId
              ? await updateBrandAction(brandId, { name, code })
              : await createBrandAction({ name, code });
            if (!result.ok) {
              setError(result.error);
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
        <FormField id="brand-name" label="Name" required>
          <Input
            id="brand-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </FormField>
        <FormField id="brand-code" label="Code" hint="Optional short code">
          <Input id="brand-code" value={code} onChange={(e) => setCode(e.target.value)} />
        </FormField>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
            {pending ? 'Saving…' : brandId ? 'Update' : 'Add brand'}
          </Button>
          {message ? <span className="text-xs font-medium text-success">{message}</span> : null}
          {error ? <span className="text-xs text-destructive">{error}</span> : null}
        </div>
      </form>
    </SurfaceCard>
  );
}
