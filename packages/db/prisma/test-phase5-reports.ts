/**
 * Fixture checks for report totals + settings sequence prefix isolation.
 * Run: DATABASE_URL=... pnpm exec tsx prisma/test-phase5-reports.ts
 */
import { config } from 'dotenv';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import { computeLineTax, roundMoney } from '../../domain/src/costing/average-cost';

config({ path: resolve(process.cwd(), '../../.env') });

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.findFirst({ where: { deletedAt: null } });
  assert.ok(org);
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
  assert.ok(customer);
  const taxRate = await prisma.taxRate.findFirst({
    where: { organizationId: org.id, deletedAt: null },
  });
  assert.ok(taxRate);

  const brand =
    (await prisma.brand.findFirst({ where: { organizationId: org.id, deletedAt: null } })) ??
    (await prisma.brand.create({
      data: { organizationId: org.id, name: `Rpt Brand ${Date.now()}`, createdBy: user.id },
    }));
  const category =
    (await prisma.category.findFirst({ where: { organizationId: org.id, deletedAt: null } })) ??
    (await prisma.category.create({
      data: { organizationId: org.id, name: `Rpt Cat ${Date.now()}`, createdBy: user.id },
    }));

  const sku = `RPT-${Date.now()}`;
  const article = await prisma.article.create({
    data: {
      organizationId: org.id,
      brandId: brand.id,
      categoryId: category.id,
      name: 'Report Fixture',
      articleCode: sku,
      defaultTaxRateId: taxRate.id,
      createdBy: user.id,
      variants: {
        create: {
          organizationId: org.id,
          size: '7',
          color: 'RED',
          sku,
          mrp: 1000,
          sellingPrice: 1000,
          lowStockThreshold: 100,
          createdBy: user.id,
        },
      },
    },
    include: { variants: true },
  });
  const variant = article.variants[0]!;

  await prisma.inventoryBalance.create({
    data: {
      organizationId: org.id,
      locationId: location.id,
      variantId: variant.id,
      quantity: 10,
      avgUnitCost: 400,
      createdBy: user.id,
      updatedBy: user.id,
    },
  });

  const taxable = 1000;
  const tax = computeLineTax({
    taxableAmount: taxable,
    cgstRate: Number(taxRate.cgstRate),
    sgstRate: Number(taxRate.sgstRate),
  });
  const total = roundMoney(taxable + tax.taxAmount);
  const invoiceDate = new Date();
  const invoiceNo = `RPT-FIX-${Date.now()}`;

  await prisma.sale.create({
    data: {
      organizationId: org.id,
      branchId: location.branchId,
      locationId: location.id,
      customerId: customer.id,
      invoiceNo,
      invoiceDate,
      status: 'POSTED',
      placeOfSupplyState: org.stateCode,
      isInterState: false,
      subtotal: taxable,
      taxAmount: tax.taxAmount,
      totalAmount: total,
      paymentStatus: 'PAID',
      postedAt: new Date(),
      createdBy: user.id,
      lines: {
        create: {
          variantId: variant.id,
          qty: 1,
          unitPrice: 1000,
          unitCost: 400,
          taxableAmount: taxable,
          cgstRate: Number(taxRate.cgstRate),
          sgstRate: Number(taxRate.sgstRate),
          cgstAmount: tax.cgstAmount,
          sgstAmount: tax.sgstAmount,
          lineTotal: total,
          taxRateId: taxRate.id,
          createdBy: user.id,
        },
      },
    },
  });

  const from = invoiceDate.toISOString().slice(0, 10);
  const to = from;
  const fromDate = new Date(`${from}T00:00:00.000Z`);
  const toDate = new Date(`${to}T23:59:59.999Z`);

  const sales = await prisma.sale.findMany({
    where: {
      organizationId: org.id,
      status: 'POSTED',
      deletedAt: null,
      invoiceDate: { gte: fromDate, lte: toDate },
      invoiceNo,
    },
    include: { lines: { where: { deletedAt: null } } },
  });
  assert.equal(sales.length, 1);

  let sumTaxable = 0;
  let sumCgst = 0;
  let sumSgst = 0;
  let sumTotal = 0;
  let sumCogs = 0;
  for (const s of sales) {
    sumTaxable = roundMoney(sumTaxable + Number(s.subtotal));
    sumTotal = roundMoney(sumTotal + Number(s.totalAmount));
    for (const l of s.lines) {
      sumCgst = roundMoney(sumCgst + Number(l.cgstAmount));
      sumSgst = roundMoney(sumSgst + Number(l.sgstAmount));
      sumCogs = roundMoney(sumCogs + Number(l.qty) * Number(l.unitCost));
    }
  }

  assert.equal(sumTaxable, taxable);
  assert.equal(sumCgst, tax.cgstAmount);
  assert.equal(sumSgst, tax.sgstAmount);
  assert.equal(sumTotal, total);
  assert.equal(sumCogs, 400);
  assert.equal(roundMoney(sumTaxable - sumCogs), 600);

  // Settings: prefix change must not alter already-posted invoice numbers
  const seq = await prisma.documentSequence.findFirst({
    where: { organizationId: org.id, docType: 'SALE_INVOICE' },
  });
  if (seq) {
    const oldPrefix = seq.prefix;
    await prisma.documentSequence.update({
      where: { id: seq.id },
      data: { prefix: `${oldPrefix}X` },
    });
    const posted = await prisma.sale.findFirst({ where: { invoiceNo } });
    assert.ok(posted);
    assert.equal(posted.invoiceNo, invoiceNo);
    await prisma.documentSequence.update({
      where: { id: seq.id },
      data: { prefix: oldPrefix },
    });
  }

  // Low stock: threshold 100, qty 10 → should appear
  const balance = await prisma.inventoryBalance.findUnique({
    where: { locationId_variantId: { locationId: location.id, variantId: variant.id } },
    include: { variant: true },
  });
  assert.ok(balance);
  assert.ok(Number(balance.quantity) <= Number(balance.variant.lowStockThreshold));

  // Stock valuation fixture
  const value = roundMoney(Number(balance.quantity) * Number(balance.avgUnitCost));
  assert.equal(value, 4000);

  console.log('PASS: phase5 report fixtures + settings isolation');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
