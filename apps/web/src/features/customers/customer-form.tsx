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
import { createCustomerAction } from '@/features/sales/actions';
import { cn } from '@/lib/utils';

export function CustomerForm({ canWrite }: { canWrite: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    gstin: '',
    stateCode: '',
    address: '',
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
          const result = await createCustomerAction(form);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setMessage('Customer saved — searchable by name or phone.');
          setForm({
            name: '',
            phone: '',
            email: '',
            gstin: '',
            stateCode: '',
            address: '',
          });
          setMoreOpen(false);
          router.refresh();
        });
      }}
    >
      <SurfaceCard padding="none" className="overflow-hidden">
        <div className="space-y-5 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="customer-name" label="Name" required>
              <Input
                id="customer-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                autoFocus
                placeholder="Customer name"
              />
            </FormField>
            <FormField
              id="customer-phone"
              label="Phone"
              hint="Unique per shop — used for WhatsApp & Quick Sale lookup"
            >
              <Input
                id="customer-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="10-digit mobile"
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
                  (GSTIN, address — optional)
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
                  <FormField id="customer-gstin" label="GSTIN (B2B)">
                    <Input
                      id="customer-gstin"
                      value={form.gstin}
                      onChange={(e) => setForm((f) => ({ ...f, gstin: e.target.value }))}
                      placeholder="Optional"
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
                  <FormField
                    id="customer-state"
                    label="State code"
                    hint="2-digit GST state (e.g. 27)"
                  >
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
          {pending ? 'Saving…' : 'Add customer'}
        </Button>
      </StickyFormActions>
    </form>
  );
}
