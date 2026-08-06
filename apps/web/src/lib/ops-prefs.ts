/** Counter-device prefs (localStorage). Fail soft when storage unavailable. */

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function readLocal(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeLocal(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export const OPS_KEYS = {
  lastPayMethod: 'shelfledger.lastPayMethod',
  lastPurchaseVendor: 'shelfledger.lastPurchaseVendorId',
  recentSkuIds: 'shelfledger.recentSkuIds',
  recentArticleIds: 'shelfledger.recentArticleIds',
  kioskMode: 'shelfledger.kioskMode',
  preferWalkIn: 'shelfledger.preferWalkIn',
  skipPostSaleConfirm: 'shelfledger.skipPostSaleConfirm',
  skipPostPurchaseConfirm: 'shelfledger.skipPostPurchaseConfirm',
} as const;

export function isSkipConfirmToday(key: string): boolean {
  return readLocal(key) === todayKey();
}

export function setSkipConfirmToday(key: string) {
  writeLocal(key, todayKey());
}

export function readRecentSkuIds(limit = 8): string[] {
  const raw = readLocal(OPS_KEYS.recentSkuIds);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string').slice(0, limit);
  } catch {
    return [];
  }
}

/** Most-recent first; dedupe; cap length. */
export function pushRecentSkuIds(ids: string[], limit = 8) {
  const prev = readRecentSkuIds(limit * 2);
  const next: string[] = [];
  for (const id of [...ids, ...prev]) {
    if (!id || next.includes(id)) continue;
    next.push(id);
    if (next.length >= limit) break;
  }
  writeLocal(OPS_KEYS.recentSkuIds, JSON.stringify(next));
}

export function readRecentArticleIds(limit = 8): string[] {
  const raw = readLocal(OPS_KEYS.recentArticleIds);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string').slice(0, limit);
  } catch {
    return [];
  }
}

export function pushRecentArticleIds(ids: string[], limit = 8) {
  const prev = readRecentArticleIds(limit * 2);
  const next: string[] = [];
  for (const id of [...ids, ...prev]) {
    if (!id || next.includes(id)) continue;
    next.push(id);
    if (next.length >= limit) break;
  }
  writeLocal(OPS_KEYS.recentArticleIds, JSON.stringify(next));
}

export function readKioskMode(): boolean {
  return readLocal(OPS_KEYS.kioskMode) === '1';
}

export function writeKioskMode(on: boolean) {
  writeLocal(OPS_KEYS.kioskMode, on ? '1' : '0');
  try {
    window.dispatchEvent(new CustomEvent('shelfledger:kiosk', { detail: { on } }));
  } catch {
    /* ignore */
  }
}
