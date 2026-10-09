import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  formatVnd,
  roundMoney,
  subInstallmentAmount,
  valueAfterTax,
} from './money.js';

test('value after tax is value × (1 + tax %)', () => {
  assert.equal(valueAfterTax(100_000_000, 8), 108_000_000);
  assert.equal(valueAfterTax(123.45, 8), 133.33);
  assert.equal(valueAfterTax(undefined, 8), undefined);
});

test('sub-instalment amount follows its kind', () => {
  assert.equal(
    subInstallmentAmount('Percent', 30, 999, 108_000_000),
    32_400_000,
  );
  assert.equal(
    subInstallmentAmount('Quantity', 30, 5_000_000, 108_000_000),
    5_000_000,
  );
});

test('money rounds half away from zero and formats in vi-VN', () => {
  assert.equal(roundMoney(0.125), 0.13);
  assert.equal(formatVnd(108000000), '108.000.000');
  assert.equal(formatVnd(null), '—');
});
