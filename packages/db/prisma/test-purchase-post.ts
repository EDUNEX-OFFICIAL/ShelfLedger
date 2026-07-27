/**
 * Integration: purchase post → ledger + balance + avg cost.
 * Run: cd packages/db && pnpm exec tsx prisma/test-purchase-post.ts
 */
import { config } from 'dotenv';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import {
  computeWeightedAverageCost,
  roundUnitCost,
} from '../../domain/src/costing/average-cost';

config({ path: resolve(process.cwd(), '../../.env') });

const prisma = new PrismaClient();

async function applyInbound(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  opts: {
    organizationId: string;
    locationId: string;
    variantId: string;
    qty: number;
    unitCost: number;
    userId: string;
    purchaseId: string;
    lineId: string;
  },
) {
  const existing = await tx.inventoryBalance.findUnique({
    where: {
      locationId_variantId: { locationId: opts.locationId, variantId: opts.variantId },
    },
  });
  const oldQty = Number(existing?.quantity ?? 0);
  const oldAvg = Number(existing?.avgUnitCost ?? 0);
  const newAvg = roundUnitCost(
    computeWeightedAverageCost({
      oldQty,
      oldAvg,
      inQty: opts.qty,
      inRate: opts.unitCost,
    }),
  );
  const newQty = oldQty + opts.qty;

  await tx.stockLedger.create({
    data: {
      organizationId: opts.organizationId,
      locationId: opts.locationId,
      variantId: opts.variantId,
      movementType: 'PURCHASE',
      qtyChange: opts.qty,
      unitCost: opts.unitCost,
      referenceType: 'PURCHASE',
      referenceId: opts.purchaseId,
      referenceLineId: opts.lineId,
      occurredAt: new Date(),
      createdBy: opts.userId,
      updatedBy: opts.userId,
    },
  });

  if (existing) {
    await tx.inventoryBalance.update({
      where: { id: existing.id },
      data: { quantity: newQty, avgUnitCost: newAvg, updatedBy: opts.userId },
    });
  } else {
    await tx.inventoryBalance.create({
      data: {
        organizationId: opts.organizationId,
        locationId: opts.locationId,
        variantId: opts.variantId,
        quantity: newQty,
        avgUnitCost: newAvg,
        createdBy: opts.userId,
        updatedBy: opts.userId,
      },
    });
  }

  return { newQty, newAvg };
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
  const vendor =
    (await prisma.vendor.findFirst({
      where: { organizationId: org.id, deletedAt: null },
    })) ??
    (await prisma.vendor.create({
      data: {
        organizationId: org.id,
        name: `Test Vendor ${Date.now()}`,
        createdBy: user.id,
      },
    }));

  const brand =
    (await prisma.brand.findFirst({ where: { organizationId: org.id, deletedAt: null } })) ??
    (await prisma.brand.create({
      data: { organizationId: org.id, name: `Test Brand ${Date.now()}`, createdBy: user.id },
    }));
  const category =
    (await prisma.category.findFirst({
      where: { organizationId: org.id, deletedAt: null },
    })) ??
    (await prisma.category.create({
      data: { organizationId: org.id, name: `Test Cat ${Date.now()}`, createdBy: user.id },
    }));

  const sku = `TST-${Date.now()}`;
  const article = await prisma.article.create({
    data: {
      organizationId: org.id,
      brandId: brand.id,
      categoryId: category.id,
      name: 'Test Shoe',
      articleCode: sku,
      createdBy: user.id,
      variants: {
        create: {
          organizationId: org.id,
          size: '9',
          color: 'BLK',
          sku,
          mrp: 1999,
          sellingPrice: 1799,
          createdBy: user.id,
        },
      },
    },
    include: { variants: true },
  });
  const variant = article.variants[0]!;

  const purchase = await prisma.purchase.create({
    data: {
      organizationId: org.id,
      branchId: location.branchId,
      locationId: location.id,
      vendorId: vendor.id,
      status: 'DRAFT',
      subtotal: 1000,
      taxAmount: 0,
      totalAmount: 1000,
      createdBy: user.id,
      lines: {
        create: {
          variantId: variant.id,
          qty: 10,
          unitRate: 100,
          taxableAmount: 1000,
          lineTotal: 1000,
          createdBy: user.id,
        },
      },
    },
    include: { lines: true },
  });
  const line = purchase.lines[0]!;

  const first = await prisma.$transaction((tx) =>
    applyInbound(tx, {
      organizationId: org.id,
      locationId: location.id,
      variantId: variant.id,
      qty: 10,
      unitCost: 100,
      userId: user.id,
      purchaseId: purchase.id,
      lineId: line.id,
    }),
  );
  assert.equal(first.newQty, 10);
  assert.equal(first.newAvg, 100);

  await prisma.purchase.update({
    where: { id: purchase.id },
    data: { status: 'POSTED', postedAt: new Date() },
  });

  // Second inbound @ 200 → avg 150
  const second = await prisma.$transaction((tx) =>
    applyInbound(tx, {
      organizationId: org.id,
      locationId: location.id,
      variantId: variant.id,
      qty: 10,
      unitCost: 200,
      userId: user.id,
      purchaseId: purchase.id,
      lineId: line.id,
    }),
  );
  assert.equal(second.newQty, 20);
  assert.equal(second.newAvg, 150);

  const balance = await prisma.inventoryBalance.findUnique({
    where: { locationId_variantId: { locationId: location.id, variantId: variant.id } },
  });
  assert.ok(balance);
  assert.equal(Number(balance.quantity), 20);
  assert.equal(Number(balance.avgUnitCost), 150);

  const ledgerCount = await prisma.stockLedger.count({
    where: { variantId: variant.id, movementType: 'PURCHASE' },
  });
  assert.ok(ledgerCount >= 2);

  // Ensure variant has no quantity column semantics — balance is separate
  const variantCols = await prisma.$queryRaw<Array<{ column_name: string }>>`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'article_variants' AND column_name = 'quantity'
  `;
  assert.equal(variantCols.length, 0, 'article_variants must not have quantity column');

  console.log('PASS: purchase post → balance + avg cost + ledger');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
