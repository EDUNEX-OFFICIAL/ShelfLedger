import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Settings, UserPlus } from 'lucide-react';
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

  const activeCount = staff.filter((s) => s.isActive).length;
  const byRole = {
    OWNER: staff.filter((s) => s.role === 'OWNER' && s.isActive).length,
    MANAGER: staff.filter((s) => s.role === 'MANAGER' && s.isActive).length,
    CASHIER: staff.filter((s) => s.role === 'CASHIER' && s.isActive).length,
    VIEWER: staff.filter((s) => s.role === 'VIEWER' && s.isActive).length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff"
        description="Team logins and roles. Only Owner can create or assign Owner."
        actions={
          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
            <a href="#new-staff" className={buttonClassName({ size: 'lg' })}>
              <UserPlus className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              Add user
            </a>
            <Link
              href="/settings"
              className={buttonClassName({ variant: 'secondary', size: 'md' })}
            >
              <Settings className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              Settings
            </Link>
          </div>
        }
      />

      {staff.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{activeCount}</span> active
          {byRole.OWNER > 0 ? (
            <>
              {' · '}
              <span className="font-medium text-foreground">{byRole.OWNER}</span> owner
              {byRole.OWNER === 1 ? '' : 's'}
            </>
          ) : null}
          {byRole.MANAGER > 0 ? (
            <>
              {' · '}
              <span className="font-medium text-foreground">{byRole.MANAGER}</span> manager
              {byRole.MANAGER === 1 ? '' : 's'}
            </>
          ) : null}
          {byRole.CASHIER > 0 ? (
            <>
              {' · '}
              <span className="font-medium text-foreground">{byRole.CASHIER}</span> cashier
              {byRole.CASHIER === 1 ? '' : 's'}
            </>
          ) : null}
          {byRole.VIEWER > 0 ? (
            <>
              {' · '}
              <span className="font-medium text-foreground">{byRole.VIEWER}</span> viewer
              {byRole.VIEWER === 1 ? '' : 's'}
            </>
          ) : null}
        </p>
      ) : null}

      <section id="team" className="scroll-mt-24 space-y-3">
        <SectionHeader
          title="Team"
          description="Search by name/email. Change role or deactivate — Save when dirty."
        />
        <StaffList
          canAssignOwner={canCreateOwner}
          currentUserId={user.id}
          rows={staff.map((row) => ({
            id: row.id,
            name: row.name,
            email: row.email,
            role: row.role,
            isActive: row.isActive,
          }))}
        />
      </section>

      <section id="new-staff" className="scroll-mt-24 space-y-3">
        <SectionHeader
          title="Add user"
          description="Temporary password (min 8). Default role Cashier for floor staff."
        />
        <StaffCreateForm canWrite canCreateOwner={canCreateOwner} />
      </section>
    </div>
  );
}
