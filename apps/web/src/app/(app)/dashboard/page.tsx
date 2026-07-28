import Link from 'next/link';
import {
  ShoppingCart,
  CircleAlert,
  PackageMinus,
  Warehouse,
  Tag,
  FolderTree,
  Layers,
  Box,
  Truck,
} from 'lucide-react';
import { requireSession } from '@/server/auth/guards';
import { masterService } from '@/server/services/masters';
import { PageHeader } from '@/components/shared/page-header';
import { SectionHeader } from '@/components/shared/section-header';
import { MoneyText, formatInr } from '@/components/shared/money-text';
import { StatusBadge } from '@/components/ui/badge';
import { buttonClassName } from '@/components/ui/button';
import { ResponsiveDataList } from '@/components/shared/responsive-data-list';
import {
  DashboardOptionalSections,
  DashboardQuickActions,
  DashboardRangeFilter,
  type DashboardRange,
} from '@/features/dashboard/dashboard-controls';
import { KpiCard, MasterStatCard } from '@/features/dashboard/kpi-card';
import { PaymentMixChart, SalesTrendChart } from '@/features/reports/charts';

function rangeBounds(range: DashboardRange): { from: Date; to: Date; label: string } {
  const to = new Date();
  const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate(), 23, 59, 59, 999));
  const startDay = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()));
  if (range === '7d') {
    const from = new Date(startDay);
    from.setUTCDate(from.getUTCDate() - 6);
    return { from, to: end, label: 'Last 7 days' };
  }
  if (range === '30d') {
    const from = new Date(startDay);
    from.setUTCDate(from.getUTCDate() - 29);
    return { from, to: end, label: 'Last 30 days' };
  }
  return { from: startDay, to: end, label: 'Today' };
}

function formatInvoiceDate(d: Date) {
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const user = await requireSession();
  const params = await searchParams;
  const range: DashboardRange =
    params.range === '7d' || params.range === '30d' || params.range === 'today'
      ? params.range
      : 'today';
  const bounds = rangeBounds(range);
  const [counts, ops] = await Promise.all([
    masterService.dashboard(user),
    masterService.opsDashboard(user, bounds.from, bounds.to),
  ]);

  const salesDeltaStatus = (() => {
    const base =
      ops.invoiceCount === 0
        ? `No invoices · ${bounds.label}`
        : `${ops.invoiceCount} invoice${ops.invoiceCount === 1 ? '' : 's'} · ${bounds.label}`;
    if (ops.salesDeltaPct == null) return base;
    const sign = ops.salesDeltaPct > 0 ? '+' : '';
    return `${base} · ${sign}${ops.salesDeltaPct}% vs prior`;
  })();

  const kpis = [
    {
      title: 'Sales',
      href: '/sales',
      icon: ShoppingCart,
      value: <MoneyText value={ops.salesTotal} compact />,
      status: salesDeltaStatus,
      statusTone:
        ops.salesDeltaPct == null
          ? ops.invoiceCount > 0
            ? ('good' as const)
            : ('neutral' as const)
          : ops.salesDeltaPct >= 0
            ? ('good' as const)
            : ('warn' as const),
      emphasis: true,
    },
    {
      title: 'Unpaid / partial',
      href: '/sales?payment=OPEN',
      icon: CircleAlert,
      value: <MoneyText value={ops.unpaidOutstanding} compact />,
      status:
        ops.unpaidCount > 0
          ? `${ops.unpaidCount} open · ${formatInr(ops.unpaidOutstanding, true)} due`
          : 'All clear',
      statusTone:
        ops.unpaidCount > 0 ? ('warn' as const) : ('good' as const),
    },
    {
      title: 'Low stock',
      href: '/reports#low-stock',
      icon: PackageMinus,
      value: (
        <span className="font-mono tabular-nums">{ops.lowStockCount}</span>
      ),
      status: ops.lowStockCount > 0 ? 'Below reorder threshold' : 'Stock levels healthy',
      statusTone:
        ops.lowStockCount > 0 ? ('alert' as const) : ('good' as const),
    },
    {
      title: 'Stock valuation',
      href: '/inventory',
      icon: Warehouse,
      value: <MoneyText value={ops.stockValue} compact />,
      status: 'Avg cost × on-hand qty',
      statusTone: 'neutral' as const,
    },
  ];

  const masters = [
    { title: 'Brands', value: counts.brands, href: '/brands', icon: Tag },
    { title: 'Categories', value: counts.categories, href: '/categories', icon: FolderTree },
    { title: 'Articles', value: counts.articles, href: '/articles', icon: Layers },
    { title: 'Variants', value: counts.variants, href: '/articles', icon: Box },
    { title: 'Vendors', value: counts.vendors, href: '/vendors', icon: Truck },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user.name}.`}
        actions={
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:items-end">
            <DashboardRangeFilter range={range} />
            <DashboardQuickActions />
          </div>
        }
      />

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.title} {...kpi} />
        ))}
      </section>

      <DashboardOptionalSections
        charts={
          <section className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <SalesTrendChart
                data={ops.salesByDay}
                title="Sales trend"
                description={`Daily posted totals · ${bounds.label}`}
              />
            </div>
            <PaymentMixChart data={ops.paymentMix} />
          </section>
        }
        masters={
          <section className="space-y-3">
            <SectionHeader
              title="Catalog"
              description="Quick counts — open a master to manage."
            />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {masters.map((card) => (
                <MasterStatCard key={card.title} {...card} />
              ))}
            </div>
          </section>
        }
      />

      <section className="space-y-3">
        <SectionHeader
          title="Recent sales"
          actions={
            <Link
              href="/sales"
              className="text-xs font-semibold text-primary hover:underline"
            >
              View all
            </Link>
          }
        />
        <ResponsiveDataList
          rows={ops.recentSales}
          isFiltered={false}
          emptyTitle="No posted sales yet"
          emptyDescription="Punch a Quick Sale to see activity here."
          emptyAction={
            <Link href="/sales/quick" className={buttonClassName({ size: 'md' })}>
              Quick Sale
            </Link>
          }
          mobileTitle={(r) => r.invoiceNo}
          mobileMeta={(r) => r.customerName}
          mobileTrailing={(r) => <StatusBadge status={r.paymentStatus} />}
          columns={[
            {
              id: 'invoice',
              header: 'Invoice',
              mobile: false,
              cell: (r) => (
                <Link
                  href={`/sales/${r.id}/invoice`}
                  className="font-mono text-xs hover:underline"
                >
                  {r.invoiceNo}
                </Link>
              ),
            },
            {
              id: 'customer',
              header: 'Customer',
              mobile: false,
              cell: (r) => r.customerName,
            },
            {
              id: 'date',
              header: 'Date',
              cell: (r) => (
                <span className="text-xs text-muted-foreground">
                  {formatInvoiceDate(r.invoiceDate)}
                </span>
              ),
            },
            {
              id: 'payment',
              header: 'Payment',
              mobile: false,
              cell: (r) => <StatusBadge status={r.paymentStatus} />,
            },
            {
              id: 'total',
              header: 'Total',
              className: 'text-right',
              cell: (r) => <MoneyText value={r.totalAmount} />,
            },
          ]}
        />
      </section>
    </div>
  );
}
