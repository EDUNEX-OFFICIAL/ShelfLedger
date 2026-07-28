'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { SurfaceCard } from '@/components/shared/surface-card';
import { createStaffAction, updateStaffAction } from '@/features/admin/actions';

type StaffRow = {
  id: string;
  email: string;
  name: string;
  role: 'OWNER' | 'MANAGER' | 'CASHIER' | 'VIEWER';
  isActive: boolean;
};

function roleOptions(includeOwner: boolean) {
  const opts = [
    { value: 'MANAGER', label: 'MANAGER' },
    { value: 'CASHIER', label: 'CASHIER' },
    { value: 'VIEWER', label: 'VIEWER' },
  ];
  if (includeOwner) return [{ value: 'OWNER', label: 'OWNER' }, ...opts];
  return opts;
}

export function StaffCreateForm({
  canWrite,
  canCreateOwner,
}: {
  canWrite: boolean;
  canCreateOwner: boolean;
}) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CASHIER' as StaffRow['role'],
  });
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!canWrite) return null;

  return (
    <SurfaceCard padding="none" className="overflow-hidden">
      <form
        className="space-y-5 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          setMessage(null);
          startTransition(async () => {
            const result = await createStaffAction(form);
            if (!result.ok) {
              setMessage(result.error);
              return;
            }
            setMessage('User created');
            setForm({ name: '', email: '', password: '', role: 'CASHIER' });
          });
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Password</Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              minLength={8}
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Role</Label>
            <Select
              value={form.role}
              onValueChange={(role) =>
                setForm((f) => ({ ...f, role: role as StaffRow['role'] }))
              }
              options={roleOptions(canCreateOwner)}
            />
          </div>
        </div>
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
          {pending ? 'Saving…' : 'Create user'}
        </Button>
      </form>
    </SurfaceCard>
  );
}

export function StaffRowActions({
  user,
  canWrite,
  canAssignOwner,
}: {
  user: StaffRow;
  canWrite: boolean;
  canAssignOwner: boolean;
}) {
  const [role, setRole] = useState(user.role);
  const [isActive, setIsActive] = useState(user.isActive);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!canWrite) return null;

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Select
        value={role}
        onValueChange={(v) => setRole(v as StaffRow['role'])}
        className="w-28"
        triggerClassName="h-8 text-xs"
        options={roleOptions(canAssignOwner || user.role === 'OWNER')}
      />
      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4 rounded border-border"
        />
        Active
      </label>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={pending}
        onClick={() => {
          setMessage(null);
          startTransition(async () => {
            const result = await updateStaffAction(user.id, {
              name: user.name,
              role,
              isActive,
            });
            if (!result.ok) setMessage(result.error);
            else setMessage('Saved');
          });
        }}
      >
        Save
      </Button>
      {message ? (
        <span className="w-full text-right text-xs text-muted-foreground">{message}</span>
      ) : null}
    </div>
  );
}
