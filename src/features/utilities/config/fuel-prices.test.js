import assert from 'node:assert/strict';
import test from 'node:test';

import {
  formatFuelPrice,
  formatPeriodDate,
  formatPriceChange,
  FUEL_PRICE_PERIODS,
  withPriceChanges,
} from './fuel-prices.js';

test('periods are oldest first with unique dates', () => {
  const dates = FUEL_PRICE_PERIODS.map((period) => period.date);
  assert.deepEqual([...dates].sort(), dates);
  assert.equal(new Set(dates).size, dates.length);
});

test('withPriceChanges computes the change from the previous period', () => {
  const rows = withPriceChanges(FUEL_PRICE_PERIODS);
  assert.equal(rows[0].changes.e10Ron95, undefined);
  const last = rows[rows.length - 1];
  assert.equal(last.label, '24/09/2026');
  assert.equal(last.changes.e10Ron95, 27080 - 25630);
  assert.equal(last.changes.kerosene, 30020 - 31470);
});

test('formats prices, changes and dates', () => {
  assert.equal(formatPeriodDate('2026-09-03'), '03/09/2026');
  assert.equal(formatFuelPrice(27080), '27.080');
  assert.equal(formatPriceChange(1450), '+1.450');
  assert.equal(formatPriceChange(-1450), '−1.450');
  assert.equal(formatPriceChange(0), '0');
});
