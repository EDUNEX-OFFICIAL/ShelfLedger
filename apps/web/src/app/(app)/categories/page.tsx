import { FolderTree } from 'lucide-react';
import { canManageMasters } from '@shelfledger/db';
import { requireSession } from '@/server/auth/guards';
import { masterService } from '@/server/services/masters';
import { PageHeader } from '@/components/shared/page-header';
import { SectionHeader } from '@/components/shared/section-header';
import { buttonClassName } from '@/components/ui/button';
import { CategoryForm } from '@/features/categories/category-form';
import { SimpleMasterList } from '@/features/masters/simple-master-list';
import { deleteCategoryAction } from '@/features/masters/actions';

export default async function CategoriesPage() {
  const user = await requireSession();
  const canWrite = canManageMasters(user.role);
  const categories = await masterService.listCategories(user);
  const byId = new Map(categories.map((c) => [c.id, c.name]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Organize articles by category."
        actions={
          canWrite ? (
            <a href="#new-category" className={buttonClassName({ size: 'lg' })}>
              <FolderTree className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              Add category
            </a>
          ) : null
        }
      />

      {canWrite ? (
        <section id="new-category" className="scroll-mt-24 space-y-3">
          <SectionHeader
            title="Create category"
            description="Optional parent for nested groups."
          />
          <CategoryForm
            canWrite={canWrite}
            parents={categories.map((c) => ({ id: c.id, name: c.name }))}
          />
        </section>
      ) : null}

      <section className="space-y-3">
        <SectionHeader title="All categories" />
        <SimpleMasterList
          canWrite={canWrite}
          searchPlaceholder="Search category…"
          emptyTitle="No categories yet"
          emptyDescription="Create categories before articles."
          emptyAction={
            canWrite ? (
              <a href="#new-category" className={buttonClassName({ size: 'md' })}>
                Add category
              </a>
            ) : undefined
          }
          secondaryHeader="Parent"
          rows={categories.map((c) => ({
            id: c.id,
            name: c.name,
            secondary: c.parentId ? (byId.get(c.parentId) ?? '') : '',
          }))}
          onDelete={deleteCategoryAction}
        />
      </section>
    </div>
  );
}
