import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  firstStepWithError,
  sectionCompleteness,
  SHIPMENT_CREATE_STEPS,
  SHIPMENT_FORM_SECTIONS,
  stepFields,
  stepOfSection,
  stepState,
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
test('completeness: missing key fields, errors win, note is optional', () => {
  const customs = section('customs');
  assert.deepEqual(sectionCompleteness(customs, values(), {}), {
    state: 'missing',
    missing: 7,
  });
  assert.deepEqual(
    sectionCompleteness(
      customs,
      values({
        declarationValue: 1200,
        declarationExchangeRate: 25_000,
        quantityAmount: 2,
        declarationWeightKg: 18_000,
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
test('create steps cover every group once, in display order', () => {
  assert.deepEqual(
    SHIPMENT_CREATE_STEPS.flatMap((step) => step.sections),
    SHIPMENT_FORM_SECTIONS.map((item) => item.id),
  );
  assert.equal(stepOfSection('customs'), 3);
  assert.ok(stepFields(SHIPMENT_CREATE_STEPS[0]).includes('supplierCustomerId'));
  assert.ok(!stepFields(SHIPMENT_CREATE_STEPS[0]).includes('bookingNumber'));
});
test('step state: error wins, review step has none', () => {
  const [, bookingStep, , customsStep, reviewStep] = SHIPMENT_CREATE_STEPS;
  assert.equal(stepState(customsStep, values(), {}), 'missing');
  assert.equal(
    stepState(bookingStep, values(), { 'transshipmentLegs.0.port': 'x' }),
    'error',
  );
  assert.equal(stepState(reviewStep, values(), {}), null);
  assert.equal(
    stepState(
      bookingStep,
      values({
        bookingNumber: 'B1',
        shippingLine: 'KMTC',
        vesselName: 'V',
        voyageNumber: '1',
        siCutoffDate: '2026-10-01',
        cyCutoffDate: '2026-10-02',
        etd: '2026-10-03',
        eta: '2026-10-10',
      }),
      {},
    ),
    'complete',
  );
});
test('first step with an error', () => {
  assert.equal(firstStepWithError({}), -1);
  assert.equal(
    firstStepWithError({ declarationValue: 'x', bookingNumber: 'y' }),
    1,
  );
  assert.equal(firstStepWithError({ 'goodsLines.a': 'x' }), 2);
});
