'use client';

import { FilteredDataList } from '@/components/shared/filtered-data-list';
import { Badge } from '@/components/ui/badge';
import { buttonClassName } from '@/components/ui/button';
import { StaffRowActions } from '@/features/staff/staff-forms';

export type StaffListRow = {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'MANAGER' | 'CASHIER' | 'VIEWER';
  isActive: boolean;
};

export function StaffList({
  rows,
  canAssignOwner,
}: {
  rows: StaffListRow[];
  canAssignOwner: boolean;
}) {
  return (
    <FilteredDataList
      rows={rows}
      searchPlaceholder="Search name, email, role…"
      searchFn={(r, q) =>
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.role.toLowerCase().includes(q)
      }
      filters={[
        {
          id: 'role',
          label: 'Role',
          options: [
            { value: 'OWNER', label: 'OWNER' },
            { value: 'MANAGER', label: 'MANAGER' },
            { value: 'CASHIER', label: 'CASHIER' },
            { value: 'VIEWER', label: 'VIEWER' },
          ],
          predicate: (r, v) => r.role === v,
        },
        {
          id: 'active',
          label: 'Status',
          options: [
            { value: '1', label: 'Active' },
            { value: '0', label: 'Inactive' },
          ],
          predicate: (r, v) => (v === '1' ? r.isActive : !r.isActive),
        },
      ]}
      emptyTitle="No staff users"
      emptyDescription="Create a user to share access with your team."
      emptyAction={
        <a href="#new-staff" className={buttonClassName({ size: 'md' })}>
          Add user
        </a>
      }
      mobileTitle={(r) => r.name}
      mobileMeta={(r) => `${r.email} · ${r.role}`}
      columns={[
        { id: 'name', header: 'Name', cell: (r) => <span className="font-medium">{r.name}</span> },
        {
          id: 'email',
          header: 'Email',
          cell: (r) => <span className="font-mono text-xs">{r.email}</span>,
        },
        {
          id: 'role',
          header: 'Role',
          cell: (r) => <Badge variant="primary">{r.role}</Badge>,
        },
        {
          id: 'status',
          header: 'Status',
          cell: (r) => (
            <Badge variant={r.isActive ? 'success' : 'muted'}>
              {r.isActive ? 'Active' : 'Inactive'}
            </Badge>
          ),
        },
      ]}
      actions={(r) => (
        <StaffRowActions user={r} canWrite canAssignOwner={canAssignOwner} />
      )}
    />
  );
}
