import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  auspiciousHours,
  dailySaying,
  dayCanChi,
  holidayName,
  jdFromDate,
  monthCanChi,
  solarToLunar,
  yearCanChi,
} from './lunar.js';

/** @param {ReturnType<typeof solarToLunar>} lunar */
const short = (lunar) =>
  `${lunar.day}/${lunar.month}/${lunar.year}${lunar.isLeap ? ' nhuận' : ''}`;

test('lunar new year and mid-autumn match published Vietnamese calendars', () => {
  assert.equal(short(solarToLunar(10, 2, 2024)), '1/1/2024');
  assert.equal(short(solarToLunar(29, 1, 2025)), '1/1/2025');
  assert.equal(short(solarToLunar(17, 2, 2026)), '1/1/2026');
  assert.equal(short(solarToLunar(25, 9, 2026)), '15/8/2026');
  assert.equal(short(solarToLunar(5, 10, 2026)), '25/8/2026');
});
test('days before Tết belong to the previous lunar year', () => {
  assert.equal(short(solarToLunar(16, 2, 2026)), '29/12/2025');
});
test('2025 leap sixth month', () => {
  assert.equal(short(solarToLunar(25, 7, 2025)), '1/6/2025 nhuận');
  assert.equal(short(solarToLunar(24, 7, 2025)), '30/6/2025');
});
test('Can Chi of year, month and day', () => {
  assert.equal(yearCanChi(2026), 'Bính Ngọ');
  assert.equal(yearCanChi(2025), 'Ất Tỵ');
  assert.equal(monthCanChi(1, 2026), 'Canh Dần');
  // 2000-01-01 is a Mậu Ngọ day.
  assert.equal(dayCanChi(jdFromDate(1, 1, 2000)), 'Mậu Ngọ');
});
test('six auspicious hours per day, Tý day starts with Tý and Sửu', () => {
  const jd = jdFromDate(1, 1, 2000) + 6; // Tý day
  assert.equal(dayCanChi(jd).endsWith('Tý'), true);
  const hours = auspiciousHours(jd);
  assert.equal(hours.length, 6);
  assert.deepEqual(hours.slice(0, 2), ['Tý (23–1)', 'Sửu (1–3)']);
});
test('solar and lunar observances; leap months have none', () => {
  assert.equal(holidayName(2, 9, solarToLunar(2, 9, 2026)), 'Quốc khánh');
  assert.equal(holidayName(25, 9, solarToLunar(25, 9, 2026)), 'Tết Trung thu');
  assert.equal(holidayName(5, 10, solarToLunar(5, 10, 2026)), null);
  assert.equal(
    holidayName(8, 8, { day: 15, month: 6, year: 2025, isLeap: true, jd: 0 }),
    null,
  );
});
test('saying is stable for a day', () => {
  assert.equal(dailySaying(2461319), dailySaying(2461319));
  assert.equal(typeof dailySaying(0), 'string');
});
