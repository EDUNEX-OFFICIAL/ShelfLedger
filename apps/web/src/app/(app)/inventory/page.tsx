import Link from 'next/link';
import { ClipboardList, SlidersHorizontal } from 'lucide-react';
import { canManageInventory } from '@shelfledger/db';
import { requireSession } from '@/server/auth/guards';
import { inventoryService } from '@/server/services/inventory';
import { PageHeader } from '@/components/shared/page-header';
import { SectionHeader } from '@/components/shared/section-header';
import { buttonClassName } from '@/components/ui/button';
import { OpeningStockForm, AdjustmentForm } from '@/features/inventory/inventory-forms';
import { InventoryBalancesList } from '@/features/inventory/inventory-list';

export default async function InventoryPage() {
  const user = await requireSession();
  const canWrite = canManageInventory(user.role);
  const [balances, variants] = await Promise.all([
    inventoryService.listBalances(user),
    inventoryService.listVariants(user),
  ]);

  const options = variants.map((v) => ({
    id: v.id,
    label: `${v.sku} — ${v.article.name} (${v.size}/${v.color})`,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Balances are maintained from the stock ledger. Never edit quantity directly."
        actions={
          canWrite ? (
            <div className="flex flex-wrap gap-2">
              <a href="#opening-stock" className={buttonClassName({ size: 'lg' })}>
                <ClipboardList className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                Opening stock
              </a>
              <a
                href="#adjustments"
                className={buttonClassName({ variant: 'secondary', size: 'md' })}
              >
                <SlidersHorizontal className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                Adjust
              </a>
            </div>
          ) : null
        }
      />

      {canWrite ? (
        <>
          <section id="opening-stock" className="scroll-mt-24 space-y-3">
            <SectionHeader
              title="Opening stock"
              description="First-time qty + unit cost for a SKU. Posts through the stock ledger."
            />
            <OpeningStockForm canWrite={canWrite} variants={options} />
          </section>

          <section id="adjustments" className="scroll-mt-24 space-y-3">
            <SectionHeader
              title="Adjustments"
              description="In, out, damage, or lost — reason required. Never edits qty outside the ledger."
            />
            <AdjustmentForm canWrite={canWrite} variants={options} />
          </section>
        </>
      ) : null}

      <section className="space-y-3">
        <SectionHeader
          title="On-hand balances"
          description="Avg cost × qty. Filter low stock or search SKU."
          actions={
            <Link
              href="/articles"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Manage SKUs
            </Link>
          }
        />
        <InventoryBalancesList
          canWrite={canWrite}
          rows={balances.map((b) => {
            const qty = Number(b.quantity);
            const threshold = Number(b.variant.lowStockThreshold);
            return {
              id: b.id,
              sku: b.variant.sku,
              articleName: b.variant.article.name,
              sizeColor: `${b.variant.size}/${b.variant.color}`,
              location: b.location.name,
              qty,
              avgUnitCost: Number(b.avgUnitCost),
              lowStock: threshold > 0 && qty <= threshold,
            };
          })}
        />
      </section>
    </div>
  );
}
