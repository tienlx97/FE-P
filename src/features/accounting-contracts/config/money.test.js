import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  formatVnd,
  percentLabel,
  roundMoney,
  subInstallmentValues,
  valueAfterTax,
} from './money.js';

test('value after tax is value × (1 + tax %)', () => {
  assert.equal(valueAfterTax(100_000_000, 8), 108_000_000);
  assert.equal(valueAfterTax(123.45, 8), 133.33);
  assert.equal(valueAfterTax(undefined, 8), undefined);
});

const contract = { valueBeforeTax: 100_000_000, valueAfterTax: 108_000_000 };
/** @param {Partial<Parameters<typeof subInstallmentValues>[0]>} overrides */
const payment = (overrides) => ({
  kind: /** @type {const} */ ('Percent'),
  percent: 30,
  percentBasis: /** @type {const} */ ('BeforeTax'),
  valueBeforeTax: 999,
  taxRatePercent: 8,
  ...overrides,
});

test('sub-instalment values follow its kind and its own tax rate', () => {
  assert.deepEqual(subInstallmentValues(payment({}), contract), {
    beforeTax: 30_000_000,
    afterTax: 32_400_000,
  });
  assert.deepEqual(
    subInstallmentValues(
      payment({
        kind: 'Quantity',
        valueBeforeTax: 5_000_000,
        taxRatePercent: 10,
      }),
      contract,
    ),
    { beforeTax: 5_000_000, afterTax: 5_500_000 },
  );
});

test('a percent of the value after tax anchors the value after tax', () => {
  assert.deepEqual(
    subInstallmentValues(
      payment({ percent: 15, percentBasis: 'AfterTax' }),
      contract,
    ),
    { beforeTax: 15_000_000, afterTax: 16_200_000 },
  );
  assert.deepEqual(
    subInstallmentValues(
      payment({ percent: 15, percentBasis: 'AfterTax', taxRatePercent: 10 }),
      contract,
    ),
    { beforeTax: 14_727_272.73, afterTax: 16_200_000 },
  );
  assert.deepEqual(
    subInstallmentValues(
      payment({ percent: 33.33, percentBasis: 'AfterTax' }),
      {
        valueBeforeTax: 1000,
        valueAfterTax: 1080,
      },
    ),
    { beforeTax: 333.3, afterTax: 359.96 },
  );
});

test('percent label names the basis', () => {
  assert.equal(
    percentLabel({ kind: 'Percent', percent: 15, percentBasis: 'AfterTax' }),
    '15% sau thuế',
  );
  assert.equal(
    percentLabel({ kind: 'Percent', percent: 30, percentBasis: 'BeforeTax' }),
    '30% trước thuế',
  );
  assert.equal(
    percentLabel({ kind: 'Quantity', percent: null, percentBasis: null }),
    '—',
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
