/**
 * Realistic India footwear retail catalog for demo / burn-in.
 * Brand article codes follow common trade patterns (not official SKUs).
 */

export type SeedVendor = {
  name: string;
  gstin: string;
  phone: string;
  email: string;
  address: string;
  stateCode: string;
  paymentTermsDays: number;
  notes: string;
};

export type SeedVariant = {
  size: string;
  color: string;
  /** Cost to shop (avg unit cost for opening). */
  unitCost: number;
  mrp: number;
  sellingPrice: number;
  openingQty: number;
  lowStockThreshold?: number;
};

export type SeedArticle = {
  brandCode: string;
  categoryPath: [string, string?];
  name: string;
  articleCode: string;
  hsnCode: string;
  description: string;
  /** Tax slab name must match seeded TaxRate.name */
  taxName: 'GST 5%' | 'GST 12%' | 'GST 18%';
  variants: SeedVariant[];
};

export type SeedBrand = {
  name: string;
  code: string;
};

export type SeedCustomer = {
  name: string;
  phone: string;
  stateCode: string;
  address?: string;
};

/** Marker brand — if active, catalog seed is skipped (idempotent). */
export const CATALOG_MARKER_BRAND_CODE = 'BATA';

export const SEED_BRANDS: SeedBrand[] = [
  { name: 'Bata', code: 'BATA' },
  { name: 'Liberty', code: 'LIBERTY' },
  { name: 'Relaxo', code: 'RELAXO' },
  { name: 'Sparx', code: 'SPARX' },
  { name: 'Paragon', code: 'PARAGON' },
  { name: 'Campus', code: 'CAMPUS' },
  { name: 'Woodland', code: 'WOODLAND' },
  { name: 'Red Tape', code: 'REDTAPE' },
  { name: 'Puma', code: 'PUMA' },
  { name: 'Adidas', code: 'ADIDAS' },
  { name: 'Nike', code: 'NIKE' },
  { name: 'Crocs', code: 'CROCS' },
  { name: 'Metro', code: 'METRO' },
  { name: 'Action', code: 'ACTION' },
];

/** Root → optional child category names. */
export const SEED_CATEGORY_TREE: { name: string; children: string[] }[] = [
  { name: 'Men', children: ['Formal', 'Casual', 'Sports', 'Sandals'] },
  { name: 'Women', children: ['Flats', 'Heels', 'Sports', 'Sandals'] },
  { name: 'Kids', children: ['School', 'Casual', 'Sports'] },
];

export const SEED_VENDORS: SeedVendor[] = [
  {
    name: 'Agra Footwear Hub Pvt Ltd',
    gstin: '09AABCA1234A1Z5',
    phone: '05622551234',
    email: 'orders@agrafootwearhub.in',
    address: 'Site C, Industrial Estate, Agra, Uttar Pradesh 282002',
    stateCode: '09',
    paymentTermsDays: 30,
    notes: 'Primary wholesale for Bata / Liberty / Paragon lines',
  },
  {
    name: 'Mumbai Sports & Lifestyle Distributors',
    gstin: '27AABCM5678B1Z2',
    phone: '02240011234',
    email: 'sales@msld.in',
    address: 'Gala 14, Bhiwandi Logistics Park, Thane, Maharashtra 421302',
    stateCode: '27',
    paymentTermsDays: 21,
    notes: 'Authorised channel for Puma, Adidas, Nike, Campus',
  },
  {
    name: 'Delhi Metro Shoe Traders',
    gstin: '07AABCD9012C1Z8',
    phone: '01145678901',
    email: 'purchase@delhimetroshoes.com',
    address: 'Shop 22, Karol Bagh Footwear Market, New Delhi 110005',
    stateCode: '07',
    paymentTermsDays: 15,
    notes: 'Metro, Red Tape, Crocs fashion footwear',
  },
  {
    name: 'Relaxo Footwears — West Zone Stockist',
    gstin: '27AABCR3456D1Z1',
    phone: '02228765432',
    email: 'west@relaxostockist.in',
    address: 'Plot 8, MIDC Andheri East, Mumbai 400093',
    stateCode: '27',
    paymentTermsDays: 45,
    notes: 'Sparx / Flite / Bahamas (Relaxo group)',
  },
  {
    name: 'Chennai South Footwear Agencies',
    gstin: '33AABCS7890E1Z4',
    phone: '04424567890',
    email: 'desk@chennaifootwear.in',
    address: '42, Ranganathan Street, T. Nagar, Chennai 600017',
    stateCode: '33',
    paymentTermsDays: 30,
    notes: 'Woodland, Action, regional Paragon lines',
  },
];

