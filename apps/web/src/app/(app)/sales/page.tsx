import Link from 'next/link';
import { Zap } from 'lucide-react';
import { canOverrideStock, canSell } from '@shelfledger/db';
import { requireSession } from '@/server/auth/guards';
import { saleService } from '@/server/services/sale';
import { customerService } from '@/server/services/customer';
import { masterService } from '@/server/services/masters';
import { inventoryService } from '@/server/services/inventory';
import { PageHeader } from '@/components/shared/page-header';
import { SectionHeader } from '@/components/shared/section-header';
import { buttonClassName } from '@/components/ui/button';
import { SaleForm } from '@/features/sales/sale-form';
import { SalesList } from '@/features/sales/sales-list';

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>;
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

  const [sales, customers, variants, taxRates] = await Promise.all([
    saleService.list(user),
    customerService.list(user),
    inventoryService.listVariants(user),
    masterService.listTaxRates(user),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales"
        description="Draft GST sale (CGST+SGST), capture payment, then post to decrement stock."
        actions={
          canWrite ? (
            <Link
              href="/sales/quick"
              className={buttonClassName({ size: 'lg', className: 'min-w-[8.5rem]' })}
            >
              <Zap className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              Quick Sale
            </Link>
          ) : null
        }
      />

      {canWrite ? (
        <section className="space-y-3">
          <SectionHeader
            title="Create draft"
            description="Overrides, partial pay, or multi-line edits — then post from the list."
          />
          <SaleForm
            canWrite={canWrite}
            canOverride={canOverride}
            customers={customers.map((c) => ({
              id: c.id,
              label: c.isWalkIn ? `${c.name} (walk-in)` : c.name,
            }))}
            variants={variants.map((v) => ({
              id: v.id,
              label: `${v.sku} — ${v.article.name} (${v.size}/${v.color})`,
              sellingPrice: Number(v.sellingPrice),
            }))}
            taxRates={taxRates.map((t) => ({ id: t.id, label: t.name }))}
          />
        </section>
      ) : null}

      <section className="space-y-3">
        <SectionHeader title="All sales" description="Search, filter, post drafts, open invoices." />
        <SalesList
          canWrite={canWrite}
          initialPayment={payment}
          rows={sales.map((sale) => ({
            id: sale.id,
            invoiceLabel: sale.status === 'DRAFT' ? 'DRAFT' : sale.invoiceNo,
            customerName: sale.customer.name,
            status: sale.status,
            paymentStatus: sale.paymentStatus,
            totalAmount: Number(sale.totalAmount),
          }))}
        />
      </section>
    </div>
  );
}
