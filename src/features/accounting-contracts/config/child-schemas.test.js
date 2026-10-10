import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  appendixSchema,
  installmentSchema,
  invoiceSchema,
  subInstallmentSchema,
} from './child-schemas.js';

const appendix = {
  type: 'Increase',
  valueBeforeTax: 10,
  signedDate: '2026-02-01',
  buyerSigned: true,
  sellerSigned: false,
  note: '',
};
const sub = {
  kind: 'Percent',
  percent: 30,
  valueBeforeTax: undefined,
  taxRatePercent: 8,
  actualPaidAmount: undefined,
  condition: '',
  paymentDate: '',
  status: 'Planned',
  note: '',
};

test('an appendix needs a value before tax unless it only changes information', () => {
  assert.equal(appendixSchema.safeParse(appendix).success, true);
  assert.equal(
    appendixSchema.safeParse({ ...appendix, valueBeforeTax: 0 }).success,
    false,
  );
  assert.equal(
    appendixSchema.safeParse({
      ...appendix,
      type: 'InfoChange',
      valueBeforeTax: undefined,
    }).success,
    true,
  );
});

test('an invoice needs a number, a positive value before tax and a tax rate', () => {
  assert.equal(
    invoiceSchema.safeParse({
      invoiceNumber: '0001',
      issuedDate: '2026-03-01',
      valueBeforeTax: 1,
      taxRatePercent: 8,
      note: '',
    }).success,
    true,
  );
  assert.equal(
    invoiceSchema.safeParse({
      invoiceNumber: ' ',
      issuedDate: '2026-03-01',
      valueBeforeTax: 1,
      taxRatePercent: 8,
      note: '',
    }).success,
    false,
  );
  assert.equal(
    invoiceSchema.safeParse({
      invoiceNumber: '1',
      issuedDate: '2026-03-01',
      valueBeforeTax: 0,
      taxRatePercent: 8,
      note: '',
    }).success,
    false,
  );
});

test('a sub-instalment needs the value its kind uses', () => {
  assert.equal(subInstallmentSchema.safeParse(sub).success, true);
  assert.equal(
    subInstallmentSchema.safeParse({ ...sub, taxRatePercent: 101 }).success,
    false,
  );
  assert.equal(
    subInstallmentSchema.safeParse({ ...sub, actualPaidAmount: -1 }).success,
    false,
  );
  assert.equal(
    subInstallmentSchema.safeParse({ ...sub, percent: 150 }).success,
    false,
  );
  assert.equal(
    subInstallmentSchema.safeParse({ ...sub, kind: 'Quantity' }).success,
    false,
  );
  assert.equal(
    subInstallmentSchema.safeParse({
      ...sub,
      kind: 'Quantity',
      valueBeforeTax: 5,
    }).success,
    true,
  );
});

test('an instalment needs at least one sub-instalment', () => {
  assert.equal(
    installmentSchema.safeParse({ note: '', subInstallments: [] }).success,
    false,
  );
  assert.equal(
    installmentSchema.safeParse({ note: '', subInstallments: [sub] }).success,
    true,
  );
});
