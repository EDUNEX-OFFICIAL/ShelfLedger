import { UserPlus } from 'lucide-react';
import { canManageCustomers, canManageMasters } from '@shelfledger/db';
import { requireSession } from '@/server/auth/guards';
import { customerService } from '@/server/services/customer';
import { PageHeader } from '@/components/shared/page-header';
import { SectionHeader } from '@/components/shared/section-header';
import { buttonClassName } from '@/components/ui/button';
import { CustomerForm } from '@/features/customers/customer-form';
import { CustomersList } from '@/features/customers/customers-list';

export default async function CustomersPage() {
  const user = await requireSession();
  const canWrite = canManageCustomers(user.role);
  const canDelete = canManageMasters(user.role);
  const customers = await customerService.list(user);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Walk-in plus named customers. Phone unique per shop when set."
        actions={
          canWrite ? (
            <a href="#new-customer" className={buttonClassName({ size: 'lg' })}>
              <UserPlus className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              Add customer
            </a>
          ) : null
        }
      />

      {canWrite ? (
        <section id="new-customer" className="scroll-mt-24 space-y-3">
          <SectionHeader
            title="Create customer"
            description="Named buyers for invoices, WhatsApp, and offers."
          />
          <CustomerForm canWrite={canWrite} />
        </section>
      ) : null}

      <section className="space-y-3">
        <SectionHeader title="All customers" />
        <CustomersList
          canWrite={canWrite}
          canDelete={canDelete}
          rows={customers.map((c) => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            gstin: c.gstin,
            isWalkIn: c.isWalkIn,
          }))}
        />
      </section>
    </div>
  );
}
