import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isConfirmableMilestone,
  isSellerScopeDone,
  packingDateRange,
} from './shipment-journey.js';

test('handover, load, discharge, clearance and site delivery are confirmed by hand', () => {
  assert.equal(isConfirmableMilestone('ExwHandover'), true);
  assert.equal(isConfirmableMilestone('OnBoard'), true);
  assert.equal(isConfirmableMilestone('Discharged'), true);
  assert.equal(isConfirmableMilestone('ImportClearance'), true);
  assert.equal(isConfirmableMilestone('Site'), true);
  for (const milestone of /** @type {const} */ ([
    'CargoReady',
    'OriginPort',
    'Ocean',
    'DestinationPort',
    'EmptyReturn',
  ])) {
    assert.equal(isConfirmableMilestone(milestone), false, milestone);
  }
});

/**
 * @param {import('../types/index.js').ShipmentMilestone} milestone
 * @param {'Seller' | 'Buyer'} scope
 * @param {'Done' | 'Current' | 'Upcoming'} state
 */
function step(milestone, scope, state) {
  return { milestone, label: milestone, scope, marker: null, state, completedOn: null, isConfirmed: false, note: null };
}

test('seller scope is done once every seller step is', () => {
  const fobCompleted = {
    steps: [step('OnBoard', 'Seller', 'Done'), step('Ocean', 'Buyer', 'Upcoming')],
    emptyReturn: null,
  };
  assert.equal(isSellerScopeDone(fobCompleted), true);

  const cifNoContainer = {
    steps: [step('DestinationPort', 'Seller', 'Done'), step('EmptyReturn', 'Seller', 'Upcoming')],
    emptyReturn: { containerCount: 0, returnedCount: 0, deadline: null, lastReturnedOn: null, overdueDays: 0, isComplete: false },
  };
  assert.equal(isSellerScopeDone(cifNoContainer), true);

  const cifContainersOut = {
    steps: [step('DestinationPort', 'Seller', 'Done'), step('EmptyReturn', 'Seller', 'Current')],
    emptyReturn: { containerCount: 2, returnedCount: 1, deadline: null, lastReturnedOn: null, overdueDays: 0, isComplete: false },
  };
  assert.equal(isSellerScopeDone(cifContainersOut), false);
  assert.equal(
    isSellerScopeDone({ steps: [step('Ocean', 'Buyer', 'Current')], emptyReturn: null }),
    false,
    'a current step means not done',
  );
});

test('packing range spans the first to the last container date', () => {
  assert.deepEqual(
    packingDateRange([
      { packingDate: '2026-10-14' },
      { packingDate: '2026-10-10' },
      { packingDate: '' },
      { packingDate: '2026-10-12' },
    ]),
    { from: '2026-10-10', to: '2026-10-14' },
  );
  assert.deepEqual(packingDateRange([{ packingDate: '2026-10-10' }]), {
    from: '2026-10-10',
    to: '2026-10-10',
  });
  assert.equal(packingDateRange([]), null);
});
