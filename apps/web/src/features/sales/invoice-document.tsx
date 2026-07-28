import Link from 'next/link';
import { MoneyText } from '@/components/shared/money-text';
import { amountInInrWords } from '@/lib/amount-in-words';
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

/** Common GST state codes (V1 display). */
const STATE_NAMES: Record<string, string> = {
  '01': 'Jammu & Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '26': 'Dadra & Nagar Haveli and Daman & Diu',
  '27': 'Maharashtra',
  '29': 'Karnataka',
  '30': 'Goa',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
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

function stateLabel(code: string | null | undefined) {
  if (!code) return null;
  const name = STATE_NAMES[code];
  return name ? `${name} (${code})` : `State ${code}`;
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

function headerPaymentLine(sale: InvoiceSale) {
  const status = paymentStatusLabel(sale.paymentStatus);
  if (sale.payments.length === 1) {
    return `${methodLabel(sale.payments[0]!.method)} · ${status}`;
  }
  if (sale.payments.length > 1) return status;
  return status;
}

export function InvoiceDocument({ sale }: { sale: InvoiceSale }) {
  const org = sale.organization;
  const cgst = sale.lines.reduce((s, l) => s + n(l.cgstAmount), 0);
  const sgst = sale.lines.reduce((s, l) => s + n(l.sgstAmount), 0);
  const discount = n(sale.discountAmount);
  const address = orgAddress(org);
  const placeOfSupply =
    stateLabel(sale.placeOfSupplyState || org.stateCode) ??
    `State ${sale.placeOfSupplyState || org.stateCode}`;
  const sellerState = stateLabel(org.stateCode);
  const total = n(sale.totalAmount);
  const words = amountInInrWords(total);
  const showPaymentsDetail =
    sale.payments.length > 1 || sale.payments.some((p) => Boolean(p.reference));
  const customerName = sale.customer.isWalkIn
    ? sale.customer.phone || sale.customer.gstin
      ? 'Walk-in customer'
      : 'Consumer (Walk-in)'
    : sale.customer.name;
  const profileIncomplete = !org.gstin || !address;

  return (
    <article
      className={cn(
        'invoice-sheet overflow-hidden rounded-xl border border-border/80 bg-card shadow-card',
        'print:overflow-visible print:rounded-none print:border-0 print:shadow-none',
      )}
    >
      <div className="h-1.5 bg-primary print:hidden" aria-hidden />

      <div className="p-5 sm:p-7 print:p-0">
        {/* Title strip — required on GST tax invoice */}
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-3">
          <div>
            <p className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              Tax Invoice
            </p>
            <p className="text-[11px] text-muted-foreground print:text-[10px]">
              Original for Recipient · CGST + SGST (same-state supply)
            </p>
          </div>
          <p className="font-mono text-sm font-semibold tabular-nums text-foreground sm:text-base">
            {sale.invoiceNo}
          </p>
        </div>

        {/* Seller + invoice meta */}
        <div className="mt-4 grid gap-4 border-b border-border pb-4 sm:grid-cols-2 print:mt-3 print:gap-3 print:pb-3">
          <section>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Seller
            </p>
            <div className="mt-2 flex items-start gap-2.5">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground print:border print:border-border print:bg-transparent print:text-foreground"
                aria-hidden
              >
                {shopMonogram(org.name)}
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                  {org.name}
                </h1>
                {address ? (
                  <p className="mt-1 text-xs leading-snug text-muted-foreground">{address}</p>
                ) : (
                  <p className="mt-1 text-xs text-warning print:hidden">
                    Address missing —{' '}
                    <Link href="/settings#organization" className="underline underline-offset-2">
                      Settings
                    </Link>
                  </p>
                )}
                <dl className="mt-2 space-y-0.5 text-xs">
                  <div className="flex flex-wrap gap-x-1">
                    <dt className="text-muted-foreground">GSTIN</dt>
                    <dd className="font-mono font-medium text-foreground">
                      {org.gstin ?? '—'}
                    </dd>
                  </div>
                  {sellerState ? (
                    <div className="flex flex-wrap gap-x-1">
                      <dt className="text-muted-foreground">State</dt>
                      <dd className="text-foreground">{sellerState}</dd>
                    </div>
                  ) : null}
                  {org.phone ? (
                    <div className="flex flex-wrap gap-x-1">
                      <dt className="text-muted-foreground">Phone</dt>
                      <dd className="text-foreground">{org.phone}</dd>
                    </div>
                  ) : null}
                  {org.email ? (
                    <div className="flex flex-wrap gap-x-1">
                      <dt className="text-muted-foreground">Email</dt>
                      <dd className="truncate text-foreground">{org.email}</dd>
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-x-1">
                    <dt className="text-muted-foreground">Branch</dt>
                    <dd className="text-foreground">{sale.branch.name}</dd>
                  </div>
                </dl>
                {profileIncomplete ? (
                  <p className="mt-2 text-[11px] text-warning print:hidden">
                    Complete shop GSTIN &amp; address in{' '}
                    <Link href="/settings#organization" className="underline underline-offset-2">
                      Settings
                    </Link>{' '}
                    for a compliant print.
                  </p>
                ) : null}
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border/80 bg-muted/30 p-3.5 sm:justify-self-end sm:w-full sm:max-w-xs print:border print:bg-transparent">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Invoice details
            </p>
            <dl className="mt-2 space-y-1.5 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Invoice no.</dt>
                <dd className="font-mono font-semibold text-foreground">{sale.invoiceNo}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Invoice date</dt>
                <dd className="font-medium tabular-nums text-foreground">
                  {formatDate(sale.invoiceDate)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Place of supply</dt>
                <dd className="text-right font-medium text-foreground">{placeOfSupply}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Reverse charge</dt>
                <dd className="font-medium text-foreground">No</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Payment</dt>
                <dd className="text-right font-medium text-foreground">
                  {headerPaymentLine(sale)}
                </dd>
              </div>
            </dl>
          </section>
        </div>

        {/* Bill to */}
        <section className="mt-4 grid gap-3 border-b border-border pb-4 sm:grid-cols-2 print:mt-3 print:pb-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Bill to
            </p>
            <p className="mt-1.5 text-sm font-semibold text-foreground">{customerName}</p>
            {sale.customer.phone ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{sale.customer.phone}</p>
            ) : null}
            {sale.customer.gstin ? (
              <p className="mt-0.5 font-mono text-xs text-foreground">
                GSTIN {sale.customer.gstin}
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-muted-foreground">GSTIN — (unregistered)</p>
            )}
            {sale.customer.address ? (
              <p className="mt-1 text-xs leading-snug text-muted-foreground">
                {sale.customer.address}
              </p>
            ) : null}
            {sale.customer.stateCode ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                State {stateLabel(sale.customer.stateCode)}
              </p>
            ) : null}
          </div>

          {showPaymentsDetail ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Payments
              </p>
              <ul className="mt-1.5 space-y-1.5">
                {sale.payments.map((p) => (
                  <li key={p.id} className="flex items-baseline justify-between gap-3 text-xs">
                    <span className="text-muted-foreground">
                      {methodLabel(p.method)}
                      {p.reference ? (
                        <span className="mt-0.5 block font-mono text-[11px]">{p.reference}</span>
                      ) : null}
                    </span>
                    <MoneyText value={n(p.amount)} className="text-xs font-medium" />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        {/* Desktop / print table */}
        <div className="mt-5 hidden overflow-x-auto md:block print:mt-3 print:block">
          <table className="w-full border-collapse text-left text-[13px] print:text-[11px]">
            <thead>
              <tr className="border-b-2 border-foreground/80 text-[10px] uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-2 font-semibold">#</th>
                <th className="py-2 pr-2 font-semibold">Description</th>
                <th className="py-2 pr-2 font-semibold">HSN</th>
                <th className="py-2 pr-2 text-right font-semibold">Qty</th>
                <th className="py-2 pr-2 text-right font-semibold">Rate</th>
                <th className="py-2 pr-2 text-right font-semibold">Taxable</th>
                <th className="py-2 pr-2 text-right font-semibold">CGST</th>
                <th className="py-2 pr-2 text-right font-semibold">SGST</th>
                <th className="py-2 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {sale.lines.map((line, idx) => (
                <tr key={line.id} className="border-b border-border/80 align-top">
                  <td className="py-2.5 pr-2 tabular-nums text-muted-foreground">{idx + 1}</td>
                  <td className="py-2.5 pr-2">
                    <span className="font-medium text-foreground">
                      {line.variant.article.name}
                    </span>
                    {line.variant.article.brand?.name ? (
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">
                        {line.variant.article.brand.name}
                      </span>
                    ) : null}
                    <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground">
                      {line.variant.sku} · {line.variant.size}/{line.variant.color}
                    </span>
                  </td>
                  <td className="py-2.5 pr-2 font-mono text-xs">{line.hsnCode ?? '—'}</td>
                  <td className="py-2.5 pr-2 text-right tabular-nums">{n(line.qty)}</td>
                  <td className="py-2.5 pr-2 text-right tabular-nums">₹{money(line.unitPrice)}</td>
                  <td className="py-2.5 pr-2 text-right tabular-nums">
                    ₹{money(line.taxableAmount)}
                  </td>
                  <td className="py-2.5 pr-2 text-right tabular-nums">
                    ₹{money(line.cgstAmount)}
                    <span className="mt-0.5 block text-[10px] text-muted-foreground">
                      @{n(line.cgstRate)}%
                    </span>
                  </td>
                  <td className="py-2.5 pr-2 text-right tabular-nums">
                    ₹{money(line.sgstAmount)}
                    <span className="mt-0.5 block text-[10px] text-muted-foreground">
                      @{n(line.sgstRate)}%
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-medium tabular-nums">
                    ₹{money(line.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile line cards */}
        <div className="mt-5 space-y-3 md:hidden print:hidden">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
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

        {/* Totals + amount in words */}
        <div className="mt-5 grid gap-4 border-t border-border pt-4 sm:grid-cols-[1fr_auto] print:mt-3 print:pt-3">
          <div className="space-y-3 text-xs text-muted-foreground">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em]">
                Amount in words
              </p>
              <p className="mt-1 text-sm font-medium leading-snug text-foreground">{words}</p>
            </div>
            {sale.notes ? (
              <p>
                <span className="font-medium text-foreground">Notes: </span>
                {sale.notes}
              </p>
            ) : null}
            <p className="print:text-[10px]">
              This is a computer-generated tax invoice. No signature required if digitally issued.
            </p>
          </div>

          <dl className="w-full space-y-1.5 rounded-lg border border-border bg-muted/30 p-3.5 text-sm sm:w-64 print:border print:bg-transparent">
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
            <div className="flex justify-between gap-4 border-t border-border pt-2.5 text-base font-semibold text-foreground">
              <dt>Grand total</dt>
              <dd>
                <MoneyText value={total} className="text-base font-semibold" />
              </dd>
            </div>
          </dl>
        </div>

        {/* Signatory */}
        <div className="mt-8 flex justify-end print:mt-10">
          <div className="w-44 text-center text-xs">
            <div className="mb-10 border-b border-border print:mb-12" />
            <p className="font-medium text-foreground">Authorised signatory</p>
            <p className="mt-0.5 text-muted-foreground">For {org.name}</p>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-muted-foreground print:mt-4 print:text-[9px]">
          Thank you for your business · Powered by{' '}
          <a
            href={PRODUCT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline underline-offset-2 print:text-foreground print:no-underline"
          >
            {POWERED_BY_LABEL}
          </a>
        </p>
      </div>
    </article>
  );
}
