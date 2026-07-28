import Link from 'next/link';
import { Layers, Tag } from 'lucide-react';
import { canManageMasters } from '@shelfledger/db';
import { requireSession } from '@/server/auth/guards';
import { masterService } from '@/server/services/masters';
import { PageHeader } from '@/components/shared/page-header';
import { SectionHeader } from '@/components/shared/section-header';
import { buttonClassName } from '@/components/ui/button';
import { BrandForm } from '@/features/brands/brand-form';
import { SimpleMasterList } from '@/features/masters/simple-master-list';
import { deleteBrandAction } from '@/features/masters/actions';

export default async function BrandsPage() {
  const user = await requireSession();
  const canWrite = canManageMasters(user.role);
  const brands = await masterService.listBrands(user);
  const withCode = brands.filter((b) => b.code?.trim()).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Brands"
        description="Labels on footwear articles (e.g. Nike, Bata). Create a brand before adding styles."
        actions={
          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
            {canWrite ? (
              <a href="#new-brand" className={buttonClassName({ size: 'lg' })}>
                <Tag className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                Add brand
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

      {brands.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{brands.length}</span> brand
          {brands.length === 1 ? '' : 's'}
          {withCode > 0 ? (
            <>
              {' · '}
              <span className="font-medium text-foreground">{withCode}</span> with code
            </>
          ) : null}
        </p>
      ) : null}

      <section id="all-brands" className="scroll-mt-24 space-y-3">
        <SectionHeader
          title="All brands"
          description="Search by name or short code."
        />
        <SimpleMasterList
          canWrite={canWrite}
          searchPlaceholder="Search brand name or code…"
          emptyTitle="No brands yet"
          emptyDescription="Add a brand first, then create articles under it."
          emptyAction={
            canWrite ? (
              <div className="flex flex-wrap justify-center gap-2">
                <a href="#new-brand" className={buttonClassName({ size: 'md' })}>
                  Add brand
                </a>
                <Link
                  href="/articles"
                  className={buttonClassName({ variant: 'secondary', size: 'md' })}
                >
                  Articles
                </Link>
              </div>
            ) : undefined
          }
          secondaryHeader="Code"
          rows={brands.map((b) => ({ id: b.id, name: b.name, secondary: b.code ?? '' }))}
          onDelete={deleteBrandAction}
          rowActionHref="/articles"
          rowActionLabel="Articles"
        />
      </section>

      {canWrite ? (
        <section id="new-brand" className="scroll-mt-24 space-y-3">
          <SectionHeader
            title="Add brand"
            description="Name required. Code is optional (auto-suggested from the name)."
          />
          <BrandForm canWrite={canWrite} />
        </section>
      ) : null}
    </div>
  );
}
