import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createCommissionAnnex,
  listCommissionAnnexes,
  updateCommissionAnnex,
} from './commission-annexes.js';
import {
  createCommission,
  getCommission,
  listCommissions,
  updateCommission,
} from './commissions.js';

const FORM_VALUES = {
  code: '26CM01',
  signedDate: '2026-09-04',
  partyCustomerId: 'customer-1',
  value: 1250,
  sellerSigned: true,
  partySigned: false,
};

const ANNEX_VALUES = {
  signedDate: '2026-09-05',
  type: 'AmountIncrease',
  amount: 250,
  sellerSigned: true,
  partySigned: true,
};

test('uses the system-wide Commissions endpoint', async () => {
  const originalFetch = globalThis.fetch;
  /** @type {{ url?: string, method?: string }} */
  const captured = {};
  globalThis.fetch = async (input, init) => {
    captured.url = String(input);
    captured.method = init?.method;
    return Response.json({
      items: [{ id: 'commission-1', code: '26CM01' }],
      page: 2,
      pageSize: 10,
      totalCount: 1,
      totalPages: 1,
    });
  };

  try {
    const result = await listCommissions({ page: 2, pageSize: 10 });

    assert.match(String(captured.url), /\/api\/v1\/commissions\?page=2&pageSize=10$/);
    assert.equal(captured.method, 'GET');
    assert.equal(result.success && result.commissions[0]?.code, '26CM01');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('uses the contract-scoped Commission endpoint for get, create, and update', async () => {
  const originalFetch = globalThis.fetch;
  /** @type {{ url: string, method: string, body?: string }[]} */
  const captured = [];
  globalThis.fetch = async (input, init) => {
    captured.push({
      url: String(input),
      method: init?.method ?? 'GET',
      body: typeof init?.body === 'string' ? init.body : undefined,
    });
    return Response.json({ id: 'commission-1', code: '26CM01' });
  };

  try {
    await getCommission('contract-1');
    await createCommission('contract-1', FORM_VALUES, [
      { paymentRatioPercent: 100, paymentCondition: 'Thanh toán đủ' },
    ]);
    await updateCommission('contract-1', FORM_VALUES, [
      { paymentRatioPercent: 100, paymentCondition: 'Thanh toán đủ' },
    ]);

    assert.deepEqual(
      captured.map(({ url, method }) => ({ path: url, method })),
      [
        { path: '/api/backend/api/v1/contracts/contract-1/commission', method: 'GET' },
        { path: '/api/backend/api/v1/contracts/contract-1/commission', method: 'POST' },
        { path: '/api/backend/api/v1/contracts/contract-1/commission', method: 'PUT' },
      ],
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('uses Commission annex endpoints and preserves commissionId responses', async () => {
  const originalFetch = globalThis.fetch;
  /** @type {{ url: string, method: string }[]} */
  const captured = [];
  globalThis.fetch = async (input, init) => {
    captured.push({ url: String(input), method: init?.method ?? 'GET' });
    return Response.json([
      {
        id: 'annex-1',
        commissionId: 'commission-1',
        annexCode: '26CM01/AN-01',
      },
    ]);
  };

  try {
    const listed = await listCommissionAnnexes('contract-1');
    await createCommissionAnnex('contract-1', ANNEX_VALUES);
    await updateCommissionAnnex('contract-1', 'annex-1', ANNEX_VALUES);

    assert.equal(listed.success && listed.annexes[0]?.commissionId, 'commission-1');
    assert.deepEqual(
      captured.map(({ url, method }) => ({ path: url, method })),
      [
        {
          path: '/api/backend/api/v1/contracts/contract-1/commission/annexes',
          method: 'GET',
        },
        {
          path: '/api/backend/api/v1/contracts/contract-1/commission/annexes',
          method: 'POST',
        },
        {
          path: '/api/backend/api/v1/contracts/contract-1/commission/annexes/annex-1',
          method: 'PUT',
        },
      ],
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
