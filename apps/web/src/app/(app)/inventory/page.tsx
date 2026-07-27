import { canManageInventory } from '@shelfledger/db';
import { requireSession } from '@/server/auth/guards';
import { inventoryService } from '@/server/services/inventory';
import { PageHeader } from '@/components/shared/page-header';
import { OpeningStockForm, AdjustmentForm } from '@/features/inventory/inventory-forms';

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
      />

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Opening stock</h2>
        <OpeningStockForm canWrite={canWrite} variants={options} />
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Adjustments</h2>
        <AdjustmentForm canWrite={canWrite} variants={options} />
      </div>

      <div className="overflow-hidden rounded-md border border-border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/60 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">SKU</th>
              <th className="px-3 py-2 font-medium">Article</th>
              <th className="px-3 py-2 font-medium">Location</th>
              <th className="px-3 py-2 font-medium">Qty</th>
              <th className="px-3 py-2 font-medium">Avg cost</th>
            </tr>
          </thead>
          <tbody>
            {balances.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-muted-foreground">
                  No stock balances yet. Post opening stock or a purchase.
                </td>
              </tr>
            ) : (
              balances.map((b) => (
                <tr key={b.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 font-mono text-xs">{b.variant.sku}</td>
                  <td className="px-3 py-2">
                    {b.variant.article.name}{' '}
                    <span className="text-muted-foreground">
                      ({b.variant.size}/{b.variant.color})
                    </span>
                  </td>
                  <td className="px-3 py-2">{b.location.name}</td>
                  <td className="px-3 py-2 font-mono tabular-nums">{Number(b.quantity)}</td>
                  <td className="px-3 py-2 font-mono tabular-nums">
                    ₹{Number(b.avgUnitCost).toFixed(4)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
