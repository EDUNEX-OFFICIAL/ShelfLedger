import Link from 'next/link';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { SurfaceCard } from '@/components/shared/surface-card';
import { cn } from '@/lib/utils';

type StatusTone = 'neutral' | 'good' | 'warn' | 'alert';

const statusToneClass: Record<StatusTone, string> = {
  neutral: 'text-muted-foreground',
  good: 'text-success',
  warn: 'text-warning',
  alert: 'text-destructive',
};

const iconToneClass: Record<StatusTone, string> = {
  neutral: 'text-muted-foreground/70 group-hover:text-primary',
  good: 'text-success/80',
  warn: 'text-warning',
  alert: 'text-destructive',
};

const surfaceToneClass: Record<StatusTone, string> = {
  neutral: '',
  good: '',
  warn: 'border-l-4 border-l-warning bg-warning/[0.04]',
  alert: 'border-l-4 border-l-destructive bg-destructive/[0.04]',
};

export function KpiCard({
  title,
  href,
  icon: Icon,
  value,
  status,
  statusTone = 'neutral',
  emphasis = false,
}: {
  title: string;
  href: string;
  icon: LucideIcon;
  value: ReactNode;
  status: string;
  statusTone?: StatusTone;
  /** Slightly larger value — use for primary sales KPI. */
  emphasis?: boolean;
}) {
  return (
    <Link href={href} className="group block">
      <SurfaceCard
        padding="md"
        interactive
        className={cn(
          'flex min-h-[8.75rem] flex-col active:translate-y-0',
          surfaceToneClass[statusTone],
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {title}
          </p>
          <Icon
            className={cn(
              'mt-0.5 shrink-0 transition-colors',
              statusTone === 'alert' || statusTone === 'warn' ? 'h-5 w-5' : 'h-4 w-4',
              iconToneClass[statusTone],
            )}
            strokeWidth={1.75}
            aria-hidden
          />
        </div>

        <div
          className={cn(
            'mt-auto pt-4 font-semibold leading-none tracking-tight text-foreground',
            emphasis ? 'text-[1.625rem] md:text-[1.875rem]' : 'text-2xl md:text-[1.75rem]',
          )}
        >
          {value}
        </div>

        <p
          className={cn(
            'mt-3 flex items-center gap-1.5 text-xs font-medium',
            statusToneClass[statusTone],
          )}
        >
          <span
            className={cn(
              'inline-block h-1.5 w-1.5 shrink-0 rounded-full',
              statusTone === 'good' && 'bg-success',
              statusTone === 'warn' && 'bg-warning',
              statusTone === 'alert' && 'bg-destructive',
              statusTone === 'neutral' && 'bg-muted-foreground/40',
            )}
            aria-hidden
          />
          {status}
        </p>
      </SurfaceCard>
    </Link>
  );
}

export function MasterStatCard({
  title,
  href,
  icon: Icon,
  value,
}: {
  title: string;
  href: string;
  icon: LucideIcon;
  value: number;
}) {
  return (
    <Link href={href} className="group block">
      <SurfaceCard
        padding="sm"
        interactive
        className="flex flex-col border-border/70 bg-card/70"
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-medium text-muted-foreground">{title}</p>
          <Icon
            className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-muted-foreground"
            strokeWidth={1.75}
            aria-hidden
          />
        </div>
        <p className="mt-2.5 font-mono text-lg font-semibold tabular-nums leading-none tracking-tight">
          {value}
        </p>
      </SurfaceCard>
    </Link>
  );
}
