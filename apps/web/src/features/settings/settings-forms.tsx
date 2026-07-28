'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { FormField } from '@/components/shared/form-field';
import { SurfaceCard } from '@/components/shared/surface-card';
import {
  StickyFormActions,
  stickyFormPadClass,
} from '@/components/shared/sticky-form-actions';
import {
  updateOrgSettingsAction,
  updateSequenceAction,
  createTaxRateAction,
} from '@/features/admin/actions';
import { cn } from '@/lib/utils';

type Org = {
  name: string;
  gstin: string | null;
  stateCode: string;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  pincode: string | null;
  phone: string | null;
  email: string | null;
  financialYearStartMonth: number;
};

type Seq = { id: string; docType: string; fyLabel: string; prefix: string; nextNumber: number };

const FY_MONTHS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

function OrgReadOnly({ org }: { org: Org }) {
  const rows: Array<{ label: string; value: string }> = [
    { label: 'Shop name', value: org.name },
    { label: 'GSTIN', value: org.gstin || '—' },
    { label: 'State code', value: org.stateCode },
    {
      label: 'FY start',
      value: FY_MONTHS.find((m) => m.value === String(org.financialYearStartMonth))?.label ?? String(org.financialYearStartMonth),
    },
    { label: 'Address', value: [org.addressLine1, org.addressLine2].filter(Boolean).join(', ') || '—' },
    { label: 'City / PIN', value: [org.city, org.pincode].filter(Boolean).join(' · ') || '—' },
    { label: 'Phone', value: org.phone || '—' },
    { label: 'Email', value: org.email || '—' },
  ];

  return (
    <SurfaceCard padding="md" className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Read-only — ask a manager to change organization settings.
      </p>
      <dl className="grid gap-3 sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.label}>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {r.label}
            </dt>
            <dd className="mt-0.5 text-sm text-foreground">{r.value}</dd>
          </div>
        ))}
      </dl>
    </SurfaceCard>
  );
}

export function OrgSettingsForm({ canWrite, org }: { canWrite: boolean; org: Org }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: org.name,
    gstin: org.gstin ?? '',
    stateCode: org.stateCode,
    addressLine1: org.addressLine1 ?? '',
    addressLine2: org.addressLine2 ?? '',
    city: org.city ?? '',
    pincode: org.pincode ?? '',
    phone: org.phone ?? '',
    email: org.email ?? '',
    financialYearStartMonth: String(org.financialYearStartMonth),
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!canWrite) return <OrgReadOnly org={org} />;

  return (
    <SurfaceCard padding="none" className={cn('overflow-hidden', stickyFormPadClass)}>
      <form
        className="space-y-5 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          setMessage(null);
          setError(null);
          startTransition(async () => {
            const result = await updateOrgSettingsAction({
              ...form,
              financialYearStartMonth: Number(form.financialYearStartMonth),
            });
            if (!result.ok) {
              setError(result.error);
              return;
            }
            setMessage(
              'Shop saved — name updates on sidebar, login, invoices, and browser title.',
            );
            router.refresh();
          });
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="org-name" label="Shop name" required>
            <Input
              id="org-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              autoFocus
            />
          </FormField>
          <FormField id="org-gstin" label="GSTIN" hint="15 characters when registered">
            <Input
              id="org-gstin"
              value={form.gstin}
              onChange={(e) => setForm((f) => ({ ...f, gstin: e.target.value.toUpperCase() }))}
              maxLength={15}
              className="font-mono uppercase"
            />
          </FormField>
          <FormField
            id="org-state"
            label="State code"
            required
            hint="2-digit GST state (e.g. 27 MH)"
          >
            <Input
              id="org-state"
              value={form.stateCode}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  stateCode: e.target.value.replace(/\D/g, '').slice(0, 2),
                }))
              }
              maxLength={2}
              inputMode="numeric"
              required
              className="font-mono"
            />
          </FormField>
          <FormField
            id="org-fy"
            label="Financial year start"
            required
            hint="India default is April"
          >
            <Select
              id="org-fy"
              value={form.financialYearStartMonth}
              onValueChange={(v) => setForm((f) => ({ ...f, financialYearStartMonth: v }))}
              options={FY_MONTHS}
            />
          </FormField>
          <FormField id="org-addr1" label="Address line 1">
            <Input
              id="org-addr1"
              value={form.addressLine1}
              onChange={(e) => setForm((f) => ({ ...f, addressLine1: e.target.value }))}
            />
          </FormField>
          <FormField id="org-addr2" label="Address line 2">
            <Input
              id="org-addr2"
              value={form.addressLine2}
              onChange={(e) => setForm((f) => ({ ...f, addressLine2: e.target.value }))}
            />
          </FormField>
          <FormField id="org-city" label="City">
            <Input
              id="org-city"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            />
          </FormField>
          <FormField id="org-pin" label="Pincode">
            <Input
              id="org-pin"
              value={form.pincode}
              onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))}
              inputMode="numeric"
            />
          </FormField>
          <FormField id="org-phone" label="Phone">
            <Input
              id="org-phone"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              inputMode="tel"
            />
          </FormField>
          <FormField id="org-email" label="Email">
            <Input
              id="org-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
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

        <StickyFormActions>
          <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
            {pending ? 'Saving…' : 'Save organization'}
          </Button>
        </StickyFormActions>
      </form>
    </SurfaceCard>
  );
}

