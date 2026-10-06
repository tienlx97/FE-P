import assert from 'node:assert/strict';
import test from 'node:test';

import { createShipment } from '../api/shipments.js';
import {
  errorsFromIssues,
  mergeCheckedErrors,
  valuesFromShipment,
} from './use-shipment-form.js';

test('first issue per field path wins', () => {
  assert.deepEqual(
    errorsFromIssues([
      { path: ['name'], message: 'a' },
      { path: ['name'], message: 'b' },
      { path: ['transshipmentLegs', 0, 'port'], message: 'c' },
    ]),
    { name: 'a', 'transshipmentLegs.0.port': 'c' },
  );
});

test('checking a step updates only its fields', () => {
  const shown = { name: 'old', declarationValue: 'kept' };
  const next = { bookingNumber: 'new', declarationValue: 'hidden' };
  assert.deepEqual(
    mergeCheckedErrors(shown, next, ['name', 'bookingNumber']),
    { declarationValue: 'kept', bookingNumber: 'new' },
  );
  assert.deepEqual(mergeCheckedErrors(shown, next), next);
  assert.deepEqual(
    mergeCheckedErrors({}, { 'transshipmentLegs.0.port': 'x' }, [
      'transshipmentLegs',
    ]),
    { 'transshipmentLegs.0.port': 'x' },
  );
});

test('sends carried goods lines and the party overrides (null = follow the contract)', async () => {
  const originalFetch = globalThis.fetch;
  /** @type {{ init?: RequestInit }} */
  const captured = {};
  globalThis.fetch = async (_input, init) => {
    captured.init = init;
    return Response.json({ id: 'shipment-1' });
  };

  try {
    const values = valuesFromShipment(
      /** @type {any} */ ({
        supplierCustomerId: 'supplier-1',
        bookingNumber: 'BK-1',
        type: 'FCL',
        name: 'Lô 1',
        paymentCondition: 'TT',
        invoiceValue: 1,
        invoiceCurrency: 'USD',
        declarationValue: 1,
        declarationCurrency: 'USD',
        declarationExchangeRate: 1,
        quantityAmount: 1,
        declarationWeightKg: 1,
        customsInspected: false,
        status: 'Booked',
        costs: [],
        lines: [
          { contractLineId: 'line-steel', quantity: 40 },
          { contractLineId: 'line-bolts', quantity: 500 },
        ],
        consignee: {
          name: 'ABC Branch',
          address: null,
          sourceContactId: null,
          extraFields: [],
          kind: 'Named',
        },
        consigneeOverridden: true,
        notifyParty: {
          name: null,
          address: null,
          sourceContactId: null,
          extraFields: [],
          kind: 'SameAsConsignee',
        },
        notifyPartyOverridden: false,
      }),
    );
    values.goodsLines['line-paint'] = 0;

    await createShipment('contract-1', values, []);

    const body = JSON.parse(String(captured.init?.body));
    assert.deepEqual(body.Lines, [
      { ContractLineId: 'line-steel', Quantity: 40 },
      { ContractLineId: 'line-bolts', Quantity: 500 },
    ]);
    assert.equal(body.PartyOverrides.Consignee.Name, 'ABC Branch');
    assert.equal(body.PartyOverrides.NotifyParty, null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
