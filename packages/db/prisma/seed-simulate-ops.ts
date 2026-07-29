/**
 * Simulate ~100 real footwear-shop operations (purchases, sales, expenses, adjustments).
 * Run: DATABASE_URL=… pnpm --filter @shelfledger/db simulate
 * Idempotent: skips if any sale notes contain SIM_OPS_V1.
 */
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  PrismaClient,
  type PaymentMethod,
  type PaymentStatus,
} from '@prisma/client';
import {
  computeLineTax,
  computeWeightedAverageCost,
  computeRoundOff,
  financialYearLabel,
  roundMoney,
  roundUnitCost,
} from '../../domain/src/costing/average-cost';

config({ path: resolve(process.cwd(), '../../.env') });
config({ path: resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();
const SIM_MARKER = 'SIM_OPS_V1';

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

function daysAgo(n: number, hour = 11, minute = 0): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function pickPayMethod(): PaymentMethod {
  const r = Math.random();
  if (r < 0.42) return 'UPI';
  if (r < 0.78) return 'CASH';
  if (r < 0.95) return 'CARD';
  return 'OTHER';
}

async function applyMovement(
  tx: Tx,
  opts: {
    organizationId: string;
    locationId: string;
    variantId: string;
    qty: number;
    unitCost: number;
    movementType:
      | 'PURCHASE'
      | 'SALE'
      | 'DAMAGE'
      | 'LOST'
      | 'ADJUSTMENT_OUT'
      | 'ADJUSTMENT_IN';
    referenceType: 'PURCHASE' | 'SALE' | 'ADJUSTMENT';
    referenceId: string;
    referenceLineId?: string | null;
    userId: string;
    occurredAt: Date;
    affectsAverageCost: boolean;
    notes?: string;
  },
) {
  const existing = await tx.inventoryBalance.findUnique({
    where: {
      locationId_variantId: { locationId: opts.locationId, variantId: opts.variantId },
    },
  });
  const oldQty = Number(existing?.quantity ?? 0);
  const oldAvg = Number(existing?.avgUnitCost ?? 0);
  const outbound =
    opts.movementType === 'SALE' ||
    opts.movementType === 'DAMAGE' ||
    opts.movementType === 'LOST' ||
    opts.movementType === 'ADJUSTMENT_OUT';
  const signedQty = outbound ? -opts.qty : opts.qty;
  const newQty = oldQty + signedQty;
  if (outbound && newQty < -0.000001) {
    throw new Error(
      `Insufficient stock for ${opts.variantId}: have ${oldQty}, need ${opts.qty}`,
    );
  }

  let newAvg = oldAvg;
  let ledgerUnitCost = opts.unitCost;
  if (!outbound && opts.affectsAverageCost) {
    newAvg = roundUnitCost(
      computeWeightedAverageCost({
        oldQty,
        oldAvg,
        inQty: opts.qty,
        inRate: opts.unitCost,
      }),
    );
    ledgerUnitCost = opts.unitCost;
  } else if (outbound) {
    ledgerUnitCost = oldAvg;
    if (newQty <= 0) newAvg = 0;
  }

  await tx.stockLedger.create({
    data: {
      organizationId: opts.organizationId,
      locationId: opts.locationId,
      variantId: opts.variantId,
      movementType: opts.movementType,
      qtyChange: signedQty,
      unitCost: roundUnitCost(ledgerUnitCost),
      referenceType: opts.referenceType,
      referenceId: opts.referenceId,
      referenceLineId: opts.referenceLineId ?? null,
      notes: opts.notes ?? null,
      occurredAt: opts.occurredAt,
      createdBy: opts.userId,
      updatedBy: opts.userId,
    },
  });

  if (existing) {
    await tx.inventoryBalance.update({
      where: { id: existing.id },
      data: {
        quantity: newQty,
        avgUnitCost: roundUnitCost(newAvg),
        updatedBy: opts.userId,
      },
    });
  } else {
    await tx.inventoryBalance.create({
      data: {
        organizationId: opts.organizationId,
        locationId: opts.locationId,
        variantId: opts.variantId,
        quantity: newQty,
        avgUnitCost: roundUnitCost(newAvg),
        createdBy: opts.userId,
        updatedBy: opts.userId,
      },
    });
  }

  return { unitCost: roundUnitCost(ledgerUnitCost), newQty };
}

async function allocateInvoiceNo(
  tx: Tx,
  opts: {
    organizationId: string;
    branchId: string;
    fyLabel: string;
    userId: string;
    invoiceDate: Date;
  },
): Promise<string> {
  const fyLabel = financialYearLabel(opts.invoiceDate, 4);
  let seq = await tx.documentSequence.findUnique({
    where: {
      organizationId_branchId_docType_fyLabel: {
        organizationId: opts.organizationId,
        branchId: opts.branchId,
        docType: 'SALE_INVOICE',
        fyLabel,
      },
    },
  });
  if (!seq) {
    seq = await tx.documentSequence.create({
      data: {
        organizationId: opts.organizationId,
        branchId: opts.branchId,
        docType: 'SALE_INVOICE',
        fyLabel,
        prefix: 'INV',
        nextNumber: 1,
        createdBy: opts.userId,
        updatedBy: opts.userId,
      },
    });
  }
  const updated = await tx.documentSequence.update({
    where: { id: seq.id },
    data: { nextNumber: { increment: 1 }, updatedBy: opts.userId },
  });
  const number = updated.nextNumber - 1;
  return `INV-${fyLabel}-${String(number).padStart(4, '0')}`;
}

async function main() {
  const already = await prisma.sale.findFirst({
    where: { notes: { contains: SIM_MARKER }, deletedAt: null },
  });
  if (already) {
    console.log('Simulation already present — skip (marker', SIM_MARKER + ')');
    return;
  }

  const org = await prisma.organization.findFirst({ where: { deletedAt: null } });
  if (!org) throw new Error('No organization — run pnpm db:seed first');

  const branch = await prisma.branch.findFirst({
    where: { organizationId: org.id, deletedAt: null },
  });
  const location = await prisma.location.findFirst({
    where: { organizationId: org.id, deletedAt: null },
  });
  const owner = await prisma.user.findFirst({
    where: { organizationId: org.id, role: 'OWNER', deletedAt: null },
  });
  if (!branch || !location || !owner) {
    throw new Error('Missing branch, location, or owner');
  }

  const vendors = await prisma.vendor.findMany({
    where: { organizationId: org.id, deletedAt: null },
  });
  const customers = await prisma.customer.findMany({
    where: { organizationId: org.id, deletedAt: null },
  });
  const walkIn = customers.find((c) => c.isWalkIn) ?? customers[0];
  if (!walkIn) throw new Error('No walk-in customer');
  if (vendors.length === 0) throw new Error('No vendors — run catalog seed first');

  const expenseCats = await prisma.expenseCategory.findMany({
    where: { organizationId: org.id, deletedAt: null },
  });
  const taxRates = await prisma.taxRate.findMany({
    where: { organizationId: org.id, deletedAt: null, isActive: true },
  });
  const taxById = new Map(taxRates.map((t) => [t.id, t]));

  const variants = await prisma.articleVariant.findMany({
    where: { organizationId: org.id, deletedAt: null },
    include: {
      article: true,
      inventoryBalances: {
        where: { locationId: location.id, deletedAt: null },
      },
    },
  });
  if (variants.length === 0) throw new Error('No item codes — run catalog seed first');

  type VRow = (typeof variants)[number];
  const withStock = () =>
    variants.filter((v) => Number(v.inventoryBalances[0]?.quantity ?? 0) > 0);

  const refreshQty = async (v: VRow) => {
    const bal = await prisma.inventoryBalance.findUnique({
      where: {
        locationId_variantId: { locationId: location.id, variantId: v.id },
      },
    });
    v.inventoryBalances = bal ? [bal] : [];
  };

  let purchaseCount = 0;
  let saleCount = 0;
  let expenseCount = 0;
  let adjustCount = 0;
  let saleTotal = 0;

  // ── Purchases: 15 stock-in bills over ~45 days ────────────────────────────
  for (let i = 0; i < 15; i++) {
    const day = 44 - Math.floor(i * 2.8);
    const occurredAt = daysAgo(day, 10, 30);
    const vendor = vendors[i % vendors.length]!;
    const lineCount = 2 + (i % 3);
    const pool = [...variants].sort(() => Math.random() - 0.5).slice(0, lineCount);

    await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      let taxAmount = 0;
      const lineData = pool.map((v) => {
        const qty = 4 + (i % 5);
        const unitRate = roundMoney(Number(v.sellingPrice) * (0.52 + (i % 4) * 0.03));
        const taxable = roundMoney(qty * unitRate);
        const taxRate = v.article.defaultTaxRateId
          ? taxById.get(v.article.defaultTaxRateId)
          : undefined;
        const cgstRate = taxRate ? Number(taxRate.cgstRate) : 0;
        const sgstRate = taxRate ? Number(taxRate.sgstRate) : 0;
        const tax = computeLineTax({ taxableAmount: taxable, cgstRate, sgstRate });
        const lineTotal = roundMoney(taxable + tax.taxAmount);
        subtotal = roundMoney(subtotal + taxable);
        taxAmount = roundMoney(taxAmount + tax.taxAmount);
        return {
          variantId: v.id,
          qty,
          unitRate,
          discountAmount: 0,
          taxRateId: taxRate?.id ?? null,
          taxableAmount: taxable,
          cgstAmount: tax.cgstAmount,
          sgstAmount: tax.sgstAmount,
          igstAmount: 0,
          lineTotal,
          createdBy: owner.id,
          updatedBy: owner.id,
        };
      });

      const purchase = await tx.purchase.create({
        data: {
          organizationId: org.id,
          branchId: branch.id,
          locationId: location.id,
          vendorId: vendor.id,
          status: 'POSTED',
          vendorInvoiceNo: `V-${vendor.name.slice(0, 3).toUpperCase()}-${1000 + i}`,
          vendorInvoiceDate: occurredAt,
          notes: `${SIM_MARKER} supplier bill`,
          subtotal,
          discountAmount: 0,
          taxAmount,
          totalAmount: roundMoney(subtotal + taxAmount),
          postedAt: occurredAt,
          createdAt: occurredAt,
          createdBy: owner.id,
          updatedBy: owner.id,
          lines: { create: lineData },
        },
        include: { lines: true },
      });

      for (const line of purchase.lines) {
        await applyMovement(tx, {
          organizationId: org.id,
          locationId: location.id,
          variantId: line.variantId,
          qty: Number(line.qty),
          unitCost: Number(line.unitRate),
          movementType: 'PURCHASE',
          referenceType: 'PURCHASE',
          referenceId: purchase.id,
          referenceLineId: line.id,
          userId: owner.id,
          occurredAt,
          affectsAverageCost: true,
          notes: SIM_MARKER,
        });
      }
    });

    for (const v of pool) await refreshQty(v);
    purchaseCount += 1;
  }

  // ── Sales: 65 counter bills ───────────────────────────────────────────────
  for (let i = 0; i < 65; i++) {
    const day = Math.floor((i / 65) * 40); // last 40 days, denser toward today
    const daysBack = 40 - day;
    const hour = 11 + (i % 8);
    const occurredAt = daysAgo(daysBack, hour, (i * 7) % 60);

    const stocked = withStock();
    if (stocked.length === 0) {
      console.warn('No stock left for more sales at index', i);
      break;
    }

    const lineCount = i % 5 === 0 ? 2 : 1;
    const chosen: VRow[] = [];
    const shuffled = [...stocked].sort(() => Math.random() - 0.5);
    for (const v of shuffled) {
      if (chosen.length >= lineCount) break;
      const qtyAvail = Number(v.inventoryBalances[0]?.quantity ?? 0);
      if (qtyAvail >= 1) chosen.push(v);
    }
    if (chosen.length === 0) continue;

    const customer =
      i % 4 === 0
        ? walkIn
        : customers.filter((c) => !c.isWalkIn)[i % Math.max(1, customers.filter((c) => !c.isWalkIn).length)] ??
          walkIn;

    const method = pickPayMethod();
    // ~12% dues / partial for dashboard realism
    const payMode: 'full' | 'partial' | 'none' =
      i % 17 === 0 ? 'none' : i % 11 === 0 ? 'partial' : 'full';

    const saleResult = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      let taxAmount = 0;
      const lineCreates = chosen.map((v) => {
        const qty = 1;
        const unitPrice = Number(v.sellingPrice);
        const lineDiscount = i % 13 === 0 ? roundMoney(unitPrice * 0.05) : 0;
        const taxable = roundMoney(qty * unitPrice - lineDiscount);
        const taxRate = v.article.defaultTaxRateId
          ? taxById.get(v.article.defaultTaxRateId)
          : undefined;
        const cgstRate = taxRate ? Number(taxRate.cgstRate) : 0;
        const sgstRate = taxRate ? Number(taxRate.sgstRate) : 0;
        const tax = computeLineTax({ taxableAmount: taxable, cgstRate, sgstRate });
        const lineTotal = roundMoney(taxable + tax.taxAmount);
        subtotal = roundMoney(subtotal + taxable);
        taxAmount = roundMoney(taxAmount + tax.taxAmount);
        return {
          variantId: v.id,
          qty,
          unitPrice,
          unitCost: 0,
          discountAmount: lineDiscount,
          taxRateId: taxRate?.id ?? null,
          hsnCode: v.article.hsnCode,
          taxableAmount: taxable,
          cgstRate,
          sgstRate,
          igstRate: 0,
          cgstAmount: tax.cgstAmount,
          sgstAmount: tax.sgstAmount,
          igstAmount: 0,
          lineTotal,
          createdBy: owner.id,
          updatedBy: owner.id,
        };
      });

      const beforeRound = roundMoney(subtotal + taxAmount);
      const roundOff = computeRoundOff(beforeRound);
      const totalAmount = roundMoney(beforeRound + roundOff);

      let paymentStatus: PaymentStatus = 'PAID';
      let payAmount = totalAmount;
      if (payMode === 'none') {
        paymentStatus = 'UNPAID';
        payAmount = 0;
      } else if (payMode === 'partial') {
        paymentStatus = 'PARTIAL';
        payAmount = roundMoney(totalAmount * 0.5);
      }

      const invoiceNo = await allocateInvoiceNo(tx, {
        organizationId: org.id,
        branchId: branch.id,
        fyLabel: financialYearLabel(occurredAt, org.financialYearStartMonth),
        userId: owner.id,
        invoiceDate: occurredAt,
      });

      const sale = await tx.sale.create({
        data: {
          organizationId: org.id,
          branchId: branch.id,
          locationId: location.id,
          customerId: customer.id,
          invoiceNo,
          invoiceDate: occurredAt,
          status: 'POSTED',
          placeOfSupplyState: org.stateCode,
          isInterState: false,
          subtotal,
          discountAmount: 0,
          taxAmount,
          roundOff,
          totalAmount,
          paymentStatus,
          notes: `${SIM_MARKER} counter sale`,
          postedAt: occurredAt,
          createdAt: occurredAt,
          createdBy: owner.id,
          updatedBy: owner.id,
          lines: { create: lineCreates },
          payments:
            payAmount > 0
              ? {
                  create: [
                    {
                      method,
                      amount: payAmount,
                      reference:
                        method === 'UPI'
                          ? `UPI${100000 + i}`
                          : method === 'CARD'
                            ? `CARD${200000 + i}`
                            : null,
                      paidAt: occurredAt,
                      createdBy: owner.id,
                      updatedBy: owner.id,
                    },
                  ],
                }
              : undefined,
        },
        include: { lines: true },
      });

      for (const line of sale.lines) {
        const movement = await applyMovement(tx, {
          organizationId: org.id,
          locationId: location.id,
          variantId: line.variantId,
          qty: Number(line.qty),
          unitCost: 0,
          movementType: 'SALE',
          referenceType: 'SALE',
          referenceId: sale.id,
          referenceLineId: line.id,
          userId: owner.id,
          occurredAt,
          affectsAverageCost: false,
          notes: SIM_MARKER,
        });
        await tx.saleLine.update({
          where: { id: line.id },
          data: { unitCost: movement.unitCost, updatedBy: owner.id },
        });
      }

      return { totalAmount };
    });

    for (const v of chosen) await refreshQty(v);
    saleCount += 1;
    saleTotal = roundMoney(saleTotal + saleResult.totalAmount);
  }

  // ── Expenses: 15 shop expenses ────────────────────────────────────────────
  const expenseNotes = [
    'Shop rent',
    'MSEB electricity bill',
    'Staff salary advance',
    'Carry bags / packaging',
    'Tea & water for staff',
    'Local transport / courier',
    'Shop cleaning',
    'Visiting cards print',
  ];
  for (let i = 0; i < 15; i++) {
    if (expenseCats.length === 0) break;
    const cat =
      expenseCats.find((c) => {
        const n = c.name.toLowerCase();
        if (i % 5 === 0) return n.includes('rent');
        if (i % 5 === 1) return n.includes('electric');
        if (i % 5 === 2) return n.includes('salar');
        if (i % 5 === 3) return n.includes('pack');
        return n.includes('misc') || true;
      }) ?? expenseCats[i % expenseCats.length]!;

    const day = 42 - i * 2;
    const expenseDate = daysAgo(Math.max(0, day), 9, 0);
    const amount =
      cat.name.toLowerCase().includes('rent')
        ? 45000
        : cat.name.toLowerCase().includes('salar')
          ? 18000 + (i % 3) * 1000
          : cat.name.toLowerCase().includes('electric')
            ? 3200 + i * 50
            : roundMoney(150 + (i % 7) * 85);

    await prisma.expense.create({
      data: {
        organizationId: org.id,
        branchId: branch.id,
        categoryId: cat.id,
        amount,
        expenseDate,
        paymentMethod: i % 3 === 0 ? 'UPI' : 'CASH',
        notes: `${SIM_MARKER} ${expenseNotes[i % expenseNotes.length]}`,
        createdAt: expenseDate,
        createdBy: owner.id,
        updatedBy: owner.id,
      },
    });
    expenseCount += 1;
  }

  // ── Adjustments: 5 damage / lost / recount ────────────────────────────────
  for (let i = 0; i < 5; i++) {
    const stocked = withStock().filter(
      (v) => Number(v.inventoryBalances[0]?.quantity ?? 0) >= 2,
    );
    if (stocked.length === 0) break;
    const v = pick(stocked);
    const occurredAt = daysAgo(5 + i * 3, 18, 0);
    const types = ['DAMAGE', 'LOST', 'ADJUSTMENT_OUT'] as const;
    const movementType = types[i % types.length]!;
    const refId = randomUUID();

    await prisma.$transaction(async (tx) => {
      await applyMovement(tx, {
        organizationId: org.id,
        locationId: location.id,
        variantId: v.id,
        qty: 1,
        unitCost: 0,
        movementType,
        referenceType: 'ADJUSTMENT',
        referenceId: refId,
        userId: owner.id,
        occurredAt,
        affectsAverageCost: false,
        notes: `${SIM_MARKER} ${movementType.toLowerCase()} — shop floor`,
      });
    });
    await refreshQty(v);
    adjustCount += 1;
  }

  const totalOps = purchaseCount + saleCount + expenseCount + adjustCount;
  console.log('Simulation complete', {
    marker: SIM_MARKER,
    purchases: purchaseCount,
    sales: saleCount,
    expenses: expenseCount,
    adjustments: adjustCount,
    totalOps,
    salesRevenueApprox: saleTotal,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
