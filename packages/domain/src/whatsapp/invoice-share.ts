/**
 * Build a WhatsApp-ready invoice summary (plain text / wa.me ?text=).
 * Keep concise — WhatsApp URL length limits apply.
 * Formatting: *bold* works in WhatsApp; keep ASCII separators for all clients.
 */

export function normalizeWhatsAppPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, '');
  if (digits.length === 0) return null;
  // India common forms: 0XXXXXXXXXX, XXXXXXXXXX, 91XXXXXXXXXX
  if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.slice(1);
  }
  if (digits.length === 10) {
    digits = `91${digits}`;
  }
  if (digits.length < 10 || digits.length > 15) return null;
  return digits;
}

export type WhatsAppInvoiceLine = {
  name: string;
  sku: string;
  qty: number;
  lineTotal: number;
};

export type WhatsAppInvoiceInput = {
  shopName: string;
  invoiceNo: string;
  invoiceDate: string;
  customerName: string;
  lines: WhatsAppInvoiceLine[];
  taxable: number;
  cgst: number;
  sgst: number;
  total: number;
  paymentStatus: string;
};

function formatInr(amount: number): string {
  return amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatInvoiceDate(isoOrDate: string): string {
  // Accept YYYY-MM-DD or full ISO
  const day = isoOrDate.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    const d = new Date(`${day}T00:00:00.000Z`);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      });
    }
  }
  return isoOrDate;
}

function paymentLabel(status: string): string {
  const map: Record<string, string> = {
    PAID: 'Paid',
    PARTIAL: 'Partially paid',
    UNPAID: 'Unpaid',
  };
  return map[status] ?? status;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 1))}…`;
}

export function buildWhatsAppInvoiceMessage(input: WhatsAppInvoiceInput): string {
  const MAX_LINES = 12;
  const itemBlocks = input.lines.slice(0, MAX_LINES).map((l, i) => {
    const name = truncate(l.name, 48);
    const sku = truncate(l.sku, 28);
    return [`${i + 1}. ${name}`, `   ${sku}  × ${l.qty}`, `   ₹${formatInr(l.lineTotal)}`].join(
      '\n',
    );
  });
  const more =
    input.lines.length > MAX_LINES
      ? `\n… +${input.lines.length - MAX_LINES} more item${
          input.lines.length - MAX_LINES === 1 ? '' : 's'
        }`
      : '';

  const parts = [
    `*${input.shopName}*`,
    'Tax Invoice',
    '',
    `*${input.invoiceNo}*`,
    `Date: ${formatInvoiceDate(input.invoiceDate)}`,
    `Customer: ${input.customerName}`,
    '',
    '────────',
    '*Items*',
    ...itemBlocks,
    more.trimEnd() ? more.trimStart() : null,
    '────────',
    `Taxable:  ₹${formatInr(input.taxable)}`,
    `CGST:     ₹${formatInr(input.cgst)}`,
    `SGST:     ₹${formatInr(input.sgst)}`,
    '',
    `*Total:   ₹${formatInr(input.total)}*`,
    `Payment: ${paymentLabel(input.paymentStatus)}`,
    '',
    'Thank you for shopping with us.',
  ];

  return parts.filter((p): p is string => p != null && p !== '').join('\n');
}

export function buildWhatsAppShareUrl(phone: string | null, message: string): string {
  const text = encodeURIComponent(message);
  if (phone) {
    return `https://wa.me/${phone}?text=${text}`;
  }
  return `https://wa.me/?text=${text}`;
}
