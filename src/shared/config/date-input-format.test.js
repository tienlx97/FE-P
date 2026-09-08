import assert from 'node:assert/strict';
import test from 'node:test';

import { formatDateInputValue } from './date-input-format.js';

test('formats an ISO date as dd/mm/yyyy', () => {
  assert.equal(formatDateInputValue('2026-03-21'), '21/03/2026');
});

test('preserves zero-padding for single-digit day/month', () => {
  assert.equal(formatDateInputValue('2026-01-05'), '05/01/2026');
});
