import { prisma } from '../client';
import type { Prisma } from '@prisma/client';

const active = { deletedAt: null } as const;

export const brandRepository = {
  list(organizationId: string) {
    return prisma.brand.findMany({
      where: { organizationId, ...active },
      orderBy: { name: 'asc' },
    });
  },

  findById(organizationId: string, id: string) {
    return prisma.brand.findFirst({
      where: { id, organizationId, ...active },
    });
  },

  create(data: Prisma.BrandCreateInput) {
    return prisma.brand.create({ data });
  },

  update(id: string, data: Prisma.BrandUpdateInput) {
    return prisma.brand.update({ where: { id }, data });
  },

  softDelete(id: string, updatedBy: string) {
    return prisma.brand.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy },
    });
  },
};

export const categoryRepository = {
  list(organizationId: string) {
    return prisma.category.findMany({
      where: { organizationId, ...active },
      orderBy: { name: 'asc' },
    });
  },

  findById(organizationId: string, id: string) {
    return prisma.category.findFirst({
      where: { id, organizationId, ...active },
    });
  },

  create(data: Prisma.CategoryCreateInput) {
    return prisma.category.create({ data });
  },

  update(id: string, data: Prisma.CategoryUpdateInput) {
    return prisma.category.update({ where: { id }, data });
  },

  softDelete(id: string, updatedBy: string) {
    return prisma.category.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy },
    });
  },
};

export const vendorRepository = {
  list(organizationId: string) {
    return prisma.vendor.findMany({
      where: { organizationId, ...active },
      orderBy: { name: 'asc' },
    });
  },

  findById(organizationId: string, id: string) {
    return prisma.vendor.findFirst({
      where: { id, organizationId, ...active },
    });
  },

  create(data: Prisma.VendorCreateInput) {
    return prisma.vendor.create({ data });
  },

  update(id: string, data: Prisma.VendorUpdateInput) {
    return prisma.vendor.update({ where: { id }, data });
  },

  softDelete(id: string, updatedBy: string) {
    return prisma.vendor.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy },
    });
  },
};

export const articleRepository = {
  list(organizationId: string) {
    return prisma.article.findMany({
      where: { organizationId, ...active },
      include: {
        brand: true,
        category: true,
        variants: { where: active, orderBy: [{ size: 'asc' }, { color: 'asc' }] },
        defaultTaxRate: true,
      },
      orderBy: { name: 'asc' },
    });
  },

  findById(organizationId: string, id: string) {
    return prisma.article.findFirst({
      where: { id, organizationId, ...active },
      include: {
        brand: true,
        category: true,
        variants: { where: active, orderBy: [{ size: 'asc' }, { color: 'asc' }] },
        defaultTaxRate: true,
      },
    });
  },

  create(data: Prisma.ArticleCreateInput) {
    return prisma.article.create({
      data,
      include: { variants: true },
    });
  },

  update(id: string, data: Prisma.ArticleUpdateInput) {
    return prisma.article.update({
      where: { id },
      data,
      include: {
        variants: { where: active },
        brand: true,
        category: true,
      },
    });
  },

  softDelete(id: string, updatedBy: string) {
    return prisma.$transaction(async (tx) => {
      await tx.articleVariant.updateMany({
        where: { articleId: id, deletedAt: null },
        data: { deletedAt: new Date(), updatedBy },
      });
      return tx.article.update({
        where: { id },
        data: { deletedAt: new Date(), updatedBy },
      });
    });
  },
};

export const taxRateRepository = {
  listActive(organizationId: string) {
    return prisma.taxRate.findMany({
      where: { organizationId, isActive: true, ...active },
      orderBy: { totalRate: 'asc' },
    });
  },
};

export const dashboardRepository = {
  async counts(organizationId: string) {
    const [brands, categories, articles, vendors, variants] = await Promise.all([
      prisma.brand.count({ where: { organizationId, ...active } }),
      prisma.category.count({ where: { organizationId, ...active } }),
      prisma.article.count({ where: { organizationId, ...active } }),
      prisma.vendor.count({ where: { organizationId, ...active } }),
      prisma.articleVariant.count({ where: { organizationId, ...active } }),
    ]);
    return { brands, categories, articles, vendors, variants };
  },
};

export const userRepository = {
  findActiveByEmail(email: string) {
    return prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        deletedAt: null,
        isActive: true,
      },
    });
  },

  touchLogin(id: string) {
    return prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  },
};
