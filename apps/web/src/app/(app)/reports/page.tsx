import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ShoppingCart, Receipt, Percent, Warehouse } from 'lucide-react';
import { canViewReports } from '@shelfledger/db';
import { requireSession } from '@/server/auth/guards';
import { reportService } from '@/server/services/report';
import { PageHeader } from '@/components/shared/page-header';
import { SectionHeader } from '@/components/shared/section-header';
import { SurfaceCard } from '@/components/shared/surface-card';
import { MoneyText, formatInr } from '@/components/shared/money-text';
import { buttonClassName } from '@/components/ui/button';
import { ReportFilters } from '@/features/reports/report-filters';
import {
  CashflowCompareChart,
  ExpenseCategoryChart,
  GstSplitChart,
  SalesTrendChart,
  TopStockValueChart,
} from '@/features/reports/charts';
import { ReportsSalesList } from '@/features/reports/reports-sales-list';
import { ReportsLowStockList } from '@/features/reports/reports-low-stock-list';
import { KpiCard } from '@/features/dashboard/kpi-card';

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setUTCDate(from.getUTCDate() - 29);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

function formatReportDate(iso: string) {
  const d = new Date(`${iso}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function formatInvoiceDate(d: Date) {
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const user = await requireSession();
  if (!canViewReports(user.role)) {
    redirect('/dashboard');
  }

  const params = await searchParams;
  const defaults = defaultRange();
  const from = params.from && /^\d{4}-\d{2}-\d{2}$/.test(params.from) ? params.from : defaults.from;
  const to = params.to && /^\d{4}-\d{2}-\d{2}$/.test(params.to) ? params.to : defaults.to;
  const range = { from, to };
  const rangeLabel = `${formatReportDate(from)} → ${formatReportDate(to)}`;

  const [sales, gst, purchases, valuation, lowStock, expenses, salesTrend] = await Promise.all([
    reportService.sales(user, range),
    reportService.gst(user, range),
    reportService.purchases(user, range),
    reportService.stockValuation(user),
    reportService.lowStock(user),
    reportService.expenses(user, range),
    reportService.salesTrend(user, range),
  ]);

  const topStock = [...valuation.rows]
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)
    .map((r) => ({ label: r.sku, value: r.value }));

  const topValuation = [...valuation.rows].sort((a, b) => b.value - a.value).slice(0, 10);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Owner/manager period summaries — sales, GST (CGST+SGST), purchases, stock, expenses."
      />

      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>
          Period{' '}
          <span className="font-medium text-foreground">{rangeLabel}</span>
        </span>
        {lowStock.rows.length > 0 ? (
          <>
            <span className="text-border" aria-hidden>
              ·
            </span>
            <a href="#low-stock" className="font-medium text-warning hover:underline">
              {lowStock.rows.length} low stock
            </a>
          </>
        ) : null}
        <span className="text-border" aria-hidden>
          ·
        </span>
        <a href="#sales-gst" className="hover:underline">
          Sales & GST
        </a>
        <a href="#cashflow" className="hover:underline">
          Cashflow
        </a>
      </p>

      <section className="space-y-3">
        <SectionHeader
          title="Period"
          description="Presets use UTC calendar days. Custom for exact dates."
        />
        <ReportFilters from={from} to={to} />
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4">
        <KpiCard
          title="Sales invoices"
          href="/sales"
          icon={ShoppingCart}
          value={<span className="font-mono tabular-nums">{sales.invoiceCount}</span>}
          status={rangeLabel}
        />
        <KpiCard
          title="Sales total"
          href={`/reports?from=${from}&to=${to}#sales-gst`}
          icon={Receipt}
          value={<MoneyText value={sales.total} compact />}
          status={`Profit est. ${formatInr(sales.profitEstimate, true)}`}
          statusTone="good"
          emphasis
        />
        <KpiCard
          title="GST (CGST+SGST)"
          href={`/reports?from=${from}&to=${to}#sales-gst`}
          icon={Percent}
          value={<MoneyText value={gst.taxAmount} compact />}
          status={`Taxable ${formatInr(gst.taxable, true)}`}
        />
        <KpiCard
          title="Stock valuation"
          href={lowStock.rows.length > 0 ? '#low-stock' : '/inventory'}
          icon={Warehouse}
          value={<MoneyText value={valuation.totalValue} compact />}
          status={
            lowStock.rows.length > 0
              ? `${lowStock.rows.length} low stock`
              : `${valuation.rows.length} on-hand SKUs`
          }
          statusTone={lowStock.rows.length > 0 ? 'warn' : 'neutral'}
        />
      </section>

      <section id="trends" className="scroll-mt-24 space-y-3">
        <SectionHeader title="Trends" description={rangeLabel} />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SalesTrendChart data={salesTrend} title="Sales trend" description={rangeLabel} />
          </div>
          <GstSplitChart cgst={gst.cgst} sgst={gst.sgst} />
        </div>
      </section>

      <section id="cashflow" className="scroll-mt-24 space-y-3">
        <SectionHeader title="Cashflow & mix" description={rangeLabel} />
        <div className="grid gap-4 lg:grid-cols-3">
          <CashflowCompareChart
            sales={sales.total}
            purchases={purchases.total}
            expenses={expenses.total}
          />
          <ExpenseCategoryChart data={expenses.byCategory} />
          <TopStockValueChart data={topStock} />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Link href="/purchases" className="block">
          <SurfaceCard padding="md" className="transition hover:border-primary/40">
            <h3 className="text-sm font-semibold tracking-tight text-foreground">Purchases</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {purchases.purchaseCount} posted · <MoneyText value={purchases.total} />
            </p>
            <p className="mt-1 text-xs font-medium text-primary">Open purchases →</p>
          </SurfaceCard>
        </Link>
        <Link href="/expenses" className="block">
          <SurfaceCard padding="md" className="transition hover:border-primary/40">
            <h3 className="text-sm font-semibold tracking-tight text-foreground">Expenses</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {expenses.count} entries · <MoneyText value={expenses.total} />
            </p>
            <p className="mt-1 text-xs font-medium text-primary">Open expenses →</p>
          </SurfaceCard>
        </Link>
      </section>

      <section id="sales-gst" className="scroll-mt-24 space-y-3">
        <SectionHeader
          title="Sales & GST"
          description={`${rangeLabel} · V1 same-state CGST+SGST only`}
          actions={
            <Link href="/sales" className="text-xs font-semibold text-primary hover:underline">
              All sales
            </Link>
          }
        />
        <SurfaceCard padding="sm">
          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <p className="text-muted-foreground">
              Taxable: <MoneyText value={gst.taxable} className="text-foreground" />
            </p>
            <p className="text-muted-foreground">
              CGST: <MoneyText value={gst.cgst} className="text-foreground" />
            </p>
            <p className="text-muted-foreground">
              SGST: <MoneyText value={gst.sgst} className="text-foreground" />
            </p>
            <p className="text-muted-foreground">
              Tax total: <MoneyText value={gst.taxAmount} className="text-foreground" />
            </p>
            <p className="text-muted-foreground">
              COGS: <MoneyText value={sales.cogs} className="text-foreground" />
            </p>
            <p className="text-muted-foreground">
              Profit est.:{' '}
              <MoneyText value={sales.profitEstimate} className="text-foreground" />
            </p>
          </div>
        </SurfaceCard>
        <ReportsSalesList
          rows={sales.rows.map((r) => ({
            id: r.id,
            invoiceNo: r.invoiceNo,
            invoiceDateLabel: formatInvoiceDate(r.invoiceDate),
            subtotal: r.subtotal,
            taxAmount: r.taxAmount,
            totalAmount: r.totalAmount,
            paymentStatus: r.paymentStatus,
          }))}
        />
      </section>

      <section id="low-stock" className="scroll-mt-24 space-y-3">
        <SectionHeader
          title="Low stock"
          description="At or below reorder threshold (not period-scoped)."
          actions={
            <Link
              href="/inventory?stock=low"
              className={buttonClassName({ variant: 'secondary', size: 'sm' })}
            >
              Inventory
            </Link>
          }
        />
        {lowStock.rows.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-warning">{lowStock.rows.length}</span> SKU
            {lowStock.rows.length === 1 ? '' : 's'} need attention
          </p>
        ) : null}
        <ReportsLowStockList
          rows={lowStock.rows.map((r) => ({
            id: `${r.variantId}-${r.location}`,
            sku: r.sku,
            articleName: r.articleName,
            location: r.location,
            qty: r.qty,
            threshold: r.threshold,
          }))}
        />
      </section>

      <section id="stock-value" className="scroll-mt-24 space-y-3">
        <SectionHeader
          title="Top stock value"
          description="Avg cost × on-hand — snapshot, not period-scoped."
          actions={
            <Link href="/inventory" className="text-xs font-semibold text-primary hover:underline">
              All balances
            </Link>
          }
        />
        <SurfaceCard padding="md">
          <p className="mb-3 text-sm text-muted-foreground">
            {valuation.rows.length} positive balances ·{' '}
            <MoneyText value={valuation.totalValue} className="font-medium text-foreground" />
          </p>
          {topValuation.length === 0 ? (
            <p className="text-sm text-muted-foreground">No on-hand stock yet.</p>
          ) : (
            <ul className="divide-y divide-border/80">
              {topValuation.map((r) => (
                <li
                  key={`${r.variantId}-${r.location}`}
                  className="flex items-center justify-between gap-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-mono text-xs font-medium">{r.sku}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.articleName} · qty {r.qty}
                    </p>
                  </div>
                  <MoneyText value={r.value} className="shrink-0 font-medium" />
                </li>
              ))}
            </ul>
          )}
        </SurfaceCard>
      </section>
    </div>
  );
}
