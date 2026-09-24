import assert from 'node:assert/strict';
import test from 'node:test';

import { deleteShipment, searchAllShipments } from './shipments.js';

test('parses full-set Shipment money, quantity, cost, and VGM totals', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    Response.json({
      page: { items: [], page: 1, pageSize: 25, totalCount: 0, totalPages: 0 },
      totals: [{ currency: 'USD', invoiceValue: 10, declarationValue: 20 }],
      logisticsCostTotal: 30,
      declarationValueVndTotal: 40,
      quantityTotals: [
        { unit: 'Cont', amount: 2 },
        { unit: 'Kien', amount: 5 },
      ],
      vgmCountTotal: 4,
      summary: {
        fclCount: 3,
        lclCount: 1,
        completedCount: 2,
        customsDeclarationCount: 4,
        coCount: 2,
        statusCounts: [
          { status: 'Booked', count: 1 },
          { status: 'Completed', count: 2 },
        ],
      },
    });

  try {
    const result = await searchAllShipments();

    assert.equal(result.success, true);
    if (!result.success) return;
    assert.deepEqual(result.quantityTotals, [
      { unit: 'Cont', amount: 2 },
      { unit: 'Kien', amount: 5 },
    ]);
    assert.equal(result.logisticsCostTotal, 30);
    assert.equal(result.declarationValueVndTotal, 40);
    assert.equal(result.vgmCountTotal, 4);
    assert.deepEqual(result.summary, {
      fclCount: 3,
      lclCount: 1,
      completedCount: 2,
      customsDeclarationCount: 4,
      coCount: 2,
      statusCounts: { Booked: 1, Completed: 2 },
      costTotalsByCategory: [],
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('deletes a Shipment through its contract-scoped endpoint', async () => {
  const originalFetch = globalThis.fetch;
  /** @type {{ url?: string, method?: string }} */
  const captured = {};
  globalThis.fetch = async (input, init) => {
    captured.url = String(input);
    captured.method = init?.method;
    return new Response(null, { status: 204 });
  };

  try {
    const result = await deleteShipment('contract-1', 'shipment-1');

    assert.deepEqual(captured, {
      url: '/api/backend/api/v1/contracts/contract-1/shipments/shipment-1',
      method: 'DELETE',
    });
    assert.deepEqual(result, { success: true });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
