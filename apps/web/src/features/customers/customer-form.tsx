'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/shared/form-field';
import { SurfaceCard } from '@/components/shared/surface-card';
import { createCustomerAction } from '@/features/sales/actions';

export function CustomerForm({ canWrite }: { canWrite: boolean }) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    gstin: '',
    stateCode: '',
    address: '',
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
            const result = await createCustomerAction(form);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            setMessage('Created');
            setForm({
              name: '',
              phone: '',
              email: '',
              gstin: '',
              stateCode: '',
              address: '',
            });
          });
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="customer-name" label="Name" required>
            <Input
              id="customer-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </FormField>
          <FormField id="customer-phone" label="Phone" hint="Unique per shop when set">
            <Input
              id="customer-phone"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </FormField>
          <FormField id="customer-gstin" label="GSTIN (B2B)">
            <Input
              id="customer-gstin"
              value={form.gstin}
              onChange={(e) => setForm((f) => ({ ...f, gstin: e.target.value }))}
            />
          </FormField>
          <FormField id="customer-email" label="Email">
            <Input
              id="customer-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </FormField>
          <FormField id="customer-state" label="State code" hint="2-digit GST state code">
            <Input
              id="customer-state"
              value={form.stateCode}
              onChange={(e) => setForm((f) => ({ ...f, stateCode: e.target.value }))}
              maxLength={2}
              placeholder="27"
            />
          </FormField>
        </div>
        <FormField id="customer-address" label="Address">
          <Textarea
            id="customer-address"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            rows={2}
          />
        </FormField>
        {message ? <p className="text-sm font-medium text-success">{message}</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
          {pending ? 'Saving…' : 'Add customer'}
        </Button>
      </form>
    </SurfaceCard>
  );
}
