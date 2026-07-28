import Link from 'next/link';
import { canSell } from '@shelfledger/db';
import { requireSession } from '@/server/auth/guards';
import { inventoryService } from '@/server/services/inventory';
import { PageHeader } from '@/components/shared/page-header';
import { buttonClassName } from '@/components/ui/button';
import { QuickSaleForm } from '@/features/sales/quick-sale-form';

export default async function QuickSalePage() {
  const user = await requireSession();
  const canWrite = canSell(user.role);
  const variants = await inventoryService.listVariants(user);

  return (
    <div className="mx-auto max-w-lg space-y-6 md:max-w-xl">
      <PageHeader
        title="Quick Sale"
        description="Capture name & mobile, punch the bill — customer saved for offers later."
        actions={
          <Link href="/sales" className={buttonClassName({ variant: 'secondary', size: 'md' })}>
            Full draft sale
          </Link>
        }
      />
      <QuickSaleForm
        canWrite={canWrite}
        variants={variants.map((v) => ({
          id: v.id,
          label: `${v.sku} — ${v.article.name} (${v.size}/${v.color})`,
          sellingPrice: Number(v.sellingPrice),
          cgstRate: v.article.defaultTaxRate ? Number(v.article.defaultTaxRate.cgstRate) : 0,
          sgstRate: v.article.defaultTaxRate ? Number(v.article.defaultTaxRate.sgstRate) : 0,
        }))}
      />
    </div>
  );
}
