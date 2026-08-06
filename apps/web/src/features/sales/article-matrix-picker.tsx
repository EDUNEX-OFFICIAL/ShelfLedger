'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Loader2, Search, X } from 'lucide-react';
import {
  articleVariantMatrixAction,
  searchArticlesAction,
} from '@/features/search/actions';
import type { AsyncSkuHit } from '@/components/ui/async-sku-combobox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyText } from '@/components/shared/money-text';
import { cn } from '@/lib/utils';

export type ArticleHit = {
  id: string;
  name: string;
  articleCode: string;
  brandName: string | null;
  variantCount: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  /** Prefill / open straight into matrix for this article. */
  initialArticleId?: string | null;
  onPick: (hit: AsyncSkuHit) => void;
};

function sortSize(a: string, b: string) {
  const na = Number.parseFloat(a);
  const nb = Number.parseFloat(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb) && na !== nb) return na - nb;
  return a.localeCompare(b, undefined, { numeric: true });
}

export function ArticleMatrixPicker({
  open,
  onClose,
  initialArticleId = null,
  onPick,
}: Props) {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<ArticleHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [article, setArticle] = useState<ArticleHit | null>(null);
  const [variants, setVariants] = useState<AsyncSkuHit[]>([]);
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [colorFilter, setColorFilter] = useState<string | null>(null);

  const resetSearch = () => {
    setArticle(null);
    setVariants([]);
    setColorFilter(null);
    setQuery('');
    setHits([]);
  };

  useEffect(() => {
    if (!open) {
      resetSearch();
      return;
    }
    // Search mode only — matrix open skips focusing the search box.
    if (initialArticleId) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open, initialArticleId]);

  useEffect(() => {
    if (!open || !initialArticleId) return;
    let cancelled = false;
    setLoadingMatrix(true);
    void articleVariantMatrixAction(initialArticleId).then((res) => {
      if (cancelled || !res) {
        setLoadingMatrix(false);
        return;
      }
      setArticle(res.article);
      setVariants(res.variants as AsyncSkuHit[]);
      setLoadingMatrix(false);
    });
    return () => {
      cancelled = true;
    };
  }, [open, initialArticleId]);

  useEffect(() => {
    if (!open || article) return;
    const q = query.trim();
    if (q.length < 1) {
      setHits([]);
      setSearching(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const handle = window.setTimeout(() => {
      void searchArticlesAction(q, 12).then((rows) => {
        if (cancelled) return;
        setHits(Array.isArray(rows) ? rows : []);
        setSearching(false);
      });
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [query, open, article]);

  const colors = useMemo(() => {
    const set = new Set(variants.map((v) => v.color));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [variants]);

  const sizes = useMemo(() => {
    const set = new Set(variants.map((v) => v.size));
    return [...set].sort(sortSize);
  }, [variants]);

  const activeColor = colorFilter && colors.includes(colorFilter) ? colorFilter : colors[0] ?? null;

  const bySizeColor = useMemo(() => {
    const map = new Map<string, AsyncSkuHit>();
    for (const v of variants) map.set(`${v.size}||${v.color}`, v);
    return map;
  }, [variants]);

  const openArticle = async (id: string) => {
    setLoadingMatrix(true);
    setColorFilter(null);
    const res = await articleVariantMatrixAction(id);
    setLoadingMatrix(false);
    if (!res) return;
    setArticle(res.article);
    setVariants(res.variants as AsyncSkuHit[]);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-foreground/40 sm:items-center sm:justify-center sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'flex max-h-[92svh] w-full flex-col rounded-t-2xl border border-border/80 bg-card shadow-md outline-none',
          'sm:max-h-[85vh] sm:max-w-lg sm:rounded-xl',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-border/80 px-3 py-3">
          {article ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-11 w-11 shrink-0 px-0"
              onClick={() => {
                setArticle(null);
                setVariants([]);
                setColorFilter(null);
                window.setTimeout(() => inputRef.current?.focus(), 0);
              }}
              aria-label="Back to search"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : null}
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="truncate text-sm font-semibold tracking-tight">
              {article ? article.name : 'Pick size & colour'}
            </h2>
            <p className="truncate text-xs text-muted-foreground">
              {article
                ? [article.brandName, article.articleCode].filter(Boolean).join(' · ')
                : 'Search article — tap size to add'}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-11 w-11 shrink-0 px-0"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {!article ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-center gap-2 border-b border-border/80 px-3">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Brand, article name or code…"
                className="h-12 border-0 bg-transparent shadow-none focus-visible:ring-0"
                inputMode="search"
                enterKeyHint="search"
                autoComplete="off"
              />
              {searching ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
              ) : null}
            </div>
            <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
              {query.trim().length < 1 ? (
                <li className="px-3 py-8 text-center text-sm text-muted-foreground">
                  Type to find an article, then pick size &amp; colour.
                </li>
              ) : hits.length === 0 && !searching ? (
                <li className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No articles match.
                </li>
              ) : (
                hits.map((h) => (
                  <li key={h.id}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3.5 text-left hover:bg-muted active:bg-muted"
                      onClick={() => void openArticle(h.id)}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{h.name}</span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {[h.brandName, h.articleCode].filter(Boolean).join(' · ')}
                        </span>
                      </span>
                      <Badge variant="muted">{h.variantCount} sizes</Badge>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        ) : loadingMatrix ? (
          <div className="flex flex-1 items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading sizes…
          </div>
        ) : variants.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">
            No size/colour variants on this article.
          </p>
        ) : (
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {colors.length > 1 ? (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Colour
                </p>
                <div className="flex gap-2 overflow-x-auto pb-0.5">
                  {colors.map((c) => {
                    const selected = c === activeColor;
                    return (
                      <button
                        key={c}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setColorFilter(c)}
                        className={cn(
                          'h-11 shrink-0 rounded-xl border px-4 text-sm font-semibold transition',
                          selected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border/80 bg-card text-foreground hover:bg-muted',
                        )}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Size{activeColor ? ` · ${activeColor}` : ''}
              </p>
              <div className="grid grid-cols-3 gap-2 xs:grid-cols-4 sm:grid-cols-5">
                {sizes.map((size) => {
                  const v = activeColor
                    ? bySizeColor.get(`${size}||${activeColor}`)
                    : undefined;
                  if (!v) {
                    return (
                      <div
                        key={size}
                        className="flex h-14 items-center justify-center rounded-xl border border-dashed border-border/60 text-sm text-muted-foreground/50"
                        aria-hidden
                      >
                        {size}
                      </div>
                    );
                  }
                  const low = v.onHandQty <= 0;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        onPick(v);
                        onClose();
                      }}
                      className={cn(
                        'flex h-14 flex-col items-center justify-center rounded-xl border px-1 transition active:scale-[0.98]',
                        low
                          ? 'border-border/60 bg-muted/40 text-muted-foreground'
                          : 'border-border/80 bg-card hover:border-primary hover:bg-primary/5',
                      )}
                    >
                      <span className="text-base font-semibold tabular-nums leading-none">
                        {size}
                      </span>
                      <span className="mt-1 text-[10px] tabular-nums leading-none">
                        {low ? 'Out' : `${v.onHandQty} left`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {activeColor ? (
              <p className="text-center text-xs text-muted-foreground">
                From{' '}
                <MoneyText
                  value={
                    Math.min(
                      ...variants
                        .filter((v) => v.color === activeColor)
                        .map((v) => v.sellingPrice),
                    )
                  }
                  className="text-xs font-medium text-foreground"
                />
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
