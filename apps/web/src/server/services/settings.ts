import {
  settingsRepository,
  canManageSettings,
  type SessionUser,
} from '@shelfledger/db';
import { ForbiddenError, NotFoundError, ValidationError } from '@shelfledger/errors';
import type { OrgSettingsInput, TaxRateCreateInput, SequenceUpdateInput } from '@shelfledger/validators';
import { roundMoney } from '@shelfledger/domain';

function emptyToNull(value: string | undefined | null): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function assertSettingsWrite(user: SessionUser) {
  if (!canManageSettings(user.role)) {
    throw new ForbiddenError('Settings require manager access');
  }
}

export const settingsService = {
  getOrg(user: SessionUser) {
    return settingsRepository.getOrganization(user.organizationId);
  },

  listSequences(user: SessionUser) {
    return settingsRepository.listSequences(user.organizationId);
  },

  listTaxRates(user: SessionUser) {
    return settingsRepository.listTaxRates(user.organizationId);
  },

  async updateOrg(user: SessionUser, input: OrgSettingsInput) {
    assertSettingsWrite(user);
    const org = await settingsRepository.getOrganization(user.organizationId);
    if (!org) throw new NotFoundError('Organization not found');

    return settingsRepository.updateOrganization(user.organizationId, {
      name: input.name.trim(),
      gstin: emptyToNull(input.gstin),
      stateCode: input.stateCode,
      addressLine1: emptyToNull(input.addressLine1),
      addressLine2: emptyToNull(input.addressLine2),
      city: emptyToNull(input.city),
      pincode: emptyToNull(input.pincode),
      phone: emptyToNull(input.phone),
      email: emptyToNull(input.email),
      financialYearStartMonth: input.financialYearStartMonth,
      updatedBy: user.id,
    });
  },

  async updateSequencePrefix(user: SessionUser, input: SequenceUpdateInput) {
    assertSettingsWrite(user);
    const sequences = await settingsRepository.listSequences(user.organizationId);
    const seq = sequences.find((s) => s.id === input.id);
    if (!seq) throw new NotFoundError('Sequence not found');
    // Prefix change only affects future allocations (nextNumber unchanged).
    return settingsRepository.updateSequencePrefix(seq.id, input.prefix.trim(), user.id);
  },

  async createTaxRate(user: SessionUser, input: TaxRateCreateInput) {
    assertSettingsWrite(user);
    const total = roundMoney(input.cgstRate + input.sgstRate);
    if (Math.abs(total - input.totalRate) > 0.011) {
      throw new ValidationError('CGST + SGST must equal total rate (IGST unused in V1)');
    }
    return settingsRepository.createTaxRate({
      name: input.name.trim(),
      totalRate: input.totalRate,
      cgstRate: input.cgstRate,
      sgstRate: input.sgstRate,
      igstRate: input.totalRate,
      isActive: true,
      createdBy: user.id,
      updatedBy: user.id,
      organization: { connect: { id: user.organizationId } },
    });
  },

  async softDeleteTaxRate(user: SessionUser, id: string) {
    assertSettingsWrite(user);
    const rates = await settingsRepository.listTaxRates(user.organizationId);
    if (!rates.some((r) => r.id === id)) throw new NotFoundError('Tax rate not found');
    return settingsRepository.softDeleteTaxRate(id, user.id);
  },
};
