'use client';

import { useMemo, useState } from 'react';
import { Copy, Printer } from 'lucide-react';
import {
  buildWhatsAppInvoiceMessage,
  buildWhatsAppShareUrl,
  normalizeWhatsAppPhone,
} from '@shelfledger/domain';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';

export type WhatsAppShareInvoice = {
  shopName: string;
  invoiceNo: string;
  invoiceDate: string;
  customerName: string;
  customerPhone: string | null;
  lines: Array<{ name: string; sku: string; qty: number; lineTotal: number }>;
  taxable: number;
  cgst: number;
  sgst: number;
  total: number;
  paymentStatus: string;
};

export function InvoiceActions({ invoice }: { invoice: WhatsAppShareInvoice }) {
  const [phone, setPhone] = useState(invoice.customerPhone ?? '');
  const [copied, setCopied] = useState(false);

  const message = useMemo(
    () =>
      buildWhatsAppInvoiceMessage({
        shopName: invoice.shopName,
        invoiceNo: invoice.invoiceNo,
        invoiceDate: invoice.invoiceDate,
        customerName: invoice.customerName,
        lines: invoice.lines,
        taxable: invoice.taxable,
        cgst: invoice.cgst,
        sgst: invoice.sgst,
        total: invoice.total,
        paymentStatus: invoice.paymentStatus,
      }),
    [invoice],
  );

  const normalized = normalizeWhatsAppPhone(phone);

  return (
    <div className="print:hidden">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-[10rem] flex-1 space-y-1">
          <Label htmlFor="wa-phone" className="text-xs text-muted-foreground">
            WhatsApp number
          </Label>
          <Input
            id="wa-phone"
            className="h-9"
            placeholder="9876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            autoComplete="tel"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => {
              const url = buildWhatsAppShareUrl(normalized, message);
              window.open(url, '_blank', 'noopener,noreferrer');
            }}
          >
            <WhatsAppIcon className="h-3.5 w-3.5" />
            WhatsApp
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(message);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 2000);
              } catch {
                setCopied(false);
              }
            }}
          >
            <Copy className="h-3.5 w-3.5" aria-hidden />
            {copied ? 'Copied' : 'Copy text'}
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" aria-hidden />
            Print / PDF
          </Button>
        </div>
      </div>
      {!phone.trim() ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Leave number blank to open WhatsApp contact picker.
        </p>
      ) : !normalized ? (
        <p className="mt-2 text-xs text-destructive">Check phone format (10-digit Indian mobile).</p>
      ) : null}
    </div>
  );
}

/** @deprecated Prefer InvoiceActions */
export function WhatsAppShareButton({ invoice }: { invoice: WhatsAppShareInvoice }) {
  return <InvoiceActions invoice={invoice} />;
}
