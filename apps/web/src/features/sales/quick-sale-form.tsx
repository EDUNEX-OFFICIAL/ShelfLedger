'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Banknote,
  Check,
  CreditCard,
  Expand,
  Grid2x2,
  Loader2,
  Minus,
  Plus,
  Printer,
  Shrink,
  Smartphone,
  Trash2,
} from 'lucide-react';
import {
  buildWhatsAppShareUrl,
  computeLineTax,
  computeRoundOff,
  distributeBillDiscount,
  normalizeWhatsAppPhone,
  roundMoney,
} from '@shelfledger/domain';
import { normalizeCustomerPhone } from '@shelfledger/validators';
import { Button, buttonClassName } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AsyncSkuCombobox,
  type AsyncSkuHit,
  type AsyncSkuOption,
} from '@/components/ui/async-sku-combobox';
import { SurfaceCard } from '@/components/shared/surface-card';
import { MoneyText } from '@/components/shared/money-text';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import {
  StickyFormActions,
  stickyFormPadDualClass,
  stickyFormPadDualKioskClass,
} from '@/components/shared/sticky-form-actions';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { useOptionalAppShell } from '@/components/layout/app-shell';
import {
  createAndPostQuickSaleAction,
  lookupCustomerByPhoneAction,
} from '@/features/sales/actions';
import { ArticleMatrixPicker } from '@/features/sales/article-matrix-picker';
import {
  articlesByIdsAction,
  variantsByIdsAction,
} from '@/features/search/actions';
import {
  OPS_KEYS,
  pushRecentArticleIds,
  pushRecentSkuIds,
  readLocal,
  readRecentArticleIds,
  readRecentSkuIds,
  writeLocal,
} from '@/lib/ops-prefs';
import { useIsLgUp } from '@/lib/use-media-query';
import { cn } from '@/lib/utils';

type VariantOption = AsyncSkuHit;

type ArticleChip = {
  id: string;
  name: string;
  articleCode: string;
  brandName: string | null;
};

function mergeCatalog(
  prev: Map<string, VariantOption>,
  hits: VariantOption[],
): Map<string, VariantOption> {
  if (hits.length === 0) return prev;
  const next = new Map(prev);
  for (const h of hits) next.set(h.id, h);
  return next;
}

function toSeedOption(v: VariantOption): AsyncSkuOption {
  return {
    value: v.id,
    label: v.label,
    keywords: [v.sku, v.barcode].filter(Boolean).join(' ').toLowerCase(),
  };
}

type Line = {
  id: string;
  variantId: string;
  qty: string;
  unitPrice: string;
};

type PostedSale = {
  id: string;
  invoiceNo: string;
  totalAmount: number;
  customerPhone: string | null;
};

const PAY_OPTIONS = [
  { value: 'CASH' as const, label: 'Cash', hotkey: '1', Icon: Banknote },
  { value: 'UPI' as const, label: 'UPI', hotkey: '2', Icon: Smartphone },
  { value: 'CARD' as const, label: 'Card', hotkey: '3', Icon: CreditCard },
];

const emptyLine = (): Line => ({
  id: crypto.randomUUID(),
  variantId: '',
  qty: '1',
  unitPrice: '',
});

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function lineEstimate(
  line: Line,
  catalog: Map<string, VariantOption>,
): { taxable: number; tax: number; total: number } | null {
  if (!line.variantId) return null;
  const v = catalog.get(line.variantId);
  if (!v) return null;
  const qty = Number(line.qty) || 0;
  const unitPrice = Number(line.unitPrice) || 0;
  if (qty <= 0) return null;
  const taxable = roundMoney(qty * unitPrice);
  const lineTax = computeLineTax({
    taxableAmount: taxable,
    cgstRate: v.cgstRate,
    sgstRate: v.sgstRate,
  });
  return {
    taxable,
    tax: lineTax.taxAmount,
    total: roundMoney(taxable + lineTax.taxAmount),
  };
}

function estimateTotal(
  lines: Line[],
  catalog: Map<string, VariantOption>,
  billDiscount = 0,
): { subtotal: number; tax: number; roundOff: number; total: number; discount: number } {
  const ready = lines.filter(
    (l) => l.variantId && Number(l.qty) > 0 && Number(l.unitPrice) >= 0,
  );
  const grosses: number[] = [];
  const metas: Array<{ cgstRate: number; sgstRate: number }> = [];
  for (const line of ready) {
    const v = catalog.get(line.variantId);
    if (!v) continue;
    const qty = Number(line.qty) || 0;
    const unitPrice = Number(line.unitPrice) || 0;
    grosses.push(roundMoney(qty * unitPrice));
    metas.push({ cgstRate: v.cgstRate, sgstRate: v.sgstRate });
  }
  const shares = distributeBillDiscount(grosses, billDiscount);
  let subtotal = 0;
  let tax = 0;
  for (let i = 0; i < grosses.length; i++) {
    const taxable = roundMoney((grosses[i] ?? 0) - (shares[i] ?? 0));
    if (taxable < 0) continue;
    const meta = metas[i]!;
    const lineTax = computeLineTax({
      taxableAmount: taxable,
      cgstRate: meta.cgstRate,
      sgstRate: meta.sgstRate,
    });
    subtotal = roundMoney(subtotal + taxable);
    tax = roundMoney(tax + lineTax.taxAmount);
  }
  const beforeRound = roundMoney(subtotal + tax);
  const roundOff = computeRoundOff(beforeRound);
  return {
    subtotal,
    tax,
    discount: billDiscount,
    roundOff,
    total: roundMoney(beforeRound + roundOff),
  };
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return target.isContentEditable;
}

