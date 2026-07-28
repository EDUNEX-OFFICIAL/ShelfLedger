import { cn } from '@/lib/utils';

export function formatInr(value: number, compact = false): string {
  if (!Number.isFinite(value)) return compact ? '₹0' : '₹0.00';
  if (compact) {
    const abs = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(2)}Cr`;
    if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(1)}L`;
    if (abs >= 1000) return `${sign}₹${(abs / 1000).toFixed(1)}k`;
    return `${sign}₹${abs.toFixed(abs % 1 === 0 ? 0 : 2)}`;
  }
  return `₹${value.toFixed(2)}`;
}

export function MoneyText({
  value,
  className,
  compact = false,
}: {
  value: number | string;
  className?: string;
  /** Short form for dense KPIs (₹1.2L). Full precision via title tooltip. */
  compact?: boolean;
}) {
  const n = typeof value === 'string' ? Number(value) : value;
  const full = formatInr(Number.isFinite(n) ? n : 0, false);
  const display = formatInr(Number.isFinite(n) ? n : 0, compact);
  return (
    <span className={cn('font-mono tabular-nums', className)} title={compact ? full : undefined}>
      {display}
    </span>
  );
}

export function SkuText({ value, className }: { value: string; className?: string }) {
  return <span className={cn('font-mono text-xs', className)}>{value}</span>;
}
