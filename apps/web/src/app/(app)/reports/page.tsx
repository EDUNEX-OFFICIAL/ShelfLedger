import { redirect } from 'next/navigation';
import { canViewReports } from '@shelfledger/db';
import { requireSession } from '@/server/auth/guards';
import { reportService } from '@/server/services/report';
import { PageHeader } from '@/components/shared/page-header';
import { SectionHeader } from '@/components/shared/section-header';
import { SurfaceCard } from '@/components/shared/surface-card';
import { MoneyText, formatInr } from '@/components/shared/money-text';
import { ReportFilters } from '@/features/reports/report-filters';
import {
  CashflowCompareChart,
  ExpenseCategoryChart,
  GstSplitChart,
  SalesTrendChart,
  TopStockValueChart,
} from '@/features/reports/charts';
import { KpiCard } from '@/features/dashboard/kpi-card';
import { ShoppingCart, Receipt, Percent, Warehouse } from 'lucide-react';

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setUTCDate(from.getUTCDate() - 30);
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Period summaries for sales, GST, purchases, stock, and expenses."
      />

      <section className="space-y-3">
        <SectionHeader title="Period" description="Defaults to last 30 days." />
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
          href="/sales"
          icon={Receipt}
          value={<MoneyText value={sales.total} compact />}
          status={`Profit est. ${formatInr(sales.profitEstimate, true)}`}
          statusTone="good"
          emphasis
        />
        <KpiCard
          title="GST (CGST+SGST)"
          href="/reports"
          icon={Percent}
          value={<MoneyText value={gst.taxAmount} compact />}
          status={`Taxable ${formatInr(gst.taxable, true)}`}
        />
        <KpiCard
          title="Stock valuation"
          href="/inventory"
          icon={Warehouse}
          value={<MoneyText value={valuation.totalValue} compact />}
          status={`${valuation.rows.length} positive balances`}
        />
      </section>

      <section className="space-y-3">
        <SectionHeader title="Trends" description={rangeLabel} />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SalesTrendChart data={salesTrend} title="Sales trend" description={rangeLabel} />
          </div>
          <GstSplitChart cgst={gst.cgst} sgst={gst.sgst} />
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeader title="Cashflow & mix" />
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

      <section className="space-y-3">
        <SectionHeader title="Sales & GST detail" description={rangeLabel} />
        <SurfaceCard padding="sm">
          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <p className="text-muted-foreground">
              Taxable:{' '}
              <MoneyText value={gst.taxable} className="text-foreground" />
            </p>
            <p className="text-muted-foreground">
              CGST: <MoneyText value={gst.cgst} className="text-foreground" />
            </p>
            <p className="text-muted-foreground">
              SGST: <MoneyText value={gst.sgst} className="text-foreground" />
            </p>
            <p className="text-muted-foreground">
              IGST (V1 N/A): <MoneyText value={gst.igst} className="text-foreground" />
            </p>
            <p className="text-muted-foreground">
              COGS snapshot: <MoneyText value={sales.cogs} className="text-foreground" />
            </p>
            <p className="text-muted-foreground">
              Profit estimate:{' '}
              <MoneyText value={sales.profitEstimate} className="text-foreground" />
            </p>
          </div>
        </SurfaceCard>
        <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/60 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Invoice</th>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium text-right">Taxable</th>
                <th className="px-3 py-2 font-medium text-right">Tax</th>
                <th className="px-3 py-2 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {sales.rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-muted-foreground">
                    No posted sales in range.
                  </td>
                </tr>
              ) : (
                sales.rows.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 font-mono text-xs">{r.invoiceNo}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {formatInvoiceDate(r.invoiceDate)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <MoneyText value={r.subtotal} />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <MoneyText value={r.taxAmount} />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <MoneyText value={r.totalAmount} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <SurfaceCard padding="md">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">Purchases</h3>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {purchases.purchaseCount} posted · <MoneyText value={purchases.total} />
          </p>
        </SurfaceCard>
        <SurfaceCard padding="md">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">Expenses</h3>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {expenses.count} entries · <MoneyText value={expenses.total} />
          </p>
        </SurfaceCard>
      </section>

      <section className="space-y-3">
        <SectionHeader
          title="Low stock"
          description="Variants at or below reorder threshold."
        />
        <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/60 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">SKU</th>
                <th className="px-3 py-2 font-medium">Article</th>
                <th className="px-3 py-2 font-medium text-right">Qty</th>
                <th className="px-3 py-2 font-medium text-right">Threshold</th>
              </tr>
            </thead>
            <tbody>
              {lowStock.rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-muted-foreground">
                    No variants below threshold.
                  </td>
                </tr>
              ) : (
                lowStock.rows.map((r) => (
                  <tr
                    key={`${r.variantId}-${r.location}`}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-3 py-2 font-mono text-xs">{r.sku}</td>
                    <td className="px-3 py-2">{r.articleName}</td>
                    <td className="px-3 py-2 text-right font-mono text-sm tabular-nums">
                      {r.qty}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-sm tabular-nums">
                      {r.threshold}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeader title="Stock valuation" description="Avg cost × on-hand qty." />
        <SurfaceCard padding="md">
          <p className="text-sm text-muted-foreground">
            {valuation.rows.length} positive balances ·{' '}
            <MoneyText value={valuation.totalValue} className="text-foreground" />
          </p>
        </SurfaceCard>
      </section>
    </div>
  );
}
