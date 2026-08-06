import Link from 'next/link';
import { canSell, searchRepository } from '@shelfledger/db';
import { requireSession } from '@/server/auth/guards';
import { saleService } from '@/server/services/sale';
import { PageHeader } from '@/components/shared/page-header';
import { QuickSaleForm } from '@/features/sales/quick-sale-form';

function startOfLocalDay(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export default async function QuickSalePage() {
  const user = await requireSession();
  const canWrite = canSell(user.role);
  const sales = await saleService.list(user);

  const weekAgo = new Date(startOfLocalDay().getTime() - 7 * 24 * 60 * 60 * 1000);
  const qtyByVariant = new Map<string, number>();
  const qtyByArticle = new Map<string, number>();
  for (const sale of sales) {
    if (sale.status !== 'POSTED') continue;
    const when = sale.invoiceDate ? new Date(sale.invoiceDate) : null;
    if (!when || when < weekAgo) continue;
    for (const line of sale.lines) {
      qtyByVariant.set(
        line.variantId,
        (qtyByVariant.get(line.variantId) ?? 0) + Number(line.qty),
      );
      const articleId = line.variant.articleId;
      if (articleId) {
        qtyByArticle.set(
          articleId,
          (qtyByArticle.get(articleId) ?? 0) + Number(line.qty),
        );
      }
    }
  }
  const frequentVariantIds = [...qtyByVariant.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id]) => id);
  const frequentArticleIds = [...qtyByArticle.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id]) => id);

  const [seedVariants, seedArticles] = await Promise.all([
    searchRepository.variantsByIds(user.organizationId, frequentVariantIds),
    searchRepository.articlesByIds(user.organizationId, frequentArticleIds),
  ]);

  return (
    <div className="mx-auto max-w-lg space-y-4 md:max-w-3xl md:space-y-6 lg:max-w-5xl">
      <PageHeader
        title="Quick Sale"
        description="Add items — Walk-in by default. Punch when ready. Print optional."
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
        frequentArticleIds={frequentArticleIds}
        seedVariants={seedVariants}
        seedArticles={seedArticles}
      />
    </div>
  );
}
