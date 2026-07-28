import type { UserRole } from '@prisma/client';

export type { UserRole };

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
  branchId: string | null;
};

export function canManageMasters(role: UserRole): boolean {
  return role === 'OWNER' || role === 'MANAGER';
}

export function canManageInventory(role: UserRole): boolean {
  return role === 'OWNER' || role === 'MANAGER';
}

export function canAccessStaff(role: UserRole): boolean {
  return role === 'OWNER' || role === 'MANAGER';
}

export function canViewReports(role: UserRole): boolean {
  return role === 'OWNER' || role === 'MANAGER' || role === 'VIEWER';
}

export function canSell(role: UserRole): boolean {
  return role === 'OWNER' || role === 'MANAGER' || role === 'CASHIER';
}

export function canOverrideStock(role: UserRole): boolean {
  return role === 'OWNER' || role === 'MANAGER';
}

export function canManageCustomers(role: UserRole): boolean {
  return role === 'OWNER' || role === 'MANAGER' || role === 'CASHIER';
}

export function canManageExpenses(role: UserRole): boolean {
  return role === 'OWNER' || role === 'MANAGER';
}

export function canManageSettings(role: UserRole): boolean {
  return role === 'OWNER' || role === 'MANAGER';
}

/** VIEWER is read-only across mutating surfaces. */
export function isReadOnly(role: UserRole): boolean {
  return role === 'VIEWER';
}

export function canCreateRole(actor: UserRole, target: UserRole): boolean {
  if (target === 'OWNER') return actor === 'OWNER';
  return actor === 'OWNER' || actor === 'MANAGER';
}
