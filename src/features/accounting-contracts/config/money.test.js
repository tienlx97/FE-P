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
  valueBeforeTax: /** @type {number | undefined} */ (undefined),
  valueAfterTax: /** @type {number | undefined} */ (undefined),
  taxRatePercent: 8,
  ...overrides,
});
/** @param {ReturnType<typeof subInstallmentValues>} values */
const effective = ({ beforeTax, afterTax }) => ({ beforeTax, afterTax });

test('sub-instalment values follow its kind and its own tax rate', () => {
  assert.deepEqual(effective(subInstallmentValues(payment({}), contract)), {
    beforeTax: 30_000_000,
    afterTax: 32_400_000,
  });
  assert.deepEqual(
    effective(
      subInstallmentValues(
        payment({
          kind: 'Quantity',
          valueBeforeTax: 5_000_000,
          taxRatePercent: 10,
        }),
        contract,
      ),
    ),
    { beforeTax: 5_000_000, afterTax: 5_500_000 },
  );
});

test('a percent of the value after tax anchors the value after tax', () => {
  assert.deepEqual(
    effective(
      subInstallmentValues(
        payment({ percent: 15, percentBasis: 'AfterTax' }),
        contract,
      ),
    ),
    { beforeTax: 15_000_000, afterTax: 16_200_000 },
  );
  assert.deepEqual(
    effective(
      subInstallmentValues(
        payment({ percent: 15, percentBasis: 'AfterTax', taxRatePercent: 10 }),
        contract,
      ),
    ),
    { beforeTax: 14_727_272.73, afterTax: 16_200_000 },
  );
  assert.deepEqual(
    effective(
      subInstallmentValues(
        payment({ percent: 33.33, percentBasis: 'AfterTax' }),
        {
          valueBeforeTax: 1000,
          valueAfterTax: 1080,
        },
      ),
    ),
    { beforeTax: 333.3, afterTax: 359.96 },
  );
});

test('a typed value wins and feeds the other one; auto keeps the computed value', () => {
  // 123,456.78 rounded by hand to 123,457 after tax.
  const typedAfter = subInstallmentValues(
    payment({ valueAfterTax: 32_400_001 }),
    contract,
  );
  assert.deepEqual(typedAfter, {
    beforeTax: 30_000_000,
    afterTax: 32_400_001,
    auto: { beforeTax: 30_000_000, afterTax: 32_400_000 },
  });
  // A typed value before tax gives the value after tax at the payment's rate.
  assert.deepEqual(
    subInstallmentValues(payment({ valueBeforeTax: 30_000_000.4 }), contract),
    {
      beforeTax: 30_000_000.4,
      afterTax: 32_400_000.43,
      auto: { beforeTax: 30_000_000, afterTax: 32_400_000.43 },
    },
  );
  // After tax basis: a typed value after tax gives the value before tax.
  assert.deepEqual(
    subInstallmentValues(
      payment({
        percent: 15,
        percentBasis: 'AfterTax',
        valueAfterTax: 16_200_108,
      }),
      contract,
    ),
    {
      beforeTax: 15_000_100,
      afterTax: 16_200_108,
      auto: { beforeTax: 15_000_100, afterTax: 16_200_000 },
    },
  );
  assert.deepEqual(
    subInstallmentValues(
      payment({
        kind: 'Quantity',
        valueBeforeTax: 114_311.83,
        valueAfterTax: 123_457,
      }),
      contract,
    ),
    {
      beforeTax: 114_311.83,
      afterTax: 123_457,
      auto: { beforeTax: undefined, afterTax: 123_456.78 },
    },
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
