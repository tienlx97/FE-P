import assert from 'node:assert/strict';
import test from 'node:test';

import { shipmentVgmSchema } from './shipment-vgm-schema.js';

/** @param {Partial<import('../types/index.js').ShipmentVgmFormValues>} overrides */
function values(overrides) {
  return {
    containerNumber: 'TCLU1234567',
    sealNumber: '',
    containerType: /** @type {const} */ ('Size40HC'),
    packingDate: '',
    plannedPackingTime: '',
    actualPackingTime: '',
    truckArrivalTime: '',
    carrierCustomerId: '',
    note: '',
    ...overrides,
  };
}

test('a container is valid before its VGM is declared', () => {
  assert.equal(shipmentVgmSchema.safeParse(values({})).success, true);
});

test('the VGM weights are all or none', () => {
  const declared = values({
    maxGross: 30480,
    tare: 3800,
    payload: 26680,
    netWeight: 20000,
    packagingWeight: 300,
  });
  assert.equal(shipmentVgmSchema.safeParse(declared).success, true);

  const partial = shipmentVgmSchema.safeParse(values({ tare: 3800, netWeight: 20000 }));
  assert.equal(partial.success, false);
  assert.deepEqual(
    partial.error?.issues.map((issue) => issue.path.join('.')).sort(),
    ['maxGross', 'packagingWeight', 'payload'],
  );
});

test('the container number and type stay required', () => {
  const result = shipmentVgmSchema.safeParse(values({ containerNumber: '', containerType: '' }));
  assert.equal(result.success, false);
  assert.deepEqual(
    result.error?.issues.map((issue) => issue.path.join('.')).sort(),
    ['containerNumber', 'containerType'],
  );
});
