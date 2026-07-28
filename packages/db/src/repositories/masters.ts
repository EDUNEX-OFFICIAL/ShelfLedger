import { prisma } from '../client';
import type { Prisma } from '@prisma/client';

const active = { deletedAt: null } as const;

export const brandRepository = {
  list(organizationId: string) {
    return prisma.brand.findMany({
      where: { organizationId, ...active },
      orderBy: { name: 'asc' },
    });
  },

  findById(organizationId: string, id: string) {
    return prisma.brand.findFirst({
      where: { id, organizationId, ...active },
    });
  },

  create(data: Prisma.BrandCreateInput) {
    return prisma.brand.create({ data });
  },

  update(id: string, data: Prisma.BrandUpdateInput) {
    return prisma.brand.update({ where: { id }, data });
  },

  softDelete(id: string, updatedBy: string) {
    return prisma.brand.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy },
    });
  },
};

export const categoryRepository = {
  list(organizationId: string) {
    return prisma.category.findMany({
      where: { organizationId, ...active },
      orderBy: { name: 'asc' },
    });
  },

  findById(organizationId: string, id: string) {
    return prisma.category.findFirst({
      where: { id, organizationId, ...active },
    });
  },

  create(data: Prisma.CategoryCreateInput) {
    return prisma.category.create({ data });
  },

  update(id: string, data: Prisma.CategoryUpdateInput) {
    return prisma.category.update({ where: { id }, data });
  },

  softDelete(id: string, updatedBy: string) {
    return prisma.category.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy },
    });
  },
};

export const vendorRepository = {
  list(organizationId: string) {
    return prisma.vendor.findMany({
      where: { organizationId, ...active },
      orderBy: { name: 'asc' },
    });
  },

  findById(organizationId: string, id: string) {
    return prisma.vendor.findFirst({
      where: { id, organizationId, ...active },
    });
  },

  create(data: Prisma.VendorCreateInput) {
    return prisma.vendor.create({ data });
  },

  update(id: string, data: Prisma.VendorUpdateInput) {
    return prisma.vendor.update({ where: { id }, data });
  },

  softDelete(id: string, updatedBy: string) {
    return prisma.vendor.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy },
    });
  },
};

export const articleRepository = {
  list(organizationId: string) {
    return prisma.article.findMany({
      where: { organizationId, ...active },
      include: {
        brand: true,
        category: true,
        variants: { where: active, orderBy: [{ size: 'asc' }, { color: 'asc' }] },
        defaultTaxRate: true,
      },
      orderBy: { name: 'asc' },
    });
  },

  findById(organizationId: string, id: string) {
    return prisma.article.findFirst({
      where: { id, organizationId, ...active },
      include: {
        brand: true,
        category: true,
        variants: { where: active, orderBy: [{ size: 'asc' }, { color: 'asc' }] },
        defaultTaxRate: true,
      },
    });
  },

  create(data: Prisma.ArticleCreateInput) {
    return prisma.article.create({
      data,
      include: { variants: true },
    });
  },

  update(id: string, data: Prisma.ArticleUpdateInput) {
    return prisma.article.update({
      where: { id },
      data,
      include: {
        variants: { where: active },
        brand: true,
        category: true,
      },
    });
  },

  softDelete(id: string, updatedBy: string) {
    return prisma.$transaction(async (tx) => {
      await tx.articleVariant.updateMany({
        where: { articleId: id, deletedAt: null },
        data: { deletedAt: new Date(), updatedBy },
      });
      return tx.article.update({
        where: { id },
        data: { deletedAt: new Date(), updatedBy },
      });
    });
  },
};

export const taxRateRepository = {
  listActive(organizationId: string) {
    return prisma.taxRate.findMany({
      where: { organizationId, isActive: true, ...active },
      orderBy: { totalRate: 'asc' },
    });
  },
};

