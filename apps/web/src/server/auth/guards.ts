import { auth } from '@/auth';
import { UnauthorizedError, ForbiddenError } from '@shelfledger/errors';
import { canAccessStaff, canManageMasters, canManageInventory, type SessionUser } from '@shelfledger/db';

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

export async function requireMasterWrite(): Promise<SessionUser> {
  const user = await requireSession();
  if (!canManageMasters(user.role)) {
    throw new ForbiddenError('You cannot modify master data');
  }
  return user;
}

export async function requireInventoryWrite(): Promise<SessionUser> {
  const user = await requireSession();
  if (!canManageInventory(user.role)) {
    throw new ForbiddenError('You cannot post inventory or purchases');
  }
  return user;
}

export async function requireStaffAccess(): Promise<SessionUser> {
  const user = await requireSession();
  if (!canAccessStaff(user.role)) {
    throw new ForbiddenError('Staff settings require manager access');
  }
  return user;
}
