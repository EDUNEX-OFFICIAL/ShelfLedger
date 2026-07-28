import Link from 'next/link';
import { CircleAlert, PackageMinus } from 'lucide-react';
import { SectionHeader } from '@/components/shared/section-header';
import { SurfaceCard } from '@/components/shared/surface-card';
import { MoneyText } from '@/components/shared/money-text';
import { buttonClassName } from '@/components/ui/button';

export type LowStockPeekRow = {
  sku: string;
  articleName: string;
  qty: number;
  threshold: number;
};

export type UnpaidPeekRow = {
  id: string;
  invoiceNo: string;
  customerName: string;
  due: number;
};

export function NeedsAttention({
  lowStockPeek,
  lowStockCount,
  unpaidPeek,
  unpaidCount,
}: {
  lowStockPeek: LowStockPeekRow[];
  lowStockCount: number;
  unpaidPeek: UnpaidPeekRow[];
  unpaidCount: number;
}) {
  if (lowStockCount === 0 && unpaidCount === 0) return null;

  return (
    <section className="space-y-3">
      <SectionHeader
        title="Needs attention"
        description="Open dues and stock below reorder — tap to act."
      />
      <div className="grid gap-3 md:grid-cols-2">
        {unpaidCount > 0 ? (
          <SurfaceCard padding="sm" className="border-l-4 border-l-warning bg-warning/[0.04]">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <CircleAlert className="h-4 w-4 text-warning" strokeWidth={1.75} aria-hidden />
                <p className="text-sm font-semibold tracking-tight">Unpaid / partial</p>
              </div>
              <Link
                href="/sales?payment=OPEN"
                className="text-xs font-semibold text-primary hover:underline"
              >
                View all ({unpaidCount})
              </Link>
            </div>
            <ul className="mt-3 divide-y divide-border/70">
              {unpaidPeek.map((row) => (
                <li key={row.id}>
                  <Link
                    href={`/sales/${row.id}/invoice`}
                    className="flex items-center justify-between gap-3 py-2 transition-colors hover:bg-muted/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-mono text-xs font-medium">{row.invoiceNo}</p>
                      <p className="truncate text-xs text-muted-foreground">{row.customerName}</p>
                    </div>
                    <MoneyText value={row.due} className="shrink-0 text-sm font-semibold" />
                  </Link>
                </li>
              ))}
            </ul>
          </SurfaceCard>
        ) : null}

        {lowStockCount > 0 ? (
          <SurfaceCard padding="sm" className="border-l-4 border-l-destructive bg-destructive/[0.04]">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <PackageMinus className="h-4 w-4 text-destructive" strokeWidth={1.75} aria-hidden />
                <p className="text-sm font-semibold tracking-tight">Low stock</p>
              </div>
              <Link
                href="/reports#low-stock"
                className="text-xs font-semibold text-primary hover:underline"
              >
                View all ({lowStockCount})
              </Link>
            </div>
            <ul className="mt-3 divide-y divide-border/70">
              {lowStockPeek.map((row) => (
                <li key={row.sku} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{row.articleName}</p>
                    <p className="truncate font-mono text-xs text-muted-foreground">{row.sku}</p>
                  </div>
                  <p className="shrink-0 font-mono text-sm tabular-nums text-destructive">
                    {row.qty}
                    <span className="text-muted-foreground">/{row.threshold}</span>
                  </p>
                </li>
              ))}
            </ul>
            {lowStockPeek.length === 0 ? (
              <Link
                href="/reports#low-stock"
                className={buttonClassName({
                  variant: 'secondary',
                  size: 'sm',
                  className: 'mt-2',
                })}
              >
                Open low-stock report
              </Link>
            ) : null}
          </SurfaceCard>
        ) : null}
      </div>
    </section>
  );
}
