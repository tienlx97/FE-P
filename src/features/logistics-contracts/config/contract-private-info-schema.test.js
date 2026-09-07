import assert from 'node:assert/strict';
import test from 'node:test';

import { contractPrivateInfoSchema } from './contract-private-info-schema.js';

function baseCandidate() {
  return {
    boqSentDate: '2026-01-10',
    containerCount: 4,
    costPricePerContainer: 1000,
    quotedPricePerContainer: 1500,
    unitCostLabor: 100,
    unitCostSandblasting: 50,
    unitCostPainting: 60,
    unitCostFactory: 70,
    volumeSale: 10,
    volumeMaterial: 12,
    profit: 2000,
    totalAmountUsd: 6000,
    exchangeRateVnd: 26130,
  };
}

test('accepts a fully populated candidate', () => {
  const result = contractPrivateInfoSchema.safeParse(baseCandidate());
  assert.equal(result.success, true);
});

test('accepts every numeric field left unset', () => {
  const result = contractPrivateInfoSchema.safeParse({ boqSentDate: '' });
  assert.equal(result.success, true);
});

test('rejects a negative container count', () => {
  const result = contractPrivateInfoSchema.safeParse({
    ...baseCandidate(),
    containerCount: -1,
  });
  assert.equal(result.success, false);
});

test('rejects a non-integer container count', () => {
  const result = contractPrivateInfoSchema.safeParse({
    ...baseCandidate(),
    containerCount: 1.5,
  });
  assert.equal(result.success, false);
});

test('rejects a negative unit cost', () => {
  const result = contractPrivateInfoSchema.safeParse({
    ...baseCandidate(),
    unitCostLabor: -100,
  });
  assert.equal(result.success, false);
});

test('accepts a negative profit (a loss)', () => {
  const result = contractPrivateInfoSchema.safeParse({
    ...baseCandidate(),
    profit: -5000,
  });
  assert.equal(result.success, true);
});
