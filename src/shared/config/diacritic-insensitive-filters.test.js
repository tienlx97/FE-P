import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applyFiltersDiacriticInsensitive,
  normalizeForSearch,
} from './diacritic-insensitive-filters.js';

/**
 * Stand-in for Astryx's real `applyFilters` (from `usePowerSearchConfig`):
 * a `contains` filter does a plain case-sensitive substring match, an `is`
 * filter does a plain exact match — no normalization of its own, matching
 * the doc comment's description of Astryx's real `matchesFilter`.
 * @param {readonly any[]} filters
 * @param {any[]} rows
 */
function stubApplyFilters(filters, rows) {
  return rows.filter((row) =>
    filters.every((filter) => {
      const rowValue = row[filter.field];
      if (filter.operator === 'contains') {
        return String(rowValue).includes(String(filter.value.value));
      }
      if (filter.operator === 'is') {
        return rowValue === filter.value.value;
      }
      throw new Error(`unhandled operator in stub: ${filter.operator}`);
    }),
  );
}

test('normalizeForSearch strips Vietnamese diacritics and lowercases, including đ', () => {
  assert.equal(normalizeForSearch('Khách hàng'), 'khach hang');
  assert.equal(normalizeForSearch('Đại Nghĩa'), 'dai nghia');
});

test('no filters returns a shallow copy of the rows, untouched', () => {
  const rows = [{ id: 1 }];
  const result = applyFiltersDiacriticInsensitive(stubApplyFilters, [], rows);
  assert.deepEqual(result, rows);
  assert.notEqual(result, rows);
});

test('a string "contains" filter still matches without dấu (the original diacritic fix)', () => {
  const rows = [
    { id: 1, buyerCompanyName: 'Khách hàng ABC' },
    { id: 2, buyerCompanyName: 'Someone else' },
  ];
  const filters = [
    {
      field: 'buyerCompanyName',
      operator: 'contains',
      value: { type: 'string', value: 'khach hang' },
    },
  ];
  const result = applyFiltersDiacriticInsensitive(
    stubApplyFilters,
    filters,
    rows,
  );
  assert.deepEqual(result, [rows[0]]);
});

test('an enum "is" filter matches its exact-case value — the 2026-09-16 regression', () => {
  // Before the fix, every string row field (including buyerCompanyName)
  // was normalized unconditionally, so this exact-case enum comparison
  // against a lowercased row value never matched anything.
  const rows = [
    { id: 1, buyerCompanyName: 'CG FRAME CO., LTD' },
    { id: 2, buyerCompanyName: 'TF CO., LTD' },
  ];
  const filters = [
    {
      field: 'buyerCompanyName',
      operator: 'is',
      value: { type: 'enum', value: 'CG FRAME CO., LTD' },
    },
  ];
  const result = applyFiltersDiacriticInsensitive(
    stubApplyFilters,
    filters,
    rows,
  );
  assert.deepEqual(result, [rows[0]]);
});

test('a string filter on one field and an enum filter on another combine correctly', () => {
  const rows = [
    {
      id: 1,
      buyerCompanyName: 'CG FRAME CO., LTD',
      projectName: 'Dự án Vsip',
    },
    {
      id: 2,
      buyerCompanyName: 'CG FRAME CO., LTD',
      projectName: 'Something unrelated',
    },
  ];
  const filters = [
    {
      field: 'buyerCompanyName',
      operator: 'is',
      value: { type: 'enum', value: 'CG FRAME CO., LTD' },
    },
    {
      field: 'projectName',
      operator: 'contains',
      value: { type: 'string', value: 'du an' },
    },
  ];
  const result = applyFiltersDiacriticInsensitive(
    stubApplyFilters,
    filters,
    rows,
  );
  assert.deepEqual(result, [rows[0]]);
});

test('non-string row fields (numbers, null) pass through untouched', () => {
  const rows = [{ id: 1, count: 5, note: null, label: 'Đơn vị' }];
  const filters = [
    {
      field: 'label',
      operator: 'is',
      value: { type: 'enum', value: 'Đơn vị' },
    },
  ];
  const result = applyFiltersDiacriticInsensitive(
    stubApplyFilters,
    filters,
    rows,
  );
  assert.deepEqual(result, rows);
});
