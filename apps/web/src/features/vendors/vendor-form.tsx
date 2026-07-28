'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
            const result = await createVendorAction(form);
            if (!result.ok) {
              setMessage(result.error);
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
          <div className="space-y-1">
            <Label htmlFor="vendor-name">Name</Label>
            <Input
              id="vendor-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="vendor-gstin">GSTIN</Label>
            <Input
              id="vendor-gstin"
              value={form.gstin}
              onChange={(e) => setForm((f) => ({ ...f, gstin: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="vendor-phone">Phone</Label>
            <Input
              id="vendor-phone"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="vendor-email">Email</Label>
            <Input
              id="vendor-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="vendor-state">State code</Label>
            <Input
              id="vendor-state"
              placeholder="27"
              maxLength={2}
              value={form.stateCode}
              onChange={(e) => setForm((f) => ({ ...f, stateCode: e.target.value }))}
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="vendor-address">Address</Label>
          <Textarea
            id="vendor-address"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            rows={2}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="vendor-notes">Notes</Label>
          <Textarea
            id="vendor-notes"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={2}
          />
        </div>
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
          {pending ? 'Saving…' : 'Add vendor'}
        </Button>
      </form>
    </SurfaceCard>
  );
}
