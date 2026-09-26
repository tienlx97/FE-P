import assert from 'node:assert/strict';
import test from 'node:test';

import { summarizeShipmentVgms } from './shipment-vgm-summary.js';

/** @param {Partial<import('../types/index.js').ShipmentVgm>} overrides */
function vgm(overrides) {
  return /** @type {import('../types/index.js').ShipmentVgm} */ ({
    id: 'v',
    containerType: 'Size20',
    sealNumber: 'S1',
    maxGross: 24000,
    tare: 2200,
    grossWeight: 22000,
    vgm: 24200,
    ...overrides,
  });
}

test('sums weights and counts container types, largest group first', () => {
  const summary = summarizeShipmentVgms(
    [
      vgm({ containerType: 'Size20' }),
      vgm({ containerType: 'Size40HC', maxGross: 32500, vgm: 28512.5 }),
      vgm({ containerType: 'Size40HC', sealNumber: ' ' }),
    ],
    { quantityAmount: 4, quantityUnit: 'Cont' },
  );

  assert.equal(summary.containerCount, 3);
  assert.deepEqual(summary.typeCounts, [
    { type: 'Size40HC', count: 2 },
    { type: 'Size20', count: 1 },
  ]);
  assert.equal(summary.sealCount, 2);
  assert.equal(summary.maxGross, 80500);
  assert.equal(summary.vgm, 76912.5);
  assert.equal(summary.plannedContainerCount, 4);
  assert.equal(summary.declaredRatio, 0.75);
});

test('containers without VGM count as undeclared and add no weight', () => {
  const summary = summarizeShipmentVgms(
    [
      vgm({}),
      vgm({
        sealNumber: null, maxGross: null, tare: null, grossWeight: null, vgm: null,
      }),
    ],
    { quantityAmount: 2, quantityUnit: 'Cont' },
  );
  assert.equal(summary.containerCount, 2);
  assert.equal(summary.sealCount, 1);
  assert.equal(summary.vgm, 24200);
  assert.equal(summary.declaredCount, 1);
  assert.equal(summary.declaredRatio, 0.5);
});

test('declared ratio needs a container plan and ignores zero VGM', () => {
  const lcl = summarizeShipmentVgms([vgm({})], {
    quantityAmount: 12,
    quantityUnit: 'Kien',
  });
  assert.equal(lcl.plannedContainerCount, null);
  assert.equal(lcl.declaredRatio, null);

  const over = summarizeShipmentVgms([vgm({}), vgm({}), vgm({ vgm: 0 })], {
    quantityAmount: 1,
    quantityUnit: 'Cont',
  });
  assert.equal(over.declaredCount, 2);
  assert.equal(over.declaredRatio, 1);
});
