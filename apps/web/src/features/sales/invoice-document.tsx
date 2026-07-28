import { MoneyText } from '@/components/shared/money-text';
import { POWERED_BY_LABEL, PRODUCT_URL, shopMonogram } from '@/lib/shop-branding';
import { cn } from '@/lib/utils';

export type InvoiceSale = {
  invoiceNo: string;
  invoiceDate: Date;
  placeOfSupplyState: string;
  paymentStatus: string;
  subtotal: { toString(): string } | number;
  discountAmount: { toString(): string } | number;
  taxAmount: { toString(): string } | number;
  roundOff: { toString(): string } | number;
  totalAmount: { toString(): string } | number;
  notes: string | null;
  organization: {
    name: string;
    gstin: string | null;
    stateCode: string;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    pincode: string | null;
    phone: string | null;
    email: string | null;
  };
  branch: { name: string };
  customer: {
    name: string;
    phone: string | null;
    gstin: string | null;
    address: string | null;
    stateCode: string | null;
    isWalkIn?: boolean;
  };
  lines: Array<{
    id: string;
    qty: { toString(): string } | number;
    unitPrice: { toString(): string } | number;
    discountAmount: { toString(): string } | number;
    taxableAmount: { toString(): string } | number;
    cgstRate: { toString(): string } | number;
    sgstRate: { toString(): string } | number;
    cgstAmount: { toString(): string } | number;
    sgstAmount: { toString(): string } | number;
    lineTotal: { toString(): string } | number;
    hsnCode: string | null;
    variant: {
      sku: string;
      size: string;
      color: string;
      article: { name: string; brand?: { name: string } | null };
    };
  }>;
  payments: Array<{
    id: string;
    method: string;
    amount: { toString(): string } | number;
    reference: string | null;
  }>;
};

function n(v: { toString(): string } | number) {
  return Number(v);
}

function money(v: { toString(): string } | number) {
  return n(v).toFixed(2);
}

