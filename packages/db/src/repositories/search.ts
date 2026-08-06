import { prisma } from '../client';

const active = { deletedAt: null } as const;

export type GlobalSearchHit = {
  id: string;
  type: 'sale' | 'customer' | 'article' | 'variant' | 'vendor' | 'brand';
  title: string;
  subtitle?: string;
  href: string;
};

/** Counter / line-picker typeahead row. */
export type VariantSearchHit = {
  id: string;
  sku: string;
  barcode: string | null;
  label: string;
  sellingPrice: number;
  cgstRate: number;
  sgstRate: number;
  onHandQty: number;
  size: string;
  color: string;
  articleId: string;
  articleName: string;
  articleCode: string;
};

/** Article hit for counter size/colour matrix. */
export type ArticleSearchHit = {
  id: string;
  name: string;
  articleCode: string;
  brandName: string | null;
  variantCount: number;
};

function mapVariantHit(
  v: {
    id: string;
    sku: string;
    barcode: string | null;
    size: string;
    color: string;
    sellingPrice: { toString(): string } | number;
    article: {
      id: string;
      name: string;
      articleCode: string;
      defaultTaxRate: {
        cgstRate: { toString(): string } | number;
        sgstRate: { toString(): string } | number;
      } | null;
    };
  },
  onHandQty: number,
): VariantSearchHit {
  return {
    id: v.id,
    sku: v.sku,
    barcode: v.barcode,
    label: `${v.sku} — ${v.article.name} (${v.size}/${v.color})`,
    sellingPrice: Number(v.sellingPrice),
    cgstRate: v.article.defaultTaxRate ? Number(v.article.defaultTaxRate.cgstRate) : 0,
    sgstRate: v.article.defaultTaxRate ? Number(v.article.defaultTaxRate.sgstRate) : 0,
    onHandQty,
    size: v.size,
    color: v.color,
    articleId: v.article.id,
    articleName: v.article.name,
    articleCode: v.article.articleCode,
  };
}

function sortSizeLabel(a: string, b: string) {
  const na = Number.parseFloat(a);
  const nb = Number.parseFloat(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb) && na !== nb) return na - nb;
  return a.localeCompare(b, undefined, { numeric: true });
}

async function onHandByVariantIds(organizationId: string, variantIds: string[]) {
  const map = new Map<string, number>();
  if (variantIds.length === 0) return map;
  const balances = await prisma.inventoryBalance.findMany({
    where: {
      organizationId,
      deletedAt: null,
      variantId: { in: variantIds },
    },
    select: { variantId: true, quantity: true },
  });
  for (const b of balances) {
    map.set(b.variantId, (map.get(b.variantId) ?? 0) + Number(b.quantity));
  }
  return map;
}

