/** Shared shop display helpers. Software product = ShelfLedger; vendor credit = EDUNEX. */

export const PRODUCT_NAME = 'ShelfLedger';
export const POWERED_BY_LABEL = 'EDUNEX';
export const PRODUCT_URL = 'https://edunexservices.in/';
export const SHOP_TAGLINE = 'Inventory & GST billing';

export function shopMonogram(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
  }
  return (name.trim().slice(0, 2) || 'SL').toUpperCase();
}
