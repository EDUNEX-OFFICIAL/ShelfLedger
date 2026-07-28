'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
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
  const [pending, startTransition] = useTransition();

  if (!canWrite) return null;

  return (
    <SurfaceCard padding="none" className="overflow-hidden">
      <form
        className="grid gap-4 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          setMessage(null);
          startTransition(async () => {
            const result = await createCategoryAction({
              name,
              parentId: parentId || null,
            });
            if (!result.ok) {
              setMessage(result.error);
              return;
            }
            setMessage('Created');
            setName('');
            setParentId('');
          });
        }}
      >
        <div className="space-y-1">
          <Label htmlFor="cat-name">Name</Label>
          <Input
            id="cat-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="cat-parent">Parent</Label>
          <Select
            id="cat-parent"
            value={parentId}
            onValueChange={setParentId}
            placeholder="None (root)"
            allowClear
            clearLabel="None (root)"
            options={parents.map((p) => ({ value: p.id, label: p.name }))}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
            {pending ? 'Saving…' : 'Add category'}
          </Button>
          {message ? <span className="text-xs text-muted-foreground">{message}</span> : null}
        </div>
      </form>
    </SurfaceCard>
  );
}
