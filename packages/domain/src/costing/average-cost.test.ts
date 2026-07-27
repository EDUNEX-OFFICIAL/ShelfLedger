import assert from 'node:assert/strict';
import test from 'node:test';
import { computeWeightedAverageCost, computeLineTax, roundMoney } from './average-cost';

test('weighted average from zero stock', () => {
  const avg = computeWeightedAverageCost({
    oldQty: 0,
    oldAvg: 0,
    inQty: 10,
    inRate: 100,
  });
  assert.equal(avg, 100);
});

test('weighted average mixes inbound', () => {
  const avg = computeWeightedAverageCost({
    oldQty: 10,
    oldAvg: 100,
    inQty: 10,
    inRate: 200,
  });
  assert.equal(avg, 150);
});

test('cgst+sgst line tax', () => {
  const tax = computeLineTax({ taxableAmount: 1000, cgstRate: 9, sgstRate: 9 });
  assert.equal(tax.cgstAmount, 90);
  assert.equal(tax.sgstAmount, 90);
  assert.equal(tax.igstAmount, 0);
  assert.equal(tax.taxAmount, 180);
});

test('roundMoney', () => {
  assert.equal(roundMoney(10.005), 10.01);
});
