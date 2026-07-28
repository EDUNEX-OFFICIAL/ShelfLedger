'use server';

import { searchRepository, type GlobalSearchHit } from '@shelfledger/db';
import { requireSession } from '@/server/auth/guards';

export async function globalSearchAction(query: string): Promise<GlobalSearchHit[]> {
  const user = await requireSession();
  const q = typeof query === 'string' ? query.trim() : '';
  if (q.length < 1) return [];
  try {
    return await searchRepository.global(user.organizationId, q);
  } catch {
    // Soft-fail DB issues so the palette can show an empty/retry state.
    return [];
  }
}
