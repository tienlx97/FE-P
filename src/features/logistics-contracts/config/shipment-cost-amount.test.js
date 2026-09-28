import assert from 'node:assert/strict';
import test from 'node:test';

import { costLineTotal, costUnitPrice } from './shipment-cost-amount.js';

test('legacy costs retain their amount; quantity calculates a new line total', () => {
  assert.equal(costUnitPrice({ amount: 1_000_000 }), 1_000_000);
  assert.equal(costUnitPrice({ amount: 600_000, quantity: 3 }), 200_000);
  assert.equal(costLineTotal(3, 200_000), 600_000);
  assert.equal(costLineTotal(undefined, 200_000), undefined);
});
