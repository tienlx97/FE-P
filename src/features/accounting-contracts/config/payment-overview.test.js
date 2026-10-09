import assert from 'node:assert/strict';
import { test } from 'node:test';

import { paymentOverview } from './payment-overview.js';

test('overview orders payments, keeps paid status and highlights only the first planned payment', () => {
  const result = paymentOverview(
    /** @type {any} */ ({
      contract: { settlementValue: 100, paidValue: 30 },
      installments: [
        {
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
            { id: 'paid', number: 1, code: '1.1', status: 'Paid', amount: 30 },
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
      ['paid', 'paid'],
      ['active', 'active'],
      ['next', 'upcoming'],
    ],
  );
  assert.equal(result.installments[1].dueDate, '09/10/2026');
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
