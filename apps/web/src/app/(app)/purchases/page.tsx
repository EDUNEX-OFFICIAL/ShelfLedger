import { canManageInventory } from '@shelfledger/db';
import { requireSession } from '@/server/auth/guards';
import { purchaseService } from '@/server/services/purchase';
import { masterService } from '@/server/services/masters';
import { inventoryService } from '@/server/services/inventory';
import { PageHeader } from '@/components/shared/page-header';
import { PurchaseForm } from '@/features/purchases/purchase-form';
import { PostPurchaseButton, ReturnPurchaseButton } from '@/features/purchases/purchase-actions';

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

      <div className="overflow-hidden rounded-md border border-border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/60 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Vendor</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Lines</th>
              <th className="px-3 py-2 font-medium">Total</th>
              <th className="px-3 py-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {purchases.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-muted-foreground">
                  No purchases yet. Create articles and a vendor first.
                </td>
              </tr>
            ) : (
              purchases.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 font-medium">{p.vendor.name}</td>
                  <td className="px-3 py-2 font-mono text-xs">{p.status}</td>
                  <td className="px-3 py-2">{p.lines.length}</td>
                  <td className="px-3 py-2 font-mono tabular-nums">
                    ₹{Number(p.totalAmount).toFixed(2)}
                  </td>
                  <td className="px-3 py-2">
                    {canWrite ? (
                      <div className="flex justify-end gap-2">
                        {p.status === 'DRAFT' ? <PostPurchaseButton purchaseId={p.id} /> : null}
                        {p.status === 'POSTED' ? (
                          <ReturnPurchaseButton
                            purchaseId={p.id}
                            lines={p.lines.map((l) => ({
                              id: l.id,
                              label: l.variant.sku,
                              qty: Number(l.qty),
                            }))}
                          />
                        ) : null}
                      </div>
                    ) : null}
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
