/**
 * Integration: purchase stock → sale post (GST + COGS) → exchange both ways.
 * Run: cd packages/db && pnpm exec tsx prisma/test-sale-exchange.ts
 */
import { config } from 'dotenv';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import {
  computeLineTax,
  computeWeightedAverageCost,
  financialYearLabel,
  roundMoney,
  roundUnitCost,
} from '../../domain/src/costing/average-cost';

config({ path: resolve(process.cwd(), '../../.env') });

const prisma = new PrismaClient();

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function applyMovement(
  tx: Tx,
  opts: {
    organizationId: string;
    locationId: string;
    variantId: string;
    qty: number;
    unitCost: number;
    movementType: 'PURCHASE' | 'SALE' | 'EXCHANGE_IN' | 'EXCHANGE_OUT';
    referenceType: 'PURCHASE' | 'SALE' | 'EXCHANGE';
    referenceId: string;
    referenceLineId: string;
    userId: string;
    affectsAverageCost: boolean;
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
    opts.movementType === 'SALE' || opts.movementType === 'EXCHANGE_OUT';
  const signedQty = outbound ? -opts.qty : opts.qty;
  const newQty = oldQty + signedQty;
  if (outbound && newQty < -0.000001) {
    throw new Error(`Insufficient stock: available ${oldQty}, requested ${opts.qty}`);
  }

  let newAvg = oldAvg;
  let ledgerUnitCost = opts.unitCost;
  if (opts.movementType === 'EXCHANGE_IN') {
    newAvg = newQty <= 0 ? 0 : oldAvg;
    ledgerUnitCost = opts.unitCost > 0 ? opts.unitCost : oldAvg;
  } else if (!outbound && opts.affectsAverageCost) {
    newAvg = roundUnitCost(
      computeWeightedAverageCost({
        oldQty,
        oldAvg,
        inQty: opts.qty,
        inRate: opts.unitCost,
      }),
    );
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
      referenceLineId: opts.referenceLineId,
      occurredAt: new Date(),
      createdBy: opts.userId,
      updatedBy: opts.userId,
    },
  });

  if (existing) {
    await tx.inventoryBalance.update({
      where: { id: existing.id },
      data: { quantity: newQty, avgUnitCost: roundUnitCost(newAvg), updatedBy: opts.userId },
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

  return { newQty, unitCost: roundUnitCost(ledgerUnitCost) };
}

async function main() {
  const org = await prisma.organization.findFirst({ where: { deletedAt: null } });
  assert.ok(org, 'seed org required');
  const user = await prisma.user.findFirst({
    where: { organizationId: org.id, role: 'OWNER', deletedAt: null },
  });
  assert.ok(user);
  const location = await prisma.location.findFirst({
    where: { organizationId: org.id, deletedAt: null },
  });
  assert.ok(location);
  const customer = await prisma.customer.findFirst({
    where: { organizationId: org.id, deletedAt: null },
  });
  assert.ok(customer, 'seed customer required');
  const taxRate = await prisma.taxRate.findFirst({
    where: { organizationId: org.id, deletedAt: null, name: 'GST 18%' },
  });
  assert.ok(taxRate);

  const brand =
    (await prisma.brand.findFirst({ where: { organizationId: org.id, deletedAt: null } })) ??
    (await prisma.brand.create({
      data: { organizationId: org.id, name: `Sale Brand ${Date.now()}`, createdBy: user.id },
    }));
  const category =
    (await prisma.category.findFirst({
      where: { organizationId: org.id, deletedAt: null },
    })) ??
    (await prisma.category.create({
      data: { organizationId: org.id, name: `Sale Cat ${Date.now()}`, createdBy: user.id },
    }));

  const sku = `SALE-${Date.now()}`;
  const article = await prisma.article.create({
    data: {
      organizationId: org.id,
      brandId: brand.id,
      categoryId: category.id,
      name: 'Sale Test Shoe',
      articleCode: sku,
      hsnCode: '6403',
      defaultTaxRateId: taxRate.id,
      createdBy: user.id,
      variants: {
        create: {
          organizationId: org.id,
          size: '8',
          color: 'NVY',
          sku,
          mrp: 2499,
          sellingPrice: 2000,
          createdBy: user.id,
        },
      },
    },
    include: { variants: true },
  });
  const variant = article.variants[0]!;

  // Opening stock via purchase-like inbound: 5 @ 100
  await prisma.$transaction((tx) =>
    applyMovement(tx, {
      organizationId: org.id,
      locationId: location.id,
      variantId: variant.id,
      qty: 5,
      unitCost: 100,
      movementType: 'PURCHASE',
      referenceType: 'PURCHASE',
      referenceId: crypto.randomUUID(),
      referenceLineId: crypto.randomUUID(),
      userId: user.id,
      affectsAverageCost: true,
    }),
  );

  const taxable = roundMoney(2 * 2000);
  const tax = computeLineTax({
    taxableAmount: taxable,
    cgstRate: Number(taxRate.cgstRate),
    sgstRate: Number(taxRate.sgstRate),
  });
  const lineTotal = roundMoney(taxable + tax.taxAmount);
  assert.equal(tax.cgstAmount, 360);
  assert.equal(tax.sgstAmount, 360);
  assert.equal(tax.igstAmount, 0);
  assert.equal(lineTotal, 4720);

  const draftNo = `DRAFT-${crypto.randomUUID()}`;
  const sale = await prisma.sale.create({
    data: {
      organizationId: org.id,
      branchId: location.branchId,
      locationId: location.id,
      customerId: customer.id,
      invoiceNo: draftNo,
      invoiceDate: new Date(),
      status: 'DRAFT',
      placeOfSupplyState: org.stateCode,
      isInterState: false,
      subtotal: taxable,
      taxAmount: tax.taxAmount,
      totalAmount: lineTotal,
      paymentStatus: 'PAID',
      createdBy: user.id,
      lines: {
        create: {
          variantId: variant.id,
          qty: 2,
          unitPrice: 2000,
          taxableAmount: taxable,
          cgstRate: Number(taxRate.cgstRate),
          sgstRate: Number(taxRate.sgstRate),
          cgstAmount: tax.cgstAmount,
          sgstAmount: tax.sgstAmount,
          igstAmount: 0,
          lineTotal,
          taxRateId: taxRate.id,
          hsnCode: '6403',
          createdBy: user.id,
        },
      },
      payments: {
        create: {
          method: 'CASH',
          amount: lineTotal,
          createdBy: user.id,
        },
      },
    },
    include: { lines: true },
  });
  const saleLine = sale.lines[0]!;

  const posted = await prisma.$transaction(async (tx) => {
    const fy = financialYearLabel(new Date(), org.financialYearStartMonth);
    let seq = await tx.documentSequence.findUnique({
      where: {
        organizationId_branchId_docType_fyLabel: {
          organizationId: org.id,
          branchId: location.branchId,
          docType: 'SALE_INVOICE',
          fyLabel: fy,
        },
      },
    });
    if (!seq) {
      seq = await tx.documentSequence.create({
        data: {
          organizationId: org.id,
          branchId: location.branchId,
          docType: 'SALE_INVOICE',
          fyLabel: fy,
          prefix: 'INV',
          nextNumber: 1,
          createdBy: user.id,
        },
      });
    }
    const updated = await tx.documentSequence.update({
      where: { id: seq.id },
      data: { nextNumber: { increment: 1 } },
    });
    const invoiceNo = `INV-${fy}-${String(updated.nextNumber - 1).padStart(4, '0')}`;

    const movement = await applyMovement(tx, {
      organizationId: org.id,
      locationId: location.id,
      variantId: variant.id,
      qty: 2,
      unitCost: 0,
      movementType: 'SALE',
      referenceType: 'SALE',
      referenceId: sale.id,
      referenceLineId: saleLine.id,
      userId: user.id,
      affectsAverageCost: false,
    });
    assert.equal(movement.unitCost, 100);

    await tx.saleLine.update({
      where: { id: saleLine.id },
      data: { unitCost: movement.unitCost },
    });

    return tx.sale.update({
      where: { id: sale.id },
      data: { status: 'POSTED', invoiceNo, postedAt: new Date() },
      include: { lines: true },
    });
  });

  assert.match(posted.invoiceNo, /^INV-/);
  assert.equal(Number(posted.lines[0]!.unitCost), 100);

  let balance = await prisma.inventoryBalance.findUnique({
    where: { locationId_variantId: { locationId: location.id, variantId: variant.id } },
  });
  assert.ok(balance);
  assert.equal(Number(balance.quantity), 3);

  // Insufficient stock must fail
  await assert.rejects(
    () =>
      prisma.$transaction((tx) =>
        applyMovement(tx, {
          organizationId: org.id,
          locationId: location.id,
          variantId: variant.id,
          qty: 99,
          unitCost: 0,
          movementType: 'SALE',
          referenceType: 'SALE',
          referenceId: crypto.randomUUID(),
          referenceLineId: crypto.randomUUID(),
          userId: user.id,
          affectsAverageCost: false,
        }),
      ),
    /Insufficient stock/,
  );

  // Exchange: return 1 of sold, replace with another unit of same variant
  const exchange = await prisma.$transaction(async (tx) => {
    const ex = await tx.exchange.create({
      data: {
        organizationId: org.id,
        branchId: location.branchId,
        locationId: location.id,
        customerId: customer.id,
        originalSaleId: sale.id,
        status: 'DRAFT',
        differenceAmount: 0,
        createdBy: user.id,
        lines: {
          create: [
            {
              direction: 'RETURN',
              variantId: variant.id,
              qty: 1,
              unitPrice: 2000,
              unitCost: 100,
              originalSaleLineId: saleLine.id,
              taxableAmount: 2000,
              cgstRate: 9,
              sgstRate: 9,
              cgstAmount: 180,
              sgstAmount: 180,
              lineTotal: 2360,
              createdBy: user.id,
            },
            {
              direction: 'REPLACE',
              variantId: variant.id,
              qty: 1,
              unitPrice: 2000,
              taxableAmount: 2000,
              cgstRate: 9,
              sgstRate: 9,
              cgstAmount: 180,
              sgstAmount: 180,
              lineTotal: 2360,
              createdBy: user.id,
            },
          ],
        },
      },
      include: { lines: true },
    });

    for (const line of ex.lines) {
      if (line.direction === 'RETURN') {
        await applyMovement(tx, {
          organizationId: org.id,
          locationId: location.id,
          variantId: variant.id,
          qty: Number(line.qty),
          unitCost: Number(line.unitCost),
          movementType: 'EXCHANGE_IN',
          referenceType: 'EXCHANGE',
          referenceId: ex.id,
          referenceLineId: line.id,
          userId: user.id,
          affectsAverageCost: false,
        });
      } else {
        await applyMovement(tx, {
          organizationId: org.id,
          locationId: location.id,
          variantId: variant.id,
          qty: Number(line.qty),
          unitCost: 0,
          movementType: 'EXCHANGE_OUT',
          referenceType: 'EXCHANGE',
          referenceId: ex.id,
          referenceLineId: line.id,
          userId: user.id,
          affectsAverageCost: false,
        });
      }
    }

    return tx.exchange.update({
      where: { id: ex.id },
      data: { status: 'POSTED', postedAt: new Date() },
    });
  });

  assert.equal(exchange.status, 'POSTED');

  balance = await prisma.inventoryBalance.findUnique({
    where: { locationId_variantId: { locationId: location.id, variantId: variant.id } },
  });
  assert.ok(balance);
  // 5 - 2 sale + 1 exchange in - 1 exchange out = 3
  assert.equal(Number(balance.quantity), 3);

  const saleLedgers = await prisma.stockLedger.count({
    where: { referenceId: sale.id, movementType: 'SALE' },
  });
  assert.equal(saleLedgers, 1);
  const exIn = await prisma.stockLedger.count({
    where: { referenceId: exchange.id, movementType: 'EXCHANGE_IN' },
  });
  const exOut = await prisma.stockLedger.count({
    where: { referenceId: exchange.id, movementType: 'EXCHANGE_OUT' },
  });
  assert.equal(exIn, 1);
  assert.equal(exOut, 1);

  console.log('PASS: sale GST + stock + invoice seq + exchange ledger');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
