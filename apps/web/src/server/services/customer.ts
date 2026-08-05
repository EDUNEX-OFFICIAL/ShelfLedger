import {
  customerRepository,
  type SessionUser,
  canManageMasters,
} from '@shelfledger/db';
import { BusinessRuleError, ConflictError, ForbiddenError, NotFoundError } from '@shelfledger/errors';
import type { CustomerInput } from '@shelfledger/validators';

function emptyToNull(value: string | undefined | null): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export const customerService = {
  list(user: SessionUser) {
    return customerRepository.list(user.organizationId);
  },

  get(user: SessionUser, id: string) {
    return customerRepository.findById(user.organizationId, id);
  },

  findWalkIn(user: SessionUser) {
    return customerRepository.findWalkIn(user.organizationId);
  },

  findByPhone(user: SessionUser, phone: string) {
    return customerRepository.findByPhone(user.organizationId, phone);
  },

  /**
   * Quick Sale: system walk-in, or find by phone / create named customer.
   * Never attaches to the system walk-in row when phone is captured.
   */
  async findOrCreateForQuickSale(
    user: SessionUser,
    input: { name: string; phone: string; useWalkIn?: boolean },
  ) {
    if (input.useWalkIn) {
      const walkIn = await customerRepository.findWalkIn(user.organizationId);
      if (!walkIn) {
        throw new BusinessRuleError('Walk-in customer is not configured');
      }
      return walkIn;
    }

    const phone = input.phone.trim();
    const name = input.name.trim();
    if (!phone || !name) {
      throw new BusinessRuleError('Customer name and mobile are required');
    }

    const existing = await customerRepository.findByPhone(user.organizationId, phone);
    if (existing) {
      if (existing.isWalkIn) {
        throw new BusinessRuleError('Phone cannot belong to the walk-in customer');
      }
      // Refresh name if staff captured a clearer one (same phone = same person).
      if (existing.name !== name) {
        return customerRepository.update(existing.id, {
          name,
          updatedBy: user.id,
        });
      }
      return existing;
    }

    return customerRepository.create({
      name,
      phone,
      email: null,
      gstin: null,
      stateCode: null,
      address: null,
      isWalkIn: false,
      createdBy: user.id,
      updatedBy: user.id,
      organization: { connect: { id: user.organizationId } },
    });
  },

  async create(user: SessionUser, input: CustomerInput) {
    const phone = emptyToNull(input.phone);
    if (phone) {
      const existing = await customerRepository.findByPhone(user.organizationId, phone);
      if (existing) throw new ConflictError('Phone already used by another customer');
    }

    return customerRepository.create({
      name: input.name.trim(),
      phone,
      email: emptyToNull(input.email),
      gstin: emptyToNull(input.gstin),
      stateCode: emptyToNull(input.stateCode),
      address: emptyToNull(input.address),
      isWalkIn: false,
      createdBy: user.id,
      updatedBy: user.id,
      organization: { connect: { id: user.organizationId } },
    });
  },

  async update(user: SessionUser, id: string, input: CustomerInput) {
    const existing = await customerRepository.findById(user.organizationId, id);
    if (!existing) throw new NotFoundError('Customer not found');
    if (existing.isWalkIn) throw new BusinessRuleError('Walk-in customer cannot be edited');

    const phone = emptyToNull(input.phone);
    if (phone) {
      const other = await customerRepository.findByPhone(user.organizationId, phone);
      if (other && other.id !== id) {
        throw new ConflictError('Phone already used by another customer');
      }
    }

    return customerRepository.update(id, {
      name: input.name.trim(),
      phone,
      email: emptyToNull(input.email),
      gstin: emptyToNull(input.gstin),
      stateCode: emptyToNull(input.stateCode),
      address: emptyToNull(input.address),
      updatedBy: user.id,
    });
  },

  async softDelete(user: SessionUser, id: string) {
    if (!canManageMasters(user.role)) {
      throw new ForbiddenError('Only managers can delete customers');
    }
    const existing = await customerRepository.findById(user.organizationId, id);
    if (!existing) throw new NotFoundError('Customer not found');
    if (existing.isWalkIn) throw new BusinessRuleError('Walk-in customer cannot be deleted');
    return customerRepository.softDelete(id, user.id);
  },
};
