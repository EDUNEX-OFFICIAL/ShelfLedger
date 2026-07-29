'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { globalSearchAction } from '@/features/search/actions';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

type GlobalSearchHit = {
  id: string;
  type: 'sale' | 'customer' | 'article' | 'variant' | 'vendor' | 'brand';
  title: string;
  subtitle?: string;
  href: string;
};

const TYPE_LABEL: Record<GlobalSearchHit['type'], string> = {
  sale: 'Invoices',
  customer: 'Customers',
  article: 'Articles',
  variant: 'Item codes',
  vendor: 'Vendors',
  brand: 'Brands',
};

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<GlobalSearchHit[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setHits([]);
    setSearched(false);
    setActive(0);
    setLoading(false);
    setError(null);
    const t = window.setTimeout(() => inputRef.current?.focus(), 10);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 1) {
      setHits([]);
      setSearched(false);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const handle = window.setTimeout(() => {
      void (async () => {
        try {
          const results = await globalSearchAction(q);
          if (cancelled) return;
          setHits(Array.isArray(results) ? results : []);
          setSearched(true);
          setActive(0);
        } catch {
          if (cancelled) return;
          setHits([]);
          setSearched(true);
          setError('Search failed. Try again.');
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [query, open]);

  const go = useCallback(
    (hit: GlobalSearchHit) => {
      onOpenChange(false);
      router.push(hit.href);
    },
    [onOpenChange, router],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onOpenChange(false);
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((i) => Math.min(i + 1, Math.max(hits.length - 1, 0)));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter' && hits[active]) {
        e.preventDefault();
        go(hits[active]!);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, hits, active, go, onOpenChange]);

  if (!open) return null;

  const grouped = hits.reduce<Record<string, GlobalSearchHit[]>>((acc, hit) => {
    const key = TYPE_LABEL[hit.type];
    (acc[key] ??= []).push(hit);
    return acc;
  }, {});

  let flatIndex = -1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/40 p-4 pt-[12vh]"
      role="presentation"
      onClick={() => onOpenChange(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-lg overflow-hidden rounded-xl border border-border/80 bg-card shadow-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="sr-only">
          Global search
        </h2>
        <div className="border-b border-border p-3">
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search invoices, customers, item codes…"
            aria-label="Global search"
            autoComplete="off"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            ↑↓ navigate · Enter open · Esc close
          </p>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {loading ? (
            <div className="space-y-2 p-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-5/6" />
              <Skeleton className="h-8 w-4/6" />
            </div>
          ) : null}
          {!loading && error ? (
            <p className="px-3 py-8 text-center text-sm text-destructive">{error}</p>
          ) : null}
          {!loading && !error && query.trim() && searched && hits.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              No results for “{query.trim()}”
            </p>
          ) : null}
          {!loading && !query.trim() ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              Type to search invoices, customers, articles, vendors…
            </p>
          ) : null}
          {!loading &&
            !error &&
            Object.entries(grouped).map(([group, items]) => (
              <div key={group} className="mb-2">
                <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {group}
                </p>
                <ul>
                  {items.map((hit) => {
                    flatIndex += 1;
                    const idx = flatIndex;
                    return (
                      <li key={`${hit.type}-${hit.id}`}>
                        <button
                          type="button"
                          className={cn(
                            'flex w-full flex-col rounded-md px-3 py-2 text-left text-sm',
                            idx === active ? 'bg-accent text-accent-foreground' : 'hover:bg-muted',
                          )}
                          onMouseEnter={() => setActive(idx)}
                          onClick={() => go(hit)}
                        >
                          <span className="font-medium">{hit.title}</span>
                          {hit.subtitle ? (
                            <span className="text-xs text-muted-foreground">{hit.subtitle}</span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
