import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

type BadgeVariant = 'default' | 'muted' | 'success' | 'warning' | 'destructive' | 'primary';

const variants: Record<BadgeVariant, string> = {
  default: 'bg-secondary text-secondary-foreground',
  muted: 'bg-muted text-muted-foreground',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  destructive: 'bg-destructive/15 text-destructive',
  primary: 'bg-accent text-accent-foreground',
};

export function Badge({
  className,
  variant = 'default',
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
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
  UNPAID: 'muted',
};

export function StatusBadge({ status }: { status: string }) {
  const variant = docStatus[status] ?? payStatus[status] ?? 'default';
  return <Badge variant={variant}>{status}</Badge>;
}
