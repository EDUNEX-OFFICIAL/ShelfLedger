import { ArrowLeftRight } from 'lucide-react';
import { canSell } from '@shelfledger/db';
import { requireSession } from '@/server/auth/guards';
import { exchangeService } from '@/server/services/exchange';
import { saleService } from '@/server/services/sale';
import { customerService } from '@/server/services/customer';
import { masterService } from '@/server/services/masters';
import { inventoryService } from '@/server/services/inventory';
import { PageHeader } from '@/components/shared/page-header';
import { SectionHeader } from '@/components/shared/section-header';
import { buttonClassName } from '@/components/ui/button';
import { ExchangeForm } from '@/features/exchanges/exchange-form';
import { ExchangesList } from '@/features/exchanges/exchanges-list';

export default async function ExchangesPage() {
  const user = await requireSession();
  const canWrite = canSell(user.role);
  const [exchanges, customers, sales, variants, taxRates] = await Promise.all([
    exchangeService.list(user),
    customerService.list(user),
    saleService.list(user),
    inventoryService.listVariants(user),
    masterService.listTaxRates(user),
  ]);

  const postedSales = sales
    .filter((s) => s.status === 'POSTED')
    .map((s) => ({
      id: s.id,
      customerId: s.customerId,
      label: `${s.invoiceNo} — ${s.customer.name} (₹${Number(s.totalAmount).toFixed(2)})`,
      lines: s.lines.map((l) => ({
        id: l.id,
        label: `${l.variant.sku} — ${l.variant.article.name}`,
        qty: Number(l.qty),
        unitPrice: Number(l.unitPrice),
      })),
    }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exchanges"
        description="Return against a posted sale and optionally replace. Updates stock both ways."
        actions={
          canWrite ? (
            <a href="#new-exchange" className={buttonClassName({ size: 'lg' })}>
              <ArrowLeftRight className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              New exchange
            </a>
          ) : null
        }
      />

      {canWrite ? (
        <section id="new-exchange" className="scroll-mt-24 space-y-3">
          <SectionHeader
            title="Post exchange"
            description="Pick the original invoice, return lines, and optional replacements."
          />
          <ExchangeForm
            canWrite={canWrite}
            customers={customers.map((c) => ({
              id: c.id,
              label: c.isWalkIn ? `${c.name} (walk-in)` : c.name,
            }))}
            sales={postedSales}
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
        <SectionHeader
          title="All exchanges"
          description="Search by customer or original invoice."
        />
        <ExchangesList
          canWrite={canWrite}
          rows={exchanges.map((ex) => ({
            id: ex.id,
            customerName: ex.customer.name,
            invoiceNo: ex.originalSale?.invoiceNo ?? '—',
            status: ex.status,
            differenceAmount: Number(ex.differenceAmount),
            lineCount: ex.lines.length,
          }))}
        />
      </section>
    </div>
  );
}
