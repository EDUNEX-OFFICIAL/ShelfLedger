'use server';

import {
  searchRepository,
  type ArticleSearchHit,
  type GlobalSearchHit,
  type VariantSearchHit,
} from '@shelfledger/db';
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

export async function searchVariantsAction(
  query: string,
  limit = 20,
): Promise<VariantSearchHit[]> {
  const user = await requireSession();
  const q = typeof query === 'string' ? query.trim() : '';
  if (q.length < 1) return [];
  try {
    return await searchRepository.searchVariants(user.organizationId, q, limit);
  } catch {
    return [];
  }
}

export async function variantsByIdsAction(ids: string[]): Promise<VariantSearchHit[]> {
  const user = await requireSession();
  if (!Array.isArray(ids) || ids.length === 0) return [];
  try {
    return await searchRepository.variantsByIds(user.organizationId, ids.slice(0, 40));
  } catch {
    return [];
  }
}

export async function searchArticlesAction(
  query: string,
  limit = 12,
): Promise<ArticleSearchHit[]> {
  const user = await requireSession();
  const q = typeof query === 'string' ? query.trim() : '';
  if (q.length < 1) return [];
  try {
    return await searchRepository.searchArticles(user.organizationId, q, limit);
  } catch {
    return [];
  }
}

export async function articlesByIdsAction(ids: string[]): Promise<ArticleSearchHit[]> {
  const user = await requireSession();
  if (!Array.isArray(ids) || ids.length === 0) return [];
  try {
    return await searchRepository.articlesByIds(user.organizationId, ids.slice(0, 20));
  } catch {
    return [];
  }
}

export async function articleVariantMatrixAction(
  articleId: string,
): Promise<{ article: ArticleSearchHit; variants: VariantSearchHit[] } | null> {
  const user = await requireSession();
  if (typeof articleId !== 'string' || !articleId) return null;
  try {
    return await searchRepository.articleVariantMatrix(user.organizationId, articleId);
  } catch {
    return null;
  }
}
