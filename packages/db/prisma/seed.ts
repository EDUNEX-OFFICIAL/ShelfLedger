import { config } from 'dotenv';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { PrismaClient, DocumentType, UserRole } from '@prisma/client';
import {
  CATALOG_MARKER_BRAND_CODE,
  SEED_ARTICLES,
  SEED_BRANDS,
  SEED_CATEGORY_TREE,
  SEED_CUSTOMERS,
  SEED_VENDORS,
  buildSku,
} from './seed-catalog';

config({ path: resolve(process.cwd(), '../../.env') });
config({ path: resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

function currentFyLabel(fyStartMonth = 4): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const startYear = month >= fyStartMonth ? year : year - 1;
  const endYearShort = String(startYear + 1).slice(-2);
  return `${startYear}-${endYearShort}`;
}

type Bootstrap = {
  orgId: string;
  branchId: string;
  locationId: string;
  ownerId: string;
  orgName: string;
  fy: string;
  createdFresh: boolean;
};

async function ensureBootstrap(): Promise<Bootstrap> {
  const email = (process.env.SEED_OWNER_EMAIL ?? 'owner@shelfledger.local').trim().toLowerCase();
  const password = process.env.SEED_OWNER_PASSWORD ?? 'ChangeMe!Owner1';
  if (password.length < 8) {
    throw new Error('SEED_OWNER_PASSWORD must be at least 8 characters');
  }
  const ownerName = (process.env.SEED_OWNER_NAME ?? 'Shop Owner').trim();
  const orgName = (process.env.SEED_ORG_NAME ?? 'City Walk Footwear').trim();
  const stateCode = (process.env.SEED_ORG_STATE_CODE ?? '27').trim();
  if (!/^\d{2}$/.test(stateCode)) {
    throw new Error('SEED_ORG_STATE_CODE must be a 2-digit GST state code');
  }

  const existing = await prisma.organization.findFirst({
    where: { deletedAt: null },
  });

  if (existing) {
    const branch = await prisma.branch.findFirst({
      where: { organizationId: existing.id, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
    const location = await prisma.location.findFirst({
      where: { organizationId: existing.id, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
    const owner = await prisma.user.findFirst({
      where: { organizationId: existing.id, role: UserRole.OWNER, deletedAt: null },
    });
    if (!branch || !location || !owner) {
      throw new Error('Existing organization is missing branch, location, or owner');
    }

    // Soft-upgrade legacy demo org name when still default
    if (existing.name === 'Demo Retail Store' && orgName !== 'Demo Retail Store') {
      await prisma.organization.update({
        where: { id: existing.id },
        data: {
          name: orgName,
          city: existing.city ?? 'Mumbai',
          addressLine1: existing.addressLine1 ?? 'Shop 12, Linking Road, Bandra West',
          pincode: existing.pincode ?? '400050',
          phone: existing.phone ?? '02226401234',
          updatedBy: owner.id,
        },
      });
    }

    return {
      orgId: existing.id,
      branchId: branch.id,
      locationId: location.id,
      ownerId: owner.id,
      orgName: orgName === 'Demo Retail Store' ? existing.name : orgName,
      fy: currentFyLabel(existing.financialYearStartMonth),
      createdFresh: false,
    };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const result = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        name: orgName,
        stateCode,
        addressLine1: 'Shop 12, Linking Road, Bandra West',
        city: 'Mumbai',
        pincode: '400050',
        phone: '02226401234',
        email: 'counter@citywalkfootwear.local',
        financialYearStartMonth: 4,
      },
    });

    const branch = await tx.branch.create({
      data: {
        organizationId: org.id,
        code: 'MAIN',
        name: 'Main Branch',
        stateCode,
        isDefault: true,
      },
    });

    const location = await tx.location.create({
      data: {
        organizationId: org.id,
        branchId: branch.id,
        code: 'SHOP',
        name: 'Shop Floor',
        isDefault: true,
      },
    });

    const owner = await tx.user.create({
      data: {
        organizationId: org.id,
        branchId: branch.id,
        email,
        name: ownerName,
        passwordHash,
        role: UserRole.OWNER,
        isActive: true,
      },
    });

    await tx.organization.update({
      where: { id: org.id },
      data: { createdBy: owner.id, updatedBy: owner.id },
    });
    await tx.branch.update({
      where: { id: branch.id },
      data: { createdBy: owner.id, updatedBy: owner.id },
    });
    await tx.location.update({
      where: { id: location.id },
      data: { createdBy: owner.id, updatedBy: owner.id },
    });

    await tx.customer.create({
      data: {
        organizationId: org.id,
        name: 'Walk-in Customer',
        isWalkIn: true,
        stateCode,
        createdBy: owner.id,
      },
    });

    const taxDefs = [
      { name: 'GST 5%', total: '5', half: '2.5' },
      { name: 'GST 12%', total: '12', half: '6' },
      { name: 'GST 18%', total: '18', half: '9' },
    ] as const;

    for (const t of taxDefs) {
      await tx.taxRate.create({
        data: {
          organizationId: org.id,
          name: t.name,
          totalRate: t.total,
          cgstRate: t.half,
          sgstRate: t.half,
          igstRate: t.total,
          isActive: true,
          createdBy: owner.id,
        },
      });
    }

    const expenseNames = ['Rent', 'Electricity', 'Salaries', 'Packaging', 'Misc'];
    for (const name of expenseNames) {
      await tx.expenseCategory.create({
        data: {
          organizationId: org.id,
          name,
          createdBy: owner.id,
        },
      });
    }

    const fy = currentFyLabel(org.financialYearStartMonth);
    await tx.documentSequence.create({
      data: {
        organizationId: org.id,
        branchId: branch.id,
        docType: DocumentType.SALE_INVOICE,
        prefix: 'INV',
        fyLabel: fy,
        nextNumber: 1,
        createdBy: owner.id,
      },
    });

    await tx.user.create({
      data: {
        organizationId: org.id,
        branchId: branch.id,
        email: 'cashier@shelfledger.local',
        name: 'Counter Cashier',
        passwordHash: await bcrypt.hash('ChangeMe!Cashier1', 12),
        role: UserRole.CASHIER,
        isActive: true,
        createdBy: owner.id,
      },
    });

    return { org, branch, location, owner, fy };
  });

  console.log('Bootstrap complete (org, users, tax, sequences)');
  return {
    orgId: result.org.id,
    branchId: result.branch.id,
    locationId: result.location.id,
    ownerId: result.owner.id,
    orgName: result.org.name,
    fy: result.fy,
    createdFresh: true,
  };
}

/** Soft-delete leftover test / dummy catalog so UI shows only real footwear masters. */
async function softDeleteLegacyCatalog(organizationId: string, userId: string) {
  const now = new Date();
  const whereOrg = { organizationId, deletedAt: null as Date | null };

  const variants = await prisma.articleVariant.updateMany({
    where: whereOrg,
    data: { deletedAt: now, updatedBy: userId },
  });
  const articles = await prisma.article.updateMany({
    where: whereOrg,
    data: { deletedAt: now, updatedBy: userId },
  });
  const brands = await prisma.brand.updateMany({
    where: whereOrg,
    data: { deletedAt: now, updatedBy: userId },
  });
  const categories = await prisma.category.updateMany({
    where: whereOrg,
    data: { deletedAt: now, updatedBy: userId },
  });
  const vendors = await prisma.vendor.updateMany({
    where: whereOrg,
    data: { deletedAt: now, updatedBy: userId },
  });

  // Zero balances for soft-deleted variants (ledger kept for audit)
  const deletedVariantIds = await prisma.articleVariant.findMany({
    where: { organizationId, deletedAt: now },
    select: { id: true },
  });
  if (deletedVariantIds.length > 0) {
    await prisma.inventoryBalance.updateMany({
      where: {
        organizationId,
        variantId: { in: deletedVariantIds.map((v) => v.id) },
        deletedAt: null,
      },
      data: { quantity: 0, avgUnitCost: 0, updatedBy: userId },
    });
  }

  console.log('Soft-deleted legacy catalog', {
    brands: brands.count,
    categories: categories.count,
    articles: articles.count,
    variants: variants.count,
    vendors: vendors.count,
  });
}

async function seedFootwearCatalog(ctx: Bootstrap) {
  const marker = await prisma.brand.findFirst({
    where: {
      organizationId: ctx.orgId,
      code: CATALOG_MARKER_BRAND_CODE,
      deletedAt: null,
    },
  });
  if (marker) {
    console.log('Footwear catalog already present — skip (marker brand BATA)');
    return;
  }

  await softDeleteLegacyCatalog(ctx.orgId, ctx.ownerId);

  const taxRates = await prisma.taxRate.findMany({
    where: { organizationId: ctx.orgId, deletedAt: null, isActive: true },
  });
  const taxByName = new Map(taxRates.map((t) => [t.name, t.id]));
  for (const name of ['GST 5%', 'GST 12%', 'GST 18%'] as const) {
    if (!taxByName.has(name)) {
      throw new Error(`Missing tax rate "${name}" — re-run bootstrap / create tax rates`);
    }
  }

  const brandIds = new Map<string, string>();
  for (const b of SEED_BRANDS) {
    const brand = await prisma.brand.create({
      data: {
        organizationId: ctx.orgId,
        name: b.name,
        code: b.code,
        createdBy: ctx.ownerId,
      },
    });
    brandIds.set(b.code, brand.id);
  }

  const categoryIds = new Map<string, string>();
  for (const root of SEED_CATEGORY_TREE) {
    const parent = await prisma.category.create({
      data: {
        organizationId: ctx.orgId,
        name: root.name,
        createdBy: ctx.ownerId,
      },
    });
    categoryIds.set(root.name, parent.id);
    for (const child of root.children) {
      const cat = await prisma.category.create({
        data: {
          organizationId: ctx.orgId,
          parentId: parent.id,
          name: child,
          createdBy: ctx.ownerId,
        },
      });
      categoryIds.set(`${root.name}/${child}`, cat.id);
    }
  }

  for (const v of SEED_VENDORS) {
    await prisma.vendor.create({
      data: {
        organizationId: ctx.orgId,
        name: v.name,
        gstin: v.gstin,
        phone: v.phone,
        email: v.email,
        address: v.address,
        stateCode: v.stateCode,
        paymentTermsDays: v.paymentTermsDays,
        notes: v.notes,
        createdBy: ctx.ownerId,
      },
    });
  }

  for (const c of SEED_CUSTOMERS) {
    const existing = await prisma.customer.findFirst({
      where: {
        organizationId: ctx.orgId,
        phone: c.phone,
        deletedAt: null,
      },
    });
    if (existing) continue;
    await prisma.customer.create({
      data: {
        organizationId: ctx.orgId,
        name: c.name,
        phone: c.phone,
        stateCode: c.stateCode,
        address: c.address,
        isWalkIn: false,
        createdBy: ctx.ownerId,
      },
    });
  }

  let articleCount = 0;
  let variantCount = 0;
  let openingUnits = 0;

  for (const a of SEED_ARTICLES) {
    const brandId = brandIds.get(a.brandCode);
    if (!brandId) throw new Error(`Unknown brand code ${a.brandCode}`);

    const [root, child] = a.categoryPath;
    const categoryKey = child ? `${root}/${child}` : root;
    const categoryId = categoryIds.get(categoryKey);
    if (!categoryId) throw new Error(`Unknown category ${categoryKey}`);

    const taxId = taxByName.get(a.taxName)!;

    const article = await prisma.article.create({
      data: {
        organizationId: ctx.orgId,
        brandId,
        categoryId,
        name: a.name,
        articleCode: a.articleCode,
        hsnCode: a.hsnCode,
        description: a.description,
        defaultTaxRateId: taxId,
        createdBy: ctx.ownerId,
        variants: {
          create: a.variants.map((v) => ({
            organizationId: ctx.orgId,
            size: v.size,
            color: v.color,
            sku: buildSku(a.brandCode, a.articleCode, v.size, v.color),
            mrp: v.mrp,
            sellingPrice: v.sellingPrice,
            lowStockThreshold: v.lowStockThreshold ?? 2,
            createdBy: ctx.ownerId,
          })),
        },
      },
      include: { variants: true },
    });
    articleCount += 1;
    variantCount += article.variants.length;

    // Opening stock via ledger + balance (same invariants as OPENING movement)
    for (let i = 0; i < article.variants.length; i++) {
      const variant = article.variants[i]!;
      const seedVariant = a.variants[i]!;
      if (!(seedVariant.openingQty > 0)) continue;

      const refId = randomUUID();
      await prisma.$transaction(async (tx) => {
        await tx.stockLedger.create({
          data: {
            organizationId: ctx.orgId,
            locationId: ctx.locationId,
            variantId: variant.id,
            movementType: 'OPENING',
            qtyChange: seedVariant.openingQty,
            unitCost: seedVariant.unitCost,
            referenceType: 'OPENING',
            referenceId: refId,
            notes: 'Seed starting stock',
            occurredAt: new Date(),
            createdBy: ctx.ownerId,
          },
        });
        await tx.inventoryBalance.create({
          data: {
            organizationId: ctx.orgId,
            locationId: ctx.locationId,
            variantId: variant.id,
            quantity: seedVariant.openingQty,
            avgUnitCost: seedVariant.unitCost,
            createdBy: ctx.ownerId,
          },
        });
      });
      openingUnits += seedVariant.openingQty;
    }
  }

  console.log('Footwear catalog seeded', {
    brands: SEED_BRANDS.length,
    categories: categoryIds.size,
    vendors: SEED_VENDORS.length,
    articles: articleCount,
    variants: variantCount,
    openingUnits,
  });
}

async function main() {
  const ctx = await ensureBootstrap();
  await seedFootwearCatalog(ctx);

  const email = (process.env.SEED_OWNER_EMAIL ?? 'owner@shelfledger.local').trim().toLowerCase();
  console.log('Seed complete');
  console.log({
    organization: ctx.orgName,
    createdFresh: ctx.createdFresh,
    ownerEmail: email,
    cashierEmail: 'cashier@shelfledger.local',
    fy: ctx.fy,
  });
  console.log('Owner password: SEED_OWNER_PASSWORD; cashier password: ChangeMe!Cashier1');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