function formatDate(d: Date) {
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function orgAddress(org: InvoiceSale['organization']) {
  return [org.addressLine1, org.addressLine2, org.city, org.pincode].filter(Boolean).join(', ');
}

function methodLabel(method: string) {
  const map: Record<string, string> = {
    CASH: 'Cash',
    UPI: 'UPI',
    CARD: 'Card',
    OTHER: 'Other',
  };
  return map[method] ?? method;
}

function paymentStatusLabel(status: string) {
  const map: Record<string, string> = {
    PAID: 'Paid',
    PARTIAL: 'Partial',
    UNPAID: 'Unpaid',
  };
  return map[status] ?? status;
}

/** Show Bill to only when there is something useful for the customer. */
function shouldShowBillTo(customer: InvoiceSale['customer']) {
  if (!customer.isWalkIn) return true;
  return Boolean(customer.phone || customer.gstin || customer.address);
}

function billToName(customer: InvoiceSale['customer']) {
  if (customer.isWalkIn) return null;
  return customer.name;
}

/** Detailed payments block only when split / refs / unpaid with notes. */
function shouldShowPaymentsBlock(sale: InvoiceSale) {
  if (sale.payments.length > 1) return true;
  if (sale.payments.some((p) => Boolean(p.reference))) return true;
  return false;
}

function headerPaymentLine(sale: InvoiceSale) {
  const status = paymentStatusLabel(sale.paymentStatus);
  if (sale.payments.length === 1) {
    return `${methodLabel(sale.payments[0]!.method)} · ${status}`;
  }
  if (sale.payments.length > 1) {
    return status;
  }
  return status;
}

export function InvoiceDocument({ sale }: { sale: InvoiceSale }) {
  const org = sale.organization;
  const cgst = sale.lines.reduce((s, l) => s + n(l.cgstAmount), 0);
  const sgst = sale.lines.reduce((s, l) => s + n(l.sgstAmount), 0);
  const discount = n(sale.discountAmount);
  const address = orgAddress(org);
  const showBillTo = shouldShowBillTo(sale.customer);
  const customerLabel = billToName(sale.customer);
  const showPayments = shouldShowPaymentsBlock(sale);
  const showMetaRow = showBillTo || showPayments;

  return (
    <article
      className={cn(
        'invoice-sheet overflow-hidden rounded-xl border border-border/80 bg-card shadow-card',
        'print:rounded-none print:border-0 print:shadow-none',
      )}
    >
      <div className="h-1.5 bg-primary print:h-1" aria-hidden />

      <div className="p-5 sm:p-8 print:p-0">
        <header className="flex flex-col gap-6 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold tracking-tight text-primary-foreground"
              aria-hidden
            >
              {shopMonogram(org.name)}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {org.name}
              </h1>
              {address ? (
                <p className="mt-1 text-sm leading-snug text-muted-foreground">{address}</p>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {org.gstin ? (
                  <span>
                    GSTIN{' '}
                    <span className="font-mono font-medium text-foreground">{org.gstin}</span>
                  </span>
                ) : null}
                {org.phone ? <span>{org.phone}</span> : null}
                {org.email ? <span className="truncate">{org.email}</span> : null}
              </div>
            </div>
          </div>

          <div className="shrink-0 rounded-lg border border-border bg-muted/40 px-4 py-3 sm:min-w-[13.5rem] sm:text-right print:bg-transparent">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
              Tax Invoice
            </p>
            <p className="mt-1 font-mono text-lg font-semibold tracking-tight text-foreground">
              {sale.invoiceNo}
            </p>
            <dl className="mt-3 space-y-1.5 text-xs">
              <div className="flex justify-between gap-4 sm:justify-end sm:gap-6">
                <dt className="text-muted-foreground">Date</dt>
                <dd className="font-medium tabular-nums">{formatDate(sale.invoiceDate)}</dd>
              </div>
              <div className="flex justify-between gap-4 sm:justify-end sm:gap-6">
                <dt className="text-muted-foreground">Payment</dt>
                <dd className="font-medium">{headerPaymentLine(sale)}</dd>
              </div>
            </dl>
          </div>
        </header>

        {showMetaRow ? (
          <section
            className={cn(
              'mt-6 grid gap-3',
              showBillTo && showPayments ? 'sm:grid-cols-2' : 'sm:grid-cols-1',
            )}
          >
            {showBillTo ? (
              <div className="rounded-lg border border-border/80 bg-muted/30 p-4 print:bg-transparent">
                <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Bill to
                </h2>
                {customerLabel ? (
                  <p className="mt-2 text-base font-semibold text-foreground">{customerLabel}</p>
                ) : null}
                {sale.customer.phone ? (
                  <p
                    className={cn(
                      'text-sm text-muted-foreground',
                      customerLabel ? 'mt-1' : 'mt-2 font-semibold text-foreground',
                    )}
                  >
                    {sale.customer.phone}
                  </p>
                ) : null}
                {sale.customer.gstin ? (
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    GSTIN {sale.customer.gstin}
                  </p>
                ) : null}
                {sale.customer.address ? (
                  <p className="mt-2 text-sm leading-snug text-muted-foreground">
                    {sale.customer.address}
                  </p>
                ) : null}
              </div>
            ) : null}

            {showPayments ? (
              <div className="rounded-lg border border-border/80 bg-muted/30 p-4 print:bg-transparent">
                <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Payments
                </h2>
                <ul className="mt-2 space-y-2">
                  {sale.payments.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-baseline justify-between gap-3 text-sm"
                    >
                      <span className="text-muted-foreground">
                        {methodLabel(p.method)}
                        {p.reference ? (
                          <span className="mt-0.5 block font-mono text-[11px]">{p.reference}</span>
                        ) : null}
                      </span>
                      <MoneyText value={n(p.amount)} className="text-sm font-medium" />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ) : null}

        {/* Desktop / print table */}
        <div className="mt-8 hidden overflow-x-auto md:block print:block">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b-2 border-border text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="py-2.5 pr-3 font-semibold">#</th>
                <th className="py-2.5 pr-3 font-semibold">Item</th>
                <th className="py-2.5 pr-3 font-semibold">HSN</th>
                <th className="py-2.5 pr-3 text-right font-semibold">Qty</th>
                <th className="py-2.5 pr-3 text-right font-semibold">Rate</th>
                <th className="py-2.5 pr-3 text-right font-semibold">Taxable</th>
                <th className="py-2.5 pr-3 text-right font-semibold">CGST</th>
                <th className="py-2.5 pr-3 text-right font-semibold">SGST</th>
                <th className="py-2.5 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.lines.map((line, idx) => (
                <tr key={line.id} className="border-b border-border/70 align-top">
                  <td className="py-3 pr-3 tabular-nums text-muted-foreground">{idx + 1}</td>
                  <td className="py-3 pr-3">
                    <span className="font-medium text-foreground">
                      {line.variant.article.name}
                    </span>
                    {line.variant.article.brand?.name ? (
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {line.variant.article.brand.name}
                      </span>
                    ) : null}
                    <span className="mt-0.5 block font-mono text-[11px] text-muted-foreground">
                      {line.variant.sku} · {line.variant.size}/{line.variant.color}
                    </span>
                  </td>
                  <td className="py-3 pr-3 font-mono text-xs">{line.hsnCode ?? '—'}</td>
                  <td className="py-3 pr-3 text-right tabular-nums">{n(line.qty)}</td>
                  <td className="py-3 pr-3 text-right tabular-nums">₹{money(line.unitPrice)}</td>
                  <td className="py-3 pr-3 text-right tabular-nums">₹{money(line.taxableAmount)}</td>
                  <td className="py-3 pr-3 text-right tabular-nums">
                    ₹{money(line.cgstAmount)}
                    <span className="mt-0.5 block text-[10px] text-muted-foreground">
                      @{n(line.cgstRate)}%
                    </span>
                  </td>
                  <td className="py-3 pr-3 text-right tabular-nums">
                    ₹{money(line.sgstAmount)}
                    <span className="mt-0.5 block text-[10px] text-muted-foreground">
                      @{n(line.sgstRate)}%
                    </span>
                  </td>
                  <td className="py-3 text-right font-medium tabular-nums">
                    ₹{money(line.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile line cards */}
        <div className="mt-6 space-y-3 md:hidden print:hidden">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Line items
          </h2>
          {sale.lines.map((line, idx) => (
            <div
              key={line.id}
              className="rounded-lg border border-border/80 bg-muted/20 p-3.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">#{idx + 1}</p>
                  <p className="font-medium text-foreground">{line.variant.article.name}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                    {line.variant.sku} · {line.variant.size}/{line.variant.color}
                  </p>
                </div>
                <MoneyText value={n(line.lineTotal)} className="shrink-0 text-sm font-semibold" />
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Qty × Rate</dt>
                  <dd className="tabular-nums">
                    {n(line.qty)} × ₹{money(line.unitPrice)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">HSN</dt>
                  <dd className="font-mono">{line.hsnCode ?? '—'}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Taxable</dt>
                  <dd className="tabular-nums">₹{money(line.taxableAmount)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">
                    Tax ({n(line.cgstRate) + n(line.sgstRate)}%)
                  </dt>
                  <dd className="tabular-nums">
                    ₹{money(n(line.cgstAmount) + n(line.sgstAmount))}
                  </dd>
                </div>
              </dl>
            </div>
          ))}
        </div>

        <footer className="mt-8 flex flex-col gap-6 border-t border-border pt-6 sm:flex-row sm:justify-between">
          <div className="max-w-sm space-y-2 text-xs text-muted-foreground">
            <p>This is a computer-generated tax invoice.</p>
            {sale.notes ? (
              <p>
                <span className="font-medium text-foreground">Notes: </span>
                {sale.notes}
              </p>
            ) : null}
          </div>

          <dl className="w-full space-y-2 rounded-lg border border-border bg-muted/30 p-4 text-sm sm:w-72 print:bg-transparent">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Taxable value</dt>
              <dd>
                <MoneyText value={n(sale.subtotal)} />
              </dd>
            </div>
            {discount > 0 ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Discount</dt>
                <dd className="font-mono tabular-nums">−₹{discount.toFixed(2)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">CGST</dt>
              <dd>
                <MoneyText value={cgst} />
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">SGST</dt>
              <dd>
                <MoneyText value={sgst} />
              </dd>
            </div>
            {n(sale.roundOff) !== 0 ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Round off</dt>
                <dd>
                  <MoneyText value={n(sale.roundOff)} />
                </dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4 border-t border-border pt-3 text-base font-semibold text-foreground">
              <dt>Grand total</dt>
              <dd className="text-primary">
                <MoneyText value={n(sale.totalAmount)} className="text-base font-semibold" />
              </dd>
            </div>
          </dl>
        </footer>

        <p className="mt-8 text-center text-[11px] text-muted-foreground">
          Thank you for your business · Powered by{' '}
          <a
            href={PRODUCT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline underline-offset-2 print:text-foreground"
          >
            {POWERED_BY_LABEL}
          </a>
        </p>
      </div>
    </article>
  );
}