function HotkeyBadge({ children }: { children: string }) {
  return (
    <kbd className="inline-flex h-4 min-w-[1rem] items-center justify-center rounded border border-border/80 bg-background/80 px-1 font-mono text-[10px] font-medium text-muted-foreground">
      {children}
    </kbd>
  );
}

export function QuickSaleForm({
  canWrite,
  seedVariants = [],
  frequentVariantIds = [],
  frequentArticleIds = [],
  seedArticles = [],
}: {
  canWrite: boolean;
  /** Server-resolved frequent / seed SKUs (not full catalog). */
  seedVariants?: VariantOption[];
  /** Top SKUs sold recently (server); merged with local recent punches. */
  frequentVariantIds?: string[];
  /** Top articles from recent sales (server). */
  frequentArticleIds?: string[];
  seedArticles?: ArticleChip[];
}) {
  const shell = useOptionalAppShell();
  const kiosk = shell?.kiosk ?? false;
  const isLgUp = useIsLgUp();
  const formRef = useRef<HTMLFormElement>(null);
  const skuTriggerRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const punchIntentRef = useRef<'none' | 'print'>('none');
  /** Counter default: walk-in (mobile-first). Named contact is opt-in. */
  const [useWalkIn, setUseWalkIn] = useState(true);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerMatch, setCustomerMatch] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState<'CASH' | 'UPI' | 'CARD'>('CASH');
  const [billDiscount, setBillDiscount] = useState('0');
  const [showAdjust, setShowAdjust] = useState(false);
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const [focusSkuIndex, setFocusSkuIndex] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [punchSuccess, setPunchSuccess] = useState(false);
  const [posted, setPosted] = useState<PostedSale | null>(null);
  const [localRecentIds, setLocalRecentIds] = useState<string[]>([]);
  const [articleChips, setArticleChips] = useState<ArticleChip[]>(() => seedArticles);
  const [matrixOpen, setMatrixOpen] = useState(false);
  const [matrixArticleId, setMatrixArticleId] = useState<string | null>(null);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [catalog, setCatalog] = useState<Map<string, VariantOption>>(
    () => new Map(seedVariants.map((v) => [v.id, v])),
  );
  const [pending, startTransition] = useTransition();

  const mergeHits = (hits: VariantOption[]) => {
    setCatalog((prev) => mergeCatalog(prev, hits));
  };

  useEffect(() => {
    const saved = readLocal(OPS_KEYS.lastPayMethod);
    if (saved === 'CASH' || saved === 'UPI' || saved === 'CARD') {
      setPayMethod(saved);
    }
    const walkPref = readLocal(OPS_KEYS.preferWalkIn);
    if (walkPref === '0') setUseWalkIn(false);
    else setUseWalkIn(true);

    const recent = readRecentSkuIds(8);
    setLocalRecentIds(recent);
    const missing = recent.filter((id) => !seedVariants.some((v) => v.id === id));
    if (missing.length > 0) {
      void variantsByIdsAction(missing).then((hits: VariantOption[]) => {
        if (!Array.isArray(hits) || hits.length === 0) return;
        setCatalog((prev) => mergeCatalog(prev, hits));
      });
    }

    const localArticles = readRecentArticleIds(8);
    const missingArticles = localArticles.filter(
      (id) => !seedArticles.some((a) => a.id === id),
    );
    if (missingArticles.length === 0) {
      const byId = new Map(seedArticles.map((a) => [a.id, a]));
      const order = [...localArticles, ...frequentArticleIds, ...seedArticles.map((a) => a.id)];
      const chips: ArticleChip[] = [];
      for (const id of order) {
        const a = byId.get(id);
        if (!a || chips.some((c) => c.id === a.id)) continue;
        chips.push(a);
        if (chips.length >= 8) break;
      }
      if (chips.length > 0) setArticleChips(chips);
      return;
    }
    let cancelled = false;
    void articlesByIdsAction(missingArticles).then((rows) => {
      if (cancelled || !Array.isArray(rows)) return;
      const merged = new Map<string, ArticleChip>();
      for (const a of [...seedArticles, ...rows]) {
        merged.set(a.id, {
          id: a.id,
          name: a.name,
          articleCode: a.articleCode,
          brandName: a.brandName,
        });
      }
      const order = [...localArticles, ...frequentArticleIds, ...seedArticles.map((a) => a.id)];
      const chips: ArticleChip[] = [];
      for (const id of order) {
        const a = merged.get(id);
        if (!a || chips.some((c) => c.id === a.id)) continue;
        chips.push(a);
        if (chips.length >= 8) break;
      }
      setArticleChips(chips);
    });
    return () => {
      cancelled = true;
    };
  }, [seedVariants, seedArticles, frequentArticleIds]);

  const choosePay = (method: 'CASH' | 'UPI' | 'CARD') => {
    setPayMethod(method);
    writeLocal(OPS_KEYS.lastPayMethod, method);
  };

  const setWalkInMode = (on: boolean) => {
    setUseWalkIn(on);
    writeLocal(OPS_KEYS.preferWalkIn, on ? '1' : '0');
    setMessage(null);
    if (on) {
      setCustomerName('');
      setCustomerPhone('');
      setCustomerMatch(null);
    }
  };

  const openMatrix = (articleId?: string | null) => {
    setMatrixArticleId(articleId ?? null);
    setMatrixOpen(true);
  };

  const clearCart = () => {
    setLines([emptyLine()]);
    setFocusSkuIndex(0);
    setBillDiscount('0');
    setShowAdjust(false);
    setMessage(null);
    setClearConfirmOpen(false);
  };

  const quickPickIds = useMemo(() => {
    const merged: string[] = [];
    for (const id of [...localRecentIds, ...frequentVariantIds]) {
      if (!id || merged.includes(id)) continue;
      if (!catalog.has(id)) continue;
      merged.push(id);
      if (merged.length >= 8) break;
    }
    return merged;
  }, [localRecentIds, frequentVariantIds, catalog]);

  const seedOptions = useMemo(() => {
    const opts: AsyncSkuOption[] = [];
    for (const id of quickPickIds) {
      const v = catalog.get(id);
      if (v) opts.push(toSeedOption(v));
    }
    return opts;
  }, [quickPickIds, catalog]);

  const totals = useMemo(
    () => estimateTotal(lines, catalog, Number(billDiscount) || 0),
    [lines, catalog, billDiscount],
  );
  const readyLines = lines.filter(
    (l) => l.variantId && Number(l.qty) > 0 && Number(l.unitPrice) >= 0,
  );

  const blockReason = readyLines.length === 0
    ? 'Add at least one item'
    : !useWalkIn && !customerPhone.trim()
      ? 'Enter mobile number'
      : !useWalkIn && !customerName.trim()
        ? 'Enter customer name'
        : null;

  const resetFormForNext = () => {
    setCustomerName('');
    setCustomerPhone('');
    setCustomerMatch(null);
    const walkPref = readLocal(OPS_KEYS.preferWalkIn);
    setUseWalkIn(walkPref !== '0');
    setBillDiscount('0');
    setShowAdjust(false);
    setLines([emptyLine()]);
    setFocusSkuIndex(0);
    setPunchSuccess(false);
    setMessage(null);
  };

  const dismissPosted = () => {
    setPosted(null);
    resetFormForNext();
  };

  const addLine = (focus = true) => {
    setLines((rows) => {
      const next = [...rows, emptyLine()];
      if (focus) setFocusSkuIndex(next.length - 1);
      return next;
    });
  };

  /** Scan / pick: bump qty if SKU already on another line; else fill/replace at index. */
  const setLineVariant = (index: number, variantId: string, hit?: VariantOption) => {
    if (!variantId) {
      setLines((rows) =>
        rows.map((r, i) =>
          i === index ? { ...r, variantId: '', unitPrice: '' } : r,
        ),
      );
      return;
    }
    if (hit) setCatalog((prev) => mergeCatalog(prev, [hit]));
    const v = hit ?? catalog.get(variantId);
    if (!v) return;

    let nextFocus = index;
    setLines((rows) => {
      const current = rows[index];
      const otherIdx = rows.findIndex((r, i) => r.variantId === variantId && i !== index);

      // Duplicate from empty row or re-scan same SKU → bump the existing line
      if (otherIdx >= 0 && (!current?.variantId || current.variantId === variantId)) {
        const mapped = rows.map((r, i) => {
          if (i === otherIdx) {
            return { ...r, qty: String((Number(r.qty) || 0) + 1) };
          }
          if (i === index && !current?.variantId) {
            return r; // leave empty picker row
          }
          return r;
        });
        const last = mapped[mapped.length - 1];
        if (last?.variantId) {
          nextFocus = mapped.length;
          return [...mapped, emptyLine()];
        }
        nextFocus = mapped.findIndex((r) => !r.variantId);
        if (nextFocus < 0) nextFocus = mapped.length - 1;
        return mapped;
      }

      const mapped = rows.map((r, i) =>
        i === index
          ? {
              ...r,
              variantId,
              unitPrice: String(v.sellingPrice),
              qty: r.qty && Number(r.qty) > 0 ? r.qty : '1',
            }
          : r,
      );
      if (index === mapped.length - 1) {
        nextFocus = mapped.length;
        return [...mapped, emptyLine()];
      }
      nextFocus = index + 1;
      return mapped;
    });
    setFocusSkuIndex(nextFocus);
  };

  useEffect(() => {
    const el = skuTriggerRefs.current[focusSkuIndex];
    if (!el) return;
    const t = window.setTimeout(() => el.focus(), 0);
    return () => window.clearTimeout(t);
  }, [focusSkuIndex, lines.length]);

  useEffect(() => {
    if (useWalkIn) {
      setCustomerMatch(null);
      return;
    }
    const normalized = normalizeCustomerPhone(customerPhone);
    if (normalized.length < 10) {
      setCustomerMatch(null);
      return;
    }
    let cancelled = false;
    const t = window.setTimeout(async () => {
      const result = await lookupCustomerByPhoneAction(customerPhone);
      if (cancelled || !result.ok) return;
      if (!result.data) {
        setCustomerMatch(null);
        return;
      }
      setCustomerMatch(result.data.name);
      setCustomerName((prev) => (prev.trim() ? prev : result.data!.name));
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [customerPhone, useWalkIn]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        if (!pending && !punchSuccess && !blockReason && !posted) {
          punchIntentRef.current = e.shiftKey ? 'print' : 'none';
          formRef.current?.requestSubmit();
        }
        return;
      }
      if (e.key === 'F3') {
        e.preventDefault();
        if (posted || matrixOpen) return;
        const emptyIdx = lines.findIndex((l) => !l.variantId);
        setFocusSkuIndex(emptyIdx >= 0 ? emptyIdx : lines.length - 1);
        return;
      }
      if (e.key === 'Escape') {
        if (matrixOpen || clearConfirmOpen || posted) return;
        if (isTypingTarget(e.target)) return;
        e.preventDefault();
        // Counter mode: Esc with empty cart exits kiosk; otherwise clear lines.
        if (kiosk && readyLines.length === 0 && shell) {
          shell.setKiosk(false);
          return;
        }
        if (readyLines.length > 0) setClearConfirmOpen(true);
        return;
      }
      if (isTypingTarget(e.target)) return;
      if (posted || matrixOpen) return;
      if (e.key === '+' || (e.key === '=' && e.shiftKey)) {
        e.preventDefault();
        addLine(true);
        return;
      }
      if (e.key === '1') choosePay('CASH');
      if (e.key === '2') choosePay('UPI');
      if (e.key === '3') choosePay('CARD');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    pending,
    punchSuccess,
    blockReason,
    posted,
    matrixOpen,
    clearConfirmOpen,
    lines,
    readyLines.length,
    kiosk,
    shell,
  ]);

  if (!canWrite) {
    return (
      <SurfaceCard padding="md">
        <p className="text-sm text-muted-foreground">Your role cannot punch sales.</p>
      </SurfaceCard>
    );
  }

  const paymentBlock = (
    <div className="space-y-2">
      <Label>Payment</Label>
      <div className="grid grid-cols-3 gap-2" role="group" aria-label="Payment method">
        {PAY_OPTIONS.map((opt) => {
          const selected = payMethod === opt.value;
          const Icon = opt.Icon;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={selected}
              aria-keyshortcuts={opt.hotkey}
              className={cn(
                'relative flex h-11 items-center justify-center gap-1.5 rounded-lg border px-2 text-sm font-medium leading-none transition duration-150',
                selected
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-border/80 bg-card text-muted-foreground hover:bg-muted',
              )}
              onClick={() => choosePay(opt.value)}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
              <span className="leading-none">{opt.label}</span>
              <kbd
                className={cn(
                  'pointer-events-none absolute right-1.5 top-1.5 hidden h-3.5 min-w-[0.875rem] items-center justify-center rounded border px-0.5 font-mono text-[9px] font-medium leading-none md:inline-flex',
                  selected
                    ? 'border-primary-foreground/25 text-primary-foreground/75'
                    : 'border-border/80 text-muted-foreground',
                )}
              >
                {opt.hotkey}
              </kbd>
            </button>
          );
        })}
      </div>
    </div>
  );

  const totalsBlock = (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Taxable</span>
        <MoneyText value={totals.subtotal} />
      </div>
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>GST</span>
        <MoneyText value={totals.tax} />
      </div>
      {totals.roundOff !== 0 ? (
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Round off</span>
          <MoneyText value={totals.roundOff} />
        </div>
      ) : null}
      <div className="flex items-end justify-between gap-3 border-t border-border/80 pt-3">
        <span className="pb-0.5 text-sm font-medium text-muted-foreground">Total</span>
        <MoneyText
          value={totals.total}
          className="text-2xl font-semibold tracking-tight text-foreground"
        />
      </div>
      <div className="pt-1">
        <button
          type="button"
          className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          onClick={() => setShowAdjust((v) => !v)}
          aria-expanded={showAdjust}
        >
          {showAdjust ? 'Hide adjust' : 'Adjust'}
        </button>
        {showAdjust ? (
          <div className="mt-2 space-y-1">
            <Label htmlFor="qs-bill-disc">Bill discount (₹)</Label>
            <Input
              id="qs-bill-disc"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              className="h-11"
              value={billDiscount}
              onChange={(e) => setBillDiscount(e.target.value)}
            />
          </div>
        ) : null}
      </div>
    </div>
  );

  const punchButton = ({ withMobileStrip = false }: { withMobileStrip?: boolean } = {}) => {
    const disabled = pending || punchSuccess || Boolean(blockReason) || Boolean(posted);
    return (
      <div className="space-y-2">
        {withMobileStrip ? (
          <div className="flex items-baseline justify-between gap-3 px-0.5">
            <span className="text-xs text-muted-foreground">
              Taxable <MoneyText value={totals.subtotal} className="text-xs" />
            </span>
            <span className="text-sm font-semibold text-foreground">
              Total <MoneyText value={totals.total} className="text-sm font-semibold" />
            </span>
          </div>
        ) : null}
        <div className="flex gap-2">
          <Button
            type="submit"
            size="lg"
            disabled={disabled}
            className={cn(
              'h-12 min-h-12 flex-1 text-base font-semibold shadow-sm',
              punchSuccess && 'bg-success text-success-foreground hover:bg-success',
            )}
            aria-live="polite"
            onClick={() => {
              punchIntentRef.current = 'none';
            }}
          >
            {punchSuccess ? (
              <span className="inline-flex animate-qs-punch-ok items-center gap-2">
                <Check className="h-5 w-5" strokeWidth={2.25} aria-hidden />
                Posted
              </span>
            ) : pending ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                Punching…
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                Punch
                <span className="font-mono text-base font-semibold tabular-nums">
                  · <MoneyText value={totals.total} className="text-base font-semibold" />
                </span>
              </span>
            )}
          </Button>
          <Button
            type="submit"
            size="lg"
            variant="secondary"
            disabled={disabled}
            className="h-12 min-h-12 w-[4.75rem] shrink-0 px-2 sm:w-auto sm:min-w-[7.5rem] sm:px-3"
            aria-label="Punch and print"
            onClick={() => {
              punchIntentRef.current = 'print';
            }}
          >
            {pending ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <Printer className="h-5 w-5" aria-hidden />
                <span className="hidden sm:inline">Print</span>
              </span>
            )}
          </Button>
        </div>
        {blockReason && !pending && !punchSuccess && !posted ? (
          <p className="text-center text-xs text-muted-foreground">{blockReason}</p>
        ) : !punchSuccess && !posted ? (
          <p className="hidden text-center text-[11px] text-muted-foreground md:block">
            <span className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
              <span className="inline-flex items-center gap-1">
                <HotkeyBadge>F2</HotkeyBadge> punch
              </span>
              <span className="text-border">·</span>
              <span className="inline-flex items-center gap-1">
                <HotkeyBadge>⇧F2</HotkeyBadge> print
              </span>
              <span className="text-border">·</span>
              <span className="inline-flex items-center gap-1">
                <HotkeyBadge>F3</HotkeyBadge> item
              </span>
              <span className="text-border">·</span>
              <span className="inline-flex items-center gap-1">
                <HotkeyBadge>1</HotkeyBadge>
                <HotkeyBadge>2</HotkeyBadge>
                <HotkeyBadge>3</HotkeyBadge> pay
              </span>
            </span>
          </p>
        ) : null}
      </div>
    );
  };

  const namedContactFields = (idPrefix: string) => (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-phone`}>Mobile</Label>
        <Input
          id={`${idPrefix}-phone`}
          type="tel"
          inputMode="tel"
          className="h-11"
          autoComplete="tel"
          placeholder="10-digit mobile"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
        />
        {customerMatch ? (
          <div
            className="flex items-start gap-1.5 rounded-md bg-success/10 px-2 py-1.5 text-xs text-success ring-1 ring-inset ring-success/25"
            role="status"
          >
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.25} aria-hidden />
            <span>
              Matched <span className="font-semibold">{customerMatch}</span>
            </span>
          </div>
        ) : null}
      </div>
      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-name`}>Name</Label>
        <Input
          id={`${idPrefix}-name`}
          className="h-11"
          autoComplete="name"
          placeholder="Customer name"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
        />
      </div>
    </div>
  );

  /** Buyer mode: always visible chips — named fields only when needed (not a wizard step). */
  const buyerModeToggle = (
    <div className="grid grid-cols-2 gap-2" role="group" aria-label="Buyer">
      <button
        type="button"
        aria-pressed={useWalkIn}
        onClick={() => setWalkInMode(true)}
        className={cn(
          'h-11 rounded-xl border text-sm font-semibold transition',
          useWalkIn
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border/80 bg-card text-muted-foreground active:bg-muted',
        )}
      >
        Walk-in
      </button>
      <button
        type="button"
        aria-pressed={!useWalkIn}
        onClick={() => setWalkInMode(false)}
        className={cn(
          'h-11 rounded-xl border text-sm font-semibold transition',
          !useWalkIn
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border/80 bg-card text-muted-foreground active:bg-muted',
        )}
      >
        Save contact
      </button>
    </div>
  );

  /** Desktop rail — fuller labels. */
  const customerFieldsDesktop = (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold tracking-tight text-foreground">Buyer</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {useWalkIn
            ? 'Walk-in — no phone captured'
            : customerName.trim() || customerPhone.trim()
              ? [customerName.trim(), customerPhone.trim()].filter(Boolean).join(' · ')
              : 'Name + mobile for WhatsApp / dues'}
        </p>
      </div>
      {buyerModeToggle}
      {!useWalkIn ? namedContactFields('qs-d') : null}
    </div>
  );

  /** Mobile: buyer + pay in one live strip under items (no step-by-step form). */
  const mobileCheckoutStrip = (
    <SurfaceCard padding="md" className="space-y-3">
      {buyerModeToggle}
      {!useWalkIn ? namedContactFields('qs-m') : null}
      <div className="grid grid-cols-3 gap-2" role="group" aria-label="Payment method">
        {PAY_OPTIONS.map((opt) => {
          const selected = payMethod === opt.value;
          const Icon = opt.Icon;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={selected}
              className={cn(
                'flex h-11 items-center justify-center gap-1.5 rounded-xl border px-2 text-sm font-semibold transition',
                selected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border/80 bg-card text-muted-foreground active:bg-muted',
              )}
              onClick={() => choosePay(opt.value)}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
              {opt.label}
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          onClick={() => setShowAdjust((v) => !v)}
          aria-expanded={showAdjust}
        >
          {showAdjust ? 'Hide discount' : 'Discount'}
        </button>
        <span className="text-xs text-muted-foreground">
          GST <MoneyText value={totals.tax} className="text-xs" />
        </span>
      </div>
      {showAdjust ? (
        <div className="space-y-1">
          <Label htmlFor="qs-bill-disc-m">Bill discount (₹)</Label>
          <Input
            id="qs-bill-disc-m"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            className="h-11"
            value={billDiscount}
            onChange={(e) => setBillDiscount(e.target.value)}
          />
        </div>
      ) : null}
      {message ? <p className="text-sm text-destructive">{message}</p> : null}
    </SurfaceCard>
  );

  const successStrip = posted ? (
    <SurfaceCard padding="md" className="border-success/30 bg-success/5">
      <div role="status" aria-live="polite" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-success">Sale posted</p>
          <p className="mt-0.5 font-mono text-sm text-foreground">{posted.invoiceNo}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Total <MoneyText value={posted.totalAmount} className="font-semibold text-foreground" />
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/sales/${posted.id}/invoice`}
            className={buttonClassName({ variant: 'secondary', size: 'sm' })}
          >
            Invoice
          </Link>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => {
              window.open(
                `/sales/${posted.id}/invoice?print=1`,
                '_blank',
                'noopener,noreferrer',
              );
            }}
          >
            <Printer className="h-3.5 w-3.5" aria-hidden />
            Print
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => {
              const phone = normalizeWhatsAppPhone(posted.customerPhone);
              const msg = [
                `*Invoice ${posted.invoiceNo}*`,
                `Total: ₹${posted.totalAmount.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`,
                '',
                'Thank you for shopping with us.',
              ].join('\n');
              window.open(
                buildWhatsAppShareUrl(phone, msg),
                '_blank',
                'noopener,noreferrer',
              );
            }}
          >
            <WhatsAppIcon className="h-3.5 w-3.5" />
            WhatsApp
          </Button>
          <Button type="button" size="sm" onClick={dismissPosted}>
            Next sale
          </Button>
        </div>
      </div>
    </SurfaceCard>
  ) : null;

  return (
    <form
      ref={formRef}
      className={cn(
        'space-y-4',
        kiosk ? stickyFormPadDualKioskClass : stickyFormPadDualClass,
      )}
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        const intent = punchIntentRef.current;
        punchIntentRef.current = 'none';
        if (!useWalkIn && !customerName.trim()) {
          setMessage('Customer name is required.');
          return;
        }
        if (!useWalkIn && !customerPhone.trim()) {
          setMessage('Mobile number is required.');
          return;
        }
        if (readyLines.length === 0) {
          setMessage('Add at least one item.');
          return;
        }
        startTransition(async () => {
          const result = await createAndPostQuickSaleAction({
            useWalkIn,
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim(),
            billDiscount: Number(billDiscount) || 0,
            payMethod,
            lines: readyLines.map((l) => ({
              variantId: l.variantId,
              qty: Number(l.qty),
              unitPrice: Number(l.unitPrice),
              discountAmount: 0,
              taxRateId: null,
            })),
          });
          if (!result.ok) {
            setMessage(result.error);
            return;
          }
          setPunchSuccess(true);
          const delay = prefersReducedMotion() ? 0 : 420;
          if (delay) await new Promise((r) => window.setTimeout(r, delay));
          setPosted({
            id: result.data.id,
            invoiceNo: result.data.invoiceNo,
            totalAmount: result.data.totalAmount,
            customerPhone: result.data.customerPhone,
          });
          writeLocal(OPS_KEYS.lastPayMethod, payMethod);
          pushRecentSkuIds(readyLines.map((l) => l.variantId));
          setLocalRecentIds(readRecentSkuIds(8));
          const articleIds = readyLines
            .map((l) => catalog.get(l.variantId)?.articleId)
            .filter((id): id is string => Boolean(id));
          if (articleIds.length > 0) {
            pushRecentArticleIds(articleIds);
          }
          if (intent === 'print') {
            window.open(
              `/sales/${result.data.id}/invoice?print=1`,
              '_blank',
              'noopener,noreferrer',
            );
          }
          resetFormForNext();
        });
      }}
    >
      <ArticleMatrixPicker
        open={matrixOpen}
        initialArticleId={matrixArticleId}
        onClose={() => {
          setMatrixOpen(false);
          setMatrixArticleId(null);
        }}
        onPick={(hit) => {
          setCatalog((prev) => mergeCatalog(prev, [hit]));
          if (hit.articleId) {
            pushRecentArticleIds([hit.articleId]);
            setArticleChips((prev) => {
              const chip: ArticleChip = {
                id: hit.articleId!,
                name: hit.articleName ?? hit.label,
                articleCode: hit.articleCode ?? '',
                brandName: null,
              };
              return [chip, ...prev.filter((a) => a.id !== chip.id)].slice(0, 8);
            });
          }
          const emptyIdx = lines.findIndex((l) => !l.variantId);
          setLineVariant(emptyIdx >= 0 ? emptyIdx : lines.length - 1, hit.id, hit);
        }}
      />
      <ConfirmDialog
        open={clearConfirmOpen}
        title="Clear items?"
        description="Remove all lines from this bill."
        confirmLabel="Clear"
        danger
        onCancel={() => setClearConfirmOpen(false)}
        onConfirm={clearCart}
      />
      {successStrip}

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(18rem,21rem)] lg:items-start lg:gap-6">
        {/* Items first on phone; left column on desktop */}
        <div className="order-1 space-y-3 lg:col-start-1 lg:row-start-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold tracking-tight text-foreground">Items</h3>
              <Badge variant="muted">
                {readyLines.length} {readyLines.length === 1 ? 'line' : 'lines'}
              </Badge>
              {readyLines.length > 0 ? (
                <Badge variant="primary">
                  <MoneyText value={totals.total} className="text-[11px] font-semibold" />
                </Badge>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {shell ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-10 px-2.5"
                  aria-pressed={kiosk}
                  onClick={() => shell.setKiosk(!kiosk)}
                  title={kiosk ? 'Exit counter mode' : 'Counter mode'}
                >
                  {kiosk ? (
                    <Shrink className="h-4 w-4" aria-hidden />
                  ) : (
                    <Expand className="h-4 w-4" aria-hidden />
                  )}
                  <span className="ml-1.5 hidden sm:inline">
                    {kiosk ? 'Exit' : 'Counter'}
                  </span>
                </Button>
              ) : null}
              <Button
                type="button"
                size="sm"
                className="h-10"
                onClick={() => openMatrix(null)}
              >
                <Grid2x2 className="h-4 w-4" aria-hidden />
                <span className="ml-1.5">Size</span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-10"
                onClick={() => addLine(true)}
              >
                <Plus className="h-4 w-4" aria-hidden />
                <span className="ml-1.5 sr-only sm:not-sr-only">Line</span>
              </Button>
            </div>
          </div>

          {articleChips.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Articles
              </p>
              <div
                className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                aria-label="Recent and frequent articles"
              >
                {articleChips.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className="h-11 shrink-0 rounded-xl border border-border/80 bg-card px-3 text-left active:bg-muted"
                    onClick={() => openMatrix(a.id)}
                  >
                    <span className="block max-w-[9rem] truncate text-xs font-semibold leading-tight">
                      {a.name}
                    </span>
                    <span className="block max-w-[9rem] truncate text-[10px] text-muted-foreground">
                      {[a.brandName, a.articleCode].filter(Boolean).join(' · ')}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {quickPickIds.length > 0 ? (
            <div
              className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              aria-label="Recent and frequent items"
            >
              {quickPickIds.map((id) => {
                const v = catalog.get(id);
                if (!v) return null;
                const short = v.sku.length > 14 ? `${v.sku.slice(0, 12)}…` : v.sku;
                return (
                  <button
                    key={id}
                    type="button"
                    className="h-10 shrink-0 rounded-lg border border-border/80 bg-muted/30 px-2.5 text-left text-xs font-medium text-foreground active:bg-muted"
                    onClick={() => {
                      const emptyIdx = lines.findIndex((l) => !l.variantId);
                      setLineVariant(emptyIdx >= 0 ? emptyIdx : lines.length - 1, id);
                    }}
                    title={v.label}
                  >
                    <span className="font-mono">{short}</span>
                  </button>
                );
              })}
            </div>
          ) : null}

          <SurfaceCard padding="none" className="overflow-hidden">
            <div className="hidden grid-cols-[minmax(0,1fr)_8.5rem_6.5rem_5.5rem_2.75rem] items-center gap-2 border-b border-border/80 bg-muted/40 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground md:grid">
              <span>Item code</span>
              <span>Qty</span>
              <span>Price</span>
              <span className="text-right">Line</span>
              <span className="sr-only">Remove</span>
            </div>

            <ul className="divide-y divide-border/80">
              {lines.map((line, index) => {
                const v = catalog.get(line.variantId);
                const est = lineEstimate(line, catalog);
                const qtyNum = Number(line.qty) || 0;
                const overQty = Boolean(v && qtyNum > 0 && qtyNum > v.onHandQty);
                const lowStock = Boolean(v && v.onHandQty > 0 && v.onHandQty <= 3);
                const outOfStock = Boolean(v && v.onHandQty <= 0);

                return (
                  <li
                    key={line.id}
                    className={cn(
                      'animate-qs-row-in space-y-2.5 px-3 py-3 md:grid md:grid-cols-[minmax(0,1fr)_8.5rem_6.5rem_5.5rem_2.75rem] md:items-start md:gap-2 md:space-y-0',
                      overQty && 'bg-destructive/[0.03]',
                    )}
                  >
                    <div className="min-w-0 space-y-1.5">
                      <Label className="md:sr-only">Item code</Label>
                      <AsyncSkuCombobox
                        value={line.variantId}
                        onValueChange={(id, hit) => setLineVariant(index, id, hit)}
                        onHits={mergeHits}
                        seedOptions={seedOptions}
                        placeholder="Search item code…"
                        required={index === 0 || Boolean(line.variantId)}
                        autoFocus={index === 0 && focusSkuIndex === 0}
                        triggerRef={(el) => {
                          skuTriggerRefs.current[index] = el;
                        }}
                        triggerClassName="h-11"
                      />
                      {v ? (
                        <Badge
                          variant={
                            overQty || outOfStock
                              ? 'destructive'
                              : lowStock
                                ? 'warning'
                                : 'muted'
                          }
                          className="font-mono"
                        >
                          Stock {v.onHandQty}
                          {overQty ? ' · over' : outOfStock ? ' · out' : null}
                        </Badge>
                      ) : null}
                    </div>

                    <div className="space-y-1">
                      <Label className="md:sr-only">Qty</Label>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="lg"
                          variant="secondary"
                          className="h-11 w-11 shrink-0 px-0"
                          aria-label="Decrease qty"
                          onClick={() =>
                            setLines((rows) =>
                              rows.map((r, i) => {
                                if (i !== index) return r;
                                const next = Math.max(1, (Number(r.qty) || 1) - 1);
                                return { ...r, qty: String(next) };
                              }),
                            )
                          }
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          inputMode="numeric"
                          className="h-11 text-center"
                          value={line.qty}
                          onChange={(e) =>
                            setLines((rows) =>
                              rows.map((r, i) =>
                                i === index ? { ...r, qty: e.target.value } : r,
                              ),
                            )
                          }
                          required={Boolean(line.variantId)}
                        />
                        <Button
                          type="button"
                          size="lg"
                          variant="secondary"
                          className="h-11 w-11 shrink-0 px-0"
                          aria-label="Increase qty"
                          onClick={() =>
                            setLines((rows) =>
                              rows.map((r, i) => {
                                if (i !== index) return r;
                                const next = (Number(r.qty) || 0) + 1;
                                return { ...r, qty: String(next) };
                              }),
                            )
                          }
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="md:sr-only">Price</Label>
                      {line.variantId ? (
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          className="h-11"
                          value={line.unitPrice}
                          onChange={(e) =>
                            setLines((rows) =>
                              rows.map((r, i) =>
                                i === index ? { ...r, unitPrice: e.target.value } : r,
                              ),
                            )
                          }
                          required
                        />
                      ) : (
                        <div
                          className="flex h-11 items-center rounded-lg border border-dashed border-border/70 bg-muted/30 px-3 text-sm text-muted-foreground"
                          aria-hidden
                        >
                          —
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 md:flex-col md:items-end md:justify-start md:pt-2">
                      <span className="text-xs text-muted-foreground md:hidden">Line</span>
                      {est ? (
                        <div className="text-right">
                          <MoneyText
                            value={est.total}
                            className="text-sm font-semibold tabular-nums"
                          />
                          <p className="text-[11px] text-muted-foreground">
                            GST <MoneyText value={est.tax} className="text-[11px]" />
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground tabular-nums">—</span>
                      )}
                    </div>

                    <div className="flex justify-end md:pt-1">
                      {lines.length > 1 ? (
                        <Button
                          type="button"
                          size="lg"
                          variant="ghost"
                          className="h-11 w-11 shrink-0 px-0 text-destructive hover:text-destructive"
                          aria-label="Remove line"
                          onClick={() =>
                            setLines((rows) => rows.filter((_, i) => i !== index))
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : (
                        <span className="hidden w-11 md:block" aria-hidden />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </SurfaceCard>

          {/* Mobile checkout — default until lg known (mobile-first); avoid duplicate fields */}
          {isLgUp !== true ? (
            <div className="space-y-3">
              {mobileCheckoutStrip}
              <StickyFormActions
                kiosk={kiosk}
                contentClassName="max-w-lg md:max-w-none"
                className="md:static md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none"
              >
                {punchButton({ withMobileStrip: true })}
              </StickyFormActions>
            </div>
          ) : null}
        </div>

        {/* Desktop rail — only after lg match confirmed */}
        {isLgUp === true ? (
          <aside className="lg:col-start-2 lg:row-start-1 lg:sticky lg:top-24">
            <SurfaceCard padding="md" className="space-y-0">
              {customerFieldsDesktop}
              <div className="mt-5 space-y-5 border-t border-border/80 pt-5">
                {paymentBlock}
                {totalsBlock}
                {message ? <p className="text-sm text-destructive">{message}</p> : null}
                {punchButton()}
              </div>
            </SurfaceCard>
          </aside>
        ) : null}
      </div>
    </form>
  );
}
