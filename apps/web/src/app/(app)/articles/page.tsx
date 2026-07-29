import Link from 'next/link';
import { Layers, Package } from 'lucide-react';
import { canManageMasters } from '@shelfledger/db';
import { requireSession } from '@/server/auth/guards';
import { masterService } from '@/server/services/masters';
import { PageHeader } from '@/components/shared/page-header';
import { SectionHeader } from '@/components/shared/section-header';
import { buttonClassName } from '@/components/ui/button';
import { ArticleForm } from '@/features/articles/article-form';
import { ArticlesList } from '@/features/articles/articles-list';

export default async function ArticlesPage() {
  const user = await requireSession();
  const canWrite = canManageMasters(user.role);
  const [articles, brands, categories, taxRates] = await Promise.all([
    masterService.listArticles(user),
    masterService.listBrands(user),
    masterService.listCategories(user),
    masterService.listTaxRates(user),
  ]);

  const totalVariants = articles.reduce((n, a) => n + a.variants.length, 0);
  const brandNames = Array.from(new Set(articles.map((a) => a.brand.name))).sort((a, b) =>
    a.localeCompare(b),
  );
  const categoryNames = Array.from(new Set(articles.map((a) => a.category.name))).sort((a, b) =>
    a.localeCompare(b),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Articles"
        description="Footwear styles with size × colour item codes. Quantity lives in Inventory / stock history — not on this page."
        actions={
          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
            {canWrite ? (
              <a href="#new-article" className={buttonClassName({ size: 'lg' })}>
                <Layers className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                Add article
              </a>
            ) : null}
            <Link
              href="/inventory"
              className={buttonClassName({ variant: 'secondary', size: 'md' })}
            >
              <Package className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              Stock
            </Link>
          </div>
        }
      />

      {articles.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{articles.length}</span> style
          {articles.length === 1 ? '' : 's'}
          {' · '}
          <span className="font-medium text-foreground">{totalVariants}</span> item code
          {totalVariants === 1 ? '' : 's'}
        </p>
      ) : null}

      <section id="all-articles" className="scroll-mt-24 space-y-3">
        <SectionHeader
          title="All articles"
          description="Search by name, article code, or item code. Filter by brand or category."
          actions={
            <div className="flex flex-wrap gap-2">
              <Link href="/brands" className="text-xs font-semibold text-primary hover:underline">
                Brands
              </Link>
              <Link
                href="/categories"
                className="text-xs font-semibold text-primary hover:underline"
              >
                Categories
              </Link>
            </div>
          }
        />
        <ArticlesList
          canWrite={canWrite}
          brands={brandNames}
          categories={categoryNames}
          rows={articles.map((article) => ({
            id: article.id,
            name: article.name,
            articleCode: article.articleCode,
            brandName: article.brand.name,
            categoryName: article.category.name,
            variantCount: article.variants.length,
            variantSummary:
              article.variants
                .slice(0, 3)
                .map((v) => `${v.size}/${v.color}`)
                .join(', ') + (article.variants.length > 3 ? '…' : ''),
            searchBlob: article.variants
              .map((v) => `${v.sku} ${v.barcode ?? ''} ${v.size} ${v.color}`)
              .join(' '),
          }))}
        />
      </section>

      {canWrite ? (
        <section id="new-article" className="scroll-mt-24 space-y-3">
          <SectionHeader
            title="Add article"
            description="Style + brand/category, then size × colour (item code, MRP, sell price)."
          />
          <ArticleForm
            canWrite={canWrite}
            brands={brands.map((b) => ({ id: b.id, name: b.name }))}
            categories={categories.map((c) => ({ id: c.id, name: c.name }))}
            taxRates={taxRates.map((t) => ({ id: t.id, name: t.name }))}
          />
        </section>
      ) : null}
    </div>
  );
}
