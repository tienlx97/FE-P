import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  isSectionOpenByDefault,
  sectionCompleteness,
  sectionsForStage,
  SHIPMENT_FORM_SECTIONS,
} from './shipment-form-sections.js';
import { nextShipmentStatus, shipmentStatusFlow } from './shipment-status.js';

/** @param {string} id */
const section = (id) => {
  const found = SHIPMENT_FORM_SECTIONS.find((item) => item.id === id);
  assert.ok(found);
  return found;
};
/** @param {Record<string, unknown>} overrides */
const values = (overrides = {}) =>
  /** @type {import('../types/index.js').ShipmentFormValues} */ (
    /** @type {unknown} */ ({
      status: 'Booked',
      goodsLines: {},
      consigneeOverride: null,
      notifyPartyOverride: null,
      customsInspected: false,
      customsDeclarationNumber: '',
      customsDeclarationDate: '',
      customsChannel: '',
      coNumber: '',
      coForm: '',
      coDeclarationDate: '',
      coIssuedDate: '',
      note: '',
      ...overrides,
    })
  );

test('status flow follows the Incoterm', () => {
  assert.deepEqual(shipmentStatusFlow('EXW'), [
    'Booked',
    'Packing',
    'Completed',
  ]);
  assert.deepEqual(shipmentStatusFlow('FOB'), [
    'Booked',
    'Packing',
    'DeliveredToPort',
    'Completed',
  ]);
  assert.equal(shipmentStatusFlow('CIF').length, 6);
  assert.deepEqual(shipmentStatusFlow('DDP').slice(-3), [
    'CustomsDeclaration',
    'TruckingToSite',
    'Completed',
  ]);
});
test('a status set outside the flow is slotted in by global order', () => {
  assert.deepEqual(shipmentStatusFlow('EXW', 'Shipping'), [
    'Booked',
    'Packing',
    'Shipping',
    'Completed',
  ]);
});
test('next status, none after completion', () => {
  assert.equal(nextShipmentStatus('FOB', 'Packing'), 'DeliveredToPort');
  assert.equal(nextShipmentStatus('CIF', 'Packing'), 'AtYardAwaitingExport');
  assert.equal(nextShipmentStatus('CIF', 'Completed'), null);
});
test('every form value belongs to exactly one section', () => {
  const fields = SHIPMENT_FORM_SECTIONS.flatMap((item) => item.fields);
  assert.equal(new Set(fields).size, fields.length);
  for (const item of SHIPMENT_FORM_SECTIONS) {
    for (const key of item.keyFields) assert.ok(item.fields.includes(key));
  }
});
test('booking-time groups open on create, later ones wait for their stage', () => {
  assert.equal(isSectionOpenByDefault(section('booking'), values()), true);
  assert.equal(isSectionOpenByDefault(section('goods'), values()), false);
  assert.equal(isSectionOpenByDefault(section('customs'), values()), false);
  assert.equal(isSectionOpenByDefault(section('note'), values()), false);
  assert.equal(
    isSectionOpenByDefault(section('goods'), values({ status: 'Packing' })),
    true,
  );
  assert.equal(
    isSectionOpenByDefault(section('customs'), values({ status: 'Packing' })),
    false,
  );
  assert.equal(
    isSectionOpenByDefault(
      section('customs'),
      values({ status: 'DeliveredToPort' }),
    ),
    true,
  );
});
test('a group with data opens whatever the status', () => {
  assert.equal(
    isSectionOpenByDefault(section('customs'), values({ coNumber: 'VN-1' })),
    true,
  );
  assert.equal(
    isSectionOpenByDefault(section('goods'), values({ goodsLines: { a: 0 } })),
    false,
  );
  assert.equal(
    isSectionOpenByDefault(section('goods'), values({ goodsLines: { a: 5 } })),
    true,
  );
});
test('completeness: missing key fields, errors win, note is optional', () => {
  const customs = section('customs');
  assert.deepEqual(sectionCompleteness(customs, values(), {}), {
    state: 'missing',
    missing: 3,
  });
  assert.deepEqual(
    sectionCompleteness(
      customs,
      values({
        customsDeclarationNumber: '1',
        customsDeclarationDate: '2026-10-01',
        customsChannel: 'Green',
      }),
      {},
    ),
    { state: 'complete', missing: 0 },
  );
  assert.equal(
    sectionCompleteness(section('booking'), values(), {
      'transshipmentLegs.0.port': { type: 'error' },
    }).state,
    'error',
  );
  assert.equal(
    sectionCompleteness(section('note'), values(), {}).state,
    'optional',
  );
});
test('stage groups always end with the note', () => {
  assert.deepEqual(sectionsForStage('Packing'), ['goods', 'note']);
  assert.deepEqual(sectionsForStage('Completed'), ['note']);
});
