import Link from 'next/link';
import { requireSession } from '@/server/auth/guards';
import { inventoryService } from '@/server/services/inventory';
import { PageHeader } from '@/components/shared/page-header';
import { SectionHeader } from '@/components/shared/section-header';
import { StockLedgerList } from '@/features/inventory/stock-ledger-list';

export default async function StockLedgerPage() {
  const user = await requireSession();
  const entries = await inventoryService.listLedger(user);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock ledger"
        description="Immutable movement history. Corrections are reverse entries, never deletes."
      />
      <section className="space-y-3">
        <SectionHeader
          title="Movements"
          description="Every qty change is a ledger row."
          actions={
            <Link
              href="/inventory"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Balances
            </Link>
          }
        />
        <StockLedgerList
          rows={entries.map((e) => ({
            id: e.id,
            when: e.occurredAt.toISOString(),
            movementType: e.movementType,
            sku: e.variant.sku,
            qtyChange: Number(e.qtyChange),
            unitCost: Number(e.unitCost),
            ref: `${e.referenceType}:${e.referenceId.slice(0, 8)}`,
          }))}
        />
      </section>
    </div>
  );
}
