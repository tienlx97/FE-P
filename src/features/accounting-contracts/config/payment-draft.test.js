import assert from 'node:assert/strict';
import { test } from 'node:test';

import { installmentSchema } from './child-schemas.js';
import {
  emptySubInstallment,
  initialPaymentStage,
  paymentFieldPatch,
  paymentValues,
} from './payment-draft.js';

test('a new stage contains one planned full-value payment and independent drafts', () => {
  const first = initialPaymentStage(8);
  assert.equal(first.subInstallments.length, 1);
  assert.equal(first.subInstallments[0].percent, 100);
  assert.equal(first.subInstallments[0].status, 'Planned');
  assert.equal(installmentSchema.safeParse(first).success, true);
  first.subInstallments[0].percent = 30;
  first.subInstallments.push({ ...emptySubInstallment(8), percent: 70 });
  assert.equal(installmentSchema.safeParse(first).success, true);
  assert.equal(initialPaymentStage(8).subInstallments[0].percent, 100);
  assert.equal(first.subInstallments[0].taxRatePercent, 8);
  assert.equal(
    installmentSchema.safeParse({ note: '', subInstallments: [] }).success,
    false,
  );
});

test('switching the kind drops typed values; other edits change one field', () => {
  const sub = {
    ...emptySubInstallment(8),
    valueBeforeTax: 5,
    valueAfterTax: 6,
  };
  assert.deepEqual(paymentFieldPatch(sub, 'kind', 'Quantity'), {
    kind: 'Quantity',
    valueBeforeTax: undefined,
    valueAfterTax: undefined,
  });
  assert.deepEqual(paymentFieldPatch(sub, 'kind', 'Percent'), {
    kind: 'Percent',
  });
  assert.deepEqual(paymentFieldPatch(sub, 'percent', 30), { percent: 30 });
});

test('a saved payment loads only its typed values into the form', () => {
  const saved = {
    id: 's',
    number: 1,
    code: '1.1',
    kind: /** @type {const} */ ('Percent'),
    percent: 30,
    percentBasis: /** @type {const} */ ('BeforeTax'),
    valueBeforeTax: 30_000_000,
    taxRatePercent: 8,
    valueAfterTax: 32_400_001,
    isValueBeforeTaxManual: false,
    isValueAfterTaxManual: true,
    actualPaidAmount: null,
    condition: null,
    paymentDate: null,
    status: /** @type {const} */ ('Planned'),
    note: null,
  };
  const values = paymentValues(saved);
  assert.equal(values.valueBeforeTax, undefined);
  assert.equal(values.valueAfterTax, 32_400_001);
  assert.equal(
    paymentValues({ ...saved, kind: 'Quantity', isValueBeforeTaxManual: true })
      .valueBeforeTax,
    30_000_000,
  );
});
