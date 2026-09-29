import assert from 'node:assert/strict';
import test from 'node:test';

import { restoreOutcome } from './restore-status.js';

/** @param {Partial<import('../types/index.js').RestoreStatus>} overrides */
const status = (overrides) => ({
  state: /** @type {const} */ ('Running'),
  restoreId: 'abc',
  startedAtUtc: '2026-09-29T10:00:00Z',
  finishedAtUtc: null,
  message: null,
  ...overrides,
});

test('restoreOutcome follows only the restore it started', () => {
  assert.equal(restoreOutcome(status({}), 'abc'), 'running');
  assert.equal(restoreOutcome(status({ state: 'Succeeded' }), 'abc'), 'succeeded');
  assert.equal(restoreOutcome(status({ state: 'Failed' }), 'abc'), 'failed');
  assert.equal(restoreOutcome(status({ state: 'Succeeded', restoreId: 'older' }), 'abc'), 'running', 'an older restore is not ours');
  assert.equal(restoreOutcome(status({ state: 'None', restoreId: null }), 'abc'), 'running');
  assert.equal(restoreOutcome(null, 'abc'), 'running', 'status not read yet (network blip)');
});
