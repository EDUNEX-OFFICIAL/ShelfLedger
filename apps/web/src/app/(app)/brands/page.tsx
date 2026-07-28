import { Tag } from 'lucide-react';
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Brands"
        description="Product brands for articles."
        actions={
          canWrite ? (
            <a href="#new-brand" className={buttonClassName({ size: 'lg' })}>
              <Tag className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              Add brand
            </a>
          ) : null
        }
      />

      {canWrite ? (
        <section id="new-brand" className="scroll-mt-24 space-y-3">
          <SectionHeader title="Create brand" description="Name and optional short code." />
          <BrandForm canWrite={canWrite} />
        </section>
      ) : (
        <p className="text-sm text-muted-foreground">Read-only: your role cannot edit masters.</p>
      )}

      <section className="space-y-3">
        <SectionHeader title="All brands" />
        <SimpleMasterList
          canWrite={canWrite}
          searchPlaceholder="Search brand name or code…"
          emptyTitle="No brands yet"
          emptyDescription="Add a brand before creating articles."
          emptyAction={
            canWrite ? (
              <a href="#new-brand" className={buttonClassName({ size: 'md' })}>
                Add brand
              </a>
            ) : undefined
          }
          secondaryHeader="Code"
          rows={brands.map((b) => ({ id: b.id, name: b.name, secondary: b.code ?? '' }))}
          onDelete={deleteBrandAction}
        />
      </section>
    </div>
  );
}
