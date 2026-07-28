'use client';

import { FilteredDataList } from '@/components/shared/filtered-data-list';
import { Badge } from '@/components/ui/badge';
import { buttonClassName } from '@/components/ui/button';
import {
  StaffRowActions,
  ROLE_LABELS,
  type StaffRole,
} from '@/features/staff/staff-forms';

export type StaffListRow = {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  isActive: boolean;
};

function roleBadgeVariant(role: StaffRole): 'primary' | 'default' | 'success' | 'muted' {
  if (role === 'OWNER') return 'primary';
  if (role === 'MANAGER') return 'default';
  if (role === 'CASHIER') return 'success';
  return 'muted';
}

export function StaffList({
  rows,
  canAssignOwner,
  currentUserId,
}: {
  rows: StaffListRow[];
  canAssignOwner: boolean;
  currentUserId: string;
}) {
  return (
    <FilteredDataList
      rows={rows}
      searchPlaceholder="Search name or email…"
      searchFn={(r, q) =>
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        ROLE_LABELS[r.role].toLowerCase().includes(q) ||
        r.role.toLowerCase().includes(q)
      }
      filters={[
        {
          id: 'role',
          label: 'Role',
          options: [
            { value: 'OWNER', label: 'Owner' },
            { value: 'MANAGER', label: 'Manager' },
            { value: 'CASHIER', label: 'Cashier' },
            { value: 'VIEWER', label: 'Viewer' },
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
      emptyDescription="Create a cashier or manager so the team can sign in."
      emptyAction={
        <a href="#new-staff" className={buttonClassName({ size: 'md' })}>
          Add user
        </a>
      }
      mobileTitle={(r) => (
        <span className="flex flex-wrap items-center gap-1.5">
          {r.name}
          {r.id === currentUserId ? (
            <Badge variant="muted" className="text-[10px]">
              You
            </Badge>
          ) : null}
        </span>
      )}
      mobileMeta={(r) => r.email}
      mobileTrailing={(r) => (
        <div className="flex flex-col items-end gap-1">
          <Badge variant={roleBadgeVariant(r.role)}>{ROLE_LABELS[r.role]}</Badge>
          {!r.isActive ? (
            <Badge variant="muted" className="text-[10px]">
              Off
            </Badge>
          ) : null}
        </div>
      )}
      columns={[
        {
          id: 'name',
          header: 'Name',
          mobile: false,
          cell: (r) => (
            <span className="font-medium">
              {r.name}
              {r.id === currentUserId ? (
                <Badge variant="muted" className="ml-2 text-[10px]">
                  You
                </Badge>
              ) : null}
            </span>
          ),
        },
        {
          id: 'email',
          header: 'Email',
          mobile: false,
          cell: (r) => <span className="font-mono text-xs">{r.email}</span>,
        },
        {
          id: 'role',
          header: 'Role',
          mobile: false,
          cell: (r) => (
            <Badge variant={roleBadgeVariant(r.role)}>{ROLE_LABELS[r.role]}</Badge>
          ),
        },
        {
          id: 'status',
          header: 'Status',
          mobile: false,
          cell: (r) => (
            <Badge variant={r.isActive ? 'success' : 'muted'}>
              {r.isActive ? 'Active' : 'Inactive'}
            </Badge>
          ),
        },
      ]}
      actions={(r) => (
        <StaffRowActions
          key={`${r.id}-${r.role}-${r.isActive}`}
          user={r}
          canWrite
          canAssignOwner={canAssignOwner}
          isSelf={r.id === currentUserId}
        />
      )}
    />
  );
}
