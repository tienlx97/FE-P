import assert from 'node:assert/strict';
import test from 'node:test';

import {
  costLineFormValues,
  costTotalsByPayment,
  emptyCostLineValues,
} from './shipment-cost-lines.js';
import { shipmentCostLineSchema } from './shipment-schema.js';

/** @type {import('../types/index.js').ShipmentCostLine} */
const PAID_ON_BEHALF = {
  id: 'cost-1',
  costCategoryId: 'log-02',
  name: 'Nâng container rỗng tại depot',
  amount: 500_000,
  quantity: 1,
  note: null,
  providerCustomerId: 'supplier-1',
  invoiceNumber: 'CL-0456',
  invoiceDate: '2026-02-10',
  costNature: 'Standard',
  paidOnBehalf: true,
  payeeName: 'Cảng Cát Lái',
  reimbursedOn: '2026-02-20',
  reimbursementReference: 'UNC-0012',
};

test('a saved line keeps its paid-on-behalf payee and reimbursement', () => {
  const values = costLineFormValues(PAID_ON_BEHALF);

  assert.equal(values.paidOnBehalf, true);
  assert.equal(values.payeeName, 'Cảng Cát Lái');
  assert.equal(values.reimbursedOn, '2026-02-20');
  assert.equal(values.reimbursementReference, 'UNC-0012');
});

test('a line from an older backend is not paid on behalf', () => {
  const {
    paidOnBehalf,
    payeeName,
    reimbursedOn,
    reimbursementReference,
    ...rest
  } = PAID_ON_BEHALF;
  void paidOnBehalf;
  void payeeName;
  void reimbursedOn;
  void reimbursementReference;

  const values = costLineFormValues(rest);

  assert.equal(values.paidOnBehalf, false);
  assert.equal(values.payeeName, '');
  assert.equal(values.reimbursedOn, '');
});

test('a line paid on behalf needs its provider', () => {
  const values = {
    ...costLineFormValues(PAID_ON_BEHALF),
    providerCustomerId: '',
  };

  const result = shipmentCostLineSchema.safeParse(values);

  assert.equal(result.success, false);
  assert.deepEqual(result.error?.issues[0]?.path, ['providerCustomerId']);
  assert.ok(
    shipmentCostLineSchema.safeParse({ ...values, paidOnBehalf: false })
      .success,
  );
});

test('a new line starts as the supplier’s own service', () => {
  assert.equal(emptyCostLineValues('log-03').paidOnBehalf, false);
  assert.equal(emptyCostLineValues('log-03').costCategoryId, 'log-03');
});

test('totals split service fees from fees paid on behalf', () => {
  assert.deepEqual(
    costTotalsByPayment([
      { amount: 500_000, paidOnBehalf: true },
      { amount: 300_000 },
      { amount: 200_000, paidOnBehalf: false },
    ]),
    { service: 500_000, paidOnBehalf: 500_000, total: 1_000_000 },
  );
});
