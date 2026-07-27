import { canManageMasters } from '@shelfledger/db';
import { requireSession } from '@/server/auth/guards';
import { masterService } from '@/server/services/masters';
import { PageHeader } from '@/components/shared/page-header';
import { CategoryForm } from '@/features/categories/category-form';
import { DeleteButton } from '@/components/shared/delete-button';
import { deleteCategoryAction } from '@/features/masters/actions';

export default async function CategoriesPage() {
  const user = await requireSession();
  const canWrite = canManageMasters(user.role);
  const categories = await masterService.listCategories(user);
  const byId = new Map(categories.map((c) => [c.id, c.name]));

  return (
    <div className="space-y-6">
      <PageHeader title="Categories" description="Organize articles by category." />
      <CategoryForm canWrite={canWrite} parents={categories.map((c) => ({ id: c.id, name: c.name }))} />
      <div className="overflow-hidden rounded-md border border-border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/60 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Parent</th>
              <th className="px-3 py-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-muted-foreground" colSpan={3}>
                  No categories yet.
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 font-medium">{category.name}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {category.parentId ? (byId.get(category.parentId) ?? '—') : '—'}
                  </td>
                  <td className="px-3 py-2">
                    {canWrite ? (
                      <div className="flex justify-end">
                        <DeleteButton action={deleteCategoryAction.bind(null, category.id)} />
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
