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

  const namedCount = customers.filter((c) => !c.isWalkIn).length;
  const withPhone = customers.filter((c) => !c.isWalkIn && c.phone).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Find by phone for WhatsApp and offers. Walk-in stays for anonymous counter bills."
        actions={
          canWrite ? (
            <a href="#new-customer" className={buttonClassName({ size: 'lg' })}>
              <UserPlus className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              Add customer
            </a>
          ) : null
        }
      />

      {customers.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{namedCount}</span> named
          {withPhone > 0 ? (
            <>
              {' · '}
              <span className="font-medium text-foreground">{withPhone}</span> with phone
            </>
          ) : null}
        </p>
      ) : null}

      <section id="all-customers" className="scroll-mt-24 space-y-3">
        <SectionHeader
          title="All customers"
          description="Search name or phone. Tap a number to call."
        />
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

      {canWrite ? (
        <section id="new-customer" className="scroll-mt-24 space-y-3">
          <SectionHeader
            title="Add customer"
            description="Name + phone first. GSTIN and address are optional for B2B."
          />
          <CustomerForm canWrite={canWrite} />
        </section>
      ) : null}
    </div>
  );
}
