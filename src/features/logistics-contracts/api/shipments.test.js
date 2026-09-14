import assert from 'node:assert/strict';
import test from 'node:test';

import { deleteShipment } from './shipments.js';

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
