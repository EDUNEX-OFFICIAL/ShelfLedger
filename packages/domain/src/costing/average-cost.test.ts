import assert from 'node:assert/strict';
import test from 'node:test';
import {
  computeWeightedAverageCost,
  computeLineTax,
  roundMoney,
  distributeBillDiscount,
  financialYearLabel,
  computeRoundOff,
} from './average-cost';

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

test('bill discount distributes proportionally', () => {
  const parts = distributeBillDiscount([100, 300], 40);
  assert.equal(parts[0], 10);
  assert.equal(parts[1], 30);
  assert.equal(roundMoney(parts[0]! + parts[1]!), 40);
});

test('financial year label from April', () => {
  assert.equal(financialYearLabel(new Date('2026-07-28T00:00:00Z'), 4), '2026-27');
  assert.equal(financialYearLabel(new Date('2026-03-15T00:00:00Z'), 4), '2025-26');
});

test('round off within one rupee', () => {
  assert.equal(computeRoundOff(100.4), -0.4);
  assert.equal(computeRoundOff(100.6), 0.4);
});
