import assert from 'node:assert/strict';
import test from 'node:test';

import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '../config/session-keys.js';
import { endServerSession } from './end-server-session.js';

test('logout preserves credentials on failed revocation and clears only after acknowledgement', async () => {
  const originalFetch = globalThis.fetch;
  const writes = [];
  const credentials = new Map([[REFRESH_TOKEN_KEY, 'disposable-test-token']]);
  // Only get/set are used by session handling; no Next request context needed.
  const store =
    /** @type {Awaited<ReturnType<typeof import('next/headers').cookies>>} */ (
      /** @type {unknown} */ ({
        get: (key) =>
          credentials.has(key) ? { value: credentials.get(key) } : undefined,
        set: (...args) => writes.push(args),
      })
    );
  try {
    for (const status of [400, 401, 500, 503]) {
      globalThis.fetch = async () => new Response(null, { status });
      assert.equal(
        (await endServerSession(store, 'http://backend.test')).status,
        503,
      );
      assert.equal(writes.length, 0);
    }
    globalThis.fetch = async () => {
      throw new Error('Connection lost or timed out');
    };
    assert.equal(
      (await endServerSession(store, 'http://backend.test')).status,
      503,
    );
    assert.equal(writes.length, 0);

    globalThis.fetch = async (url, options) => {
      assert.equal(url, 'http://backend.test/api/v1/authentication/logout');
      assert.equal(options.method, 'POST');
      assert.equal(
        JSON.parse(options.body).RefreshToken,
        'disposable-test-token',
      );
      assert.equal(writes.length, 0);
      return new Response(null, { status: 204 });
    };
    assert.equal(
      (await endServerSession(store, 'http://backend.test')).status,
      200,
    );
    assert.equal(writes.length, 6);
    assert.ok(
      writes.every(
        ([, value, options]) => value === '' && options.maxAge === 0,
      ),
    );

    writes.length = 0;
    credentials.delete(REFRESH_TOKEN_KEY);
    credentials.set(ACCESS_TOKEN_KEY, 'disposable-access-token');
    assert.equal(
      (await endServerSession(store, 'http://backend.test')).status,
      503,
    );
    assert.equal(writes.length, 0);
    credentials.clear();
    assert.equal(
      (await endServerSession(store, 'http://backend.test')).status,
      200,
    );
    assert.equal(writes.length, 6);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
