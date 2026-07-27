import { canManageMasters } from '@shelfledger/db';
import { requireSession } from '@/server/auth/guards';
import { masterService } from '@/server/services/masters';
import { PageHeader } from '@/components/shared/page-header';
import { BrandForm } from '@/features/brands/brand-form';
import { DeleteButton } from '@/components/shared/delete-button';
import { deleteBrandAction } from '@/features/masters/actions';

export default async function BrandsPage() {
  const user = await requireSession();
  const canWrite = canManageMasters(user.role);
  const brands = await masterService.listBrands(user);

  return (
    <div className="space-y-6">
      <PageHeader title="Brands" description="Product brands for articles." />
      <BrandForm canWrite={canWrite} />
      <div className="overflow-hidden rounded-md border border-border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/60 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Code</th>
              <th className="px-3 py-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {brands.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-muted-foreground" colSpan={3}>
                  No brands yet.
                </td>
              </tr>
            ) : (
              brands.map((brand) => (
                <tr key={brand.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 font-medium">{brand.name}</td>
                  <td className="px-3 py-2 font-mono text-xs">{brand.code ?? '—'}</td>
                  <td className="px-3 py-2">
                    {canWrite ? (
                      <div className="flex justify-end">
                        <DeleteButton action={deleteBrandAction.bind(null, brand.id)} />
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {!canWrite ? (
        <p className="text-sm text-muted-foreground">Read-only: your role cannot edit masters.</p>
      ) : null}
    </div>
  );
}
