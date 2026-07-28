import { prisma } from '../client';

const active = { deletedAt: null } as const;

export type GlobalSearchHit = {
  id: string;
  type: 'sale' | 'customer' | 'article' | 'variant' | 'vendor' | 'brand';
  title: string;
  subtitle?: string;
  href: string;
};

export const searchRepository = {
  async global(organizationId: string, query: string, limit = 8): Promise<GlobalSearchHit[]> {
    const q = query.trim();
    if (q.length < 1) return [];

    const [sales, customers, variants, vendors, brands, articles] = await Promise.all([
      prisma.sale.findMany({
        where: {
          organizationId,
          ...active,
          status: 'POSTED',
          invoiceNo: { contains: q, mode: 'insensitive' },
        },
        take: limit,
        orderBy: { invoiceDate: 'desc' },
        select: { id: true, invoiceNo: true, totalAmount: true },
      }),
      prisma.customer.findMany({
        where: {
          organizationId,
          ...active,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: limit,
        orderBy: { name: 'asc' },
        select: { id: true, name: true, phone: true },
      }),
      prisma.articleVariant.findMany({
        where: {
          organizationId,
          ...active,
          OR: [
            { sku: { contains: q, mode: 'insensitive' } },
            { barcode: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: limit,
        include: { article: { select: { name: true } } },
      }),
      prisma.vendor.findMany({
        where: {
          organizationId,
          ...active,
          name: { contains: q, mode: 'insensitive' },
        },
        take: limit,
        select: { id: true, name: true, phone: true },
      }),
      prisma.brand.findMany({
        where: {
          organizationId,
          ...active,
          name: { contains: q, mode: 'insensitive' },
        },
        take: limit,
        select: { id: true, name: true },
      }),
      prisma.article.findMany({
        where: {
          organizationId,
          ...active,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { articleCode: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: limit,
        select: { id: true, name: true, articleCode: true },
      }),
    ]);

    const hits: GlobalSearchHit[] = [];

    for (const s of sales) {
      hits.push({
        id: s.id,
        type: 'sale',
        title: s.invoiceNo,
        subtitle: `Invoice · ₹${Number(s.totalAmount).toFixed(2)}`,
        href: `/sales/${s.id}/invoice`,
      });
    }
    for (const c of customers) {
      hits.push({
        id: c.id,
        type: 'customer',
        title: c.name,
        subtitle: c.phone ? `Customer · ${c.phone}` : 'Customer',
        href: '/customers',
      });
    }
    for (const v of variants) {
      hits.push({
        id: v.id,
        type: 'variant',
        title: v.sku,
        subtitle: `${v.article.name} · ${v.size}/${v.color}`,
        href: '/articles',
      });
    }
    for (const a of articles) {
      hits.push({
        id: a.id,
        type: 'article',
        title: a.name,
        subtitle: `Article · ${a.articleCode}`,
        href: '/articles',
      });
    }
    for (const v of vendors) {
      hits.push({
        id: v.id,
        type: 'vendor',
        title: v.name,
        subtitle: v.phone ? `Vendor · ${v.phone}` : 'Vendor',
        href: '/vendors',
      });
    }
    for (const b of brands) {
      hits.push({
        id: b.id,
        type: 'brand',
        title: b.name,
        subtitle: 'Brand',
        href: '/brands',
      });
    }

    return hits.slice(0, 24);
  },
};
