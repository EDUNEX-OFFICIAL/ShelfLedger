import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalizeWhatsAppPhone,
  buildWhatsAppInvoiceMessage,
  buildWhatsAppShareUrl,
} from './invoice-share';

test('normalizeWhatsAppPhone India 10-digit', () => {
  assert.equal(normalizeWhatsAppPhone('9876543210'), '919876543210');
  assert.equal(normalizeWhatsAppPhone('09876543210'), '919876543210');
  assert.equal(normalizeWhatsAppPhone('+91 98765 43210'), '919876543210');
});

test('buildWhatsAppInvoiceMessage structured GST summary', () => {
  const msg = buildWhatsAppInvoiceMessage({
    shopName: 'IR Footwear',
    invoiceNo: 'INV-2026-27-0006',
    invoiceDate: '2026-07-28',
    customerName: 'test',
    lines: [
      { name: 'Report Fixture', sku: 'RPT-1785211847998', qty: 1, lineTotal: 1050 },
    ],
    taxable: 1000,
    cgst: 25,
    sgst: 25,
    total: 1050,
    paymentStatus: 'PAID',
  });

  assert.match(msg, /\*IR Footwear\*/);
  assert.match(msg, /Tax Invoice/);
  assert.match(msg, /\*INV-2026-27-0006\*/);
  assert.match(msg, /Date: 28 Jul 2026/);
  assert.match(msg, /Customer: test/);
  assert.match(msg, /\*Items\*/);
  assert.match(msg, /Report Fixture/);
  assert.match(msg, /RPT-1785211847998/);
  assert.match(msg, /Taxable: {2}₹1,000\.00/);
  assert.match(msg, /CGST: {5}₹25\.00/);
  assert.match(msg, /\*Total: {3}₹1,050\.00\*/);
  assert.match(msg, /Payment: Paid/);
  assert.match(msg, /Thank you for shopping with us\./);
  assert.doesNotMatch(msg, /Payment: PAID/);
});

test('buildWhatsAppShareUrl with phone', () => {
  const url = buildWhatsAppShareUrl('919876543210', 'Hello');
  assert.equal(url, 'https://wa.me/919876543210?text=Hello');
});
