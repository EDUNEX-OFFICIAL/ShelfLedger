import { prisma } from '../client';

const active = { deletedAt: null } as const;

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function parseDayStart(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

function parseDayEnd(isoDate: string): Date {
  return new Date(`${isoDate}T23:59:59.999Z`);
}

export const reportRepository = {
  async salesSummary(organizationId: string, from: string, to: string) {
    const fromDate = parseDayStart(from);
    const toDate = parseDayEnd(to);

    const sales = await prisma.sale.findMany({
      where: {
        organizationId,
        status: 'POSTED',
        ...active,
        invoiceDate: { gte: fromDate, lte: toDate },
      },
      include: {
        lines: { where: active },
        payments: { where: active },
      },
    });

    let taxable = 0;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;
    let total = 0;
    let discount = 0;
    let cogs = 0;

    for (const sale of sales) {
      taxable = roundMoney(taxable + Number(sale.subtotal));
      total = roundMoney(total + Number(sale.totalAmount));
      discount = roundMoney(discount + Number(sale.discountAmount));
      for (const line of sale.lines) {
        cgst = roundMoney(cgst + Number(line.cgstAmount));
        sgst = roundMoney(sgst + Number(line.sgstAmount));
        igst = roundMoney(igst + Number(line.igstAmount));
        cogs = roundMoney(cogs + Number(line.qty) * Number(line.unitCost));
      }
    }

    return {
      invoiceCount: sales.length,
      taxable,
      cgst,
      sgst,
      igst,
      taxAmount: roundMoney(cgst + sgst + igst),
      discount,
      total,
      cogs,
      profitEstimate: roundMoney(taxable - cogs),
      rows: sales.map((s) => ({
        id: s.id,
        invoiceNo: s.invoiceNo,
        invoiceDate: s.invoiceDate,
        totalAmount: Number(s.totalAmount),
        subtotal: Number(s.subtotal),
        taxAmount: Number(s.taxAmount),
        paymentStatus: s.paymentStatus,
      })).slice(0, 200),
    };
  },

  async gstSummary(organizationId: string, from: string, to: string) {
    const summary = await this.salesSummary(organizationId, from, to);
    return {
      taxable: summary.taxable,
      cgst: summary.cgst,
      sgst: summary.sgst,
      igst: summary.igst,
      taxAmount: summary.taxAmount,
      invoiceCount: summary.invoiceCount,
    };
  },

  async purchaseSummary(organizationId: string, from: string, to: string) {
    const fromDate = parseDayStart(from);
    const toDate = parseDayEnd(to);
    const purchases = await prisma.purchase.findMany({
      where: {
        organizationId,
        status: 'POSTED',
        ...active,
        postedAt: { gte: fromDate, lte: toDate },
      },
      include: { vendor: true, lines: { where: active } },
    });

    let subtotal = 0;
    let taxAmount = 0;
    let total = 0;
    for (const p of purchases) {
      subtotal = roundMoney(subtotal + Number(p.subtotal));
      taxAmount = roundMoney(taxAmount + Number(p.taxAmount));
      total = roundMoney(total + Number(p.totalAmount));
    }

    return {
      purchaseCount: purchases.length,
      subtotal,
      taxAmount,
      total,
      rows: purchases.map((p) => ({
        id: p.id,
        vendorName: p.vendor.name,
        postedAt: p.postedAt,
        totalAmount: Number(p.totalAmount),
        lineCount: p.lines.length,
      })).slice(0, 200),
    };
  },

  async stockValuation(organizationId: string) {
    const balances = await prisma.inventoryBalance.findMany({
      where: { organizationId, ...active, quantity: { gt: 0 } },
      include: {
        variant: { include: { article: true } },
        location: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    let totalValue = 0;
    const rows = balances.map((b) => {
      const qty = Number(b.quantity);
      const avg = Number(b.avgUnitCost);
      const value = roundMoney(qty * avg);
      totalValue = roundMoney(totalValue + value);
      return {
        variantId: b.variantId,
        sku: b.variant.sku,
        articleName: b.variant.article.name,
        location: b.location.name,
        qty,
        avgUnitCost: avg,
        value,
      };
    });

    return { totalValue, rows };
  },

  async lowStock(organizationId: string) {
    const balances = await prisma.inventoryBalance.findMany({
      where: { organizationId, ...active },
      include: {
        variant: { include: { article: true } },
        location: true,
      },
    });

    const rows = balances
      .map((b) => {
        const qty = Number(b.quantity);
        const threshold = Number(b.variant.lowStockThreshold);
        return {
          variantId: b.variantId,
          sku: b.variant.sku,
          articleName: b.variant.article.name,
          location: b.location.name,
          qty,
          threshold,
        };
      })
      .filter((r) => r.threshold > 0 && r.qty <= r.threshold)
      .sort((a, b) => a.qty - b.qty);

    // Also include variants with threshold but no balance row (qty 0)
    const withBalance = new Set(balances.map((b) => b.variantId));
    const variants = await prisma.articleVariant.findMany({
      where: {
        organizationId,
        ...active,
        lowStockThreshold: { gt: 0 },
        article: { deletedAt: null },
      },
      include: { article: true },
    });
    for (const v of variants) {
      if (withBalance.has(v.id)) continue;
      rows.push({
        variantId: v.id,
        sku: v.sku,
        articleName: v.article.name,
        location: '—',
        qty: 0,
        threshold: Number(v.lowStockThreshold),
      });
    }

    return { rows };
  },

  async expenseSummary(organizationId: string, from: string, to: string) {
    const fromDate = parseDayStart(from);
    const toDate = parseDayEnd(to);
    const expenses = await prisma.expense.findMany({
      where: {
        organizationId,
        ...active,
        expenseDate: { gte: fromDate, lte: toDate },
      },
      include: { category: true },
    });
    const total = roundMoney(expenses.reduce((s, e) => s + Number(e.amount), 0));

    const byCategoryMap = new Map<string, number>();
    for (const e of expenses) {
      const name = e.category.name;
      byCategoryMap.set(name, roundMoney((byCategoryMap.get(name) ?? 0) + Number(e.amount)));
    }
    const byCategory = Array.from(byCategoryMap.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    return { total, count: expenses.length, byCategory };
  },

  /** Daily sales totals for charts (fills empty days with 0). */
  async salesTrend(organizationId: string, from: string, to: string) {
    const fromDate = parseDayStart(from);
    const toDate = parseDayEnd(to);
    const sales = await prisma.sale.findMany({
      where: {
        organizationId,
        status: 'POSTED',
        ...active,
        invoiceDate: { gte: fromDate, lte: toDate },
      },
      select: { invoiceDate: true, totalAmount: true },
    });

    const dayMap = new Map<string, number>();
    const cursor = new Date(parseDayStart(from));
    const end = parseDayStart(to);
    while (cursor <= end) {
      dayMap.set(cursor.toISOString().slice(0, 10), 0);
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    for (const row of sales) {
      const key = row.invoiceDate.toISOString().slice(0, 10);
      if (!dayMap.has(key)) continue;
      dayMap.set(key, roundMoney((dayMap.get(key) ?? 0) + Number(row.totalAmount)));
    }
    return Array.from(dayMap.entries()).map(([date, salesAmount]) => ({
      date,
      sales: salesAmount,
    }));
  },
};
