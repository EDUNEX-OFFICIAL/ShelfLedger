'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/shared/form-field';
import { SurfaceCard } from '@/components/shared/surface-card';
import {
  StickyFormActions,
  stickyFormPadClass,
} from '@/components/shared/sticky-form-actions';
import { createVendorAction } from '@/features/masters/actions';
import { cn } from '@/lib/utils';

export function VendorForm({ canWrite }: { canWrite: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    gstin: '',
    phone: '',
    email: '',
    address: '',
    stateCode: '',
    paymentTermsDays: '' as string,
    notes: '',
  });
  const [moreOpen, setMoreOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!canWrite) return null;

  return (
    <form
      className={cn('space-y-4', stickyFormPadClass)}
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        setError(null);
        startTransition(async () => {
          const terms = form.paymentTermsDays.trim();
          const result = await createVendorAction({
            name: form.name,
            gstin: form.gstin,
            phone: form.phone,
            email: form.email,
            address: form.address,
            stateCode: form.stateCode,
            notes: form.notes,
            paymentTermsDays: terms === '' ? null : Number(terms),
          });
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setMessage('Vendor saved — available on New purchase.');
          setForm({
            name: '',
            gstin: '',
            phone: '',
            email: '',
            address: '',
            stateCode: '',
            paymentTermsDays: '',
            notes: '',
          });
          setMoreOpen(false);
          router.refresh();
        });
      }}
    >
      <SurfaceCard padding="none" className="overflow-hidden">
        <div className="space-y-5 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="vendor-name" label="Vendor name" required>
              <Input
                id="vendor-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                autoFocus
                placeholder="Supplier / company name"
              />
            </FormField>
            <FormField
              id="vendor-gstin"
              label="GSTIN"
              hint="Important for purchase invoices & ITC"
            >
              <Input
                id="vendor-gstin"
                value={form.gstin}
                onChange={(e) => setForm((f) => ({ ...f, gstin: e.target.value }))}
                placeholder="15-character GSTIN"
                className="font-mono"
              />
            </FormField>
            <FormField id="vendor-phone" label="Phone">
              <Input
                id="vendor-phone"
                type="tel"
                inputMode="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </FormField>
            <FormField
              id="vendor-terms"
              label="Payment terms (days)"
              hint="e.g. 30 for Net 30 — optional"
            >
              <Input
                id="vendor-terms"
                type="number"
                min="0"
                max="365"
                step="1"
                inputMode="numeric"
                value={form.paymentTermsDays}
                onChange={(e) => setForm((f) => ({ ...f, paymentTermsDays: e.target.value }))}
                placeholder="30"
              />
            </FormField>
          </div>

          <div className="rounded-xl border border-border/70 bg-muted/20">
            <button
              type="button"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen((o) => !o)}
              className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-sm"
            >
              <span className="font-medium text-foreground">
                More details
                <span className="ml-1.5 font-normal text-muted-foreground">
                  (email, address, notes)
                </span>
              </span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 shrink-0 text-muted-foreground transition',
                  moreOpen && 'rotate-180',
                )}
                strokeWidth={1.75}
                aria-hidden
              />
            </button>
            {moreOpen ? (
              <div className="space-y-4 border-t border-border/70 px-3.5 py-3.5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField id="vendor-email" label="Email">
                    <Input
                      id="vendor-email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    />
                  </FormField>
                  <FormField id="vendor-state" label="State code" hint="2-digit GST state">
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
                    placeholder="e.g. Brand distributor, credit account"
                  />
                </FormField>
              </div>
            ) : null}
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
        </div>
      </SurfaceCard>

      <StickyFormActions>
        <Button
          type="submit"
          size="lg"
          disabled={pending}
          className="h-12 w-full text-base md:h-11 md:w-auto"
        >
          {pending ? 'Saving…' : 'Add vendor'}
        </Button>
      </StickyFormActions>
    </form>
  );
}
