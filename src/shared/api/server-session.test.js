import assert from 'node:assert/strict';
import test from 'node:test';

import { clearPasswordChangedSession } from './server-session.js';

test('confirmed self-service password changes clear all cookies; failures and Admin resets preserve them', () => {
  const writes = [];
  const store =
    /** @type {Awaited<ReturnType<typeof import('next/headers').cookies>>} */ (
      /** @type {unknown} */ ({ set: (...args) => writes.push(args) })
    );
  const selfPath = ['api', 'v1', 'users', 'me', 'password'];
  for (const status of [400, 401, 403, 500, 502]) {
    clearPasswordChangedSession(
      store,
      'POST',
      selfPath,
      new Response(null, { status }),
    );
    assert.equal(writes.length, 0);
  }
  clearPasswordChangedSession(
    store,
    'POST',
    ['api', 'v1', 'users', 'employee-id', 'password', 'reset'],
    new Response(null, { status: 200 }),
  );
  clearPasswordChangedSession(
    store,
    'GET',
    selfPath,
    new Response(null, { status: 200 }),
  );
  assert.equal(writes.length, 0);
  clearPasswordChangedSession(
    store,
    'POST',
    selfPath,
    new Response(null, { status: 200 }),
  );
  assert.equal(writes.length, 6);
  assert.equal(new Set(writes.map(([key]) => key)).size, 6);
  assert.ok(
    writes.every(([, value, options]) => value === '' && options.maxAge === 0),
  );
});
