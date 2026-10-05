import assert from 'node:assert/strict';
import { test } from 'node:test';

import { goldMillions } from './gold.js';

test('gold widget displays millions per lượng without unit error or lost precision', () => {
  assert.equal(goldMillions(143_500_000), '143,50');
  assert.equal(goldMillions(140_501_000), '140,501');
});
