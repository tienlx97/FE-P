import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  formatVnd,
  roundMoney,
  subInstallmentValues,
  valueAfterTax,
} from './money.js';

test('value after tax is value × (1 + tax %)', () => {
  assert.equal(valueAfterTax(100_000_000, 8), 108_000_000);
  assert.equal(valueAfterTax(123.45, 8), 133.33);
  assert.equal(valueAfterTax(undefined, 8), undefined);
});

test('sub-instalment values follow its kind and its own tax rate', () => {
  assert.deepEqual(subInstallmentValues('Percent', 30, 999, 8, 100_000_000), {
    beforeTax: 30_000_000,
    afterTax: 32_400_000,
  });
  assert.deepEqual(
    subInstallmentValues('Quantity', 30, 5_000_000, 10, 100_000_000),
    { beforeTax: 5_000_000, afterTax: 5_500_000 },
  );
});

test('money rounds half away from zero and formats with comma groups and decimal point', () => {
  assert.equal(roundMoney(0.125), 0.13);
  assert.equal(formatVnd(108000000), '108,000,000');
  assert.equal(formatVnd(123456.78), '123,456.78');
  assert.equal(formatVnd(0), '0');
  assert.equal(formatVnd(-123456.78), '-123,456.78');
  assert.equal(formatVnd(undefined), '—');
  assert.equal(formatVnd(null), '—');
});
