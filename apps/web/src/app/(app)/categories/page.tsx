import Link from 'next/link';
import { FolderTree, Layers } from 'lucide-react';
import { canManageMasters } from '@shelfledger/db';
import { requireSession } from '@/server/auth/guards';
import { masterService } from '@/server/services/masters';
import { PageHeader } from '@/components/shared/page-header';
import { SectionHeader } from '@/components/shared/section-header';
import { buttonClassName } from '@/components/ui/button';
import { CategoryForm } from '@/features/categories/category-form';
import { CategoriesList } from '@/features/categories/categories-list';

function buildHierarchyRows(
  categories: Array<{ id: string; name: string; parentId: string | null }>,
) {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const childCount = new Map<string, number>();
  for (const c of categories) {
    if (c.parentId) {
      childCount.set(c.parentId, (childCount.get(c.parentId) ?? 0) + 1);
    }
  }

  const roots = categories
    .filter((c) => !c.parentId)
    .sort((a, b) => a.name.localeCompare(b.name));
  const children = categories.filter((c) => c.parentId);

  const rows: Array<{
    id: string;
    name: string;
    parentName: string | null;
    depth: number;
    childCount: number;
  }> = [];

  for (const root of roots) {
    rows.push({
      id: root.id,
      name: root.name,
      parentName: null,
      depth: 0,
      childCount: childCount.get(root.id) ?? 0,
    });
    const kids = children
      .filter((c) => c.parentId === root.id)
      .sort((a, b) => a.name.localeCompare(b.name));
    for (const kid of kids) {
      rows.push({
        id: kid.id,
        name: kid.name,
        parentName: root.name,
        depth: 1,
        childCount: 0,
      });
    }
  }

  // Orphans: parent missing / not a root (deeper than 2 levels flattened)
  const placed = new Set(rows.map((r) => r.id));
  for (const c of categories) {
    if (placed.has(c.id)) continue;
    const parent = c.parentId ? byId.get(c.parentId) : null;
    rows.push({
      id: c.id,
      name: c.name,
      parentName: parent?.name ?? 'Unknown parent',
      depth: 1,
      childCount: childCount.get(c.id) ?? 0,
    });
  }

  return rows;
}

export default async function CategoriesPage() {
  const user = await requireSession();
  const canWrite = canManageMasters(user.role);
  const categories = await masterService.listCategories(user);

  const rows = buildHierarchyRows(categories);
  const rootCount = rows.filter((r) => r.depth === 0).length;
  const subCount = rows.filter((r) => r.depth > 0).length;

  // Parents for the form: roots only (keeps a clear 2-level tree for footwear)
  const rootParents = categories
    .filter((c) => !c.parentId)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Group articles (Men → Sports). Roots first, optional subcategories under a parent."
        actions={
          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
            {canWrite ? (
              <a href="#new-category" className={buttonClassName({ size: 'lg' })}>
                <FolderTree className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                Add category
              </a>
            ) : null}
            <Link
              href="/articles#new-article"
              className={buttonClassName({ variant: 'secondary', size: 'md' })}
            >
              <Layers className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              Add article
            </Link>
          </div>
        }
      />

      {!canWrite ? (
        <p className="text-sm text-muted-foreground">Read-only: your role cannot edit masters.</p>
      ) : null}

      {categories.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{rootCount}</span> root
          {rootCount === 1 ? '' : 's'}
          {subCount > 0 ? (
            <>
              {' · '}
              <span className="font-medium text-foreground">{subCount}</span> subcategor
              {subCount === 1 ? 'y' : 'ies'}
            </>
          ) : null}
        </p>
      ) : null}

      <section id="all-categories" className="scroll-mt-24 space-y-3">
        <SectionHeader
          title="All categories"
          description="Tree order: root, then its subcategories. Filter roots or subs."
        />
        <CategoriesList canWrite={canWrite} rows={rows} />
      </section>

      {canWrite ? (
        <section id="new-category" className="scroll-mt-24 space-y-3">
          <SectionHeader
            title="Add category"
            description="Leave parent empty for a root. Pick a root to create a subcategory."
          />
          <CategoryForm canWrite={canWrite} parents={rootParents} />
        </section>
      ) : null}
    </div>
  );
}
