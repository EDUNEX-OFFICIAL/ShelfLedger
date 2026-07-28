import { auth } from '@/auth';
import { UnauthorizedError, ForbiddenError } from '@shelfledger/errors';
import {
  canAccessStaff,
  canManageMasters,
  canManageInventory,
  canSell,
  canManageCustomers,
  canManageExpenses,
  canManageSettings,
  canViewReports,
  isReadOnly,
  type SessionUser,
} from '@shelfledger/db';

export async function requireSession(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    organizationId: session.user.organizationId,
    branchId: session.user.branchId,
  };
}

function rejectViewer(user: SessionUser) {
  if (isReadOnly(user.role)) {
    throw new ForbiddenError('Viewer accounts are read-only');
  }
}

export async function requireMasterWrite(): Promise<SessionUser> {
  const user = await requireSession();
  rejectViewer(user);
  if (!canManageMasters(user.role)) {
    throw new ForbiddenError('You cannot modify master data');
  }
  return user;
}

export async function requireInventoryWrite(): Promise<SessionUser> {
  const user = await requireSession();
  rejectViewer(user);
  if (!canManageInventory(user.role)) {
    throw new ForbiddenError('You cannot post inventory or purchases');
  }
  return user;
}

export async function requireStaffAccess(): Promise<SessionUser> {
  const user = await requireSession();
  rejectViewer(user);
  if (!canAccessStaff(user.role)) {
    throw new ForbiddenError('Staff settings require manager access');
  }
  return user;
}

export async function requireSell(): Promise<SessionUser> {
  const user = await requireSession();
  rejectViewer(user);
  if (!canSell(user.role)) {
    throw new ForbiddenError('You cannot create or post sales');
  }
  return user;
}

export async function requireCustomerWrite(): Promise<SessionUser> {
  const user = await requireSession();
  rejectViewer(user);
  if (!canManageCustomers(user.role)) {
    throw new ForbiddenError('You cannot manage customers');
  }
  return user;
}

export async function requireExpenseWrite(): Promise<SessionUser> {
  const user = await requireSession();
  rejectViewer(user);
  if (!canManageExpenses(user.role)) {
    throw new ForbiddenError('You cannot manage expenses');
  }
  return user;
}

export async function requireSettingsWrite(): Promise<SessionUser> {
  const user = await requireSession();
  rejectViewer(user);
  if (!canManageSettings(user.role)) {
    throw new ForbiddenError('Settings require manager access');
  }
  return user;
}

export async function requireReports(): Promise<SessionUser> {
  const user = await requireSession();
  if (!canViewReports(user.role)) {
    throw new ForbiddenError('You cannot view reports');
  }
  return user;
}
