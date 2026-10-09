import assert from 'node:assert/strict';
import { test } from 'node:test';

import { contractSchema } from './contract-schema.js';

const valid = {
  companyId: 'c',
  contractNumber: 'HD-01',
  signedDate: '2026-01-05',
  projectCode: 'CT-01',
  projectName: 'Nhà xưởng',
  sourceId: '',
  customerId: 'k',
  valueBeforeTax: 100,
  taxRatePercent: 8,
  paymentDueDate: '',
  note: '',
};

test('a complete contract passes', () => {
  assert.equal(contractSchema.safeParse(valid).success, true);
});

test('tax must be 0–100 and values are required', () => {
  assert.equal(
    contractSchema.safeParse({ ...valid, taxRatePercent: 120 }).success,
    false,
  );
  assert.equal(
    contractSchema.safeParse({ ...valid, valueBeforeTax: undefined }).success,
    false,
  );
  assert.equal(
    contractSchema.safeParse({ ...valid, projectCode: ' ' }).success,
    false,
  );
});
