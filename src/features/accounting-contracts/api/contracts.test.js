import assert from 'node:assert/strict';
import { test } from 'node:test';

import { contractBody } from './contracts.js';

test('contract body trims and sends empty optionals as null', () => {
  assert.deepEqual(
    contractBody({
      companyId: 'c',
      contractNumber: ' HD-01 ',
      signedDate: '2026-01-05',
      projectCode: ' CT-01',
      projectName: 'Dự án ',
      sourceId: '',
      customerId: 'k',
      valueBeforeTax: 100,
      taxRatePercent: 8,
      valueAfterTax: undefined,
      paymentDueDate: '',
      note: ' ',
    }),
    {
      contractNumber: 'HD-01',
      signedDate: '2026-01-05',
      projectCode: 'CT-01',
      projectName: 'Dự án',
      sourceId: null,
      customerId: 'k',
      valueBeforeTax: 100,
      taxRatePercent: 8,
      valueAfterTax: null,
      paymentDueDate: null,
      note: null,
    },
  );
});

test('a typed contract value after tax is sent as is', () => {
  const body = contractBody({
    companyId: 'c',
    contractNumber: 'HD-01',
    signedDate: '2026-01-05',
    projectCode: 'CT-01',
    projectName: 'Dự án',
    sourceId: '',
    customerId: 'k',
    valueBeforeTax: 114_311.83,
    taxRatePercent: 8,
    valueAfterTax: 123_457,
    paymentDueDate: '',
    note: '',
  });
  assert.equal(body.valueAfterTax, 123_457);
});
