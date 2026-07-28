import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

type BadgeVariant = 'default' | 'muted' | 'success' | 'warning' | 'destructive' | 'primary';

const variants: Record<BadgeVariant, string> = {
  default: 'bg-secondary text-secondary-foreground ring-1 ring-inset ring-border/80',
  muted: 'bg-muted text-muted-foreground ring-1 ring-inset ring-border/70',
  success: 'bg-success/18 text-success ring-1 ring-inset ring-success/30',
  warning: 'bg-warning/15 text-warning ring-1 ring-inset ring-warning/30',
  destructive: 'bg-destructive/12 text-destructive ring-1 ring-inset ring-destructive/25',
  primary: 'bg-accent text-accent-foreground ring-1 ring-inset ring-primary/20',
};

export function Badge({
  className,
  variant = 'default',
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold leading-none tracking-wide',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

const docStatus: Record<string, BadgeVariant> = {
  DRAFT: 'muted',
  POSTED: 'success',
  VOIDED: 'destructive',
};

const payStatus: Record<string, BadgeVariant> = {
  PAID: 'success',
  PARTIAL: 'warning',
  UNPAID: 'warning',
};

const statusLabel: Record<string, string> = {
  DRAFT: 'Draft',
  POSTED: 'Posted',
  VOIDED: 'Voided',
  PAID: 'Paid',
  PARTIAL: 'Partial',
  UNPAID: 'Unpaid',
};

export function StatusBadge({ status }: { status: string }) {
  const variant = docStatus[status] ?? payStatus[status] ?? 'default';
  return <Badge variant={variant}>{statusLabel[status] ?? status}</Badge>;
}
