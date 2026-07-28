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

/** Inset accent bar — keeps outer width identical to neutral cards. */
const surfaceToneClass: Record<StatusTone, string> = {
  neutral: '',
  good: '',
  warn: 'relative bg-warning/[0.04] before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:rounded-l-[inherit] before:bg-warning',
  alert:
    'relative bg-destructive/[0.04] before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:rounded-l-[inherit] before:bg-destructive',
};

export function KpiCard({
  title,
  href,
  icon: Icon,
  value,
  status,
  statusTone = 'neutral',
  emphasis: _emphasis = false,
}: {
  title: string;
  href: string;
  icon: LucideIcon;
  value: ReactNode;
  status: string;
  statusTone?: StatusTone;
  /** Kept for call-site compat; value size is unified across KPI cards. */
  emphasis?: boolean;
}) {
  return (
    <Link href={href} className="group flex h-full min-w-0">
      <SurfaceCard
        padding="md"
        interactive
        className={cn(
          'flex h-full w-full min-w-0 flex-col active:translate-y-0',
          surfaceToneClass[statusTone],
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {title}
          </p>
          <Icon
            className={cn(
              'mt-0.5 h-4 w-4 shrink-0 transition-colors',
              iconToneClass[statusTone],
            )}
            strokeWidth={1.75}
            aria-hidden
          />
        </div>

        <div
          className={cn(
            'mt-auto flex min-h-[2.5rem] items-end pt-4 font-semibold leading-none tracking-tight text-foreground',
            'text-[1.625rem] md:text-[1.75rem]',
          )}
        >
          <div className="min-w-0 overflow-hidden">{value}</div>
        </div>

        <p
          className={cn(
            'mt-3 line-clamp-2 min-h-[2.5rem] text-xs font-medium leading-snug',
            statusToneClass[statusTone],
          )}
        >
          <span
            className={cn(
              'mb-0.5 mr-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full align-middle',
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
    <Link href={href} className="group flex h-full min-w-0">
      <SurfaceCard
        padding="sm"
        interactive
        className="flex h-full w-full flex-col border-border/70 bg-card/70"
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
