import { prisma } from '../client';
import type { Prisma, StockMovementType, ReferenceType, DocumentStatus } from '@prisma/client';

const active = { deletedAt: null } as const;

export type TxClient = Prisma.TransactionClient;

export const inventoryBalanceRepository = {
  list(organizationId: string, locationId?: string) {
    return prisma.inventoryBalance.findMany({
      where: {
        organizationId,
        deletedAt: null,
        ...(locationId ? { locationId } : {}),
        quantity: { not: 0 },
      },
      include: {
        variant: {
          include: { article: { include: { brand: true } } },
        },
        location: true,
      },
      orderBy: [{ updatedAt: 'desc' }],
    });
  },

  find(tx: TxClient | typeof prisma, locationId: string, variantId: string) {
    return tx.inventoryBalance.findUnique({
      where: { locationId_variantId: { locationId, variantId } },
    });
  },
};

export const stockLedgerRepository = {
  list(organizationId: string, opts?: { locationId?: string; variantId?: string; limit?: number }) {
    return prisma.stockLedger.findMany({
      where: {
        organizationId,
        deletedAt: null,
        ...(opts?.locationId ? { locationId: opts.locationId } : {}),
        ...(opts?.variantId ? { variantId: opts.variantId } : {}),
      },
      include: {
        variant: { include: { article: true } },
        location: true,
      },
      orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
      take: opts?.limit ?? 100,
    });
  },

  create(
    tx: TxClient,
    data: {
      organizationId: string;
      locationId: string;
      variantId: string;
      movementType: StockMovementType;
      qtyChange: number | string;
      unitCost: number | string;
      referenceType: ReferenceType;
      referenceId: string;
      referenceLineId?: string | null;
      notes?: string | null;
      occurredAt: Date;
      createdBy: string;
    },
  ) {
    return tx.stockLedger.create({
      data: {
        organizationId: data.organizationId,
        locationId: data.locationId,
        variantId: data.variantId,
        movementType: data.movementType,
        qtyChange: data.qtyChange,
        unitCost: data.unitCost,
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        referenceLineId: data.referenceLineId ?? null,
        notes: data.notes ?? null,
        occurredAt: data.occurredAt,
        createdBy: data.createdBy,
        updatedBy: data.createdBy,
      },
    });
  },

  sumReturnedQty(purchaseLineId: string) {
    return prisma.stockLedger.aggregate({
      where: {
        referenceType: 'PURCHASE_RETURN',
        referenceLineId: purchaseLineId,
        deletedAt: null,
      },
      _sum: { qtyChange: true },
    });
  },
};

export const purchaseRepository = {
  list(organizationId: string) {
    return prisma.purchase.findMany({
      where: { organizationId, ...active },
      include: {
        vendor: true,
        lines: { where: active, include: { variant: { include: { article: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  findById(organizationId: string, id: string) {
    return prisma.purchase.findFirst({
      where: { id, organizationId, ...active },
      include: {
        vendor: true,
        location: true,
        branch: true,
        lines: {
          where: active,
          include: { variant: { include: { article: true } }, taxRate: true },
        },
      },
    });
  },

  create(data: Prisma.PurchaseCreateInput) {
    return prisma.purchase.create({
      data,
      include: { lines: true, vendor: true },
    });
  },

  updateStatus(
    tx: TxClient,
    id: string,
    data: {
      status: DocumentStatus;
      postedAt?: Date | null;
      updatedBy: string;
      subtotal?: number | string;
      discountAmount?: number | string;
      taxAmount?: number | string;
      totalAmount?: number | string;
    },
  ) {
    return tx.purchase.update({
      where: { id },
      data,
    });
  },
};

export const orgContextRepository = {
  async defaultLocation(organizationId: string) {
    const location = await prisma.location.findFirst({
      where: { organizationId, deletedAt: null, isDefault: true },
      include: { branch: true },
    });
    if (location) return location;
    return prisma.location.findFirst({
      where: { organizationId, deletedAt: null },
      include: { branch: true },
    });
  },

  listVariants(organizationId: string) {
    return prisma.articleVariant.findMany({
      where: { organizationId, deletedAt: null, article: { deletedAt: null } },
      include: { article: { include: { brand: true, defaultTaxRate: true } } },
      orderBy: { sku: 'asc' },
    });
  },
};
