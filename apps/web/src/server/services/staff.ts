import bcrypt from 'bcryptjs';
import {
  staffRepository,
  userRepository,
  canAccessStaff,
  canCreateRole,
  type SessionUser,
} from '@shelfledger/db';
import {
  BusinessRuleError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '@shelfledger/errors';
import type { StaffCreateInput, StaffUpdateInput } from '@shelfledger/validators';

function assertStaffAccess(user: SessionUser) {
  if (!canAccessStaff(user.role)) {
    throw new ForbiddenError('Staff settings require manager access');
  }
}

export const staffService = {
  list(user: SessionUser) {
    assertStaffAccess(user);
    return staffRepository.list(user.organizationId);
  },

  async create(user: SessionUser, input: StaffCreateInput) {
    assertStaffAccess(user);
    if (!canCreateRole(user.role, input.role)) {
      throw new ForbiddenError('Only OWNER can create OWNER users');
    }

    const email = input.email.trim().toLowerCase();
    const existing = await staffRepository.findByEmail(user.organizationId, email);
    if (existing) throw new ConflictError('Email already registered');

    if (input.password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    return staffRepository.create({
      organizationId: user.organizationId,
      branchId: user.branchId,
      email,
      name: input.name.trim(),
      passwordHash,
      role: input.role,
      createdBy: user.id,
    });
  },

  async update(user: SessionUser, id: string, input: StaffUpdateInput) {
    assertStaffAccess(user);
    const existing = await staffRepository.findById(user.organizationId, id);
    if (!existing) throw new NotFoundError('User not found');

    if (existing.role !== input.role && !canCreateRole(user.role, input.role)) {
      throw new ForbiddenError('Only OWNER can assign OWNER role');
    }

    if (existing.id === user.id && !input.isActive) {
      throw new BusinessRuleError('You cannot deactivate your own account');
    }

    if (existing.id === user.id && input.role !== existing.role) {
      throw new BusinessRuleError('You cannot change your own role');
    }

    const demotingOwner =
      existing.role === 'OWNER' && (input.role !== 'OWNER' || !input.isActive);
    if (demotingOwner) {
      const owners = await userRepository.countActiveOwners(user.organizationId);
      if (owners <= 1) {
        throw new BusinessRuleError('Cannot remove or demote the last active OWNER');
      }
    }

    return staffRepository.update(id, {
      name: input.name.trim(),
      role: input.role,
      isActive: input.isActive,
      updatedBy: user.id,
    });
  },
};
