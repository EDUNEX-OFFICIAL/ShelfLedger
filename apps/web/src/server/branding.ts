import { settingsRepository } from '@shelfledger/db';
import { PRODUCT_NAME, shopMonogram } from '@/lib/shop-branding';

export type ShopBranding = {
  name: string;
  monogram: string;
};

function asBranding(name: string | null | undefined): ShopBranding {
  const resolved = name?.trim() || PRODUCT_NAME;
  return { name: resolved, monogram: shopMonogram(resolved) };
}

/**
 * Shop name from organization settings.
 * Pass organizationId when authenticated; omit for single-tenant login branding.
 * Never throws — falls back to product name (needed for Docker build / offline).
 */
export async function getShopBranding(organizationId?: string): Promise<ShopBranding> {
  try {
    const org = organizationId
      ? await settingsRepository.getOrganization(organizationId)
      : await settingsRepository.findPrimaryOrganization();
    return asBranding(org?.name);
  } catch {
    return asBranding(PRODUCT_NAME);
  }
}