const variantInclude = {
  article: { include: { defaultTaxRate: true } },
} as const;

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

  async searchVariants(
    organizationId: string,
    query: string,
    limit = 20,
  ): Promise<VariantSearchHit[]> {
    const q = query.trim();
    if (q.length < 1) return [];

    const rows = await prisma.articleVariant.findMany({
      where: {
        organizationId,
        deletedAt: null,
        article: { deletedAt: null },
        OR: [
          { sku: { contains: q, mode: 'insensitive' } },
          { barcode: { contains: q, mode: 'insensitive' } },
          { article: { name: { contains: q, mode: 'insensitive' } } },
          { article: { articleCode: { contains: q, mode: 'insensitive' } } },
        ],
      },
      take: limit,
      orderBy: { sku: 'asc' },
      include: variantInclude,
    });

    const needle = q.toLowerCase();
    rows.sort((a, b) => {
      const aExact =
        a.sku.toLowerCase() === needle || (a.barcode?.toLowerCase() ?? '') === needle ? 0 : 1;
      const bExact =
        b.sku.toLowerCase() === needle || (b.barcode?.toLowerCase() ?? '') === needle ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;
      return a.sku.localeCompare(b.sku);
    });

    const onHand = await onHandByVariantIds(
      organizationId,
      rows.map((r) => r.id),
    );
    return rows.map((r) => mapVariantHit(r, onHand.get(r.id) ?? 0));
  },

  async variantsByIds(organizationId: string, ids: string[]): Promise<VariantSearchHit[]> {
    const unique = [...new Set(ids.filter(Boolean))];
    if (unique.length === 0) return [];

    const rows = await prisma.articleVariant.findMany({
      where: {
        organizationId,
        deletedAt: null,
        id: { in: unique },
        article: { deletedAt: null },
      },
      include: variantInclude,
    });
    const onHand = await onHandByVariantIds(
      organizationId,
      rows.map((r) => r.id),
    );
    const byId = new Map(rows.map((r) => [r.id, r]));
    return unique
      .map((id) => byId.get(id))
      .filter((r): r is NonNullable<typeof r> => Boolean(r))
      .map((r) => mapVariantHit(r, onHand.get(r.id) ?? 0));
  },

  async searchArticles(
    organizationId: string,
    query: string,
    limit = 12,
  ): Promise<ArticleSearchHit[]> {
    const q = query.trim();
    if (q.length < 1) return [];

    const rows = await prisma.article.findMany({
      where: {
        organizationId,
        deletedAt: null,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { articleCode: { contains: q, mode: 'insensitive' } },
          { brand: { name: { contains: q, mode: 'insensitive' } } },
        ],
      },
      take: limit,
      orderBy: { name: 'asc' },
      include: {
        brand: { select: { name: true } },
        _count: { select: { variants: { where: { deletedAt: null } } } },
      },
    });

    return rows.map((a) => ({
      id: a.id,
      name: a.name,
      articleCode: a.articleCode,
      brandName: a.brand?.name ?? null,
      variantCount: a._count.variants,
    }));
  },

  async articlesByIds(organizationId: string, ids: string[]): Promise<ArticleSearchHit[]> {
    const unique = [...new Set(ids.filter(Boolean))];
    if (unique.length === 0) return [];

    const rows = await prisma.article.findMany({
      where: {
        organizationId,
        deletedAt: null,
        id: { in: unique },
      },
      include: {
        brand: { select: { name: true } },
        _count: { select: { variants: { where: { deletedAt: null } } } },
      },
    });
    const byId = new Map(rows.map((r) => [r.id, r]));
    return unique
      .map((id) => byId.get(id))
      .filter((r): r is NonNullable<typeof r> => Boolean(r))
      .map((a) => ({
        id: a.id,
        name: a.name,
        articleCode: a.articleCode,
        brandName: a.brand?.name ?? null,
        variantCount: a._count.variants,
      }));
  },

  /** All active size/colour variants for one article (counter matrix). */
  async articleVariantMatrix(
    organizationId: string,
    articleId: string,
  ): Promise<{ article: ArticleSearchHit; variants: VariantSearchHit[] } | null> {
    const article = await prisma.article.findFirst({
      where: { id: articleId, organizationId, deletedAt: null },
      include: {
        brand: { select: { name: true } },
        _count: { select: { variants: { where: { deletedAt: null } } } },
        variants: {
          where: { deletedAt: null },
          orderBy: [{ size: 'asc' }, { color: 'asc' }],
          include: variantInclude,
        },
      },
    });
    if (!article) return null;

    const onHand = await onHandByVariantIds(
      organizationId,
      article.variants.map((v) => v.id),
    );
    const variants = article.variants
      .map((v) => mapVariantHit(v, onHand.get(v.id) ?? 0))
      .sort((a, b) => {
        const sizeCmp = sortSizeLabel(a.size, b.size);
        if (sizeCmp !== 0) return sizeCmp;
        return a.color.localeCompare(b.color);
      });

    return {
      article: {
        id: article.id,
        name: article.name,
        articleCode: article.articleCode,
        brandName: article.brand?.name ?? null,
        variantCount: article._count.variants,
      },
      variants,
    };
  },
};
