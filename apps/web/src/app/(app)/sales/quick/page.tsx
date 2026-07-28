import Link from 'next/link';
import { canSell } from '@shelfledger/db';
import { requireSession } from '@/server/auth/guards';
import { inventoryService } from '@/server/services/inventory';
import { PageHeader } from '@/components/shared/page-header';
import { QuickSaleForm } from '@/features/sales/quick-sale-form';

export default async function QuickSalePage() {
  const user = await requireSession();
  const canWrite = canSell(user.role);
  const [variants, balances] = await Promise.all([
    inventoryService.listVariants(user),
    inventoryService.listBalances(user),
  ]);

  const onHandByVariant = new Map<string, number>();
  for (const b of balances) {
    onHandByVariant.set(
      b.variantId,
      (onHandByVariant.get(b.variantId) ?? 0) + Number(b.quantity),
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 md:max-w-3xl lg:max-w-5xl">
      <PageHeader
        title="Quick Sale"
        description="Name, mobile, punch — customer saved for offers."
        actions={
          <Link
            href="/sales"
            className="text-xs font-medium text-muted-foreground/90 underline-offset-4 hover:text-primary hover:underline"
          >
            Full draft sale
          </Link>
        }
      />
      <QuickSaleForm
        canWrite={canWrite}
        variants={variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          barcode: v.barcode,
          label: `${v.sku} — ${v.article.name} (${v.size}/${v.color})`,
          sellingPrice: Number(v.sellingPrice),
          cgstRate: v.article.defaultTaxRate ? Number(v.article.defaultTaxRate.cgstRate) : 0,
          sgstRate: v.article.defaultTaxRate ? Number(v.article.defaultTaxRate.sgstRate) : 0,
          onHandQty: onHandByVariant.get(v.id) ?? 0,
        }))}
      />
    </div>
  );
}
