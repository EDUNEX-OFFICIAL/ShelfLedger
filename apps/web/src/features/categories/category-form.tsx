'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  /** Prefer root categories as parents for a clean 2-level tree. */
  parents: Array<{ id: string; name: string }>;
  canWrite: boolean;
}) {
  const router = useRouter();
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
            setMessage(
              parentId
                ? 'Subcategory saved — ready for articles.'
                : 'Root category saved — add subcategories or articles.',
            );
            setName('');
            setParentId('');
            router.refresh();
          });
        }}
      >
        <FormField id="cat-name" label="Category name" required>
          <Input
            id="cat-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            placeholder="e.g. Men, Sports"
          />
        </FormField>
        <FormField
          id="cat-parent"
          label="Parent"
          hint="Leave empty for a root group"
        >
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
        <div className="flex flex-col gap-2 sm:pb-0.5">
          <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
            {pending ? 'Saving…' : 'Add category'}
          </Button>
          {message ? (
            <p className="text-xs font-medium text-success" role="status">
              {message}{' '}
              <Link href="/articles#new-article" className="underline underline-offset-2">
                Add article
              </Link>
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
