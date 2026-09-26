import assert from 'node:assert/strict';
import test from 'node:test';

import {
  formatFuelPrice,
  formatPeriodDate,
  formatPriceChange,
  productsIn,
  productStatuses,
  toPriceRows,
  weekdayLabel,
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

test('formats prices, changes and dates', () => {
  assert.equal(formatPeriodDate('2026-09-03'), '03/09/2026');
  assert.equal(formatFuelPrice(27080), '27.080');
  assert.equal(formatPriceChange(1450), '+1.450');
  assert.equal(formatPriceChange(-1450), '−1.450');
  assert.equal(formatPriceChange(0), '0');
});

test('productStatuses splits still-sold products from stopped ones', () => {
  const rows = toPriceRows([
    period('2026-05-21', [
      ['RON95_III', 25540],
      ['E5_RON92_II', 24340],
    ]),
    period('2026-05-28', [
      ['RON95_III', 24150],
      ['E5_RON92_II', 23250],
    ]),
    period('2026-06-04', [['E5_RON92_II', 21780]]),
    period('2026-06-11', [
      ['E5_RON92_II', 21330],
      ['E10_RON95_III', 22060],
    ]),
  ]);
  const { active, stopped } = productStatuses(rows, [
    { code: 'E10_RON95_III', label: 'E10' },
    { code: 'RON95_III', label: 'RON 95-III' },
    { code: 'E5_RON92_II', label: 'E5' },
  ]);
  assert.deepEqual(
    active.map((status) => [
      status.code,
      status.price,
      status.change,
      status.previousOn,
    ]),
    [
      ['E10_RON95_III', 22060, undefined, undefined],
      ['E5_RON92_II', 21330, -450, '2026-06-04'],
    ],
  );
  assert.deepEqual(
    stopped.map((status) => [
      status.code,
      status.price,
      status.pricedOn,
      status.stoppedFrom,
    ]),
    [['RON95_III', 24150, '2026-05-28', '2026-06-04']],
  );
});

test('weekdayLabel', () => {
  assert.equal(weekdayLabel('2026-09-24'), 'Thứ 5');
  assert.equal(weekdayLabel('2026-09-27'), 'CN');
});
