import {
  prisma,
  saleRepository,
  customerRepository,
  orgContextRepository,
  documentSequenceRepository,
  canOverrideStock,
  type SessionUser,
} from '@shelfledger/db';
import {
  BusinessRuleError,
  NotFoundError,
  ValidationError,
} from '@shelfledger/errors';
import {
  computeLineTax,
  computeRoundOff,
  distributeBillDiscount,
  financialYearLabel,
  roundMoney,
} from '@shelfledger/domain';
import type { SaleCreateInput } from '@shelfledger/validators';
import { applyStockMovement } from '@/server/services/stock-ledger';

function emptyToNull(value: string | undefined | null): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function parseInvoiceDate(value: string | undefined): Date {
  if (!value || value.trim() === '') {
    const d = new Date();
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new ValidationError('Invalid invoice date');
  }
  return parsed;
}

function paymentStatus(total: number, paid: number): 'PAID' | 'PARTIAL' | 'UNPAID' {
  if (paid <= 0) return 'UNPAID';
  if (paid + 0.001 >= total) return 'PAID';
  return 'PARTIAL';
}

export const saleService = {
  list(user: SessionUser) {
    return saleRepository.list(user.organizationId);
  },

  get(user: SessionUser, id: string) {
    return saleRepository.findById(user.organizationId, id);
  },

  async createDraft(user: SessionUser, input: SaleCreateInput) {
    const location = await orgContextRepository.defaultLocation(user.organizationId);
    if (!location) throw new BusinessRuleError('No default location configured');

    const org = await prisma.organization.findFirst({
      where: { id: user.organizationId, deletedAt: null },
    });
    if (!org) throw new NotFoundError('Organization not found');

    const customer = await customerRepository.findById(user.organizationId, input.customerId);
    if (!customer) throw new NotFoundError('Customer not found');

    if (input.stockOverride) {
      if (!canOverrideStock(user.role)) {
        throw new BusinessRuleError('Stock override requires manager or owner');
      }
      if (!emptyToNull(input.overrideReason)) {
        throw new ValidationError('Override reason is required when stock override is enabled');
      }
    }

    const taxRates = await prisma.taxRate.findMany({
      where: { organizationId: user.organizationId, deletedAt: null },
    });
    const taxById = new Map(taxRates.map((t) => [t.id, t]));

    const billDiscount = input.billDiscount ?? 0;
    const lineGross: number[] = [];
    const prepared = [];

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

      const lineDiscount = line.discountAmount ?? 0;
      const gross = roundMoney(line.qty * line.unitPrice - lineDiscount);
      if (gross < 0) throw new ValidationError('Line net cannot be negative');

      const taxRate = line.taxRateId
        ? taxById.get(line.taxRateId)
        : variant.article.defaultTaxRateId
          ? taxById.get(variant.article.defaultTaxRateId)
          : undefined;

      prepared.push({
        variant,
        qty: line.qty,
        unitPrice: line.unitPrice,
        lineDiscount,
        taxRate,
        gross,
      });
      lineGross.push(gross);
    }

    const discountShares = distributeBillDiscount(lineGross, billDiscount);
    let subtotal = 0;
    let taxAmount = 0;
    const lineCreates = [];

    for (let i = 0; i < prepared.length; i++) {
      const row = prepared[i]!;
      const billShare = discountShares[i] ?? 0;
      const taxable = roundMoney(row.gross - billShare);
      if (taxable < 0) throw new ValidationError('Bill discount exceeds line taxable amounts');

      const cgstRate = row.taxRate ? Number(row.taxRate.cgstRate) : 0;
      const sgstRate = row.taxRate ? Number(row.taxRate.sgstRate) : 0;
      const tax = computeLineTax({ taxableAmount: taxable, cgstRate, sgstRate });
      const lineTotal = roundMoney(taxable + tax.taxAmount);

      subtotal = roundMoney(subtotal + taxable);
      taxAmount = roundMoney(taxAmount + tax.taxAmount);

      lineCreates.push({
        variantId: row.variant.id,
        qty: row.qty,
        unitPrice: row.unitPrice,
        unitCost: 0,
        discountAmount: roundMoney(row.lineDiscount + billShare),
        taxRateId: row.taxRate?.id ?? null,
        hsnCode: row.variant.article.hsnCode,
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

    const beforeRound = roundMoney(subtotal + taxAmount);
    const roundOff = computeRoundOff(beforeRound);
    const totalAmount = roundMoney(beforeRound + roundOff);

    const payments = (input.payments ?? []).map((p) => ({
      method: p.method,
      amount: p.amount,
      reference: emptyToNull(p.reference),
      createdBy: user.id,
      updatedBy: user.id,
    }));
    const paid = roundMoney(payments.reduce((s, p) => s + p.amount, 0));
    if (paid > totalAmount + 0.001) {
      throw new ValidationError('Payments exceed invoice total');
    }

    const invoiceDate = parseInvoiceDate(input.invoiceDate);
    const draftInvoiceNo = `DRAFT-${crypto.randomUUID()}`;

    return saleRepository.create({
      invoiceNo: draftInvoiceNo,
      invoiceDate,
      status: 'DRAFT',
      placeOfSupplyState: org.stateCode,
      isInterState: false,
      subtotal,
      discountAmount: billDiscount,
      taxAmount,
      roundOff,
      totalAmount,
      paymentStatus: paymentStatus(totalAmount, paid),
      notes: emptyToNull(input.notes),
      stockOverride: Boolean(input.stockOverride),
      overrideReason: emptyToNull(input.overrideReason),
      createdBy: user.id,
      updatedBy: user.id,
      organization: { connect: { id: user.organizationId } },
      branch: { connect: { id: location.branchId } },
      location: { connect: { id: location.id } },
      customer: { connect: { id: customer.id } },
      lines: { create: lineCreates },
      payments: payments.length > 0 ? { create: payments } : undefined,
    });
  },

  async post(user: SessionUser, saleId: string) {
    return prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findFirst({
        where: {
          id: saleId,
          organizationId: user.organizationId,
          deletedAt: null,
        },
        include: {
          lines: { where: { deletedAt: null } },
          organization: true,
        },
      });
      if (!sale) throw new NotFoundError('Sale not found');
      if (sale.status !== 'DRAFT') {
        throw new BusinessRuleError('Only draft sales can be posted');
      }
      if (sale.lines.length === 0) {
        throw new BusinessRuleError('Sale has no lines');
      }

      const lineTaxSum = roundMoney(
        sale.lines.reduce(
          (s, l) => s + Number(l.cgstAmount) + Number(l.sgstAmount) + Number(l.igstAmount),
          0,
        ),
      );
      if (Math.abs(lineTaxSum - Number(sale.taxAmount)) > 0.02) {
        throw new BusinessRuleError('GST header total does not match line tax sums', {
          headerTax: Number(sale.taxAmount),
          lineTaxSum,
        });
      }

      if (sale.stockOverride) {
        if (!canOverrideStock(user.role)) {
          throw new BusinessRuleError('Stock override requires manager or owner');
        }
        if (!sale.overrideReason) {
          throw new BusinessRuleError('Override reason is required');
        }
      }

      const postedAt = new Date();
      const fyLabel = financialYearLabel(
        sale.invoiceDate,
        sale.organization.financialYearStartMonth,
      );
      const invoiceNo = await documentSequenceRepository.allocateInvoiceNo(tx, {
        organizationId: user.organizationId,
        branchId: sale.branchId,
        docType: 'SALE_INVOICE',
        fyLabel,
        userId: user.id,
      });

      for (const line of sale.lines) {
        const movement = await applyStockMovement(tx, {
          organizationId: user.organizationId,
          locationId: sale.locationId,
          variantId: line.variantId,
          qty: Number(line.qty),
          unitCost: 0,
          movementType: 'SALE',
          referenceType: 'SALE',
          referenceId: sale.id,
          referenceLineId: line.id,
          userId: user.id,
          occurredAt: postedAt,
          affectsAverageCost: false,
          allowNegative: sale.stockOverride,
        });

        await tx.saleLine.update({
          where: { id: line.id },
          data: {
            unitCost: movement.unitCost,
            updatedBy: user.id,
          },
        });
      }

      return tx.sale.update({
        where: { id: sale.id },
        data: {
          status: 'POSTED',
          invoiceNo,
          postedAt,
          updatedBy: user.id,
        },
        include: {
          lines: true,
          payments: true,
          customer: true,
        },
      });
    });
  },

  /** Quick Sale: create draft then post (same invariants as draft → post). */
  async createAndPost(user: SessionUser, input: SaleCreateInput) {
    // Single payment: create without payments, then attach exact server total so
    // client GST preview rounding cannot leave PARTIAL / exceed-total errors.
    const singlePay = input.payments?.length === 1 ? input.payments[0] : null;
    const draftInput: SaleCreateInput = singlePay
      ? { ...input, payments: [] }
      : input;

    const draft = await this.createDraft(user, draftInput);
    const total = Number(draft.totalAmount);

    if (singlePay && total > 0) {
      await prisma.salePayment.create({
        data: {
          saleId: draft.id,
          method: singlePay.method,
          amount: total,
          reference: emptyToNull(singlePay.reference),
          createdBy: user.id,
          updatedBy: user.id,
        },
      });
      await prisma.sale.update({
        where: { id: draft.id },
        data: {
          paymentStatus: 'PAID',
          updatedBy: user.id,
        },
      });
    }

    return this.post(user, draft.id);
  },
};
