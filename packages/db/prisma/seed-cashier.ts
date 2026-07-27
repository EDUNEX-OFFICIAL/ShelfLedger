import { config } from 'dotenv';
import { resolve } from 'node:path';
import bcrypt from 'bcryptjs';
import { PrismaClient, UserRole } from '@prisma/client';

config({ path: resolve(process.cwd(), '../../.env') });
config({ path: resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.findFirst({ where: { deletedAt: null } });
  if (!org) {
    throw new Error('No organization — run pnpm db:seed first');
  }

  const branch = await prisma.branch.findFirst({
    where: { organizationId: org.id, deletedAt: null },
  });

  const email = 'cashier@shelfledger.local';
  const existing = await prisma.user.findFirst({ where: { email, deletedAt: null } });
  if (existing) {
    console.log('Cashier already exists:', email);
    return;
  }

  const passwordHash = await bcrypt.hash('ChangeMe!Cashier1', 12);
  await prisma.user.create({
    data: {
      organizationId: org.id,
      branchId: branch?.id ?? null,
      email,
      name: 'Counter Cashier',
      passwordHash,
      role: UserRole.CASHIER,
      isActive: true,
    },
  });
  console.log('Cashier created:', email);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
