'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
            const result = await createCustomerAction(form);
            if (!result.ok) {
              setMessage(result.error);
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
          <div className="space-y-1">
            <Label htmlFor="customer-name">Name</Label>
            <Input
              id="customer-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="customer-phone">Phone</Label>
            <Input
              id="customer-phone"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="customer-gstin">GSTIN (B2B)</Label>
            <Input
              id="customer-gstin"
              value={form.gstin}
              onChange={(e) => setForm((f) => ({ ...f, gstin: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="customer-email">Email</Label>
            <Input
              id="customer-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="customer-state">State code</Label>
            <Input
              id="customer-state"
              value={form.stateCode}
              onChange={(e) => setForm((f) => ({ ...f, stateCode: e.target.value }))}
              maxLength={2}
              placeholder="27"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="customer-address">Address</Label>
          <Textarea
            id="customer-address"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            rows={2}
          />
        </div>
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
          {pending ? 'Saving…' : 'Add customer'}
        </Button>
      </form>
    </SurfaceCard>
  );
}