export const dashboardRepository = {
  async counts(organizationId: string) {
    const [brands, categories, articles, vendors, variants] = await Promise.all([
      prisma.brand.count({ where: { organizationId, ...active } }),
      prisma.category.count({ where: { organizationId, ...active } }),
      prisma.article.count({ where: { organizationId, ...active } }),
      prisma.vendor.count({ where: { organizationId, ...active } }),
      prisma.articleVariant.count({ where: { organizationId, ...active } }),
    ]);
    return { brands, categories, articles, vendors, variants };
  },

  async opsSummary(organizationId: string, from: Date, to: Date) {
    const startDay = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
    const endDay = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()));
    const inclusiveDays =
      Math.round((endDay.getTime() - startDay.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    const prevEndDay = new Date(startDay);
    prevEndDay.setUTCDate(prevEndDay.getUTCDate() - 1);
    const prevStartDay = new Date(prevEndDay);
    prevStartDay.setUTCDate(prevStartDay.getUTCDate() - (inclusiveDays - 1));
    const prevFrom = prevStartDay;
    const prevTo = new Date(
      Date.UTC(
        prevEndDay.getUTCFullYear(),
        prevEndDay.getUTCMonth(),
        prevEndDay.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );

    const [
      salesInRange,
      prevSales,
      openBalanceSales,
      unpaidCount,
      lowStockBalances,
      valuationBalances,
      recentSales,
    ] = await Promise.all([
      prisma.sale.findMany({
        where: {
          organizationId,
          ...active,
          status: 'POSTED',
          invoiceDate: { gte: from, lte: to },
        },
        select: {
          id: true,
          totalAmount: true,
          paymentStatus: true,
          invoiceDate: true,
        },
      }),
      prisma.sale.findMany({
        where: {
          organizationId,
          ...active,
          status: 'POSTED',
          invoiceDate: { gte: prevFrom, lte: prevTo },
        },
        select: { totalAmount: true },
      }),
      prisma.sale.findMany({
        where: {
          organizationId,
          ...active,
          status: 'POSTED',
          paymentStatus: { in: ['UNPAID', 'PARTIAL'] },
        },
        select: {
          totalAmount: true,
          payments: { where: active, select: { amount: true } },
        },
      }),
      prisma.sale.count({
        where: {
          organizationId,
          ...active,
          status: 'POSTED',
          paymentStatus: { in: ['UNPAID', 'PARTIAL'] },
        },
      }),
      prisma.inventoryBalance.findMany({
        where: { organizationId, ...active },
        include: { variant: { select: { lowStockThreshold: true } } },
      }),
      prisma.inventoryBalance.findMany({
        where: { organizationId, ...active, quantity: { gt: 0 } },
        select: { quantity: true, avgUnitCost: true },
      }),
      prisma.sale.findMany({
        where: { organizationId, ...active, status: 'POSTED' },
        include: { customer: { select: { name: true } } },
        orderBy: [{ invoiceDate: 'desc' }, { createdAt: 'desc' }],
        take: 8,
      }),
    ]);

    let salesTotal = 0;
    for (const s of salesInRange) {
      salesTotal += Number(s.totalAmount);
    }
    salesTotal = Math.round((salesTotal + Number.EPSILON) * 100) / 100;

    let previousSalesTotal = 0;
    for (const s of prevSales) {
      previousSalesTotal += Number(s.totalAmount);
    }
    previousSalesTotal = Math.round((previousSalesTotal + Number.EPSILON) * 100) / 100;

    let unpaidOutstanding = 0;
    for (const s of openBalanceSales) {
      const paid = s.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      unpaidOutstanding += Math.max(0, Number(s.totalAmount) - paid);
    }
    unpaidOutstanding = Math.round((unpaidOutstanding + Number.EPSILON) * 100) / 100;

    let salesDeltaPct: number | null = null;
    if (previousSalesTotal > 0) {
      salesDeltaPct =
        Math.round((((salesTotal - previousSalesTotal) / previousSalesTotal) * 100 + Number.EPSILON) * 10) /
        10;
    } else if (salesTotal > 0) {
      salesDeltaPct = 100;
    }

    let stockValue = 0;
    for (const b of valuationBalances) {
      stockValue += Number(b.quantity) * Number(b.avgUnitCost);
    }
    stockValue = Math.round((stockValue + Number.EPSILON) * 100) / 100;

    const lowStockCount = lowStockBalances.filter((b) => {
      const threshold = Number(b.variant.lowStockThreshold);
      return threshold > 0 && Number(b.quantity) <= threshold;
    }).length;

    const dayMap = new Map<string, { sales: number; invoices: number }>();
    const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
    const endCursor = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()));
    while (cursor <= endCursor) {
      const key = cursor.toISOString().slice(0, 10);
      dayMap.set(key, { sales: 0, invoices: 0 });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    for (const s of salesInRange) {
      const key = s.invoiceDate.toISOString().slice(0, 10);
      const bucket = dayMap.get(key);
      if (!bucket) continue;
      bucket.sales = Math.round((bucket.sales + Number(s.totalAmount) + Number.EPSILON) * 100) / 100;
      bucket.invoices += 1;
    }

    let paid = 0;
    let partial = 0;
    let unpaid = 0;
    for (const s of salesInRange) {
      if (s.paymentStatus === 'PAID') paid += 1;
      else if (s.paymentStatus === 'PARTIAL') partial += 1;
      else unpaid += 1;
    }

    return {
      salesTotal,
      previousSalesTotal,
      salesDeltaPct,
      invoiceCount: salesInRange.length,
      unpaidCount,
      unpaidOutstanding,
      lowStockCount,
      stockValue,
      salesByDay: Array.from(dayMap.entries()).map(([date, v]) => ({
        date,
        sales: v.sales,
        invoices: v.invoices,
      })),
      paymentMix: [
        { status: 'PAID', count: paid },
        { status: 'PARTIAL', count: partial },
        { status: 'UNPAID', count: unpaid },
      ],
      recentSales: recentSales.map((s) => ({
        id: s.id,
        invoiceNo: s.invoiceNo,
        invoiceDate: s.invoiceDate,
        customerName: s.customer.name,
        totalAmount: Number(s.totalAmount),
        paymentStatus: s.paymentStatus,
      })),
    };
  },
};

export const userRepository = {
  findActiveByEmail(email: string) {
    return prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        deletedAt: null,
        isActive: true,
      },
    });
  },

  findSessionUser(id: string) {
    return prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationId: true,
        branchId: true,
        isActive: true,
      },
    });
  },

  countActiveOwners(organizationId: string) {
    return prisma.user.count({
      where: {
        organizationId,
        role: 'OWNER',
        isActive: true,
        deletedAt: null,
      },
    });
  },

  touchLogin(id: string) {
    return prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  },
};
