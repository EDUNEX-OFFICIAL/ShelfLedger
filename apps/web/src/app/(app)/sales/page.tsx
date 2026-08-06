import Link from 'next/link';
import { FilePenLine, Zap } from 'lucide-react';
import { canOverrideStock, canSell } from '@shelfledger/db';
import { requireSession } from '@/server/auth/guards';
import { saleService } from '@/server/services/sale';
import { customerService } from '@/server/services/customer';
import { masterService } from '@/server/services/masters';
import { PageHeader } from '@/components/shared/page-header';
import { SectionHeader } from '@/components/shared/section-header';
import { buttonClassName } from '@/components/ui/button';
import { DraftSalePanel } from '@/features/sales/draft-sale-panel';
import { SaleForm } from '@/features/sales/sale-form';
import { SalesList } from '@/features/sales/sales-list';

function filterContextLabel(payment?: string, status?: string): string | null {
  if (status === 'DRAFT' && !payment) return 'Showing draft sales only';
  if (status === 'POSTED' && payment === 'OPEN') return 'Showing posted sales with open dues';
  if (payment === 'OPEN') return 'Showing unpaid / partial sales';
  if (payment === 'PAID') return 'Showing paid sales';
  if (payment === 'PARTIAL') return 'Showing partially paid sales';
  if (payment === 'UNPAID') return 'Showing unpaid sales';
  if (status === 'POSTED') return 'Showing posted sales only';
  return null;
}

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string; status?: string }>;
}) {
  const user = await requireSession();
  const canWrite = canSell(user.role);
  const canOverride = canOverrideStock(user.role);
  const params = await searchParams;
  const payment =
    params.payment === 'OPEN' ||
    params.payment === 'PAID' ||
    params.payment === 'PARTIAL' ||
    params.payment === 'UNPAID'
      ? params.payment
      : undefined;
  const status =
    params.status === 'DRAFT' || params.status === 'POSTED' ? params.status : undefined;

  const [sales, customers, taxRates] = await Promise.all([
    saleService.list(user),
    customerService.list(user),
    masterService.listTaxRates(user),
  ]);

  const draftCount = sales.filter((s) => s.status === 'DRAFT').length;
  const openCount = sales.filter(
    (s) =>
      s.status === 'POSTED' &&
      (s.paymentStatus === 'UNPAID' || s.paymentStatus === 'PARTIAL'),
  ).length;
  const contextLabel = filterContextLabel(payment, status);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales"
        description="Find invoices, post drafts, chase open dues. Walk-in paid bills → Quick Sale."
        actions={
          canWrite ? (
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
              <Link
                href="/sales/quick"
                className={buttonClassName({ size: 'lg', className: 'min-w-[8.5rem]' })}
              >
                <Zap className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                Quick Sale
              </Link>
              <a
                href="#new-draft"
                className={buttonClassName({ variant: 'secondary', size: 'md' })}
              >
                <FilePenLine className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                New draft
              </a>
            </div>
          ) : null
        }
      />

      {draftCount > 0 || openCount > 0 ? (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {draftCount > 0 ? (
            <Link href="/sales?status=DRAFT" className="font-medium text-primary hover:underline">
              {draftCount} draft{draftCount === 1 ? '' : 's'} to post
            </Link>
          ) : null}
          {draftCount > 0 && openCount > 0 ? (
            <span className="text-border" aria-hidden>
              ·
            </span>
          ) : null}
          {openCount > 0 ? (
            <Link href="/sales?payment=OPEN" className="font-medium text-primary hover:underline">
              {openCount} open due{openCount === 1 ? '' : 's'}
            </Link>
          ) : null}
        </p>
      ) : null}

      {contextLabel ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <span>{contextLabel}.</span>
          <Link href="/sales" className="font-semibold text-primary hover:underline">
            Show all
          </Link>
        </div>
      ) : null}

      <section id="all-sales" className="scroll-mt-24 space-y-3">
        <SectionHeader
          title="All sales"
          description="Search invoice or customer. Tap a posted bill for the invoice."
        />
        <SalesList
          canWrite={canWrite}
          initialPayment={payment}
          initialStatus={status}
          rows={sales.map((sale) => {
            const totalAmount = Number(sale.totalAmount);
            const paid = sale.payments.reduce((s, p) => s + Number(p.amount), 0);
            const dueAmount = Math.max(0, totalAmount - paid);
            return {
              id: sale.id,
              invoiceLabel: sale.status === 'DRAFT' ? 'DRAFT' : sale.invoiceNo,
              customerName: sale.customer.name,
              status: sale.status,
              paymentStatus: sale.paymentStatus,
              totalAmount,
              dueAmount,
              invoiceDate: sale.invoiceDate,
            };
          })}
        />
      </section>

      {canWrite ? (
        <DraftSalePanel
          title="Advanced draft"
          description="Unpaid/partial, stock override, or multi-line edits. Prefer Quick Sale for walk-in paid bills."
        >
          <SaleForm
            canWrite={canWrite}
            canOverride={canOverride}
            customers={customers.map((c) => ({
              id: c.id,
              label: c.isWalkIn ? `${c.name} (walk-in)` : c.name,
            }))}
            taxRates={taxRates.map((t) => ({
              id: t.id,
              label: t.name,
              cgstRate: Number(t.cgstRate),
              sgstRate: Number(t.sgstRate),
            }))}
          />
        </DraftSalePanel>
      ) : null}
    </div>
  );
}
