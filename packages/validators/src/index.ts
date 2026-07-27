import { z } from 'zod';

export const uuidSchema = z.string().uuid();

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const userRoleSchema = z.enum(['OWNER', 'MANAGER', 'CASHIER', 'VIEWER']);

export const documentStatusSchema = z.enum(['DRAFT', 'POSTED', 'VOIDED']);

export const moneySchema = z
  .union([z.string(), z.number()])
  .transform((v) => (typeof v === 'number' ? v.toFixed(2) : v));

export const qtySchema = z
  .union([z.string(), z.number()])
  .transform((v) => (typeof v === 'number' ? String(v) : v));

export const healthQuerySchema = z.object({
  deep: z
    .union([z.literal('1'), z.literal('true'), z.literal('0'), z.literal('false')])
    .optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(128),
});

export const brandCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  code: z.string().trim().max(40).optional().or(z.literal('')),
});

export const brandUpdateSchema = brandCreateSchema;

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  parentId: z.string().uuid().optional().nullable(),
});

export const categoryUpdateSchema = categoryCreateSchema;

export const optionalEmailSchema = z
  .string()
  .trim()
  .max(255)
  .transform((v) => (v === '' ? undefined : v))
  .pipe(z.string().email().optional());

export const optionalStateCodeSchema = z
  .string()
  .trim()
  .transform((v) => (v === '' ? undefined : v))
  .pipe(z.string().regex(/^\d{2}$/, 'State code must be 2 digits').optional());

export const vendorCreateSchema = z.object({
  name: z.string().trim().min(1).max(160),
  gstin: z.string().trim().max(15).optional().or(z.literal('')),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  email: optionalEmailSchema,
  address: z.string().trim().max(500).optional().or(z.literal('')),
  stateCode: optionalStateCodeSchema,
  paymentTermsDays: z.coerce.number().int().min(0).max(365).optional().nullable(),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
});

export const vendorUpdateSchema = vendorCreateSchema;

export const articleVariantInputSchema = z.object({
  size: z.string().trim().min(1).max(40),
  color: z.string().trim().min(1).max(40),
  sku: z.string().trim().min(1).max(80),
  barcode: z.string().trim().max(80).optional().or(z.literal('')),
  mrp: z.coerce.number().positive().max(1_000_000),
  sellingPrice: z.coerce.number().positive().max(1_000_000),
  lowStockThreshold: z.coerce.number().min(0).max(1_000_000).default(0),
});

export const articleCreateSchema = z.object({
  name: z.string().trim().min(1).max(160),
  articleCode: z.string().trim().min(1).max(80),
  brandId: z.string().uuid(),
  categoryId: z.string().uuid(),
  hsnCode: z.string().trim().max(16).optional().or(z.literal('')),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  defaultTaxRateId: z.string().uuid().optional().nullable(),
  variants: z.array(articleVariantInputSchema).min(1, 'At least one variant is required'),
});

export const articleUpdateSchema = z.object({
  name: z.string().trim().min(1).max(160),
  articleCode: z.string().trim().min(1).max(80),
  brandId: z.string().uuid(),
  categoryId: z.string().uuid(),
  hsnCode: z.string().trim().max(16).optional().or(z.literal('')),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  defaultTaxRateId: z.string().uuid().optional().nullable(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type BrandInput = z.infer<typeof brandCreateSchema>;
export type CategoryInput = z.infer<typeof categoryCreateSchema>;
export type VendorInput = z.infer<typeof vendorCreateSchema>;
export type ArticleCreateInput = z.infer<typeof articleCreateSchema>;
export type ArticleUpdateInput = z.infer<typeof articleUpdateSchema>;

export const purchaseLineInputSchema = z.object({
  variantId: z.string().uuid(),
  qty: z.coerce.number().positive().max(1_000_000),
  unitRate: z.coerce.number().min(0).max(1_000_000),
  discountAmount: z.coerce.number().min(0).max(1_000_000).default(0),
  taxRateId: z.string().uuid().optional().nullable(),
});

export const purchaseCreateSchema = z.object({
  vendorId: z.string().uuid(),
  vendorInvoiceNo: z.string().trim().max(80).optional().or(z.literal('')),
  vendorInvoiceDate: z.string().optional().or(z.literal('')),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
  lines: z.array(purchaseLineInputSchema).min(1),
});

export const purchaseReturnSchema = z.object({
  purchaseId: z.string().uuid(),
  lines: z
    .array(
      z.object({
        purchaseLineId: z.string().uuid(),
        qty: z.coerce.number().positive().max(1_000_000),
      }),
    )
    .min(1),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
});

export const openingStockSchema = z.object({
  variantId: z.string().uuid(),
  qty: z.coerce.number().positive().max(1_000_000),
  unitCost: z.coerce.number().min(0).max(1_000_000),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
});

export const stockAdjustmentSchema = z.object({
  variantId: z.string().uuid(),
  qty: z.coerce.number().positive().max(1_000_000),
  direction: z.enum(['IN', 'OUT', 'DAMAGE', 'LOST']),
  unitCost: z.coerce.number().min(0).max(1_000_000).optional(),
  reason: z.string().trim().min(3).max(500),
});

export type PurchaseCreateInput = z.infer<typeof purchaseCreateSchema>;
export type PurchaseReturnInput = z.infer<typeof purchaseReturnSchema>;
export type OpeningStockInput = z.infer<typeof openingStockSchema>;
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
