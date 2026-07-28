'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { FormField } from '@/components/shared/form-field';
import { SurfaceCard } from '@/components/shared/surface-card';
import { createCategoryAction } from '@/features/masters/actions';

export function CategoryForm({
  parents,
  canWrite,
}: {
  parents: Array<{ id: string; name: string }>;
  canWrite: boolean;
}) {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!canWrite) return null;

  return (
    <SurfaceCard padding="none" className="overflow-hidden">
      <form
        className="grid gap-4 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          setMessage(null);
          setError(null);
          startTransition(async () => {
            const result = await createCategoryAction({
              name,
              parentId: parentId || null,
            });
            if (!result.ok) {
              setError(result.error);
              return;
            }
            setMessage('Created');
            setName('');
            setParentId('');
          });
        }}
      >
        <FormField id="cat-name" label="Name" required>
          <Input
            id="cat-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </FormField>
        <FormField id="cat-parent" label="Parent" hint="Leave empty for root">
          <Select
            id="cat-parent"
            value={parentId}
            onValueChange={setParentId}
            placeholder="None (root)"
            allowClear
            clearLabel="None (root)"
            options={parents.map((p) => ({ value: p.id, label: p.name }))}
          />
        </FormField>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
            {pending ? 'Saving…' : 'Add category'}
          </Button>
          {message ? <span className="text-xs font-medium text-success">{message}</span> : null}
          {error ? <span className="text-xs text-destructive">{error}</span> : null}
        </div>
      </form>
    </SurfaceCard>
  );
}
