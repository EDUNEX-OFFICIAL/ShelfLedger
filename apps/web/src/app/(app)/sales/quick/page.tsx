import Link from 'next/link';
import { canSell } from '@shelfledger/db';
import { requireSession } from '@/server/auth/guards';
import { inventoryService } from '@/server/services/inventory';
import { saleService } from '@/server/services/sale';
import { PageHeader } from '@/components/shared/page-header';
import { QuickSaleForm } from '@/features/sales/quick-sale-form';

function startOfLocalDay(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export default async function QuickSalePage() {
  const user = await requireSession();
  const canWrite = canSell(user.role);
  const [variants, balances, sales] = await Promise.all([
    inventoryService.listVariants(user),
    inventoryService.listBalances(user),
    saleService.list(user),
  ]);

  const onHandByVariant = new Map<string, number>();
  for (const b of balances) {
    onHandByVariant.set(
      b.variantId,
      (onHandByVariant.get(b.variantId) ?? 0) + Number(b.quantity),
    );
  }

  const weekAgo = new Date(startOfLocalDay().getTime() - 7 * 24 * 60 * 60 * 1000);
  const qtyByVariant = new Map<string, number>();
  for (const sale of sales) {
    if (sale.status !== 'POSTED') continue;
    const when = sale.invoiceDate ? new Date(sale.invoiceDate) : null;
    if (!when || when < weekAgo) continue;
    for (const line of sale.lines) {
      qtyByVariant.set(
        line.variantId,
        (qtyByVariant.get(line.variantId) ?? 0) + Number(line.qty),
      );
    }
  }
  const frequentVariantIds = [...qtyByVariant.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id]) => id);

  return (
    <div className="mx-auto max-w-lg space-y-6 md:max-w-3xl lg:max-w-5xl">
      <PageHeader
        title="Quick Sale"
        description="Scan items first — Walk-in or name + mobile, then punch."
        actions={
          <Link
            href="/sales#new-draft"
            className="text-xs font-medium text-muted-foreground/90 underline-offset-4 hover:text-primary hover:underline"
          >
            Full draft sale
          </Link>
        }
      />
      <QuickSaleForm
        canWrite={canWrite}
        frequentVariantIds={frequentVariantIds}
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
