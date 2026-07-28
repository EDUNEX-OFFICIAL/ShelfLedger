'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/shared/form-field';
import { SurfaceCard } from '@/components/shared/surface-card';
import { createBrandAction, updateBrandAction } from '@/features/masters/actions';

function suggestCode(name: string) {
  const letters = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return letters.slice(0, 4);
}

export function BrandForm({
  initial,
  brandId,
  canWrite,
}: {
  initial?: { name: string; code: string | null };
  brandId?: string;
  canWrite: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? '');
  const [code, setCode] = useState(initial?.code ?? '');
  const [codeTouched, setCodeTouched] = useState(Boolean(initial?.code));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!canWrite) return null;

  return (
    <SurfaceCard padding="none" className="overflow-hidden">
      <form
        className="grid gap-4 p-5 sm:grid-cols-[1fr_140px_auto] sm:items-end"
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
            setMessage(brandId ? 'Brand updated' : 'Brand saved — ready for new articles.');
            if (!brandId) {
              setName('');
              setCode('');
              setCodeTouched(false);
            }
            router.refresh();
          });
        }}
      >
        <FormField id="brand-name" label="Brand name" required>
          <Input
            id="brand-name"
            value={name}
            onChange={(e) => {
              const next = e.target.value;
              setName(next);
              if (!brandId && !codeTouched) {
                setCode(suggestCode(next));
              }
            }}
            required
            autoFocus={!brandId}
            placeholder="e.g. Nike"
          />
        </FormField>
        <FormField id="brand-code" label="Code" hint="Optional short code">
          <Input
            id="brand-code"
            value={code}
            onChange={(e) => {
              setCodeTouched(true);
              setCode(e.target.value);
            }}
            className="font-mono"
            placeholder="NIKE"
            maxLength={20}
          />
        </FormField>
        <div className="flex flex-col gap-2 sm:pb-0.5">
          <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
            {pending ? 'Saving…' : brandId ? 'Update' : 'Add brand'}
          </Button>
          {message ? (
            <p className="text-xs font-medium text-success" role="status">
              {message}{' '}
              {!brandId ? (
                <Link href="/articles#new-article" className="underline underline-offset-2">
                  Add article
                </Link>
              ) : null}
            </p>
          ) : null}
          {error ? (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </form>
    </SurfaceCard>
  );
}
