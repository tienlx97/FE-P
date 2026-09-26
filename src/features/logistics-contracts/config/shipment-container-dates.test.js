import assert from 'node:assert/strict';
import test from 'node:test';

import {
  containerDateFields,
  containerDatesRows,
  dateRange,
} from './shipment-container-dates.js';

test('container date fields follow the Incoterm and destination mode', () => {
  const keys = (/** @type {string} */ incoterm, /** @type {any} */ freeTime) =>
    containerDateFields(incoterm, freeTime).map((field) => field.key);

  assert.deepEqual(keys('EXW', null), []);
  assert.deepEqual(keys('FOB', null), ['emptyPickedUpOn', 'gatedInOn']);
  assert.deepEqual(keys('CIF', { mode: 'Combined' }), [
    'emptyPickedUpOn',
    'gatedInOn',
    'emptyReturnedOn',
  ]);
  assert.deepEqual(keys('DDP', { mode: 'Separate' }), [
    'emptyPickedUpOn',
    'gatedInOn',
    'destinationGatedOutOn',
    'emptyReturnedOn',
  ]);
});

test('rows keep every date of the container', () => {
  const [row] = containerDatesRows([
    /** @type {import('../types/index.js').ShipmentVgm} */ ({
      id: 'v1',
      containerNumber: 'TCLU1234567',
      emptyPickedUpOn: '2026-10-01',
      gatedInOn: null,
      destinationGatedOutOn: '2026-10-20',
      emptyReturnedOn: null,
      emptyReturnDepot: null,
    }),
  ]);
  assert.deepEqual(row, {
    vgmId: 'v1',
    containerNumber: 'TCLU1234567',
    emptyPickedUpOn: '2026-10-01',
    gatedInOn: '',
    destinationGatedOutOn: '2026-10-20',
    emptyReturnedOn: '',
    emptyReturnDepot: '',
  });
});

test('date range spans the first to the last container', () => {
  assert.deepEqual(dateRange(['2026-10-03', null, '2026-10-01']), {
    from: '2026-10-01',
    to: '2026-10-03',
  });
  assert.equal(dateRange([null, undefined]), null);
});
