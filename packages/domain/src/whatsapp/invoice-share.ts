/**
 * Build a WhatsApp-ready invoice summary (plain text / wa.me ?text=).
 * Keep concise — WhatsApp URL length limits apply.
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

export function buildWhatsAppInvoiceMessage(input: WhatsAppInvoiceInput): string {
  const lines = input.lines.slice(0, 12).map((l, i) => {
    const label = l.name.length > 40 ? `${l.name.slice(0, 37)}…` : l.name;
    return `${i + 1}. ${label} (${l.sku}) x${l.qty} = ₹${l.lineTotal.toFixed(2)}`;
  });
  const more =
    input.lines.length > 12 ? `\n… +${input.lines.length - 12} more items` : '';

  const parts = [
    `*${input.shopName}*`,
    `Tax Invoice: ${input.invoiceNo}`,
    `Date: ${input.invoiceDate}`,
    `Customer: ${input.customerName}`,
    '',
    'Items:',
    ...lines,
    more,
    '',
    `Taxable: ₹${input.taxable.toFixed(2)}`,
    `CGST: ₹${input.cgst.toFixed(2)}`,
    `SGST: ₹${input.sgst.toFixed(2)}`,
    `*Total: ₹${input.total.toFixed(2)}*`,
    `Payment: ${input.paymentStatus}`,
    '',
    'Thank you for shopping with us.',
  ];

  return parts.filter((p) => p !== null).join('\n').trim();
}

export function buildWhatsAppShareUrl(phone: string | null, message: string): string {
  const text = encodeURIComponent(message);
  if (phone) {
    return `https://wa.me/${phone}?text=${text}`;
  }
  return `https://wa.me/?text=${text}`;
}