export const SEED_CUSTOMERS: SeedCustomer[] = [
  {
    name: 'Rahul Sharma',
    phone: '9876543210',
    stateCode: '27',
    address: 'Andheri West, Mumbai',
  },
  {
    name: 'Priya Patel',
    phone: '9823456789',
    stateCode: '27',
    address: 'Vashi, Navi Mumbai',
  },
  {
    name: 'Amit Kumar',
    phone: '9911223344',
    stateCode: '27',
    address: 'Pune Camp',
  },
];

function sizes(
  list: string[],
  color: string,
  unitCost: number,
  mrp: number,
  sellingPrice: number,
  openingQty: number,
): SeedVariant[] {
  return list.map((size) => ({
    size,
    color,
    unitCost,
    mrp,
    sellingPrice,
    openingQty,
    lowStockThreshold: 2,
  }));
}

const MEN = ['6', '7', '8', '9', '10'];
const WOMEN = ['4', '5', '6', '7'];
const KIDS = ['1', '2', '3', '4'];

export const SEED_ARTICLES: SeedArticle[] = [
  // ── Bata ──────────────────────────────────────────────────────────────────
  {
    brandCode: 'BATA',
    categoryPath: ['Men', 'Formal'],
    name: 'Bata Formal Oxford',
    articleCode: '851-6664',
    hsnCode: '6403',
    description: 'Black leather formal oxford — office staple',
    taxName: 'GST 12%',
    variants: sizes(MEN, 'Black', 890, 1799, 1599, 6),
  },
  {
    brandCode: 'BATA',
    categoryPath: ['Men', 'Casual'],
    name: 'Bata Power Jogger',
    articleCode: '821-6048',
    hsnCode: '6404',
    description: 'Everyday knit jogger (Power by Bata)',
    taxName: 'GST 12%',
    variants: [
      ...sizes(MEN, 'Navy', 720, 1499, 1299, 8),
      ...sizes(['7', '8', '9'], 'Grey', 720, 1499, 1299, 5),
    ],
  },
  {
    brandCode: 'BATA',
    categoryPath: ['Women', 'Flats'],
    name: 'Bata Ballerina Flat',
    articleCode: '551-2140',
    hsnCode: '6403',
    description: 'Comfort ballerina for daily wear',
    taxName: 'GST 5%',
    variants: sizes(WOMEN, 'Beige', 380, 999, 899, 7),
  },
  // ── Liberty ───────────────────────────────────────────────────────────────
  {
    brandCode: 'LIBERTY',
    categoryPath: ['Men', 'Sports'],
    name: 'Liberty Force Runner',
    articleCode: 'FORCE-144',
    hsnCode: '6404',
    description: 'Lightweight mesh running shoe',
    taxName: 'GST 12%',
    variants: sizes(MEN, 'White/Blue', 650, 1399, 1199, 10),
  },
  {
    brandCode: 'LIBERTY',
    categoryPath: ['Men', 'Sandals'],
    name: 'Liberty Glider Sandal',
    articleCode: 'GLIDER-42',
    hsnCode: '6402',
    description: 'PU casual sandal — monsoon friendly',
    taxName: 'GST 5%',
    variants: sizes(MEN, 'Brown', 280, 799, 699, 12),
  },
  // ── Sparx / Relaxo ────────────────────────────────────────────────────────
  {
    brandCode: 'SPARX',
    categoryPath: ['Men', 'Sports'],
    name: 'Sparx SFG Sports Shoe',
    articleCode: 'SFG-144',
    hsnCode: '6404',
    description: 'Value sports shoe — high volume counter SKU',
    taxName: 'GST 5%',
    variants: sizes(MEN, 'Black/Red', 420, 999, 899, 15),
  },
  {
    brandCode: 'SPARX',
    categoryPath: ['Men', 'Casual'],
    name: 'Sparx SM Casual',
    articleCode: 'SM-414',
    hsnCode: '6404',
    description: 'Canvas casual lace-up',
    taxName: 'GST 5%',
    variants: sizes(MEN, 'Olive', 350, 899, 799, 10),
  },
  {
    brandCode: 'RELAXO',
    categoryPath: ['Men', 'Sandals'],
    name: 'Flite Soft Slipper',
    articleCode: 'FLITE-202',
    hsnCode: '6402',
    description: 'House / shop slipper (Flite by Relaxo)',
    taxName: 'GST 5%',
    variants: sizes(MEN, 'Navy', 90, 299, 249, 20),
  },
  // ── Paragon ───────────────────────────────────────────────────────────────
  {
    brandCode: 'PARAGON',
    categoryPath: ['Men', 'Sandals'],
    name: 'Paragon K1015 Hawaii',
    articleCode: 'K1015',
    hsnCode: '6402',
    description: 'Classic rubber Hawaii chappal',
    taxName: 'GST 5%',
    variants: sizes(MEN, 'Black', 70, 199, 179, 25),
  },
  {
    brandCode: 'PARAGON',
    categoryPath: ['Women', 'Sandals'],
    name: 'Paragon Toffer Ladies',
    articleCode: 'TOFFER-9',
    hsnCode: '6402',
    description: 'Ladies PU sandal',
    taxName: 'GST 5%',
    variants: sizes(WOMEN, 'Pink', 110, 349, 299, 12),
  },
  // ── Campus ────────────────────────────────────────────────────────────────
  {
    brandCode: 'CAMPUS',
    categoryPath: ['Men', 'Sports'],
    name: 'Campus North Plus',
    articleCode: 'NORTH-PLUS',
    hsnCode: '6404',
    description: 'Campus running / training shoe',
    taxName: 'GST 12%',
    variants: sizes(MEN, 'Black/White', 780, 1699, 1499, 8),
  },
  {
    brandCode: 'CAMPUS',
    categoryPath: ['Kids', 'Sports'],
    name: 'Campus Junior Roar',
    articleCode: '3-ROAR-01',
    hsnCode: '6404',
    description: 'Kids sports shoe for school PE',
    taxName: 'GST 5%',
    variants: sizes(KIDS, 'Blue/Orange', 320, 899, 799, 10),
  },
  // ── Woodland ──────────────────────────────────────────────────────────────
  {
    brandCode: 'WOODLAND',
    categoryPath: ['Men', 'Casual'],
    name: 'Woodland Camel Boot',
    articleCode: 'GC-1070',
    hsnCode: '6403',
    description: 'Leather outdoor / casual boot',
    taxName: 'GST 12%',
    variants: sizes(['7', '8', '9', '10'], 'Camel', 2100, 4499, 3999, 4),
  },
  {
    brandCode: 'WOODLAND',
    categoryPath: ['Men', 'Casual'],
    name: 'Woodland Trekking Shoe',
    articleCode: 'CAMEL-318',
    hsnCode: '6403',
    description: 'Nubuck trekking shoe',
    taxName: 'GST 12%',
    variants: sizes(MEN, 'Olive', 1850, 3999, 3499, 5),
  },
  // ── Red Tape ──────────────────────────────────────────────────────────────
  {
    brandCode: 'REDTAPE',
    categoryPath: ['Men', 'Casual'],
    name: 'Red Tape Sneaker',
    articleCode: 'RSO3050',
    hsnCode: '6404',
    description: 'Fashion sneaker — mall counter favourite',
    taxName: 'GST 12%',
    variants: sizes(MEN, 'White', 1200, 2799, 2499, 6),
  },
  {
    brandCode: 'REDTAPE',
    categoryPath: ['Women', 'Flats'],
    name: 'Red Tape Ladies Slip-on',
    articleCode: 'RSL0104',
    hsnCode: '6404',
    description: 'Women casual slip-on',
    taxName: 'GST 12%',
    variants: sizes(WOMEN, 'Black', 980, 2299, 1999, 5),
  },
  // ── Puma ──────────────────────────────────────────────────────────────────
  {
    brandCode: 'PUMA',
    categoryPath: ['Men', 'Sports'],
    name: 'Puma Smash V2',
    articleCode: '390265-01',
    hsnCode: '6404',
    description: 'Classic court sneaker',
    taxName: 'GST 12%',
    variants: sizes(MEN, 'White/Black', 1650, 4499, 3999, 4),
  },
  {
    brandCode: 'PUMA',
    categoryPath: ['Women', 'Sports'],
    name: 'Puma Softride Walk',
    articleCode: '384277-02',
    hsnCode: '6404',
    description: 'Women walking shoe',
    taxName: 'GST 12%',
    variants: sizes(WOMEN, 'Pink/White', 1450, 3999, 3499, 4),
  },
  // ── Adidas ────────────────────────────────────────────────────────────────
  {
    brandCode: 'ADIDAS',
    categoryPath: ['Men', 'Sports'],
    name: 'Adidas Grand Court',
    articleCode: 'GW3848',
    hsnCode: '6404',
    description: 'Court lifestyle sneaker',
    taxName: 'GST 12%',
    variants: sizes(MEN, 'White', 1750, 4999, 4499, 4),
  },
  {
    brandCode: 'ADIDAS',
    categoryPath: ['Men', 'Sports'],
    name: 'Adidas Runfalcon 3.0',
    articleCode: 'HP6106',
    hsnCode: '6404',
    description: 'Entry running shoe',
    taxName: 'GST 12%',
    variants: sizes(MEN, 'Black/White', 1550, 4299, 3799, 5),
  },
  // ── Nike ──────────────────────────────────────────────────────────────────
  {
    brandCode: 'NIKE',
    categoryPath: ['Men', 'Sports'],
    name: 'Nike Revolution 7',
    articleCode: 'FB8501-001',
    hsnCode: '6404',
    description: 'Road running shoe',
    taxName: 'GST 12%',
    variants: sizes(MEN, 'Black', 2100, 5499, 4999, 3),
  },
  {
    brandCode: 'NIKE',
    categoryPath: ['Kids', 'Sports'],
    name: 'Nike Kids Star Runner',
    articleCode: 'DA2777-003',
    hsnCode: '6404',
    description: 'Kids athletic sneaker',
    taxName: 'GST 12%',
    variants: sizes(KIDS, 'Blue', 980, 2799, 2499, 4),
  },
  // ── Crocs ─────────────────────────────────────────────────────────────────
  {
    brandCode: 'CROCS',
    categoryPath: ['Men', 'Sandals'],
    name: 'Crocs Classic Clog',
    articleCode: '10001-001',
    hsnCode: '6402',
    description: 'Iconic foam clog',
    taxName: 'GST 12%',
    variants: sizes(MEN, 'Black', 1100, 3495, 2995, 6),
  },
  {
    brandCode: 'CROCS',
    categoryPath: ['Women', 'Sandals'],
    name: 'Crocs LiteRide Clog',
    articleCode: '206708-2Y2',
    hsnCode: '6402',
    description: 'Women LiteRide clog',
    taxName: 'GST 12%',
    variants: sizes(WOMEN, 'Lavender', 1200, 3995, 3495, 4),
  },
  // ── Metro ─────────────────────────────────────────────────────────────────
  {
    brandCode: 'METRO',
    categoryPath: ['Women', 'Heels'],
    name: 'Metro Block Heel',
    articleCode: '32-4821',
    hsnCode: '6403',
    description: 'Office block heel pump',
    taxName: 'GST 12%',
    variants: sizes(WOMEN, 'Black', 890, 2199, 1899, 5),
  },
  {
    brandCode: 'METRO',
    categoryPath: ['Women', 'Flats'],
    name: 'Metro Kolhapuri Flat',
    articleCode: '32-1105',
    hsnCode: '6403',
    description: 'Ethnic-inspired leather flat',
    taxName: 'GST 12%',
    variants: sizes(WOMEN, 'Tan', 720, 1799, 1599, 6),
  },
  // ── Action ────────────────────────────────────────────────────────────────
  {
    brandCode: 'ACTION',
    categoryPath: ['Men', 'Sports'],
    name: 'Action Athleo Runner',
    articleCode: 'ATHLEO-11',
    hsnCode: '6404',
    description: 'Budget sports shoe — rural / tier-2 favourite',
    taxName: 'GST 5%',
    variants: sizes(MEN, 'Grey/Orange', 380, 899, 799, 12),
  },
  {
    brandCode: 'ACTION',
    categoryPath: ['Kids', 'School'],
    name: 'Action School Shoe',
    articleCode: 'SCH-880',
    hsnCode: '6403',
    description: 'Black school shoe with buckle',
    taxName: 'GST 5%',
    variants: sizes(KIDS, 'Black', 250, 699, 599, 14),
  },
];

/** Build SKU: BRAND-ARTICLE-SIZE-COLORCODE */
export function buildSku(brandCode: string, articleCode: string, size: string, color: string): string {
  const colorCode = color
    .replace(/[^A-Za-z0-9]+/g, '')
    .slice(0, 6)
    .toUpperCase();
  const art = articleCode.replace(/[^A-Za-z0-9-]/g, '').toUpperCase();
  return `${brandCode}-${art}-${size}-${colorCode}`;
}
