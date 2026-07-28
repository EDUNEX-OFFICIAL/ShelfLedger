import Link from 'next/link';
import { PackagePlus, Truck } from 'lucide-react';
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

  const withGstin = vendors.filter((v) => v.gstin?.trim()).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendors"
        description="Suppliers for purchase bills. GSTIN and payment terms help match vendor invoices."
        actions={
          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
            {canWrite ? (
              <a href="#new-vendor" className={buttonClassName({ size: 'lg' })}>
                <Truck className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                Add vendor
              </a>
            ) : null}
            <Link
              href="/purchases#new-purchase"
              className={buttonClassName({ variant: 'secondary', size: 'md' })}
            >
              <PackagePlus className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              New purchase
            </Link>
          </div>
        }
      />

      {vendors.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{vendors.length}</span> vendor
          {vendors.length === 1 ? '' : 's'}
          {withGstin > 0 ? (
            <>
              {' · '}
              <span className="font-medium text-foreground">{withGstin}</span> with GSTIN
            </>
          ) : null}
        </p>
      ) : null}

      <section id="all-vendors" className="scroll-mt-24 space-y-3">
        <SectionHeader
          title="All vendors"
          description="Search by name or GSTIN. Open Purchase to receive stock against a bill."
        />
        <VendorsList
          canWrite={canWrite}
          rows={vendors.map((v) => ({
            id: v.id,
            name: v.name,
            phone: v.phone,
            gstin: v.gstin,
            paymentTermsDays: v.paymentTermsDays,
          }))}
        />
      </section>

      {canWrite ? (
        <section id="new-vendor" className="scroll-mt-24 space-y-3">
          <SectionHeader
            title="Add vendor"
            description="Name + GSTIN first. Payment terms optional (Net days)."
          />
          <VendorForm canWrite={canWrite} />
        </section>
      ) : null}
    </div>
  );
}
