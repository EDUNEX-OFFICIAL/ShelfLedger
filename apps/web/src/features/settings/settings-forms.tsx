'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SurfaceCard } from '@/components/shared/surface-card';
import {
  updateOrgSettingsAction,
  updateSequenceAction,
  createTaxRateAction,
} from '@/features/admin/actions';

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
  const [pending, startTransition] = useTransition();

  if (!canWrite) {
    return (
      <SurfaceCard padding="md">
        <p className="text-sm text-muted-foreground">
          Read-only view. Ask a manager to change organization settings.
        </p>
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard padding="none" className="overflow-hidden">
      <form
        className="space-y-5 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          setMessage(null);
          startTransition(async () => {
            const result = await updateOrgSettingsAction({
              ...form,
              financialYearStartMonth: Number(form.financialYearStartMonth),
            });
            if (!result.ok) {
              setMessage(result.error);
              return;
            }
            setMessage(
              'Shop saved. Name updates on sidebar, login, invoices, and browser title.',
            );
            router.refresh();
          });
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Shop name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1">
            <Label>GSTIN</Label>
            <Input
              value={form.gstin}
              onChange={(e) => setForm((f) => ({ ...f, gstin: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label>State code</Label>
            <Input
              value={form.stateCode}
              onChange={(e) => setForm((f) => ({ ...f, stateCode: e.target.value }))}
              maxLength={2}
              required
            />
          </div>
          <div className="space-y-1">
            <Label>FY start month (1–12)</Label>
            <Input
              type="number"
              min={1}
              max={12}
              value={form.financialYearStartMonth}
              onChange={(e) =>
                setForm((f) => ({ ...f, financialYearStartMonth: e.target.value }))
              }
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Address line 1</Label>
            <Input
              value={form.addressLine1}
              onChange={(e) => setForm((f) => ({ ...f, addressLine1: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label>City</Label>
            <Input
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label>Pincode</Label>
            <Input
              value={form.pincode}
              onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label>Phone</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
        </div>
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
          {pending ? 'Saving…' : 'Save organization'}
        </Button>
      </form>
    </SurfaceCard>
  );
}

export function SequenceForm({ canWrite, sequences }: { canWrite: boolean; sequences: Seq[] }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [prefixes, setPrefixes] = useState<Record<string, string>>(
    Object.fromEntries(sequences.map((s) => [s.id, s.prefix])),
  );

  return (
    <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-card">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border bg-muted/60 text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Type</th>
            <th className="px-3 py-2 font-medium">FY</th>
            <th className="px-3 py-2 font-medium">Prefix</th>
            <th className="px-3 py-2 font-medium">Next #</th>
            <th className="px-3 py-2 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sequences.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-3 py-4 text-muted-foreground">
                No sequences yet — first posted sale creates one.
              </td>
            </tr>
          ) : (
            sequences.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0">
                <td className="px-3 py-2 font-mono text-xs">{s.docType}</td>
                <td className="px-3 py-2 font-mono text-xs">{s.fyLabel}</td>
                <td className="px-3 py-2">
                  {canWrite ? (
                    <Input
                      className="h-8 w-24"
                      value={prefixes[s.id] ?? s.prefix}
                      onChange={(e) =>
                        setPrefixes((p) => ({ ...p, [s.id]: e.target.value }))
                      }
                    />
                  ) : (
                    s.prefix
                  )}
                </td>
                <td className="px-3 py-2 font-mono text-sm tabular-nums">{s.nextNumber}</td>
                <td className="px-3 py-2 text-right">
                  {canWrite ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={pending}
                      onClick={() => {
                        setMessage(null);
                        startTransition(async () => {
                          const result = await updateSequenceAction({
                            id: s.id,
                            prefix: prefixes[s.id] ?? s.prefix,
                          });
                          if (!result.ok) setMessage(result.error);
                          else
                            setMessage(
                              'Prefix updated — applies to newly posted invoices only.',
                            );
                        });
                      }}
                    >
                      Save
                    </Button>
                  ) : null}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {message ? <p className="px-3 py-2 text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}

export function TaxRateForm({ canWrite }: { canWrite: boolean }) {
  const [form, setForm] = useState({
    name: '',
    totalRate: '18',
    cgstRate: '9',
    sgstRate: '9',
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
            const result = await createTaxRateAction({
              name: form.name,
              totalRate: Number(form.totalRate),
              cgstRate: Number(form.cgstRate),
              sgstRate: Number(form.sgstRate),
            });
            if (!result.ok) {
              setMessage(result.error);
              return;
            }
            setMessage('Tax rate added (existing invoices unchanged)');
            setForm({ name: '', totalRate: '18', cgstRate: '9', sgstRate: '9' });
          });
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Total %</Label>
            <Input
              type="number"
              step="0.01"
              value={form.totalRate}
              onChange={(e) => setForm((f) => ({ ...f, totalRate: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1">
            <Label>CGST %</Label>
            <Input
              type="number"
              step="0.01"
              value={form.cgstRate}
              onChange={(e) => setForm((f) => ({ ...f, cgstRate: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1">
            <Label>SGST %</Label>
            <Input
              type="number"
              step="0.01"
              value={form.sgstRate}
              onChange={(e) => setForm((f) => ({ ...f, sgstRate: e.target.value }))}
              required
            />
          </div>
        </div>
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
          {pending ? 'Saving…' : 'Add tax rate'}
        </Button>
      </form>
    </SurfaceCard>
  );
}
