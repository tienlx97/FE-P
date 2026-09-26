import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isConfirmableMilestone,
  packingDateRange,
} from './shipment-journey.js';

test('only import clearance and site delivery are confirmed by hand', () => {
  assert.equal(isConfirmableMilestone('ImportClearance'), true);
  assert.equal(isConfirmableMilestone('Site'), true);
  for (const milestone of /** @type {const} */ ([
    'CargoReady',
    'OriginPort',
    'OnBoard',
    'Ocean',
    'DestinationPort',
    'EmptyReturn',
  ])) {
    assert.equal(isConfirmableMilestone(milestone), false, milestone);
  }
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
