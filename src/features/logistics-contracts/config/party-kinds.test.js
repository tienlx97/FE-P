import assert from 'node:assert/strict';
import test from 'node:test';

import {
  describePaymentTerm,
  labelForPaymentMethod,
  partyPayload,
} from './party-kinds.js';

test('describes a term with its method, and without one for commission terms', () => {
  assert.equal(
    describePaymentTerm({
      id: '1',
      paymentRatioPercent: 70,
      paymentCondition: 'at sight',
      paymentType: 'LC',
    }),
    '70% L/C at sight',
  );
  assert.equal(
    describePaymentTerm({
      id: '2',
      paymentRatioPercent: 100,
      paymentCondition: 'T/T',
      paymentType: null,
    }),
    '100% T/T',
  );
  assert.equal(labelForPaymentMethod(undefined), '');
});

test('sends no party for "Không có" and drops the name of a fixed wording', () => {
  const base = {
    name: 'ignored',
    address: '',
    sourceContactId: '',
    loadedName: '',
    extraFields: [],
  };
  assert.equal(partyPayload({ ...base, kind: '' }), null);
  assert.equal(partyPayload({ ...base, kind: 'ToOrder' })?.Name, null);
  assert.equal(
    partyPayload({ ...base, kind: 'ToOrderOfBank', name: ' VCB ' })?.Name,
    'VCB',
  );
});
