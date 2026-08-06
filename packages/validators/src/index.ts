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

export const customerCreateSchema = z.object({
  name: z.string().trim().min(1).max(160),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  email: optionalEmailSchema,
  gstin: z.string().trim().max(15).optional().or(z.literal('')),
  stateCode: optionalStateCodeSchema,
  address: z.string().trim().max(500).optional().or(z.literal('')),
});

export const customerUpdateSchema = customerCreateSchema;

export const paymentMethodSchema = z.enum(['CASH', 'UPI', 'CARD', 'OTHER']);

export const salePaymentInputSchema = z.object({
  method: paymentMethodSchema,
  amount: z.coerce.number().positive().max(1_000_000),
  reference: z.string().trim().max(120).optional().or(z.literal('')),
});

export const saleLineInputSchema = z.object({
  variantId: z.string().uuid(),
  qty: z.coerce.number().positive().max(1_000_000),
  unitPrice: z.coerce.number().min(0).max(1_000_000),
  discountAmount: z.coerce.number().min(0).max(1_000_000).default(0),
  taxRateId: z.string().uuid().optional().nullable(),
});

export const saleCreateSchema = z.object({
  customerId: z.string().uuid(),
  invoiceDate: z.string().optional().or(z.literal('')),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
  billDiscount: z.coerce.number().min(0).max(1_000_000).default(0),
  stockOverride: z.boolean().optional().default(false),
  overrideReason: z.string().trim().max(500).optional().or(z.literal('')),
  lines: z.array(saleLineInputSchema).min(1),
  payments: z.array(salePaymentInputSchema).optional().default([]),
});

/** Digits-only phone for lookup / storage (strips +91 / leading 0). */
export function normalizeCustomerPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}

/** Quick Sale: name+mobile, or system walk-in via useWalkIn. */
export const quickSaleSchema = z
  .object({
    useWalkIn: z.boolean().default(false),
    customerName: z.string().trim().max(160).optional().default(''),
    customerPhone: z.string().trim().max(20).optional().default(''),
    billDiscount: z.coerce.number().min(0).max(1_000_000).default(0),
    payMethod: paymentMethodSchema,
    lines: z.array(saleLineInputSchema).min(1),
  })
  .superRefine((data, ctx) => {
    if (data.useWalkIn) return;
    if (!data.customerName.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Name is required',
        path: ['customerName'],
      });
    }
    const phone = normalizeCustomerPhone(data.customerPhone);
    if (!phone || phone.length < 10 || phone.length > 15) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Enter a valid 10-digit mobile number',
        path: ['customerPhone'],
      });
    }
  })
  .transform((data) => ({
    ...data,
    customerName: data.customerName.trim(),
    customerPhone: data.useWalkIn ? '' : normalizeCustomerPhone(data.customerPhone),
  }));

/** Record a payment against a posted sale with open dues. */
export const saleAddPaymentSchema = z.object({
  saleId: z.string().uuid(),
  method: paymentMethodSchema,
  amount: z.coerce.number().positive().max(1_000_000),
  reference: z.string().trim().max(120).optional().or(z.literal('')),
});

export const exchangeReturnLineSchema = z.object({
  originalSaleLineId: z.string().uuid(),
  qty: z.coerce.number().positive().max(1_000_000),
});

export const exchangeReplaceLineSchema = z.object({
  variantId: z.string().uuid(),
  qty: z.coerce.number().positive().max(1_000_000),
  unitPrice: z.coerce.number().min(0).max(1_000_000),
  taxRateId: z.string().uuid().optional().nullable(),
});

export const exchangeCreateSchema = z.object({
  customerId: z.string().uuid(),
  originalSaleId: z.string().uuid(),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
  returnLines: z.array(exchangeReturnLineSchema).min(1),
  replaceLines: z.array(exchangeReplaceLineSchema).default([]),
});

export type CustomerInput = z.infer<typeof customerCreateSchema>;
export type SaleCreateInput = z.infer<typeof saleCreateSchema>;
export type QuickSaleInput = z.infer<typeof quickSaleSchema>;
export type ExchangeCreateInput = z.infer<typeof exchangeCreateSchema>;

export const expenseCreateSchema = z.object({
  categoryId: z.string().uuid(),
  amount: z.coerce.number().positive().max(10_000_000),
  expenseDate: z.string().min(1),
  paymentMethod: paymentMethodSchema,
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
});

export const expenseCategoryCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
});

export const staffCreateSchema = z.object({
  email: z.string().trim().email().max(255),
  name: z.string().trim().min(1).max(120),
  password: z.string().min(8).max(128),
  role: z.enum(['OWNER', 'MANAGER', 'CASHIER', 'VIEWER']),
});

export const staffUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  role: z.enum(['OWNER', 'MANAGER', 'CASHIER', 'VIEWER']),
  isActive: z.boolean(),
});

export const orgSettingsSchema = z.object({
  name: z.string().trim().min(1).max(160),
  gstin: z.string().trim().max(15).optional().or(z.literal('')),
  stateCode: z.string().trim().regex(/^\d{2}$/, 'State code must be 2 digits'),
  addressLine1: z.string().trim().max(200).optional().or(z.literal('')),
  addressLine2: z.string().trim().max(200).optional().or(z.literal('')),
  city: z.string().trim().max(80).optional().or(z.literal('')),
  pincode: z.string().trim().max(12).optional().or(z.literal('')),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  email: optionalEmailSchema,
  financialYearStartMonth: z.coerce.number().int().min(1).max(12),
});

export const taxRateCreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  totalRate: z.coerce.number().min(0).max(100),
  cgstRate: z.coerce.number().min(0).max(100),
  sgstRate: z.coerce.number().min(0).max(100),
});

export const sequenceUpdateSchema = z.object({
  id: z.string().uuid(),
  prefix: z.string().trim().min(1).max(20),
});

export const reportDateRangeSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
});

export type ExpenseCreateInput = z.infer<typeof expenseCreateSchema>;
export type StaffCreateInput = z.infer<typeof staffCreateSchema>;
export type StaffUpdateInput = z.infer<typeof staffUpdateSchema>;
export type OrgSettingsInput = z.infer<typeof orgSettingsSchema>;
export type TaxRateCreateInput = z.infer<typeof taxRateCreateSchema>;
export type SequenceUpdateInput = z.infer<typeof sequenceUpdateSchema>;
export type ReportDateRangeInput = z.infer<typeof reportDateRangeSchema>;
