import { canManageMasters } from '@shelfledger/db';
import { requireSession } from '@/server/auth/guards';
import { masterService } from '@/server/services/masters';
import { PageHeader } from '@/components/shared/page-header';
import { VendorForm } from '@/features/vendors/vendor-form';
import { DeleteButton } from '@/components/shared/delete-button';
import { deleteVendorAction } from '@/features/masters/actions';

export default async function VendorsPage() {
  const user = await requireSession();
  const canWrite = canManageMasters(user.role);
  const vendors = await masterService.listVendors(user);

  return (
    <div className="space-y-6">
      <PageHeader title="Vendors" description="Suppliers for purchase documents." />
      <VendorForm canWrite={canWrite} />
      <div className="overflow-hidden rounded-md border border-border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/60 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Phone</th>
              <th className="px-3 py-2 font-medium">GSTIN</th>
              <th className="px-3 py-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-muted-foreground" colSpan={4}>
                  No vendors yet.
                </td>
              </tr>
            ) : (
              vendors.map((vendor) => (
                <tr key={vendor.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 font-medium">{vendor.name}</td>
                  <td className="px-3 py-2 font-mono text-xs">{vendor.phone ?? '—'}</td>
                  <td className="px-3 py-2 font-mono text-xs">{vendor.gstin ?? '—'}</td>
                  <td className="px-3 py-2">
                    {canWrite ? (
                      <div className="flex justify-end">
                        <DeleteButton action={deleteVendorAction.bind(null, vendor.id)} />
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
