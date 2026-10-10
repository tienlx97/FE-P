import assert from 'node:assert/strict';
import { test } from 'node:test';

import { paymentOverview } from './payment-overview.js';

test('overview aggregates occurrences into ordered stages and highlights only the first unpaid stage', () => {
  const result = paymentOverview(
    /** @type {any} */ ({
      contract: { settlementValue: 100, paidValue: 30 },
      installments: [
        {
          id: 'stage-2',
          amount: 20,
          paidAmount: 0,
          number: 2,
          subInstallments: [
            {
              id: 'next',
              number: 1,
              code: '2.1',
              status: 'Planned',
              amount: 20,
            },
          ],
        },
        {
          id: 'stage-1',
          amount: 80,
          paidAmount: 30,
          number: 1,
          subInstallments: [
            {
              id: 'active',
              number: 2,
              code: '1.2',
              status: 'Planned',
              amount: 50,
              paymentDate: '2026-10-09',
              kind: 'Percent',
              percent: 50,
            },
            {
              id: 'paid',
              number: 1,
              code: '1.1',
              status: 'Paid',
              amount: 30,
              actualPaidAmount: 30,
            },
          ],
        },
      ],
    }),
  );
  assert.equal(result.paidPercent, 30);
  assert.equal(result.currentPercent, 50);
  assert.deepEqual(
    result.installments.map((p) => [p.id, p.status]),
    [
      ['stage-1', 'active'],
      ['stage-2', 'upcoming'],
    ],
  );
  assert.equal(result.installments[0].dueDate, '09/10/2026');
});

test('a planned payment counts for nothing even with an amount typed', () => {
  const result = paymentOverview(
    /** @type {any} */ ({
      contract: { settlementValue: 100, paidValue: 0 },
      installments: [
        {
          id: 'one',
          number: 1,
          amount: 50,
          paidAmount: 50,
          subInstallments: [
            { status: 'Planned', amount: 50, actualPaidAmount: 50 },
          ],
        },
      ],
    }),
  );
  assert.equal(result.installments[0].status, 'active');
});

test('empty and overpaid contracts have bounded progress', () => {
  assert.deepEqual(
    paymentOverview(
      /** @type {any} */ ({
        contract: { settlementValue: 0, paidValue: 0 },
        installments: [],
      }),
    ),
    { paidPercent: 0, currentPercent: 0, installments: [] },
  );
  const result = paymentOverview(
    /** @type {any} */ ({
      contract: { settlementValue: 100, paidValue: 120 },
      installments: [
        {
          id: 'stage',
          amount: 50,
          paidAmount: 0,
          number: 1,
          subInstallments: [
            { id: 'p', number: 1, status: 'Planned', amount: 50 },
          ],
        },
      ],
    }),
  );
  assert.equal(result.paidPercent, 100);
  assert.equal(result.currentPercent, 0);
});

test('a fully paid stage is paid, and a partially paid stage keeps its remaining amount active', () => {
  const result = paymentOverview(
    /** @type {any} */ ({
      contract: { settlementValue: 100, paidValue: 50 },
      installments: [
        {
          id: 'one',
          number: 1,
          amount: 30,
          paidAmount: 30,
          subInstallments: [{ status: 'Paid', actualPaidAmount: 30 }],
        },
        {
          id: 'two',
          number: 2,
          amount: 70,
          paidAmount: 20,
          subInstallments: [
            { status: 'Paid', actualPaidAmount: 20 },
            { status: 'Planned', paymentDate: '2026-10-15' },
          ],
        },
      ],
    }),
  );
  assert.equal(result.currentPercent, 50);
  assert.deepEqual(
    result.installments.map((s) => [s.label, s.status]),
    [
      ['Đợt 1', 'paid'],
      ['Đợt 2', 'active'],
    ],
  );
});
