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

export default async function PurchasesPage() {
  const user = await requireSession();
  const canWrite = canManageInventory(user.role);
  const [purchases, vendors, variants, taxRates] = await Promise.all([
    purchaseService.list(user),
    masterService.listVendors(user),
    inventoryService.listVariants(user),
    masterService.listTaxRates(user),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchases"
        description="Draft then post. Posting writes stock ledger and updates average cost."
        actions={
          canWrite ? (
            <a href="#new-purchase" className={buttonClassName({ size: 'lg' })}>
              <PackagePlus className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              New purchase
            </a>
          ) : null
        }
      />

      {canWrite ? (
        <section id="new-purchase" className="scroll-mt-24 space-y-3">
          <SectionHeader
            title="Create draft"
            description="Vendor invoice details and lines (ex-GST). Post from the list to receive stock."
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

      <section className="space-y-3">
        <SectionHeader
          title="All purchases"
          description="Search by vendor, post drafts, or return posted lines."
        />
        <PurchasesList
          canWrite={canWrite}
          rows={purchases.map((p) => ({
            id: p.id,
            vendorName: p.vendor.name,
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
    </div>
  );
}
