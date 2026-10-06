import assert from 'node:assert/strict';
import test from 'node:test';

import {
  differsFromSpecs,
  isValidContainerNumber,
  normalizeContainerNumber,
  specsFill,
  specsSummary,
} from './container-specs.js';

/** @returns {import('../types/index.js').ContainerSpecs} */
const specs = (overrides = {}) => ({
  containerNumber: 'SEGU6154506',
  status: 'Found',
  message: null,
  source: 'BIC BoxTech',
  sizeType: '45G1',
  containerType: 'Size40HC',
  tareKg: 3830,
  maxPayloadKg: 28670,
  maxGrossKg: 32500,
  alert: null,
  ...overrides,
});

/** @returns {import('../types/index.js').ShipmentVgmFormValues} */
const values = (overrides = {}) => ({
  containerNumber: 'SEGU6154506',
  sealNumber: '',
  containerType: '',
  tare: undefined,
  payload: undefined,
  maxGross: undefined,
  netWeight: undefined,
  packagingWeight: undefined,
  packingDate: '',
  plannedPackingTime: '',
  actualPackingTime: '',
  truckArrivalTime: '',
  carrierCustomerId: '',
  note: '',
  ...overrides,
});

test('ISO 6346 numbers are checked by their check digit', () => {
  for (const number of [
    'CSQU3054383',
    'SEGU6154506',
    'TGBU5261698',
    'tgbu 526169-8',
  ]) {
    assert.equal(isValidContainerNumber(number), true, number);
  }
  for (const number of ['CSQU3054384', 'CSQX3054383', 'CSQU305438', '', null]) {
    assert.equal(isValidContainerNumber(number), false, String(number));
  }
  assert.equal(normalizeContainerNumber(' tgbu 526169-8 '), 'TGBU5261698');
});

test('specs fill the blank fields and keep what was typed', () => {
  assert.deepEqual(specsFill(values({ tare: 3700 }), specs()), {
    containerType: 'Size40HC',
    maxGross: 32500,
    payload: 28670,
  });
  assert.deepEqual(
    specsFill(values({ tare: 3700 }), specs(), { overwrite: true }),
    {
      containerType: 'Size40HC',
      maxGross: 32500,
      tare: 3830,
      payload: 28670,
    },
  );
  assert.deepEqual(
    specsFill(values(), specs({ containerType: null, maxGrossKg: null })),
    { tare: 3830, payload: 28670 },
    'only what BoxTech knows',
  );
});

test('another container replaces what the previous lookup filled, never what was typed', () => {
  const previous = {
    containerType: 'Size40HC',
    maxGross: 32500,
    tare: 3830,
    payload: 28670,
  };
  const filled = values({ ...previous, payload: 28000 });
  assert.deepEqual(
    specsFill(filled, null, { previous }),
    { containerType: '', maxGross: undefined, tare: undefined },
    'unknown container: clear the filled values, keep the typed payload',
  );
  assert.deepEqual(
    specsFill(
      filled,
      specs({
        containerType: 'Size20',
        tareKg: 2200,
        maxPayloadKg: 28280,
        maxGrossKg: 30480,
      }),
      {
        previous,
      },
    ),
    { containerType: 'Size20', maxGross: 30480, tare: 2200 },
  );
});

test('a drawer differing from BoxTech offers to fill again', () => {
  assert.equal(differsFromSpecs(values({ tare: 3700 }), specs()), true);
  assert.equal(
    differsFromSpecs(
      values({
        containerType: 'Size40HC',
        tare: 3830,
        payload: 28670,
        maxGross: 32500,
      }),
      specs(),
    ),
    false,
  );
});

test('the summary lists the size-type and weights', () => {
  assert.equal(
    specsSummary(specs()),
    '45G1 · tare 3.830 · payload 28.670 · max gross 32.500 kg',
  );
});
