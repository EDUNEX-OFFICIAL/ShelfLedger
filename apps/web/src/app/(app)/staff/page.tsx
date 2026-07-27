import { redirect } from 'next/navigation';
import { canAccessStaff } from '@shelfledger/db';
import { requireSession } from '@/server/auth/guards';
import { PageHeader } from '@/components/shared/page-header';

export default async function StaffPage() {
  const user = await requireSession();
  if (!canAccessStaff(user.role)) {
    redirect('/dashboard');
  }

  return (
    <div>
      <PageHeader
        title="Staff"
        description="User management arrives in Phase 5. Access is restricted to OWNER and MANAGER."
      />
      <div className="rounded-md border border-border bg-white p-6 text-sm text-muted-foreground">
        Signed in as <span className="font-medium text-foreground">{user.email}</span> with role{' '}
        <span className="font-mono text-foreground">{user.role}</span>. CASHIER and VIEWER cannot open
        this page.
      </div>
    </div>
  );
}
