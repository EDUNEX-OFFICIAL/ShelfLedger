import Link from 'next/link';
import { ClipboardList, ScrollText, SlidersHorizontal } from 'lucide-react';
import { canManageInventory } from '@shelfledger/db';
import { requireSession } from '@/server/auth/guards';
import { inventoryService } from '@/server/services/inventory';
import { PageHeader } from '@/components/shared/page-header';
import { SectionHeader } from '@/components/shared/section-header';
import { MoneyText } from '@/components/shared/money-text';
import { buttonClassName } from '@/components/ui/button';
import { InventoryActionPanel } from '@/features/inventory/inventory-action-panel';
import { OpeningStockForm, AdjustmentForm } from '@/features/inventory/inventory-forms';
import { InventoryBalancesList } from '@/features/inventory/inventory-list';

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ stock?: string }>;
}) {
  const user = await requireSession();
  const canWrite = canManageInventory(user.role);
  const params = await searchParams;
  const initialStock =
    params.stock === 'low' || params.stock === 'ok' ? params.stock : undefined;

  const balances = await inventoryService.listBalances(user);
  let stockValue = 0;
  let lowCount = 0;
  const rows = balances.map((b) => {
    const qty = Number(b.quantity);
    const avg = Number(b.avgUnitCost);
    const threshold = Number(b.variant.lowStockThreshold);
    const lowStock = threshold > 0 && qty <= threshold;
    if (lowStock) lowCount += 1;
    stockValue += qty * avg;
    return {
      id: b.id,
      sku: b.variant.sku,
      articleName: b.variant.article.name,
      sizeColor: `${b.variant.size}/${b.variant.color}`,
      location: b.location.name,
      qty,
      avgUnitCost: avg,
      lowStock,
    };
  });
  stockValue = Math.round((stockValue + Number.EPSILON) * 100) / 100;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="On-hand qty from stock history — never edit balances directly."
        actions={
          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
            {canWrite ? (
              <>
                <a href="#opening-stock" className={buttonClassName({ size: 'lg' })}>
                  <ClipboardList className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                  Starting stock
                </a>
                <a
                  href="#adjustments"
                  className={buttonClassName({ variant: 'secondary', size: 'md' })}
                >
                  <SlidersHorizontal className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                  Adjust
                </a>
              </>
            ) : null}
            <Link
              href="/stock-ledger"
              className={buttonClassName({ variant: 'ghost', size: 'md' })}
            >
              <ScrollText className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              History
            </Link>
          </div>
        }
      />

      {balances.length > 0 ? (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>
            On-hand value{' '}
            <MoneyText value={stockValue} className="font-medium text-foreground" />
          </span>
          {lowCount > 0 ? (
            <>
              <span className="text-border" aria-hidden>
                ·
              </span>
              <Link
                href="/inventory?stock=low"
                className="font-medium text-destructive hover:underline"
              >
                {lowCount} low stock
              </Link>
            </>
          ) : (
            <>
              <span className="text-border" aria-hidden>
                ·
              </span>
              <span className="text-success">Stock levels healthy</span>
            </>
          )}
        </p>
      ) : null}

      {initialStock === 'low' ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <span>Showing low-stock item codes only.</span>
          <Link href="/inventory" className="font-semibold text-primary hover:underline">
            Show all
          </Link>
        </div>
      ) : null}

      <section id="balances" className="scroll-mt-24 space-y-3">
        <SectionHeader
          title="On-hand balances"
          description="Search an item code to see qty. Low stock is highlighted."
          actions={
            <Link
              href="/articles"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Manage item codes
            </Link>
          }
        />
        <InventoryBalancesList
          canWrite={canWrite}
          initialStock={initialStock}
          rows={rows}
        />
      </section>

      {canWrite ? (
        <>
          <InventoryActionPanel
            id="opening-stock"
            title="Starting stock"
            description="First-time qty + unit cost for an item code. Saved in stock history."
          >
            <OpeningStockForm canWrite={canWrite} />
          </InventoryActionPanel>

          <InventoryActionPanel
            id="adjustments"
            title="Adjustments"
            description="In, out, damage, or lost — reason required. Always saved in stock history."
          >
            <AdjustmentForm canWrite={canWrite} />
          </InventoryActionPanel>
        </>
      ) : null}
    </div>
  );
}
