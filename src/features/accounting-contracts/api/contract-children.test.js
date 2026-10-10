import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  appendixBody,
  invoiceBody,
  saveInstallmentRows,
  subInstallmentBody,
} from './contract-children.js';

test('an information-change appendix sends value before tax 0 and no typed value', () => {
  const appendix = {
    type: /** @type {const} */ ('InfoChange'),
    valueBeforeTax: 5,
    taxRatePercent: 8,
    valueAfterTax: 6,
    signedDate: '2026-02-01',
    buyerSigned: true,
    sellerSigned: true,
    note: '',
  };
  assert.equal(appendixBody(appendix).valueBeforeTax, 0);
  assert.equal(appendixBody(appendix).valueAfterTax, null);
  assert.equal(
    appendixBody({ ...appendix, type: 'Increase' }).valueAfterTax,
    6,
  );
});

test('an invoice sends its typed value after tax, null when computed', () => {
  const invoice = {
    invoiceNumber: ' 01 ',
    issuedDate: '2026-03-01',
    valueBeforeTax: 114_311.83,
    taxRatePercent: 8,
    valueAfterTax: 123_457,
    note: '',
  };
  assert.equal(invoiceBody(invoice).valueAfterTax, 123_457);
  assert.equal(
    invoiceBody({ ...invoice, valueAfterTax: undefined }).valueAfterTax,
    null,
  );
});

test('stage table updates preserve row IDs and stop on partial failure', async () => {
  const requests = [];
  const values = {
    kind: /** @type {const} */ ('Percent'),
    percent: 50,
    amount: undefined,
    condition: '',
    paymentDate: '',
    status: /** @type {const} */ ('Planned'),
    note: '**Ghi chú**',
  };
  const result = await saveInstallmentRows(
    'contract',
    'stage',
    'note',
    [
      { id: 'first', values },
      { id: 'second', values },
      { id: 'third', values },
    ],
    async (_contract, path, method, body) => {
      requests.push({ path, method, body });
      return path.endsWith('second')
        ? { success: false, message: 'Không thể lưu' }
        : { success: true, data: /** @type {any} */ ({}) };
    },
  );
  assert.equal(result.success, false);
  if (!result.success) assert.match(result.message, /Một phần thay đổi/);
  assert.deepEqual(
    requests.map((r) => [r.path, r.method]),
    [
      ['installments/stage', 'PUT'],
      ['installments/stage/sub-installments/first', 'PUT'],
      ['installments/stage/sub-installments/second', 'PUT'],
    ],
  );
  assert.equal(requests[1].body.note, '**Ghi chú**');
});

test('a sub-instalment sends its typed values and only the percent its kind uses', () => {
  const values = {
    condition: ' ',
    paymentDate: '',
    status: /** @type {const} */ ('Paid'),
    note: '',
    percent: 30,
    percentBasis: /** @type {const} */ ('AfterTax'),
    valueBeforeTax: 5,
    valueAfterTax: undefined,
    taxRatePercent: 8,
    actualPaidAmount: undefined,
  };
  assert.deepEqual(subInstallmentBody({ ...values, kind: 'Percent' }), {
    kind: 'Percent',
    percent: 30,
    percentBasis: 'AfterTax',
    valueBeforeTax: 5,
    taxRatePercent: 8,
    valueAfterTax: null,
    actualPaidAmount: null,
    condition: null,
    paymentDate: null,
    status: 'Paid',
    note: null,
  });
  const quantity = subInstallmentBody({ ...values, kind: 'Quantity' });
  assert.equal(quantity.percent, null);
  assert.equal(quantity.percentBasis, null);
  assert.equal(
    subInstallmentBody({ ...values, kind: 'Quantity', valueAfterTax: 6 })
      .valueAfterTax,
    6,
  );
});
