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
