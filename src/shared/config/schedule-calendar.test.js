import assert from 'node:assert/strict';
import test from 'node:test';

import {
  addDays,
  addMonths,
  dayOverflow,
  dayRange,
  groupByDay,
  monthTitle,
  monthWeeks,
  rangeTitle,
  rowsThatFit,
  startOfWeek,
  weekdayLabel,
} from './schedule-calendar.js';

test('day and month arithmetic crosses month and year ends', () => {
  assert.equal(addDays('2026-09-30', 1), '2026-10-01');
  assert.equal(addDays('2026-01-01', -1), '2025-12-31');
  assert.equal(addMonths('2026-12-15', 1), '2027-01-01');
  assert.equal(addMonths('2026-03-31', -1), '2026-02-01');
});

test('weeks start on Monday', () => {
  assert.equal(startOfWeek('2026-09-27'), '2026-09-21'); // Sunday
  assert.equal(startOfWeek('2026-09-28'), '2026-09-28'); // Monday
  assert.equal(weekdayLabel('2026-09-27'), 'CN');
  assert.equal(weekdayLabel('2026-09-28'), 'T2');
});

test('a month grid covers the whole month in full weeks', () => {
  const september = monthWeeks('2026-09-27');
  assert.equal(september.length, 5);
  assert.deepEqual([september[0][0], september.at(-1)?.at(-1)], ['2026-08-31', '2026-10-04']);
  assert.equal(monthWeeks('2027-02-10').length, 4); // Feb 2027: 28 days from a Monday
  assert.equal(monthWeeks('2026-08-01').length, 6);
});

test('titles and ranges read in Vietnamese', () => {
  assert.equal(monthTitle('2026-09-27'), 'Tháng 9, 2026');
  assert.equal(rangeTitle('2026-09-27', '2026-10-10'), '27/09 – 10/10/2026');
  assert.deepEqual(dayRange('2026-09-30', 3), ['2026-09-30', '2026-10-01', '2026-10-02']);
});

test('items group by day in order', () => {
  const byDay = groupByDay([
    { date: '2026-10-01', id: 'a' },
    { date: '2026-10-02', id: 'b' },
    { date: '2026-10-01', id: 'c' },
  ]);
  assert.deepEqual(byDay.get('2026-10-01')?.map((item) => item.id), ['a', 'c']);
  assert.equal(byDay.get('2026-10-03'), undefined);
});

test('rowsThatFit: rows as tall as the day number under it, gap apart', () => {
  // 24 px rows, 4 px gap: 24 (day) + 3 × 28 = 108.
  assert.equal(rowsThatFit({ available: 108, rowHeight: 24, gap: 4 }), 3);
  assert.equal(rowsThatFit({ available: 107, rowHeight: 24, gap: 4 }), 2);
  assert.equal(rowsThatFit({ available: 20, rowHeight: 24, gap: 4 }), 0);
  assert.equal(rowsThatFit({ available: 0, rowHeight: 0, gap: 4 }), 0);
});

test('dayOverflow shows all that fit, else one row less and "+n mục"', () => {
  assert.deepEqual(dayOverflow(3, 3), { shown: 3, hidden: 0 });
  assert.deepEqual(dayOverflow(5, 3), { shown: 2, hidden: 3 });
  assert.deepEqual(dayOverflow(2, 0), { shown: 0, hidden: 2 });
  assert.deepEqual(dayOverflow(0, 0), { shown: 0, hidden: 0 });
});
