import assert from 'node:assert/strict';
import { test } from 'node:test';

import { EMPTY_FREE_TIME } from './shipment-schedule.js';
import { shipmentSchema } from './shipment-schema.js';
import { requiresDeclarationFigures } from './shipment-status.js';

/** A booking-time shipment: no declaration figures yet. */
const booked = {
  supplierCustomerId: 'supplier-1',
  customsBrokerIds: [],
  truckingIds: [],
  bookingNumber: 'BK-1',
  billOfLadingNumber: '',
  shippingLine: '',
  vesselName: '',
  etd: '',
  eta: '',
  placeOfLoading: '',
  placeOfDischarge: '',
  placeOfDelivery: '',
  note: '',
  type: 'FCL',
  name: 'Lô 1',
  paymentCondition: 'TT',
  invoiceValue: 50_000,
  invoiceCurrency: 'USD',
  declarationValue: undefined,
  declarationCurrency: 'USD',
  declarationExchangeRate: undefined,
  quantityAmount: undefined,
  declarationWeightKg: undefined,
  coNumber: '',
  coDeclarationDate: '',
  coIssuedDate: '',
  customsDeclarationNumber: '',
  customsDeclarationDate: '',
  customsInspected: false,
  costLines: [],
  goodsLines: {},
  consigneeOverride: null,
  notifyPartyOverride: null,
  status: 'Booked',
  invoiceNumber: '',
  voyageNumber: '',
  siCutoffDate: '',
  siCutoffTime: '',
  serviceTerm: '',
  isTransshipment: false,
  transshipmentLegs: [],
  coForm: '',
  customsChannel: '',
  letterOfCreditNumber: '',
  emptyReturnDeadline: '',
  cyCutoffDate: '',
  cyCutoffTime: '',
  actualDeparture: '',
  actualArrival: '',
  originFreeTime: EMPTY_FREE_TIME,
  destinationFreeTime: EMPTY_FREE_TIME,
};

/** @param {Record<string, unknown>} overrides */
const issuePaths = (overrides) => {
  const result = shipmentSchema.safeParse({ ...booked, ...overrides });
  return result.success
    ? []
    : result.error.issues.map((issue) => issue.path.join('.')).sort();
};

const FIGURES = [
  'declarationExchangeRate',
  'declarationValue',
  'declarationWeightKg',
  'quantityAmount',
];

test('figures are required from AtYardAwaitingExport, as on the backend', () => {
  assert.equal(requiresDeclarationFigures('Booked'), false);
  assert.equal(requiresDeclarationFigures('Packing'), false);
  assert.equal(requiresDeclarationFigures('AtYardAwaitingExport'), true);
  assert.equal(requiresDeclarationFigures('Completed'), true);
});
test('a booked or packing shipment may omit the declaration figures', () => {
  assert.deepEqual(issuePaths({}), []);
  assert.deepEqual(issuePaths({ status: 'Packing' }), []);
});
test('from the yard each missing figure is an error on its own field', () => {
  assert.deepEqual(issuePaths({ status: 'AtYardAwaitingExport' }), FIGURES);
  assert.deepEqual(
    issuePaths({
      status: 'Shipping',
      declarationValue: 1200,
      declarationExchangeRate: 25_000,
      quantityAmount: 2,
      declarationWeightKg: 18_000,
    }),
    [],
  );
});
test('a given figure must still be positive while booked', () => {
  assert.deepEqual(issuePaths({ declarationExchangeRate: 0 }), [
    'declarationExchangeRate',
  ]);
});
test('figure errors show even while other fields are still invalid', () => {
  const paths = issuePaths({
    status: 'AtYardAwaitingExport',
    name: '',
    type: '',
    paymentCondition: '',
  });
  for (const field of FIGURES) assert.ok(paths.includes(field), field);
  assert.ok(paths.includes('name'));
});
