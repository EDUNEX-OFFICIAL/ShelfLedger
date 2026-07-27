import { requireSession } from '@/server/auth/guards';
import { inventoryService } from '@/server/services/inventory';
import { PageHeader } from '@/components/shared/page-header';

export default async function StockLedgerPage() {
  const user = await requireSession();
  const entries = await inventoryService.listLedger(user);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock ledger"
        description="Immutable movement history. Corrections are reverse entries, never deletes."
      />
      <div className="overflow-hidden rounded-md border border-border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/60 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">When</th>
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium">SKU</th>
              <th className="px-3 py-2 font-medium">Qty Δ</th>
              <th className="px-3 py-2 font-medium">Unit cost</th>
              <th className="px-3 py-2 font-medium">Ref</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-muted-foreground">
                  No ledger entries yet.
                </td>
              </tr>
            ) : (
              entries.map((e) => (
                <tr key={e.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 font-mono text-xs">
                    {e.occurredAt.toISOString().slice(0, 19).replace('T', ' ')}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{e.movementType}</td>
                  <td className="px-3 py-2 font-mono text-xs">{e.variant.sku}</td>
                  <td className="px-3 py-2 font-mono tabular-nums">{Number(e.qtyChange)}</td>
                  <td className="px-3 py-2 font-mono tabular-nums">
                    ₹{Number(e.unitCost).toFixed(4)}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                    {e.referenceType}:{e.referenceId.slice(0, 8)}
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
