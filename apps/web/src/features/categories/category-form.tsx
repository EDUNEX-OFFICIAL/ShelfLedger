'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
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
    <form
      className="grid gap-3 rounded-md border border-border bg-white p-4 sm:grid-cols-[1fr_1fr_auto]"
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
        <Input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="cat-parent">Parent</Label>
        <Select id="cat-parent" value={parentId} onChange={(e) => setParentId(e.target.value)}>
          <option value="">None (root)</option>
          {parents.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex items-end gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Add category'}
        </Button>
        {message ? <span className="text-xs text-muted-foreground">{message}</span> : null}
      </div>
    </form>
  );
}
