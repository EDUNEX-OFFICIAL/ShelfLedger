import { prisma, purchaseRepository, orgContextRepository } from '@shelfledger/db';
import type { SessionUser } from '@shelfledger/db';
import { BusinessRuleError, NotFoundError, ValidationError } from '@shelfledger/errors';
import { computeLineTax, roundMoney } from '@shelfledger/domain';
import type { PurchaseCreateInput, PurchaseReturnInput } from '@shelfledger/validators';
import { applyStockMovement } from '@/server/services/stock-ledger';

function emptyToNull(value: string | undefined | null): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export const purchaseService = {
  list(user: SessionUser) {
    return purchaseRepository.list(user.organizationId);
  },

  get(user: SessionUser, id: string) {
    return purchaseRepository.findById(user.organizationId, id);
  },

  async createDraft(user: SessionUser, input: PurchaseCreateInput) {
    const location = await orgContextRepository.defaultLocation(user.organizationId);
    if (!location) throw new BusinessRuleError('No default location configured');

    const vendor = await prisma.vendor.findFirst({
      where: { id: input.vendorId, organizationId: user.organizationId, deletedAt: null },
    });
    if (!vendor) throw new NotFoundError('Vendor not found');

    const taxRates = await prisma.taxRate.findMany({
      where: { organizationId: user.organizationId, deletedAt: null },
    });
    const taxById = new Map(taxRates.map((t) => [t.id, t]));

    let subtotal = 0;
    let taxAmount = 0;
    const lineCreates = [];

    for (const line of input.lines) {
      const variant = await prisma.articleVariant.findFirst({
        where: {
          id: line.variantId,
          organizationId: user.organizationId,
          deletedAt: null,
        },
        include: { article: true },
      });
      if (!variant) throw new ValidationError('Item not found');

      const discount = line.discountAmount ?? 0;
      const taxable = roundMoney(line.qty * line.unitRate - discount);
      if (taxable < 0) throw new ValidationError('Line taxable amount cannot be negative');

      const taxRate = line.taxRateId
        ? taxById.get(line.taxRateId)
        : variant.article.defaultTaxRateId
          ? taxById.get(variant.article.defaultTaxRateId)
          : undefined;

      const cgstRate = taxRate ? Number(taxRate.cgstRate) : 0;
      const sgstRate = taxRate ? Number(taxRate.sgstRate) : 0;
      const tax = computeLineTax({ taxableAmount: taxable, cgstRate, sgstRate });
      const lineTotal = roundMoney(taxable + tax.taxAmount);

      subtotal = roundMoney(subtotal + taxable);
      taxAmount = roundMoney(taxAmount + tax.taxAmount);

      lineCreates.push({
        variantId: line.variantId,
        qty: line.qty,
        unitRate: line.unitRate,
        discountAmount: discount,
        taxRateId: taxRate?.id ?? null,
        taxableAmount: taxable,
        cgstAmount: tax.cgstAmount,
        sgstAmount: tax.sgstAmount,
        igstAmount: 0,
        lineTotal,
        createdBy: user.id,
        updatedBy: user.id,
      });
    }

    const totalAmount = roundMoney(subtotal + taxAmount);

    return purchaseRepository.create({
      status: 'DRAFT',
      vendorInvoiceNo: emptyToNull(input.vendorInvoiceNo),
      vendorInvoiceDate: emptyToNull(input.vendorInvoiceDate)
        ? new Date(input.vendorInvoiceDate as string)
        : null,
      notes: emptyToNull(input.notes),
      subtotal,
      discountAmount: 0,
      taxAmount,
      totalAmount,
      createdBy: user.id,
      updatedBy: user.id,
      organization: { connect: { id: user.organizationId } },
      branch: { connect: { id: location.branchId } },
      location: { connect: { id: location.id } },
      vendor: { connect: { id: input.vendorId } },
      lines: { create: lineCreates },
    });
  },

  async post(user: SessionUser, purchaseId: string) {
    return prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.findFirst({
        where: {
          id: purchaseId,
          organizationId: user.organizationId,
          deletedAt: null,
        },
        include: { lines: { where: { deletedAt: null } } },
      });
      if (!purchase) throw new NotFoundError('Purchase not found');
      if (purchase.status !== 'DRAFT') {
        throw new BusinessRuleError('Only draft purchases can be posted');
      }
      if (purchase.lines.length === 0) {
        throw new BusinessRuleError('Purchase has no lines');
      }

      const postedAt = new Date();

      for (const line of purchase.lines) {
        await applyStockMovement(tx, {
          organizationId: user.organizationId,
          locationId: purchase.locationId,
          variantId: line.variantId,
          qty: Number(line.qty),
          unitCost: Number(line.unitRate),
          movementType: 'PURCHASE',
          referenceType: 'PURCHASE',
          referenceId: purchase.id,
          referenceLineId: line.id,
          userId: user.id,
          occurredAt: postedAt,
          affectsAverageCost: true,
        });
      }

      return tx.purchase.update({
        where: { id: purchase.id },
        data: {
          status: 'POSTED',
          postedAt,
          updatedBy: user.id,
        },
        include: { lines: true, vendor: true },
      });
    });
  },

  async postReturn(user: SessionUser, input: PurchaseReturnInput) {
    return prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.findFirst({
        where: {
          id: input.purchaseId,
          organizationId: user.organizationId,
          deletedAt: null,
        },
        include: { lines: { where: { deletedAt: null } } },
      });
      if (!purchase) throw new NotFoundError('Purchase not found');
      if (purchase.status !== 'POSTED') {
        throw new BusinessRuleError('Can only return against a posted purchase');
      }

      const occurredAt = new Date();
      const returnId = crypto.randomUUID();

      for (const ret of input.lines) {
        const line = purchase.lines.find((l) => l.id === ret.purchaseLineId);
        if (!line) throw new ValidationError('Purchase line not found on this purchase');

        const prior = await tx.stockLedger.aggregate({
          where: {
            referenceType: 'PURCHASE_RETURN',
            referenceLineId: line.id,
            deletedAt: null,
          },
          _sum: { qtyChange: true },
        });
        // qtyChange on returns is negative; absolute returned so far:
        const alreadyReturned = Math.abs(Number(prior._sum.qtyChange ?? 0));
        const purchased = Number(line.qty);
        if (alreadyReturned + ret.qty > purchased + 0.000001) {
          throw new BusinessRuleError('Return qty exceeds purchased qty', {
            purchased,
            alreadyReturned,
            requested: ret.qty,
          });
        }

        await applyStockMovement(tx, {
          organizationId: user.organizationId,
          locationId: purchase.locationId,
          variantId: line.variantId,
          qty: ret.qty,
          unitCost: Number(line.unitRate),
          movementType: 'PURCHASE_RETURN',
          referenceType: 'PURCHASE_RETURN',
          referenceId: returnId,
          referenceLineId: line.id,
          notes: emptyToNull(input.notes) ?? `Return against purchase ${purchase.id}`,
          userId: user.id,
          occurredAt,
          affectsAverageCost: false,
        });
      }

      await tx.auditLog.create({
        data: {
          organizationId: user.organizationId,
          actorUserId: user.id,
          action: 'PURCHASE_RETURN_POSTED',
          entityType: 'purchase',
          entityId: purchase.id,
          metadata: { returnId, lines: input.lines, notes: input.notes ?? null },
        },
      });

      return { returnId, purchaseId: purchase.id };
    });
  },
};
