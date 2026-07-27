import { canManageMasters } from '@shelfledger/db';
import { requireSession } from '@/server/auth/guards';
import { masterService } from '@/server/services/masters';
import { PageHeader } from '@/components/shared/page-header';
import { ArticleForm } from '@/features/articles/article-form';
import { DeleteButton } from '@/components/shared/delete-button';
import { deleteArticleAction } from '@/features/masters/actions';

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
      />
      <ArticleForm
        canWrite={canWrite}
        brands={brands.map((b) => ({ id: b.id, name: b.name }))}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        taxRates={taxRates.map((t) => ({ id: t.id, name: t.name }))}
      />
      <div className="overflow-hidden rounded-md border border-border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/60 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Article</th>
              <th className="px-3 py-2 font-medium">Brand</th>
              <th className="px-3 py-2 font-medium">Category</th>
              <th className="px-3 py-2 font-medium">Variants</th>
              <th className="px-3 py-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {articles.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-muted-foreground" colSpan={5}>
                  No articles yet.
                </td>
              </tr>
            ) : (
              articles.map((article) => (
                <tr key={article.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2">
                    <div className="font-medium">{article.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{article.articleCode}</div>
                  </td>
                  <td className="px-3 py-2">{article.brand.name}</td>
                  <td className="px-3 py-2">{article.category.name}</td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {article.variants.length} —{' '}
                    {article.variants
                      .slice(0, 3)
                      .map((v) => `${v.size}/${v.color}`)
                      .join(', ')}
                    {article.variants.length > 3 ? '…' : ''}
                  </td>
                  <td className="px-3 py-2">
                    {canWrite ? (
                      <div className="flex justify-end">
                        <DeleteButton action={deleteArticleAction.bind(null, article.id)} />
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
