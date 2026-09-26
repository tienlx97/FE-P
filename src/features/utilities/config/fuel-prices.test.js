import assert from 'node:assert/strict';
import test from 'node:test';

import {
  formatFuelPrice,
  formatPeriodDate,
  formatPriceChange,
  productsIn,
  sliceRange,
  toPriceRows,
} from './fuel-prices.js';

/**
 * @param {string} effectiveDate
 * @param {Array<[string, number]>} prices
 */
function period(effectiveDate, prices) {
  return {
    id: effectiveDate,
    market: 'VN',
    effectiveDate,
    source: 'manual',
    updatedAtUtc: '',
    items: prices.map(([productCode, price]) => ({
      productCode,
      productName: `name ${productCode}`,
      price,
    })),
  };
}

const PERIODS = [
  period('2026-09-24', [
    ['E10_RON95_III', 27080],
    ['KEROSENE_2K', 30020],
  ]),
  period('2026-09-10', [
    ['E10_RON95_III', 24230],
    ['ZZ', 1],
  ]),
  period('2026-09-17', [['E10_RON95_III', 25630]]),
];

test('toPriceRows sorts oldest first and diffs each product vs its last price', () => {
  const rows = toPriceRows(PERIODS);
  assert.deepEqual(
    rows.map((row) => row.label),
    ['10/09/2026', '17/09/2026', '24/09/2026'],
  );
  assert.equal(rows[0].changes.E10_RON95_III, undefined);
  assert.equal(rows[1].changes.E10_RON95_III, 25630 - 24230);
  assert.equal(rows[2].changes.E10_RON95_III, 27080 - 25630);
  // First time kerosene is priced → no change.
  assert.equal(rows[2].changes.KEROSENE_2K, undefined);
  assert.equal(rows[2].E10_RON95_III, 27080);
});

test('productsIn keeps known order, then unknown codes', () => {
  assert.deepEqual(
    productsIn(PERIODS).map((product) => product.code),
    ['E10_RON95_III', 'KEROSENE_2K', 'ZZ'],
  );
});

test('sliceRange keeps the last n rows', () => {
  assert.deepEqual(sliceRange([1, 2, 3], '2'), [2, 3]);
  assert.deepEqual(sliceRange([1, 2, 3], 'all'), [1, 2, 3]);
});

test('formats prices, changes and dates', () => {
  assert.equal(formatPeriodDate('2026-09-03'), '03/09/2026');
  assert.equal(formatFuelPrice(27080), '27.080');
  assert.equal(formatPriceChange(1450), '+1.450');
  assert.equal(formatPriceChange(-1450), '−1.450');
  assert.equal(formatPriceChange(0), '0');
});
