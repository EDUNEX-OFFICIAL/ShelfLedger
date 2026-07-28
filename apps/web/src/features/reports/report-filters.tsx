'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/shared/form-field';
import { SegmentedControl } from '@/components/shared/segmented-control';
import { SurfaceCard } from '@/components/shared/surface-card';

export type ReportPreset = 'today' | '7d' | '30d' | 'month' | 'custom';

function utcYmd(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function rangeForPreset(preset: Exclude<ReportPreset, 'custom'>): {
  from: string;
  to: string;
} {
  const now = new Date();
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const from = new Date(to);

  if (preset === 'today') {
    return { from: utcYmd(from), to: utcYmd(to) };
  }
  if (preset === '7d') {
    from.setUTCDate(from.getUTCDate() - 6);
    return { from: utcYmd(from), to: utcYmd(to) };
  }
  if (preset === '30d') {
    from.setUTCDate(from.getUTCDate() - 29);
    return { from: utcYmd(from), to: utcYmd(to) };
  }
  // month
  from.setUTCDate(1);
  return { from: utcYmd(from), to: utcYmd(to) };
}

export function detectPreset(from: string, to: string): ReportPreset {
  for (const p of ['today', '7d', '30d', 'month'] as const) {
    const r = rangeForPreset(p);
    if (r.from === from && r.to === to) return p;
  }
  return 'custom';
}

const PRESETS: { value: ReportPreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: 'month', label: 'Month' },
  { value: 'custom', label: 'Custom' },
];

function pushRange(router: ReturnType<typeof useRouter>, from: string, to: string) {
  const qs = new URLSearchParams({ from, to });
  const hash = typeof window !== 'undefined' ? window.location.hash : '';
  router.push(`/reports?${qs.toString()}${hash}`);
}

export function ReportFilters({ from, to }: { from: string; to: string }) {
  const router = useRouter();
  const [preset, setPreset] = useState<ReportPreset>(() => detectPreset(from, to));
  const [range, setRange] = useState({ from, to });
  const [pending, startTransition] = useTransition();

  return (
    <SurfaceCard padding="sm" className="space-y-3">
      <SegmentedControl
        ariaLabel="Report period"
        value={preset}
        options={PRESETS}
        size="sm"
        className="w-full max-w-full flex-wrap sm:w-auto"
        onChange={(value) => {
          setPreset(value);
          if (value === 'custom') return;
          const next = rangeForPreset(value);
          setRange(next);
          startTransition(() => pushRange(router, next.from, next.to));
        }}
      />

      {preset === 'custom' ? (
        <form
          className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(() => pushRange(router, range.from, range.to));
          }}
        >
          <FormField id="report-from" label="From" className="min-w-[10rem] flex-1 sm:max-w-[11rem]">
            <Input
              id="report-from"
              type="date"
              value={range.from}
              onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
              required
            />
          </FormField>
          <FormField id="report-to" label="To" className="min-w-[10rem] flex-1 sm:max-w-[11rem]">
            <Input
              id="report-to"
              type="date"
              value={range.to}
              onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
              required
            />
          </FormField>
          <Button type="submit" size="md" disabled={pending}>
            {pending ? 'Loading…' : 'Apply'}
          </Button>
        </form>
      ) : (
        <p className="text-xs text-muted-foreground">
          {from} → {to}
          {' · '}
          <button
            type="button"
            className="font-medium text-primary hover:underline"
            onClick={() => setPreset('custom')}
          >
            Pick dates
          </button>
        </p>
      )}
    </SurfaceCard>
  );
}
