import assert from 'node:assert/strict';
import test from 'node:test';

import {
  addDays,
  addMonths,
  dayRange,
  groupByDay,
  monthTitle,
  monthWeeks,
  rangeTitle,
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
