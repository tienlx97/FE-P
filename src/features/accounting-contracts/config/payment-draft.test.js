import assert from 'node:assert/strict';
import { test } from 'node:test';

import { installmentSchema } from './child-schemas.js';
import { emptySubInstallment, initialPaymentStage } from './payment-draft.js';

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
