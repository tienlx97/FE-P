import assert from 'node:assert/strict';
import { test } from 'node:test';

import { appendixBody, subInstallmentBody } from './contract-children.js';

test('an information-change appendix sends amount 0', () => {
  assert.equal(
    appendixBody({
      type: 'InfoChange',
      amount: 5,
      signedDate: '2026-02-01',
      buyerSigned: true,
      sellerSigned: true,
      note: '',
    }).amount,
    0,
  );
});

test('a sub-instalment sends only the value its kind uses', () => {
  const values = {
    condition: ' ',
    paymentDate: '',
    status: /** @type {const} */ ('Paid'),
    note: '',
    percent: 30,
    amount: 5,
  };
  assert.deepEqual(subInstallmentBody({ ...values, kind: 'Percent' }), {
    kind: 'Percent',
    percent: 30,
    amount: null,
    condition: null,
    paymentDate: null,
    status: 'Paid',
    note: null,
  });
  assert.equal(
    subInstallmentBody({ ...values, kind: 'Quantity' }).percent,
    null,
  );
});
