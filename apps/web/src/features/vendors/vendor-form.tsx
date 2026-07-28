'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/shared/form-field';
import { SurfaceCard } from '@/components/shared/surface-card';
import { createVendorAction } from '@/features/masters/actions';

export function VendorForm({ canWrite }: { canWrite: boolean }) {
  const [form, setForm] = useState({
    name: '',
    gstin: '',
    phone: '',
    email: '',
    address: '',
    stateCode: '',
    notes: '',
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
            const result = await createVendorAction(form);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            setMessage('Created');
            setForm({
              name: '',
              gstin: '',
              phone: '',
              email: '',
              address: '',
              stateCode: '',
              notes: '',
            });
          });
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="vendor-name" label="Name" required>
            <Input
              id="vendor-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </FormField>
          <FormField id="vendor-gstin" label="GSTIN">
            <Input
              id="vendor-gstin"
              value={form.gstin}
              onChange={(e) => setForm((f) => ({ ...f, gstin: e.target.value }))}
            />
          </FormField>
          <FormField id="vendor-phone" label="Phone">
            <Input
              id="vendor-phone"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </FormField>
          <FormField id="vendor-email" label="Email">
            <Input
              id="vendor-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </FormField>
          <FormField id="vendor-state" label="State code" hint="2-digit GST state code">
            <Input
              id="vendor-state"
              placeholder="27"
              maxLength={2}
              value={form.stateCode}
              onChange={(e) => setForm((f) => ({ ...f, stateCode: e.target.value }))}
            />
          </FormField>
        </div>
        <FormField id="vendor-address" label="Address">
          <Textarea
            id="vendor-address"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            rows={2}
          />
        </FormField>
        <FormField id="vendor-notes" label="Notes">
          <Textarea
            id="vendor-notes"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={2}
          />
        </FormField>
        {message ? <p className="text-sm font-medium text-success">{message}</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
          {pending ? 'Saving…' : 'Add vendor'}
        </Button>
      </form>
    </SurfaceCard>
  );
}
