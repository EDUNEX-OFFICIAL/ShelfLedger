import { prisma } from '../client';
import type { Prisma, UserRole } from '@prisma/client';

const active = { deletedAt: null } as const;

export const expenseCategoryRepository = {
  list(organizationId: string) {
    return prisma.expenseCategory.findMany({
      where: { organizationId, ...active },
      orderBy: { name: 'asc' },
    });
  },

  create(data: Prisma.ExpenseCategoryCreateInput) {
    return prisma.expenseCategory.create({ data });
  },

  softDelete(id: string, updatedBy: string) {
    return prisma.expenseCategory.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy },
    });
  },
};

export const expenseRepository = {
  list(organizationId: string, opts?: { from?: Date; to?: Date }) {
    return prisma.expense.findMany({
      where: {
        organizationId,
        ...active,
        ...(opts?.from || opts?.to
          ? {
              expenseDate: {
                ...(opts.from ? { gte: opts.from } : {}),
                ...(opts.to ? { lte: opts.to } : {}),
              },
            }
          : {}),
      },
      include: { category: true },
      orderBy: [{ expenseDate: 'desc' }, { createdAt: 'desc' }],
    });
  },

  create(data: Prisma.ExpenseCreateInput) {
    return prisma.expense.create({
      data,
      include: { category: true },
    });
  },

  softDelete(id: string, updatedBy: string) {
    return prisma.expense.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy },
    });
  },

  findById(organizationId: string, id: string) {
    return prisma.expense.findFirst({
      where: { id, organizationId, ...active },
      include: { category: true },
    });
  },
};

export const staffRepository = {
  list(organizationId: string) {
    return prisma.user.findMany({
      where: { organizationId, ...active },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        branchId: true,
      },
    });
  },

  findById(organizationId: string, id: string) {
    return prisma.user.findFirst({
      where: { id, organizationId, ...active },
    });
  },

  findByEmail(organizationId: string, email: string) {
    return prisma.user.findFirst({
      where: { organizationId, email: email.toLowerCase(), ...active },
    });
  },

  create(data: {
    organizationId: string;
    branchId: string | null;
    email: string;
    name: string;
    passwordHash: string;
    role: UserRole;
    createdBy: string;
  }) {
    return prisma.user.create({
      data: {
        organizationId: data.organizationId,
        branchId: data.branchId,
        email: data.email.toLowerCase(),
        name: data.name,
        passwordHash: data.passwordHash,
        role: data.role,
        isActive: true,
        createdBy: data.createdBy,
        updatedBy: data.createdBy,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });
  },

  update(
    id: string,
    data: {
      name?: string;
      role?: UserRole;
      isActive?: boolean;
      passwordHash?: string;
      updatedBy: string;
    },
  ) {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });
  },
};

export const settingsRepository = {
  getOrganization(organizationId: string) {
    return prisma.organization.findFirst({
      where: { id: organizationId, ...active },
    });
  },

  /** Single-tenant V1: first active org (login / public branding). */
  findPrimaryOrganization() {
    return prisma.organization.findFirst({
      where: { ...active },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true },
    });
  },

  updateOrganization(organizationId: string, data: Prisma.OrganizationUpdateInput) {
    return prisma.organization.update({
      where: { id: organizationId },
      data,
    });
  },

  listSequences(organizationId: string) {
    return prisma.documentSequence.findMany({
      where: { organizationId },
      orderBy: [{ fyLabel: 'desc' }, { docType: 'asc' }],
    });
  },

  updateSequencePrefix(id: string, prefix: string, updatedBy: string) {
    return prisma.documentSequence.update({
      where: { id },
      data: { prefix, updatedBy },
    });
  },

  listTaxRates(organizationId: string) {
    return prisma.taxRate.findMany({
      where: { organizationId, ...active },
      orderBy: { totalRate: 'asc' },
    });
  },

  createTaxRate(data: Prisma.TaxRateCreateInput) {
    return prisma.taxRate.create({ data });
  },

  softDeleteTaxRate(id: string, updatedBy: string) {
    return prisma.taxRate.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false, updatedBy },
    });
  },
};
