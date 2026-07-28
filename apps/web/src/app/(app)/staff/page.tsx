import { UserPlus } from 'lucide-react';
import { redirect } from 'next/navigation';
import { canAccessStaff } from '@shelfledger/db';
import { requireSession } from '@/server/auth/guards';
import { staffService } from '@/server/services/staff';
import { PageHeader } from '@/components/shared/page-header';
import { SectionHeader } from '@/components/shared/section-header';
import { buttonClassName } from '@/components/ui/button';
import { StaffCreateForm } from '@/features/staff/staff-forms';
import { StaffList } from '@/features/staff/staff-list';

export default async function StaffPage() {
  const user = await requireSession();
  if (!canAccessStaff(user.role)) {
    redirect('/dashboard');
  }

  const staff = await staffService.list(user);
  const canCreateOwner = user.role === 'OWNER';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff"
        description="Create users and assign roles. Only OWNER can create or assign OWNER."
        actions={
          <a href="#new-staff" className={buttonClassName({ size: 'lg' })}>
            <UserPlus className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            Add user
          </a>
        }
      />

      <section id="new-staff" className="scroll-mt-24 space-y-3">
        <SectionHeader
          title="Create user"
          description="Password min 8 characters. Role controls what they can do."
        />
        <StaffCreateForm canWrite canCreateOwner={canCreateOwner} />
      </section>

      <section className="space-y-3">
        <SectionHeader title="Team" description="Search, filter by role, activate or change role." />
        <StaffList
          canAssignOwner={canCreateOwner}
          rows={staff.map((row) => ({
            id: row.id,
            name: row.name,
            email: row.email,
            role: row.role,
            isActive: row.isActive,
          }))}
        />
      </section>
    </div>
  );
}
