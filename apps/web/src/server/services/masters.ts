import {
  brandRepository,
  categoryRepository,
  vendorRepository,
  articleRepository,
  taxRateRepository,
  dashboardRepository,
  type SessionUser,
} from '@shelfledger/db';
import { ConflictError, NotFoundError, ValidationError } from '@shelfledger/errors';
import type {
  BrandInput,
  CategoryInput,
  VendorInput,
  ArticleCreateInput,
  ArticleUpdateInput,
} from '@shelfledger/validators';

function emptyToNull(value: string | undefined | null): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export const masterService = {
  dashboard(user: SessionUser) {
    return dashboardRepository.counts(user.organizationId);
  },

  opsDashboard(user: SessionUser, from: Date, to: Date) {
    return dashboardRepository.opsSummary(user.organizationId, from, to);
  },

  listBrands(user: SessionUser) {
    return brandRepository.list(user.organizationId);
  },

  async createBrand(user: SessionUser, input: BrandInput) {
    try {
      return await brandRepository.create({
        name: input.name.trim(),
        code: emptyToNull(input.code),
        createdBy: user.id,
        updatedBy: user.id,
        organization: { connect: { id: user.organizationId } },
      });
    } catch (error) {
      throw mapUnique(error, 'Brand name already exists');
    }
  },

  async updateBrand(user: SessionUser, id: string, input: BrandInput) {
    const existing = await brandRepository.findById(user.organizationId, id);
    if (!existing) throw new NotFoundError('Brand not found');
    try {
      return await brandRepository.update(id, {
        name: input.name.trim(),
        code: emptyToNull(input.code),
        updatedBy: user.id,
      });
    } catch (error) {
      throw mapUnique(error, 'Brand name already exists');
    }
  },

  async deleteBrand(user: SessionUser, id: string) {
    const existing = await brandRepository.findById(user.organizationId, id);
    if (!existing) throw new NotFoundError('Brand not found');
    return brandRepository.softDelete(id, user.id);
  },

  listCategories(user: SessionUser) {
    return categoryRepository.list(user.organizationId);
  },

  async createCategory(user: SessionUser, input: CategoryInput) {
    if (input.parentId) {
      const parent = await categoryRepository.findById(user.organizationId, input.parentId);
      if (!parent) throw new ValidationError('Parent category not found');
    }
    try {
      return await categoryRepository.create({
        name: input.name.trim(),
        createdBy: user.id,
        updatedBy: user.id,
        organization: { connect: { id: user.organizationId } },
        parent: input.parentId ? { connect: { id: input.parentId } } : undefined,
      });
    } catch (error) {
      throw mapUnique(error, 'Category name already exists at this level');
    }
  },

  async updateCategory(user: SessionUser, id: string, input: CategoryInput) {
    const existing = await categoryRepository.findById(user.organizationId, id);
    if (!existing) throw new NotFoundError('Category not found');
    if (input.parentId === id) throw new ValidationError('Category cannot be its own parent');
    if (input.parentId) {
      const parent = await categoryRepository.findById(user.organizationId, input.parentId);
      if (!parent) throw new ValidationError('Parent category not found');
    }
    try {
      return await categoryRepository.update(id, {
        name: input.name.trim(),
        updatedBy: user.id,
        parent: input.parentId
          ? { connect: { id: input.parentId } }
          : { disconnect: true },
      });
    } catch (error) {
      throw mapUnique(error, 'Category name already exists at this level');
    }
  },

  async deleteCategory(user: SessionUser, id: string) {
    const existing = await categoryRepository.findById(user.organizationId, id);
    if (!existing) throw new NotFoundError('Category not found');
    return categoryRepository.softDelete(id, user.id);
  },

  listVendors(user: SessionUser) {
    return vendorRepository.list(user.organizationId);
  },

  async createVendor(user: SessionUser, input: VendorInput) {
    return vendorRepository.create({
      name: input.name.trim(),
      gstin: emptyToNull(input.gstin),
      phone: emptyToNull(input.phone),
      email: emptyToNull(input.email),
      address: emptyToNull(input.address),
      stateCode: emptyToNull(input.stateCode),
      paymentTermsDays: input.paymentTermsDays ?? null,
      notes: emptyToNull(input.notes),
      createdBy: user.id,
      updatedBy: user.id,
      organization: { connect: { id: user.organizationId } },
    });
  },

  async updateVendor(user: SessionUser, id: string, input: VendorInput) {
    const existing = await vendorRepository.findById(user.organizationId, id);
    if (!existing) throw new NotFoundError('Vendor not found');
    return vendorRepository.update(id, {
      name: input.name.trim(),
      gstin: emptyToNull(input.gstin),
      phone: emptyToNull(input.phone),
      email: emptyToNull(input.email),
      address: emptyToNull(input.address),
      stateCode: emptyToNull(input.stateCode),
      paymentTermsDays: input.paymentTermsDays ?? null,
      notes: emptyToNull(input.notes),
      updatedBy: user.id,
    });
  },

  async deleteVendor(user: SessionUser, id: string) {
    const existing = await vendorRepository.findById(user.organizationId, id);
    if (!existing) throw new NotFoundError('Vendor not found');
    return vendorRepository.softDelete(id, user.id);
  },

  listArticles(user: SessionUser) {
    return articleRepository.list(user.organizationId);
  },

  getArticle(user: SessionUser, id: string) {
    return articleRepository.findById(user.organizationId, id);
  },

  listTaxRates(user: SessionUser) {
    return taxRateRepository.listActive(user.organizationId);
  },

  async createArticle(user: SessionUser, input: ArticleCreateInput) {
    const skus = input.variants.map((v) => v.sku.trim().toLowerCase());
    if (new Set(skus).size !== skus.length) {
      throw new ValidationError('Duplicate item codes in size & colour');
    }
    try {
      return await articleRepository.create({
        name: input.name.trim(),
        articleCode: input.articleCode.trim(),
        hsnCode: emptyToNull(input.hsnCode),
        description: emptyToNull(input.description),
        createdBy: user.id,
        updatedBy: user.id,
        organization: { connect: { id: user.organizationId } },
        brand: { connect: { id: input.brandId } },
        category: { connect: { id: input.categoryId } },
        defaultTaxRate: input.defaultTaxRateId
          ? { connect: { id: input.defaultTaxRateId } }
          : undefined,
        variants: {
          create: input.variants.map((v) => ({
            organizationId: user.organizationId,
            size: v.size.trim(),
            color: v.color.trim(),
            sku: v.sku.trim(),
            barcode: emptyToNull(v.barcode),
            mrp: v.mrp,
            sellingPrice: v.sellingPrice,
            lowStockThreshold: v.lowStockThreshold,
            createdBy: user.id,
            updatedBy: user.id,
          })),
        },
      });
    } catch (error) {
      throw mapUnique(error, 'Article code, item code, or barcode already exists');
    }
  },

  async updateArticle(user: SessionUser, id: string, input: ArticleUpdateInput) {
    const existing = await articleRepository.findById(user.organizationId, id);
    if (!existing) throw new NotFoundError('Article not found');
    try {
      return await articleRepository.update(id, {
        name: input.name.trim(),
        articleCode: input.articleCode.trim(),
        hsnCode: emptyToNull(input.hsnCode),
        description: emptyToNull(input.description),
        updatedBy: user.id,
        brand: { connect: { id: input.brandId } },
        category: { connect: { id: input.categoryId } },
        defaultTaxRate: input.defaultTaxRateId
          ? { connect: { id: input.defaultTaxRateId } }
          : { disconnect: true },
      });
    } catch (error) {
      throw mapUnique(error, 'Article code already exists');
    }
  },

  async deleteArticle(user: SessionUser, id: string) {
    const existing = await articleRepository.findById(user.organizationId, id);
    if (!existing) throw new NotFoundError('Article not found');
    return articleRepository.softDelete(id, user.id);
  },
};

function mapUnique(error: unknown, message: string): Error {
  if (
    typeof error === 'object' &&
    error &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
  ) {
    return new ConflictError(message);
  }
  return error instanceof Error ? error : new Error('Unknown error');
}
