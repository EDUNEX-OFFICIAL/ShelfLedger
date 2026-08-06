'use client';

import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Check, ChevronsUpDown, Loader2, Search, X } from 'lucide-react';
import { searchVariantsAction } from '@/features/search/actions';
import { cn } from '@/lib/utils';

/** Mirrors server VariantSearchHit — keep client free of @shelfledger/db. */
export type AsyncSkuHit = {
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
  articleId?: string;
  articleName?: string;
  articleCode?: string;
};

export type AsyncSkuOption = {
  value: string;
  label: string;
  /** Extra tokens for exact Enter match (SKU / item code). */
  keywords?: string;
  disabled?: boolean;
};

type Props = {
  id?: string;
  value: string;
  onValueChange: (value: string, hit?: AsyncSkuHit) => void;
  /** Shown when query is empty (recent / frequent). */
  seedOptions?: AsyncSkuOption[];
  /** Called whenever server search returns hits (merge into catalog). */
  onHits?: (hits: AsyncSkuHit[]) => void;
  placeholder?: string;
  allowClear?: boolean;
  clearLabel?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  triggerClassName?: string;
  autoFocus?: boolean;
  triggerRef?: React.Ref<HTMLButtonElement>;
  /** Controlled open (e.g. F3 / Add item). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  'aria-invalid'?: boolean;
  'aria-label'?: string;
  debounceMs?: number;
  limit?: number;
};

function assignRef<T>(ref: React.Ref<T> | undefined, value: T | null) {
  if (!ref) return;
  if (typeof ref === 'function') ref(value);
  else (ref as React.MutableRefObject<T | null>).current = value;
}

function findExactKeywordMatch(options: AsyncSkuOption[], raw: string): AsyncSkuOption | null {
  const needle = raw.trim().toLowerCase();
  if (!needle) return null;
  for (const o of options) {
    if (o.disabled) continue;
    const kw = (o.keywords ?? '').toLowerCase().trim();
    if (!kw) continue;
    if (kw === needle) return o;
    const tokens = kw.split(/\s+/).filter(Boolean);
    if (tokens.some((t) => t === needle)) return o;
  }
  return null;
}

function hitToOption(h: AsyncSkuHit): AsyncSkuOption {
  return {
    value: h.id,
    label: h.label,
    keywords: [h.sku, h.barcode].filter(Boolean).join(' ').toLowerCase(),
  };
}

export function AsyncSkuCombobox({
  id,
  value,
  onValueChange,
  seedOptions = [],
  onHits,
  placeholder = 'Search item code…',
  allowClear = false,
  clearLabel = 'None',
  disabled,
  required,
  className,
  triggerClassName,
  autoFocus,
  triggerRef,
  open: openControlled,
  onOpenChange,
  'aria-invalid': ariaInvalid,
  'aria-label': ariaLabel,
  debounceMs = 200,
  limit = 20,
}: Props) {
  const [openUncontrolled, setOpenUncontrolled] = React.useState(false);
  const open = openControlled ?? openUncontrolled;
  const setOpen = React.useCallback(
    (next: boolean) => {
      onOpenChange?.(next);
      if (openControlled === undefined) setOpenUncontrolled(next);
    },
    [onOpenChange, openControlled],
  );

  const [query, setQuery] = React.useState('');
  const [hits, setHits] = React.useState<AsyncSkuHit[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [labelCache, setLabelCache] = React.useState<Record<string, string>>({});
  const inputRef = React.useRef<HTMLInputElement>(null);
  const localTriggerRef = React.useRef<HTMLButtonElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const onHitsRef = React.useRef(onHits);
  onHitsRef.current = onHits;

  React.useEffect(() => {
    if (!value) return;
    const fromSeed = seedOptions.find((o) => o.value === value);
    if (fromSeed) {
      setLabelCache((c) => (c[value] === fromSeed.label ? c : { ...c, [value]: fromSeed.label }));
      return;
    }
    const fromHit = hits.find((h) => h.id === value);
    if (fromHit) {
      setLabelCache((c) => (c[value] === fromHit.label ? c : { ...c, [value]: fromHit.label }));
    }
  }, [value, seedOptions, hits]);

  const displayLabel =
    (value && labelCache[value]) ||
    seedOptions.find((o) => o.value === value)?.label ||
    hits.find((h) => h.id === value)?.label ||
    null;

  const q = query.trim();
  const options: AsyncSkuOption[] = q.length > 0 ? hits.map(hitToOption) : seedOptions;

  React.useEffect(() => {
    if (!autoFocus) return;
    const t = window.setTimeout(() => localTriggerRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [autoFocus]);

  React.useEffect(() => {
    if (!open) {
      setQuery('');
      setHits([]);
      setLoading(false);
      setActiveIndex(0);
      return;
    }
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [query, hits]);

  React.useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (trimmed.length < 1) {
      setHits([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const handle = window.setTimeout(() => {
      void (async () => {
        try {
          const results = await searchVariantsAction(trimmed, limit);
          if (cancelled) return;
          const list = (Array.isArray(results) ? results : []) as AsyncSkuHit[];
          setHits(list);
          onHitsRef.current?.(list);
        } catch {
          if (cancelled) return;
          setHits([]);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, debounceMs);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [query, open, debounceMs, limit]);

  const pick = (next: string, opt?: AsyncSkuOption, hit?: AsyncSkuHit) => {
    if (next && opt?.label) {
      setLabelCache((c) => ({ ...c, [next]: opt.label }));
    }
    if (hit) onHitsRef.current?.([hit]);
    onValueChange(next, hit);
    setOpen(false);
  };

  const pickFromQueryOrActive = () => {
    const exact = findExactKeywordMatch(options, query);
    if (exact) {
      const hit = hits.find((h) => h.id === exact.value);
      pick(exact.value, exact, hit);
      return;
    }
    if (options.length === 1) {
      const only = options[0];
      if (only && !only.disabled) {
        const hit = hits.find((h) => h.id === only.value);
        pick(only.value, only, hit);
        return;
      }
    }
    const opt = options[activeIndex];
    if (opt && !opt.disabled) {
      const hit = hits.find((h) => h.id === opt.value);
      pick(opt.value, opt, hit);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(options.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      pickFromQueryOrActive();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    }
  };

  const onTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      setQuery(e.key);
      setOpen(true);
    }
  };

  React.useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const emptyHint =
    q.length > 0
      ? loading
        ? 'Searching…'
        : 'No matching item codes'
      : seedOptions.length === 0
        ? 'Type item code or name…'
        : 'Recent / frequent — or type to search';

  return (
    <div className={cn('relative', className)}>
      {required ? (
        <input
          tabIndex={-1}
          aria-hidden
          className="pointer-events-none absolute h-px w-px opacity-0"
          value={value}
          required
          onChange={() => {}}
        />
      ) : null}
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen} modal={false}>
        <PopoverPrimitive.Trigger asChild>
          <button
            type="button"
            id={id}
            ref={(node) => {
              localTriggerRef.current = node;
              assignRef(triggerRef, node);
            }}
            disabled={disabled}
            aria-invalid={ariaInvalid}
            aria-label={ariaLabel}
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-required={required}
            onKeyDown={onTriggerKeyDown}
            className={cn(
              'flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-border/80 bg-card px-3 text-left text-sm shadow-sm outline-none transition',
              'hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              'disabled:cursor-not-allowed disabled:opacity-50',
              ariaInvalid && 'border-destructive',
              triggerClassName,
            )}
          >
            <span className={cn('truncate', !displayLabel && 'text-muted-foreground')}>
              {displayLabel ?? placeholder}
            </span>
            <span className="flex shrink-0 items-center gap-1">
              {allowClear && value ? (
                <span
                  role="button"
                  tabIndex={-1}
                  className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onValueChange('');
                  }}
                  aria-label="Clear"
                >
                  <X className="h-3.5 w-3.5" />
                </span>
              ) : null}
              <ChevronsUpDown className="h-4 w-4 opacity-50" aria-hidden />
            </span>
          </button>
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align="start"
            sideOffset={4}
            className={cn(
              'z-50 w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-lg border border-border/80 bg-card shadow-md outline-none',
              'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            )}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <div className="flex items-center gap-2 border-b border-border/80 px-2">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Item code or name…"
                className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                aria-autocomplete="list"
                aria-controls={id ? `${id}-listbox` : undefined}
                inputMode="search"
                enterKeyHint="search"
              />
              {loading ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
              ) : null}
            </div>
            <div
              ref={listRef}
              id={id ? `${id}-listbox` : undefined}
              role="listbox"
              className="max-h-60 overflow-y-auto p-1"
            >
              {allowClear && q.length < 1 ? (
                <button
                  type="button"
                  role="option"
                  className="flex w-full cursor-default items-center rounded-md px-2 py-2.5 text-left text-sm text-muted-foreground outline-none hover:bg-accent hover:text-accent-foreground"
                  onClick={() => pick('')}
                >
                  {clearLabel}
                </button>
              ) : null}
              {options.length === 0 ? (
                <p className="px-2 py-3 text-sm text-muted-foreground">{emptyHint}</p>
              ) : (
                options.map((opt, index) => {
                  const selected = opt.value === value;
                  const active = index === activeIndex;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="option"
                      data-index={index}
                      aria-selected={selected}
                      disabled={opt.disabled}
                      className={cn(
                        'relative flex w-full cursor-default items-center rounded-md py-2.5 pl-8 pr-2 text-left text-sm outline-none',
                        active && 'bg-accent text-accent-foreground',
                        opt.disabled && 'pointer-events-none opacity-50',
                      )}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => {
                        if (!opt.disabled) {
                          const hit = hits.find((h) => h.id === opt.value);
                          pick(opt.value, opt, hit);
                        }
                      }}
                    >
                      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                        {selected ? <Check className="h-3.5 w-3.5" /> : null}
                      </span>
                      <span className="truncate">{opt.label}</span>
                    </button>
                  );
                })
              )}
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </div>
  );
}
