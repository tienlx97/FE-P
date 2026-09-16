import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveResultCount, tablePagination } from './table-pagination.js';

test('empty server results stay on page one with a zero range', () => {
  assert.deepEqual(
    tablePagination(
      { pageIndex: 1, pageSize: 25, totalCount: 0, totalPages: 0 },
      0,
    ),
    { currentPage: 1, totalPages: 1, rangeStart: 0, rangeEnd: 0 },
  );
});

test('local filtering to no rows never displays an inverted range', () => {
  assert.deepEqual(
    tablePagination(
      { pageIndex: 2, pageSize: 25, totalCount: 40, totalPages: 2 },
      0,
    ),
    { currentPage: 2, totalPages: 2, rangeStart: 0, rangeEnd: 0 },
  );
});

test('last page range and stale page indexes are bounded', () => {
  assert.deepEqual(
    tablePagination(
      { pageIndex: 7, pageSize: 25, totalCount: 40, totalPages: 2 },
      15,
    ),
    { currentPage: 2, totalPages: 2, rangeStart: 26, rangeEnd: 40 },
  );
});

test('resolveResultCount trusts the server total when nothing narrows further', () => {
  assert.equal(
    resolveResultCount({
      pagination: { totalCount: 34 },
      filteredCount: 25,
      unfilteredCount: 25,
    }),
    34,
  );
});

test('resolveResultCount falls back to the client-filtered count once a client-only filter narrows the page — the 2026-09-17 regression', () => {
  // Before the fix, this always returned pagination.totalCount (34) even
  // though only 5 rows on the already-fetched page actually matched a
  // client-only filter, showing a badge/footer number the table itself
  // visibly contradicted.
  assert.equal(
    resolveResultCount({
      pagination: { totalCount: 34 },
      filteredCount: 5,
      unfilteredCount: 25,
    }),
    5,
  );
});

test('resolveResultCount without pagination just reports the filtered count', () => {
  assert.equal(
    resolveResultCount({
      pagination: undefined,
      filteredCount: 3,
      unfilteredCount: 10,
    }),
    3,
  );
});
