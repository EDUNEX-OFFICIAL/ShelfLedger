import {
  prisma,
  exchangeRepository,
  customerRepository,
  orgContextRepository,
  type SessionUser,
} from '@shelfledger/db';
import {
  BusinessRuleError,
  NotFoundError,
  ValidationError,
} from '@shelfledger/errors';
import { computeLineTax, roundMoney } from '@shelfledger/domain';
import type { ExchangeCreateInput } from '@shelfledger/validators';
import { applyStockMovement } from '@/server/services/stock-ledger';

function emptyToNull(value: string | undefined | null): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export const exchangeService = {
  list(user: SessionUser) {
    return exchangeRepository.list(user.organizationId);
  },

  get(user: SessionUser, id: string) {
    return exchangeRepository.findById(user.organizationId, id);
  },

  async createAndPost(user: SessionUser, input: ExchangeCreateInput) {
    const location = await orgContextRepository.defaultLocation(user.organizationId);
    if (!location) throw new BusinessRuleError('No default location configured');

    const customer = await customerRepository.findById(user.organizationId, input.customerId);
    if (!customer) throw new NotFoundError('Customer not found');

    return prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findFirst({
        where: {
          id: input.originalSaleId,
          organizationId: user.organizationId,
          deletedAt: null,
        },
        include: { lines: { where: { deletedAt: null } } },
      });
      if (!sale) throw new NotFoundError('Original sale not found');
      if (sale.status !== 'POSTED') {
        throw new BusinessRuleError('Exchange requires a posted sale');
      }
      if (sale.customerId !== input.customerId) {
        throw new BusinessRuleError('Customer must match the original sale customer');
      }

      const taxRates = await tx.taxRate.findMany({
        where: { organizationId: user.organizationId, deletedAt: null },
      });
      const taxById = new Map(taxRates.map((t) => [t.id, t]));

      let returnTotal = 0;
      let replaceTotal = 0;
      const lineCreates: Array<{
        direction: 'RETURN' | 'REPLACE';
        variantId: string;
        qty: number;
        unitPrice: number;
        unitCost: number;
        originalSaleLineId: string | null;
        taxRateId: string | null;
        hsnCode: string | null;
        taxableAmount: number;
        cgstRate: number;
        sgstRate: number;
        igstRate: number;
        cgstAmount: number;
        sgstAmount: number;
        igstAmount: number;
        lineTotal: number;
        createdBy: string;
        updatedBy: string;
      }> = [];

      for (const ret of input.returnLines) {
        const saleLine = sale.lines.find((l) => l.id === ret.originalSaleLineId);
        if (!saleLine) throw new ValidationError('Sale line not found on original sale');

        const prior = await tx.exchangeLine.aggregate({
          where: {
            originalSaleLineId: saleLine.id,
            direction: 'RETURN',
            deletedAt: null,
            exchange: { status: 'POSTED', deletedAt: null },
          },
          _sum: { qty: true },
        });
        const alreadyReturned = Number(prior._sum.qty ?? 0);
        const sold = Number(saleLine.qty);
        if (alreadyReturned + ret.qty > sold + 0.000001) {
          throw new BusinessRuleError('Return qty exceeds sold qty', {
            sold,
            alreadyReturned,
            requested: ret.qty,
          });
        }

        const unitPrice = Number(saleLine.unitPrice);
        const taxable = roundMoney(ret.qty * unitPrice);
        const cgstRate = Number(saleLine.cgstRate);
        const sgstRate = Number(saleLine.sgstRate);
        const tax = computeLineTax({ taxableAmount: taxable, cgstRate, sgstRate });
        const lineTotal = roundMoney(taxable + tax.taxAmount);
        returnTotal = roundMoney(returnTotal + lineTotal);

        lineCreates.push({
          direction: 'RETURN',
          variantId: saleLine.variantId,
          qty: ret.qty,
          unitPrice,
          unitCost: Number(saleLine.unitCost),
          originalSaleLineId: saleLine.id,
          taxRateId: saleLine.taxRateId,
          hsnCode: saleLine.hsnCode,
          taxableAmount: taxable,
          cgstRate,
          sgstRate,
          igstRate: 0,
          cgstAmount: tax.cgstAmount,
          sgstAmount: tax.sgstAmount,
          igstAmount: 0,
          lineTotal,
          createdBy: user.id,
          updatedBy: user.id,
        });
      }

      for (const rep of input.replaceLines) {
        const variant = await tx.articleVariant.findFirst({
          where: {
            id: rep.variantId,
            organizationId: user.organizationId,
            deletedAt: null,
          },
          include: { article: true },
        });
        if (!variant) throw new ValidationError(`Variant not found: ${rep.variantId}`);

        const taxRate = rep.taxRateId
          ? taxById.get(rep.taxRateId)
          : variant.article.defaultTaxRateId
            ? taxById.get(variant.article.defaultTaxRateId)
            : undefined;

        const taxable = roundMoney(rep.qty * rep.unitPrice);
        const cgstRate = taxRate ? Number(taxRate.cgstRate) : 0;
        const sgstRate = taxRate ? Number(taxRate.sgstRate) : 0;
        const tax = computeLineTax({ taxableAmount: taxable, cgstRate, sgstRate });
        const lineTotal = roundMoney(taxable + tax.taxAmount);
        replaceTotal = roundMoney(replaceTotal + lineTotal);

        lineCreates.push({
          direction: 'REPLACE',
          variantId: variant.id,
          qty: rep.qty,
          unitPrice: rep.unitPrice,
          unitCost: 0,
          originalSaleLineId: null,
          taxRateId: taxRate?.id ?? null,
          hsnCode: variant.article.hsnCode,
          taxableAmount: taxable,
          cgstRate,
          sgstRate,
          igstRate: 0,
          cgstAmount: tax.cgstAmount,
          sgstAmount: tax.sgstAmount,
          igstAmount: 0,
          lineTotal,
          createdBy: user.id,
          updatedBy: user.id,
        });
      }

      const differenceAmount = roundMoney(replaceTotal - returnTotal);
      const postedAt = new Date();

      const exchange = await exchangeRepository.create(tx, {
        status: 'DRAFT',
        differenceAmount,
        notes: emptyToNull(input.notes),
        createdBy: user.id,
        updatedBy: user.id,
        organization: { connect: { id: user.organizationId } },
        branch: { connect: { id: location.branchId } },
        location: { connect: { id: location.id } },
        customer: { connect: { id: customer.id } },
        originalSale: { connect: { id: sale.id } },
        lines: { create: lineCreates },
      });

      const lines = await tx.exchangeLine.findMany({
        where: { exchangeId: exchange.id, deletedAt: null },
      });

      for (const line of lines) {
        if (line.direction === 'RETURN') {
          await applyStockMovement(tx, {
            organizationId: user.organizationId,
            locationId: location.id,
            variantId: line.variantId,
            qty: Number(line.qty),
            unitCost: Number(line.unitCost),
            movementType: 'EXCHANGE_IN',
            referenceType: 'EXCHANGE',
            referenceId: exchange.id,
            referenceLineId: line.id,
            userId: user.id,
            occurredAt: postedAt,
            affectsAverageCost: false,
          });
        } else {
          const movement = await applyStockMovement(tx, {
            organizationId: user.organizationId,
            locationId: location.id,
            variantId: line.variantId,
            qty: Number(line.qty),
            unitCost: 0,
            movementType: 'EXCHANGE_OUT',
            referenceType: 'EXCHANGE',
            referenceId: exchange.id,
            referenceLineId: line.id,
            userId: user.id,
            occurredAt: postedAt,
            affectsAverageCost: false,
          });
          await tx.exchangeLine.update({
            where: { id: line.id },
            data: { unitCost: movement.unitCost, updatedBy: user.id },
          });
        }
      }

      return tx.exchange.update({
        where: { id: exchange.id },
        data: {
          status: 'POSTED',
          postedAt,
          updatedBy: user.id,
        },
        include: {
          lines: true,
          customer: true,
          originalSale: true,
        },
      });
    });
  },
};
