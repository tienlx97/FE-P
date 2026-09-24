import assert from 'node:assert/strict';
import test from 'node:test';

import { allocateCommissionPayments } from './commission-payment-allocation.js';

const terms = [
  { paymentRatioPercent: 30 },
  { paymentRatioPercent: 70 },
];

test('no payments leaves every term unpaid', () => {
  const { terms: result, overpaid } = allocateCommissionPayments(
    terms,
    [],
    10000,
  );
  assert.deepEqual(
    result.map((term) => [term.planned, term.paid, term.state]),
    [
      [3000, 0, 'unpaid'],
      [7000, 0, 'unpaid'],
    ],
  );
  assert.equal(overpaid, 0);
});

test('a partial payment marks only the first term partial', () => {
  const { terms: result } = allocateCommissionPayments(
    terms,
    [{ amount: 1000, paymentDate: '2026-09-01' }],
    10000,
  );
  assert.deepEqual(
    result.map((term) => [term.paid, term.state, term.lastPaymentDate]),
    [
      [1000, 'partial', '2026-09-01'],
      [0, 'unpaid', null],
    ],
  );
});

test('payments fill terms in date order and spill into the next term', () => {
  const { terms: result } = allocateCommissionPayments(
    terms,
    [
      { amount: 2000, paymentDate: '2026-09-10' },
      { amount: 2000, paymentDate: '2026-09-01' },
    ],
    10000,
  );
  assert.deepEqual(
    result.map((term) => [term.paid, term.state, term.lastPaymentDate]),
    [
      [3000, 'paid', '2026-09-10'],
      [1000, 'partial', '2026-09-10'],
    ],
  );
});

test('money beyond the plan is reported as overpaid', () => {
  const { terms: result, overpaid } = allocateCommissionPayments(
    terms,
    [{ amount: 10500, paymentDate: '2026-09-01' }],
    10000,
  );
  assert.deepEqual(
    result.map((term) => term.state),
    ['paid', 'paid'],
  );
  assert.equal(overpaid, 500);
});

test('rounded thirds still count as fully paid', () => {
  const thirds = [
    { paymentRatioPercent: 33.33 },
    { paymentRatioPercent: 33.33 },
    { paymentRatioPercent: 33.34 },
  ];
  const { terms: result } = allocateCommissionPayments(
    thirds,
    [{ amount: 100, paymentDate: '2026-09-01' }],
    100,
  );
  assert.deepEqual(
    result.map((term) => term.state),
    ['paid', 'paid', 'paid'],
  );
});
