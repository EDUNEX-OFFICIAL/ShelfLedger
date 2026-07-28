import { Truck } from 'lucide-react';
import { canManageMasters } from '@shelfledger/db';
import { requireSession } from '@/server/auth/guards';
import { masterService } from '@/server/services/masters';
import { PageHeader } from '@/components/shared/page-header';
import { SectionHeader } from '@/components/shared/section-header';
import { buttonClassName } from '@/components/ui/button';
import { VendorForm } from '@/features/vendors/vendor-form';
import { VendorsList } from '@/features/vendors/vendors-list';

export default async function VendorsPage() {
  const user = await requireSession();
  const canWrite = canManageMasters(user.role);
  const vendors = await masterService.listVendors(user);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendors"
        description="Suppliers for purchase documents."
        actions={
          canWrite ? (
            <a href="#new-vendor" className={buttonClassName({ size: 'lg' })}>
              <Truck className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              Add vendor
            </a>
          ) : null
        }
      />

      {canWrite ? (
        <section id="new-vendor" className="scroll-mt-24 space-y-3">
          <SectionHeader title="Create vendor" description="GSTIN and contact details optional." />
          <VendorForm canWrite={canWrite} />
        </section>
      ) : null}

      <section className="space-y-3">
        <SectionHeader title="All vendors" />
        <VendorsList
          canWrite={canWrite}
          rows={vendors.map((v) => ({
            id: v.id,
            name: v.name,
            phone: v.phone,
            gstin: v.gstin,
          }))}
        />
      </section>
    </div>
  );
}
