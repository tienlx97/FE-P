import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  holidayName,
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
test('Can Chi of the lunar year', () => {
  assert.equal(yearCanChi(2026), 'Bính Ngọ');
  assert.equal(yearCanChi(2025), 'Ất Tỵ');
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
