'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { FormField } from '@/components/shared/form-field';
import { SurfaceCard } from '@/components/shared/surface-card';
import { createStaffAction, updateStaffAction } from '@/features/admin/actions';

export type StaffRole = 'OWNER' | 'MANAGER' | 'CASHIER' | 'VIEWER';

type StaffRow = {
  id: string;
  email: string;
  name: string;
  role: StaffRole;
  isActive: boolean;
};

export const ROLE_LABELS: Record<StaffRole, string> = {
  OWNER: 'Owner',
  MANAGER: 'Manager',
  CASHIER: 'Cashier',
  VIEWER: 'Viewer',
};

export const ROLE_HINTS: Record<StaffRole, string> = {
  OWNER: 'Full access including staff & settings',
  MANAGER: 'Ops, masters, reports, staff (no OWNER create)',
  CASHIER: 'Sales, exchanges, customers — no staff/settings',
  VIEWER: 'Read-only reports and lists',
};

export function roleOptions(includeOwner: boolean) {
  const opts: Array<{ value: StaffRole; label: string }> = [
    { value: 'MANAGER', label: 'Manager' },
    { value: 'CASHIER', label: 'Cashier' },
    { value: 'VIEWER', label: 'Viewer' },
  ];
  if (includeOwner) return [{ value: 'OWNER', label: 'Owner' }, ...opts];
  return opts;
}

export function StaffCreateForm({
  canWrite,
  canCreateOwner,
}: {
  canWrite: boolean;
  canCreateOwner: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CASHIER' as StaffRole,
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!canWrite) return null;

  return (
    <SurfaceCard padding="none" className="overflow-hidden">
      <form
        className="space-y-5 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          setMessage(null);
          setError(null);
          startTransition(async () => {
            const result = await createStaffAction(form);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            setMessage('User created — they can sign in with this email and password.');
            setForm({ name: '', email: '', password: '', role: 'CASHIER' });
            router.refresh();
          });
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="staff-name" label="Name" required>
            <Input
              id="staff-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              autoFocus
              placeholder="Floor name"
            />
          </FormField>
          <FormField id="staff-email" label="Email" required hint="Login ID">
            <Input
              id="staff-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
              autoComplete="off"
            />
          </FormField>
          <FormField
            id="staff-password"
            label="Temporary password"
            required
            hint="Min 8 characters — share securely"
          >
            <Input
              id="staff-password"
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              minLength={8}
              required
              autoComplete="new-password"
            />
          </FormField>
          <FormField
            id="staff-role"
            label="Role"
            required
            hint={ROLE_HINTS[form.role]}
          >
            <Select
              id="staff-role"
              value={form.role}
              onValueChange={(role) => setForm((f) => ({ ...f, role: role as StaffRole }))}
              options={roleOptions(canCreateOwner)}
            />
          </FormField>
        </div>
        {message ? (
          <p className="text-sm font-medium text-success" role="status">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
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
  isSelf,
}: {
  user: StaffRow;
  canWrite: boolean;
  canAssignOwner: boolean;
  isSelf?: boolean;
}) {
  const router = useRouter();
  const [role, setRole] = useState(user.role);
  const [isActive, setIsActive] = useState(user.isActive);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!canWrite) return null;

  const dirty = role !== user.role || isActive !== user.isActive;

  return (
    <div className="flex w-full flex-col items-stretch gap-2 sm:items-end">
      {isSelf ? (
        <p className="text-[11px] text-muted-foreground">
          You — role &amp; deactivate locked (safety).
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Select
          value={role}
          onValueChange={(v) => setRole(v as StaffRole)}
          className="w-32"
          triggerClassName="h-8 text-xs"
          disabled={isSelf}
          options={roleOptions(canAssignOwner || user.role === 'OWNER')}
          aria-label={`Role for ${user.name}`}
        />
        <label
          className={`flex items-center gap-1.5 text-xs ${
            isSelf ? 'cursor-not-allowed text-muted-foreground/70' : 'text-muted-foreground'
          }`}
        >
          <input
            type="checkbox"
            checked={isActive}
            disabled={isSelf}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          Active
        </label>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={pending || isSelf || !dirty}
          onClick={() => {
            setMessage(null);
            setError(null);
            startTransition(async () => {
              const result = await updateStaffAction(user.id, {
                name: user.name,
                role,
                isActive,
              });
              if (!result.ok) {
                setError(result.error);
                return;
              }
              setMessage('Saved');
              router.refresh();
            });
          }}
        >
          {pending ? '…' : 'Save'}
        </Button>
      </div>
      {message ? (
        <span className="text-right text-xs font-medium text-success" role="status">
          {message}
        </span>
      ) : null}
      {error ? (
        <span className="text-right text-xs text-destructive" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
