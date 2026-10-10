import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  appendixBody,
  saveInstallmentRows,
  subInstallmentBody,
} from './contract-children.js';

test('an information-change appendix sends value before tax 0', () => {
  assert.equal(
    appendixBody({
      type: 'InfoChange',
      valueBeforeTax: 5,
      signedDate: '2026-02-01',
      buyerSigned: true,
      sellerSigned: true,
      note: '',
    }).valueBeforeTax,
    0,
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
