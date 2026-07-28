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

test('buildWhatsAppInvoiceMessage includes totals', () => {
  const msg = buildWhatsAppInvoiceMessage({
    shopName: 'Demo Store',
    invoiceNo: 'INV-1',
    invoiceDate: '2026-07-28',
    customerName: 'Walk-in',
    lines: [{ name: 'Shoe', sku: 'S1', qty: 1, lineTotal: 1180 }],
    taxable: 1000,
    cgst: 90,
    sgst: 90,
    total: 1180,
    paymentStatus: 'PAID',
  });
  assert.match(msg, /INV-1/);
  assert.match(msg, /Total: ₹1180\.00/);
  assert.match(msg, /CGST/);
});

test('buildWhatsAppShareUrl with phone', () => {
  const url = buildWhatsAppShareUrl('919876543210', 'Hello');
  assert.equal(url, 'https://wa.me/919876543210?text=Hello');
});
