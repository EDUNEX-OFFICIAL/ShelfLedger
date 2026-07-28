'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Banknote,
  Check,
  CreditCard,
  Loader2,
  Minus,
  Plus,
  Smartphone,
  Trash2,
} from 'lucide-react';
import { computeLineTax, computeRoundOff, roundMoney } from '@shelfledger/domain';
import { normalizeCustomerPhone } from '@shelfledger/validators';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { SurfaceCard } from '@/components/shared/surface-card';
import { MoneyText } from '@/components/shared/money-text';
import {
  StickyFormActions,
  stickyFormPadTallClass,
} from '@/components/shared/sticky-form-actions';
import {
  createAndPostQuickSaleAction,
  lookupCustomerByPhoneAction,
} from '@/features/sales/actions';
import { cn } from '@/lib/utils';

type VariantOption = {
  id: string;
  sku: string;
  barcode: string | null;
  label: string;
  sellingPrice: number;
  cgstRate: number;
  sgstRate: number;
  onHandQty: number;
};

type Line = {
  id: string;
  variantId: string;
  qty: string;
  unitPrice: string;
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
  variants: VariantOption[],
): { taxable: number; tax: number; total: number } | null {
  if (!line.variantId) return null;
  const v = variants.find((x) => x.id === line.variantId);
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
  variants: VariantOption[],
): { subtotal: number; tax: number; roundOff: number; total: number } {
  let subtotal = 0;
  let tax = 0;
  for (const line of lines) {
    const est = lineEstimate(line, variants);
    if (!est) continue;
    subtotal = roundMoney(subtotal + est.taxable);
    tax = roundMoney(tax + est.tax);
  }
  const beforeRound = roundMoney(subtotal + tax);
  const roundOff = computeRoundOff(beforeRound);
  return {
    subtotal,
    tax,
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
  variants,
}: {
  canWrite: boolean;
  variants: VariantOption[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const skuTriggerRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerMatch, setCustomerMatch] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState<'CASH' | 'UPI' | 'CARD'>('CASH');
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const [focusSkuIndex, setFocusSkuIndex] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [punchSuccess, setPunchSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  const selectOptions = useMemo(
    () =>
      variants.map((v) => ({
        value: v.id,
        label: v.label,
        keywords: [v.sku, v.barcode].filter(Boolean).join(' ').toLowerCase(),
      })),
    [variants],
  );

  const totals = useMemo(() => estimateTotal(lines, variants), [lines, variants]);
  const readyLines = lines.filter(
    (l) => l.variantId && Number(l.qty) > 0 && Number(l.unitPrice) >= 0,
  );

  const blockReason = !customerName.trim()
    ? 'Enter customer name'
    : !customerPhone.trim()
      ? 'Enter mobile number'
      : readyLines.length === 0
        ? 'Add at least one SKU'
        : null;

  const addLine = (focus = true) => {
    setLines((rows) => {
      const next = [...rows, emptyLine()];
      if (focus) setFocusSkuIndex(next.length - 1);
      return next;
    });
  };

  const setLineVariant = (index: number, id: string) => {
    const v = variants.find((x) => x.id === id);
    let nextFocus: number | null = null;
    setLines((rows) => {
      const mapped = rows.map((r, i) =>
        i === index
          ? {
              ...r,
              variantId: id,
              unitPrice: v ? String(v.sellingPrice) : r.unitPrice,
            }
          : r,
      );
      if (id && index === rows.length - 1) {
        nextFocus = mapped.length;
        return [...mapped, emptyLine()];
      }
      return mapped;
    });
    if (nextFocus != null) setFocusSkuIndex(nextFocus);
  };

  useEffect(() => {
    const el = skuTriggerRefs.current[focusSkuIndex];
    if (!el) return;
    const t = window.setTimeout(() => el.focus(), 0);
    return () => window.clearTimeout(t);
  }, [focusSkuIndex, lines.length]);

  useEffect(() => {
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
  }, [customerPhone]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        if (!pending && !punchSuccess && !blockReason) formRef.current?.requestSubmit();
        return;
      }
      if (isTypingTarget(e.target)) return;
      if (e.key === '+' || (e.key === '=' && e.shiftKey)) {
        e.preventDefault();
        addLine(true);
        return;
      }
      if (e.key === '1') setPayMethod('CASH');
      if (e.key === '2') setPayMethod('UPI');
      if (e.key === '3') setPayMethod('CARD');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pending, punchSuccess, blockReason]);

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
              onClick={() => setPayMethod(opt.value)}
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
    </div>
  );

  const punchButton = ({ withMobileStrip = false }: { withMobileStrip?: boolean } = {}) => (
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
      <Button
        type="submit"
        size="lg"
        disabled={pending || punchSuccess || Boolean(blockReason)}
        className={cn(
          'h-[3.25rem] w-full text-base font-semibold shadow-sm',
          punchSuccess && 'bg-success text-success-foreground hover:bg-success',
        )}
        aria-live="polite"
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
            Punch sale
            <span className="font-mono text-base font-semibold tabular-nums">
              · <MoneyText value={totals.total} className="text-base font-semibold" />
            </span>
          </span>
        )}
      </Button>
      {blockReason && !pending && !punchSuccess ? (
        <p className="text-center text-xs text-muted-foreground">{blockReason}</p>
      ) : !punchSuccess ? (
        <p className="hidden text-center text-[11px] text-muted-foreground md:block">
          <span className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <span className="inline-flex items-center gap-1">
              <HotkeyBadge>F2</HotkeyBadge> punch
            </span>
            <span className="text-border">·</span>
            <span className="inline-flex items-center gap-1">
              <HotkeyBadge>1</HotkeyBadge>
              <HotkeyBadge>2</HotkeyBadge>
              <HotkeyBadge>3</HotkeyBadge> pay
            </span>
            <span className="text-border">·</span>
            <span className="inline-flex items-center gap-1">
              <HotkeyBadge>+</HotkeyBadge> line
            </span>
          </span>
        </p>
      ) : null}
    </div>
  );

  const customerFields = (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold tracking-tight text-foreground">Customer</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">Saved for offers &amp; WhatsApp</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <div className="space-y-1">
          <Label htmlFor="qs-phone">Mobile</Label>
          <Input
            id="qs-phone"
            type="tel"
            inputMode="tel"
            className="h-11"
            autoComplete="tel"
            placeholder="10-digit mobile"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            required
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
          <Label htmlFor="qs-name">Name</Label>
          <Input
            id="qs-name"
            className="h-11"
            autoComplete="name"
            placeholder="Customer name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
          />
        </div>
      </div>
    </div>
  );

  return (
    <form
      ref={formRef}
      className={cn('space-y-4', stickyFormPadTallClass)}
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        if (!customerName.trim()) {
          setMessage('Customer name is required.');
          return;
        }
        if (!customerPhone.trim()) {
          setMessage('Mobile number is required.');
          return;
        }
        if (readyLines.length === 0) {
          setMessage('Add at least one SKU.');
          return;
        }
        startTransition(async () => {
          const result = await createAndPostQuickSaleAction({
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim(),
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
          setCustomerName('');
          setCustomerPhone('');
          setCustomerMatch(null);
          setLines([emptyLine()]);
          setFocusSkuIndex(0);
          router.push(`/sales/${result.data.id}/invoice`);
        });
      }}
    >
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(18rem,21rem)] lg:items-start lg:gap-6">
        {/* Checkout rail — single surface on desktop */}
        <aside className="order-1 lg:col-start-2 lg:row-start-1 lg:sticky lg:top-24">
          <SurfaceCard padding="md" className="space-y-0">
            {customerFields}
            <div className="mt-5 hidden space-y-5 border-t border-border/80 pt-5 lg:block">
              {paymentBlock}
              {totalsBlock}
              {message ? <p className="text-sm text-destructive">{message}</p> : null}
              {punchButton()}
            </div>
          </SurfaceCard>
        </aside>

        {/* Items ticket */}
        <div className="order-2 space-y-3 lg:col-start-1 lg:row-start-1">
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
              <span className="text-xs text-muted-foreground">excl. GST in price</span>
            </div>
            <Button type="button" size="sm" variant="secondary" onClick={() => addLine(true)}>
              Add line
            </Button>
          </div>

          <SurfaceCard padding="none" className="overflow-hidden">
            <div className="hidden grid-cols-[minmax(0,1fr)_8.5rem_6.5rem_5.5rem_2.75rem] items-center gap-2 border-b border-border/80 bg-muted/40 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground md:grid">
              <span>SKU</span>
              <span>Qty</span>
              <span>Price</span>
              <span className="text-right">Line</span>
              <span className="sr-only">Remove</span>
            </div>

            <ul className="divide-y divide-border/80">
              {lines.map((line, index) => {
                const v = variants.find((x) => x.id === line.variantId);
                const est = lineEstimate(line, variants);
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
                      <Label className="md:sr-only">SKU</Label>
                      <Select
                        value={line.variantId}
                        onValueChange={(id) => setLineVariant(index, id)}
                        placeholder="Search SKU…"
                        required={index === 0 || Boolean(line.variantId)}
                        searchable
                        options={selectOptions}
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
        </div>

        {/* Mobile / tablet checkout below items */}
        <div className="order-3 space-y-4 lg:hidden">
          <SurfaceCard padding="md" className="space-y-5">
            {paymentBlock}
            {totalsBlock}
            {message ? <p className="text-sm text-destructive">{message}</p> : null}
          </SurfaceCard>
          <StickyFormActions
            contentClassName="max-w-lg md:max-w-none"
            className="md:static md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none"
          >
            {punchButton({ withMobileStrip: true })}
          </StickyFormActions>
        </div>
      </div>
    </form>
  );
}
