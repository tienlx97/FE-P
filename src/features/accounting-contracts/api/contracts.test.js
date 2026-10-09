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
      paymentDueDate: null,
      note: null,
    },
  );
});
