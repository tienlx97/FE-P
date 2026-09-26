import assert from 'node:assert/strict';
import test from 'node:test';

import {
  formatAxisTime,
  isoToTime,
  presetRange,
  rowsInRange,
  timeToIso,
} from './fuel-chart-range.js';

test('presetRange counts back from the latest period, clamped to the first', () => {
  assert.deepEqual(presetRange('3m', '2025-12-31', '2026-09-24'), {
    start: '2026-06-24',
    end: '2026-09-24',
  });
  assert.deepEqual(presetRange('ytd', '2025-12-31', '2026-09-24'), {
    start: '2026-01-01',
    end: '2026-09-24',
  });
  assert.deepEqual(presetRange('12m', '2025-12-31', '2026-09-24'), {
    start: '2025-12-31',
    end: '2026-09-24',
  });
  assert.deepEqual(presetRange('all', '2025-12-31', '2026-09-24'), {
    start: '2025-12-31',
    end: '2026-09-24',
  });
});

/** @param {string} date @param {number} price */
function row(date, price) {
  return {
    date,
    label: date,
    source: 'x',
    prices: { A: price },
    changes: { A: 1 },
    A: price,
  };
}

test('rowsInRange carries the price in effect at the range start', () => {
  const rows = [
    row('2026-01-01', 10),
    row('2026-01-08', 11),
    row('2026-01-15', 12),
  ];
  const result = rowsInRange(rows, { start: '2026-01-05', end: '2026-01-10' });
  assert.deepEqual(
    result.map((item) => [item.date, item.A, item.carriedFrom]),
    [
      ['2026-01-05', 10, '2026-01-01'],
      ['2026-01-08', 11, undefined],
    ],
  );
  assert.deepEqual(result[0].changes, {});
  // Starting exactly on a period: no carried point.
  assert.equal(
    rowsInRange(rows, { start: '2026-01-08', end: '2026-01-15' }).length,
    2,
  );
});

test('time helpers round-trip and pick the tick format by span', () => {
  assert.equal(timeToIso(isoToTime('2026-03-07')), '2026-03-07');
  const day = 24 * 60 * 60 * 1000;
  assert.equal(formatAxisTime(isoToTime('2026-03-07'), 90 * day), '07/03');
  assert.equal(formatAxisTime(isoToTime('2026-03-07'), 700 * day), '03/2026');
});
