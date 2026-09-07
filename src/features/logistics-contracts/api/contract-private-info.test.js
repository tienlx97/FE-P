import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getContractPrivateInfo,
  upsertContractPrivateInfo,
} from './contract-private-info.js';

/** @type {import('../types/index.js').ContractPrivateInfoFormValues} */
const BASE_VALUES = {
  boqSentDate: '2026-01-10',
  containerCount: 4,
  costPricePerContainer: 1000,
  quotedPricePerContainer: 1500,
  unitCostLabor: 100,
  unitCostSandblasting: 50,
  unitCostPainting: 60,
  unitCostFactory: 70,
  volumeSale: 10,
  volumeMaterial: 12,
  profit: 2000,
  totalAmountUsd: 6000,
  exchangeRateVnd: 26130,
};

test('upsertContractPrivateInfo sends every field as PascalCase, blank date as null', async () => {
  const originalFetch = globalThis.fetch;
  /** @type {{ input?: unknown, init?: RequestInit }} */
  const captured = {};
  globalThis.fetch = async (input, init) => {
    captured.input = input;
    captured.init = init;
    return Response.json({ boqSentDate: null });
  };

  try {
    await upsertContractPrivateInfo(
      'contract-1',
      { ...BASE_VALUES, boqSentDate: '' },
      [],
    );

    assert.match(String(captured.input), /\/contracts\/contract-1\/private-info$/);
    assert.equal(captured.init?.method, 'PUT');

    const body = JSON.parse(String(captured.init?.body));
    assert.equal(body.BoqSentDate, null);
    assert.equal(body.ContainerCount, 4);
    assert.equal(body.QuotedPricePerContainer, 1500);
    assert.equal(body.ExchangeRateVnd, 26130);
    assert.deepEqual(body.ExtraFields, []);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('upsertContractPrivateInfo sends unset numeric fields as null', async () => {
  const originalFetch = globalThis.fetch;
  /** @type {{ init?: RequestInit }} */
  const captured = {};
  globalThis.fetch = async (_input, init) => {
    captured.init = init;
    return Response.json({});
  };

  try {
    await upsertContractPrivateInfo(
      'contract-1',
      { boqSentDate: '' },
      [],
    );

    const body = JSON.parse(String(captured.init?.body));
    assert.equal(body.ContainerCount, null);
    assert.equal(body.Profit, null);
    assert.equal(body.TotalAmountUsd, null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('upsertContractPrivateInfo drops extra-field rows with a blank key', async () => {
  const originalFetch = globalThis.fetch;
  /** @type {{ init?: RequestInit }} */
  const captured = {};
  globalThis.fetch = async (_input, init) => {
    captured.init = init;
    return Response.json({});
  };

  try {
    await upsertContractPrivateInfo('contract-1', BASE_VALUES, [
      { rowKey: 'a', key: 'Ghi chú thêm', value: 'Đợt 1' },
      { rowKey: 'b', key: '  ', value: 'bị bỏ qua' },
    ]);

    const body = JSON.parse(String(captured.init?.body));
    assert.deepEqual(body.ExtraFields, [
      { Key: 'Ghi chú thêm', Value: 'Đợt 1' },
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('getContractPrivateInfo returns privateInfo on success', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    Response.json({ boqSentDate: '2026-01-10', volumeDeclaration: 9700 });

  try {
    const result = await getContractPrivateInfo('contract-1');
    assert.equal(result.success, true);
    assert.equal(result.success && result.privateInfo.volumeDeclaration, 9700);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('getContractPrivateInfo folds a 403 into a generic error, not an exists:false state', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ detail: 'Forbidden' }), { status: 403 });

  try {
    const result = await getContractPrivateInfo('contract-1');
    assert.equal(result.success, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
