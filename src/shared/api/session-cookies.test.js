import assert from 'node:assert/strict';
import test from 'node:test';

import { clearSession } from './session-cookies.js';

test('logout reports a failed cookie clear instead of claiming success', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response(null, { status: 500 });
    assert.equal(await clearSession(), false);
    globalThis.fetch = async () => {
      throw new Error('Offline');
    };
    assert.equal(await clearSession(), false);
    globalThis.fetch = async () => Response.json({ ok: true });
    assert.equal(await clearSession(), true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
