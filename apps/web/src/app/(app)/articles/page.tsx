import Link from 'next/link';
import { Layers } from 'lucide-react';
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Articles"
        description="Styles with size × color variants. Stock quantity lives in the ledger, not here."
        actions={
          canWrite ? (
            <a href="#new-article" className={buttonClassName({ size: 'lg' })}>
              <Layers className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              Add article
            </a>
          ) : null
        }
      />

      {canWrite ? (
        <section id="new-article" className="scroll-mt-24 space-y-3">
          <SectionHeader
            title="Create article"
            description="Requires a brand and category. Add one or more variants."
            actions={
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/brands"
                  className="text-xs font-semibold text-primary hover:underline"
                >
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
          <ArticleForm
            canWrite={canWrite}
            brands={brands.map((b) => ({ id: b.id, name: b.name }))}
            categories={categories.map((c) => ({ id: c.id, name: c.name }))}
            taxRates={taxRates.map((t) => ({ id: t.id, name: t.name }))}
          />
        </section>
      ) : null}

      <section className="space-y-3">
        <SectionHeader title="All articles" description="Search by name, code, or brand." />
        <ArticlesList
          canWrite={canWrite}
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
          }))}
        />
      </section>
    </div>
  );
}
