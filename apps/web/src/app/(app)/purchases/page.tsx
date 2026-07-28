import Link from 'next/link';
import { PackagePlus } from 'lucide-react';
import { canManageInventory } from '@shelfledger/db';
import { requireSession } from '@/server/auth/guards';
import { purchaseService } from '@/server/services/purchase';
import { masterService } from '@/server/services/masters';
import { inventoryService } from '@/server/services/inventory';
import { PageHeader } from '@/components/shared/page-header';
import { SectionHeader } from '@/components/shared/section-header';
import { buttonClassName } from '@/components/ui/button';
import { PurchaseForm } from '@/features/purchases/purchase-form';
import { PurchasesList } from '@/features/purchases/purchases-list';

function filterContextLabel(status?: string): string | null {
  if (status === 'DRAFT') return 'Showing draft purchases only — post to receive stock';
  if (status === 'POSTED') return 'Showing posted purchases — use Return for outbound';
  return null;
}

export default async function PurchasesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireSession();
  const canWrite = canManageInventory(user.role);
  const params = await searchParams;
  const status =
    params.status === 'DRAFT' || params.status === 'POSTED' ? params.status : undefined;

  const [purchases, vendors, variants, taxRates] = await Promise.all([
    purchaseService.list(user),
    masterService.listVendors(user),
    inventoryService.listVariants(user),
    masterService.listTaxRates(user),
  ]);

  const draftCount = purchases.filter((p) => p.status === 'DRAFT').length;
  const contextLabel = filterContextLabel(status);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchases"
        description="Enter a vendor bill, then Post to receive stock and update average cost."
        actions={
          canWrite ? (
            <a href="#new-purchase" className={buttonClassName({ size: 'lg' })}>
              <PackagePlus className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              New purchase
            </a>
          ) : null
        }
      />

      {draftCount > 0 ? (
        <p className="text-xs text-muted-foreground">
          <Link href="/purchases?status=DRAFT" className="font-medium text-primary hover:underline">
            {draftCount} draft{draftCount === 1 ? '' : 's'} waiting to receive
          </Link>
        </p>
      ) : null}

      {contextLabel ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <span>{contextLabel}.</span>
          <Link href="/purchases" className="font-semibold text-primary hover:underline">
            Show all
          </Link>
        </div>
      ) : null}

      <section id="all-purchases" className="scroll-mt-24 space-y-3">
        <SectionHeader
          title="All purchases"
          description="Match vendor invoice #, post drafts to receive, or return posted lines."
        />
        <PurchasesList
          canWrite={canWrite}
          initialStatus={status}
          rows={purchases.map((p) => ({
            id: p.id,
            vendorName: p.vendor.name,
            vendorInvoiceNo: p.vendorInvoiceNo,
            vendorInvoiceDate: p.vendorInvoiceDate,
            status: p.status,
            lineCount: p.lines.length,
            totalAmount: Number(p.totalAmount),
            returnLines: p.lines.map((l) => ({
              id: l.id,
              label: l.variant.sku,
              qty: Number(l.qty),
            })),
          }))}
        />
      </section>

      {canWrite ? (
        <section id="new-purchase" className="scroll-mt-24 space-y-3">
          <SectionHeader
            title="New vendor bill"
            description="Lines are ex-GST. Saving creates a draft — Post from the list to put stock on the shelf."
          />
          <PurchaseForm
            canWrite={canWrite}
            vendors={vendors.map((v) => ({ id: v.id, label: v.name }))}
            variants={variants.map((v) => ({
              id: v.id,
              label: `${v.sku} — ${v.article.name} (${v.size}/${v.color})`,
            }))}
            taxRates={taxRates.map((t) => ({ id: t.id, label: t.name }))}
          />
        </section>
      ) : null}
    </div>
  );
}