export function SequenceForm({ canWrite, sequences }: { canWrite: boolean; sequences: Seq[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prefixes, setPrefixes] = useState<Record<string, string>>(
    Object.fromEntries(sequences.map((s) => [s.id, s.prefix])),
  );
  const [pending, startTransition] = useTransition();

  if (sequences.length === 0) {
    return (
      <SurfaceCard padding="md">
        <p className="text-sm text-muted-foreground">
          No sequences yet — the first posted sale creates an invoice sequence for the current FY.
        </p>
      </SurfaceCard>
    );
  }

  return (
    <div className="space-y-3">
      {sequences.map((s) => (
        <SurfaceCard key={s.id} padding="md" className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {s.docType === 'SALE_INVOICE' ? 'Sale invoice' : s.docType}
              </p>
              <p className="text-xs text-muted-foreground">FY {s.fyLabel}</p>
            </div>
            <p className="font-mono text-xs text-muted-foreground">
              Next #{s.nextNumber}
            </p>
          </div>
          {canWrite ? (
            <div className="flex flex-wrap items-end gap-2">
              <FormField id={`seq-${s.id}`} label="Prefix" className="min-w-[8rem] flex-1">
                <Input
                  id={`seq-${s.id}`}
                  className="font-mono"
                  value={prefixes[s.id] ?? s.prefix}
                  onChange={(e) => setPrefixes((p) => ({ ...p, [s.id]: e.target.value }))}
                />
              </FormField>
              <Button
                type="button"
                size="md"
                variant="secondary"
                disabled={pending && pendingId === s.id}
                onClick={() => {
                  setMessage(null);
                  setError(null);
                  setPendingId(s.id);
                  startTransition(async () => {
                    const result = await updateSequenceAction({
                      id: s.id,
                      prefix: prefixes[s.id] ?? s.prefix,
                    });
                    setPendingId(null);
                    if (!result.ok) {
                      setError(result.error);
                      return;
                    }
                    setMessage('Prefix updated — applies to newly posted invoices only.');
                    router.refresh();
                  });
                }}
              >
                {pending && pendingId === s.id ? 'Saving…' : 'Save prefix'}
              </Button>
            </div>
          ) : (
            <p className="font-mono text-sm">
              Prefix <span className="font-semibold">{s.prefix}</span>
            </p>
          )}
        </SurfaceCard>
      ))}
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
  );
}

function splitHalf(total: number): { cgst: string; sgst: string } {
  const half = Math.round((total / 2) * 100) / 100;
  const cgst = half;
  const sgst = Math.round((total - cgst) * 100) / 100;
  return { cgst: String(cgst), sgst: String(sgst) };
}

export function TaxRateForm({ canWrite }: { canWrite: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    totalRate: '18',
    cgstRate: '9',
    sgstRate: '9',
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
            const result = await createTaxRateAction({
              name: form.name,
              totalRate: Number(form.totalRate),
              cgstRate: Number(form.cgstRate),
              sgstRate: Number(form.sgstRate),
            });
            if (!result.ok) {
              setError(result.error);
              return;
            }
            setMessage('Tax rate added — existing invoices unchanged.');
            setForm({ name: '', totalRate: '18', cgstRate: '9', sgstRate: '9' });
            router.refresh();
          });
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormField id="tax-name" label="Name" required hint='e.g. GST 18%'>
            <Input
              id="tax-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              placeholder="GST 18%"
            />
          </FormField>
          <FormField id="tax-total" label="Total %" required hint="CGST+SGST auto-split">
            <Input
              id="tax-total"
              type="number"
              step="0.01"
              value={form.totalRate}
              onChange={(e) => {
                const totalRate = e.target.value;
                const n = Number(totalRate);
                if (Number.isFinite(n) && n >= 0) {
                  const split = splitHalf(n);
                  setForm((f) => ({ ...f, totalRate, cgstRate: split.cgst, sgstRate: split.sgst }));
                } else {
                  setForm((f) => ({ ...f, totalRate }));
                }
              }}
              required
            />
          </FormField>
          <FormField id="tax-cgst" label="CGST %" required>
            <Input
              id="tax-cgst"
              type="number"
              step="0.01"
              value={form.cgstRate}
              onChange={(e) => setForm((f) => ({ ...f, cgstRate: e.target.value }))}
              required
            />
          </FormField>
          <FormField id="tax-sgst" label="SGST %" required>
            <Input
              id="tax-sgst"
              type="number"
              step="0.01"
              value={form.sgstRate}
              onChange={(e) => setForm((f) => ({ ...f, sgstRate: e.target.value }))}
              required
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
          {pending ? 'Saving…' : 'Add tax rate'}
        </Button>
      </form>
    </SurfaceCard>
  );
}
