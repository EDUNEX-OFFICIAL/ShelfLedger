import { config } from 'dotenv';
import { resolve } from 'node:path';
import bcrypt from 'bcryptjs';
import { PrismaClient, DocumentType, UserRole } from '@prisma/client';

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

async function main() {
  const email = (process.env.SEED_OWNER_EMAIL ?? 'owner@shelfledger.local').trim().toLowerCase();
  const password = process.env.SEED_OWNER_PASSWORD ?? 'ChangeMe!Owner1';
  if (password.length < 8) {
    throw new Error('SEED_OWNER_PASSWORD must be at least 8 characters');
  }
  const ownerName = (process.env.SEED_OWNER_NAME ?? 'Shop Owner').trim();
  const orgName = (process.env.SEED_ORG_NAME ?? 'Demo Retail Store').trim();
  const stateCode = (process.env.SEED_ORG_STATE_CODE ?? '27').trim();
  if (!/^\d{2}$/.test(stateCode)) {
    throw new Error('SEED_ORG_STATE_CODE must be a 2-digit GST state code');
  }

  const existing = await prisma.organization.findFirst({
    where: { deletedAt: null },
  });
  if (existing) {
    console.log('Seed skipped: organization already exists:', existing.name);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const result = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        name: orgName,
        stateCode,
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

  console.log('Seed complete');
  console.log({
    organization: result.org.name,
    branch: result.branch.code,
    location: result.location.code,
    ownerEmail: email,
    cashierEmail: 'cashier@shelfledger.local',
    fy: result.fy,
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
