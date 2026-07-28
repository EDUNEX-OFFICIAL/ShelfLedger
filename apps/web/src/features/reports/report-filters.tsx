'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SurfaceCard } from '@/components/shared/surface-card';

export function ReportFilters({ from, to }: { from: string; to: string }) {
  const router = useRouter();
  const [range, setRange] = useState({ from, to });
  const [pending, startTransition] = useTransition();

  return (
    <SurfaceCard padding="sm">
      <form
        className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          startTransition(() => {
            const qs = new URLSearchParams({ from: range.from, to: range.to });
            router.push(`/reports?${qs.toString()}`);
          });
        }}
      >
        <div className="min-w-[10rem] flex-1 space-y-1 sm:max-w-[11rem]">
          <Label htmlFor="report-from">From</Label>
          <Input
            id="report-from"
            type="date"
            value={range.from}
            onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
            required
          />
        </div>
        <div className="min-w-[10rem] flex-1 space-y-1 sm:max-w-[11rem]">
          <Label htmlFor="report-to">To</Label>
          <Input
            id="report-to"
            type="date"
            value={range.to}
            onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
            required
          />
        </div>
        <Button type="submit" size="md" disabled={pending}>
          {pending ? 'Loading…' : 'Apply'}
        </Button>
      </form>
    </SurfaceCard>
  );
}
