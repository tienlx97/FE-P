import assert from 'node:assert/strict';
import test from 'node:test';

import { contractSchema } from './contract-schema.js';

/** A minimally valid candidate — every `.refine()` passes. */
function baseCandidate() {
  return {
    contractNumber: 'HD-001',
    contractType: 'Draft',
    createdDate: '2026-01-10',
    quotationDate: '2026-01-05',
    projectName: 'Dự án A',
    category: 'Máy móc',
    countryId: 'country-1',
    placeOfLoading: 'Cảng Hải Phòng',
    placeOfDischarge: 'Cảng Rotterdam',
    contractValue: 1000,
    currency: 'USD',
    incoterm: 'CIF',
    incotermYear: 2020,
    companyId: 'company-1',
    sourceSellerId: 'seller-1',
    sellerInline: {
      companyName: '',
      representativeName: '',
      representativeTitle: '',
      address: '',
    },
    sourceCustomerId: 'customer-1',
    buyerInline: {
      companyName: '',
      representativeName: '',
      representativeTitle: '',
      address: '',
    },
    note: '',
    paymentTerms: [{ paymentRatioPercent: 100, paymentCondition: 'T/T' }],
    bankIds: ['bank-1'],
    sellerSigned: false,
    buyerSigned: false,
    status: 'InProgress',
  };
}

test('accepts a quotation date on or before the contract date', () => {
  const equalDates = contractSchema.safeParse({
    ...baseCandidate(),
    createdDate: '2026-01-10',
    quotationDate: '2026-01-10',
  });
  assert.equal(equalDates.success, true);

  const beforeDate = contractSchema.safeParse({
    ...baseCandidate(),
    createdDate: '2026-01-10',
    quotationDate: '2026-01-05',
  });
  assert.equal(beforeDate.success, true);
});

test('rejects a quotation date after the contract date', () => {
  const result = contractSchema.safeParse({
    ...baseCandidate(),
    createdDate: '2026-01-10',
    quotationDate: '2026-01-15',
  });

  assert.equal(result.success, false);
  if (!result.success) {
    const issue = result.error.issues.find(
      (candidate) => candidate.path.join('.') === 'quotationDate',
    );
    assert.ok(issue, 'expected an issue on quotationDate');
    assert.equal(
      issue?.message,
      'Ngày báo giá phải trước hoặc bằng ngày tạo hợp đồng',
    );
  }
});

test('requires a valid contractType', () => {
  const result = contractSchema.safeParse({
    ...baseCandidate(),
    contractType: 'NotAType',
  });
  assert.equal(result.success, false);
  if (!result.success) {
    const issue = result.error.issues.find(
      (candidate) => candidate.path.join('.') === 'contractType',
    );
    assert.ok(issue, 'expected an issue on contractType');
  }
});

test('requires countryId', () => {
  const result = contractSchema.safeParse({ ...baseCandidate(), countryId: '' });
  assert.equal(result.success, false);
  if (!result.success) {
    const issue = result.error.issues.find(
      (candidate) => candidate.path.join('.') === 'countryId',
    );
    assert.ok(issue, 'expected an issue on countryId');
  }
});

test('requires companyId', () => {
  const result = contractSchema.safeParse({ ...baseCandidate(), companyId: '' });
  assert.equal(result.success, false);
  if (!result.success) {
    const issue = result.error.issues.find(
      (candidate) => candidate.path.join('.') === 'companyId',
    );
    assert.ok(issue, 'expected an issue on companyId');
  }
});

test('requires placeOfDischarge for DDP/CIF', () => {
  for (const incoterm of ['DDP', 'CIF']) {
    const result = contractSchema.safeParse({
      ...baseCandidate(),
      incoterm,
      placeOfDischarge: '',
    });
    assert.equal(result.success, false, `expected ${incoterm} to require it`);
    if (!result.success) {
      const issue = result.error.issues.find(
        (candidate) => candidate.path.join('.') === 'placeOfDischarge',
      );
      assert.ok(issue, `expected an issue on placeOfDischarge for ${incoterm}`);
    }
  }
});

test('rejects a non-empty placeOfDischarge for FOB/EXW', () => {
  for (const incoterm of ['FOB', 'EXW']) {
    const result = contractSchema.safeParse({
      ...baseCandidate(),
      incoterm,
      placeOfDischarge: 'Cảng Rotterdam',
    });
    assert.equal(result.success, false, `expected ${incoterm} to reject it`);
  }
});

test('accepts an empty placeOfDischarge for FOB/EXW', () => {
  for (const incoterm of ['FOB', 'EXW']) {
    const result = contractSchema.safeParse({
      ...baseCandidate(),
      incoterm,
      placeOfDischarge: '',
    });
    assert.equal(result.success, true, `expected ${incoterm} to accept it`);
  }
});

test('requires at least one bank', () => {
  const result = contractSchema.safeParse({ ...baseCandidate(), bankIds: [] });
  assert.equal(result.success, false);
  if (!result.success) {
    const issue = result.error.issues.find(
      (candidate) => candidate.path.join('.') === 'bankIds',
    );
    assert.ok(issue, 'expected an issue on bankIds');
  }
});

test('rejects note longer than 2000 characters', () => {
  const result = contractSchema.safeParse({
    ...baseCandidate(),
    note: 'a'.repeat(2001),
  });
  assert.equal(result.success, false);
});
