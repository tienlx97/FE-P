import assert from 'node:assert/strict';
import test from 'node:test';

import {
  apiRequest,
  SESSION_EXPIRED_MESSAGE,
  SESSION_REVOKED_MESSAGE,
  SIGNED_IN_ELSEWHERE_MESSAGE,
} from './api-client.js';

const SESSION_END_CASES = [
  {
    detail: 'Signed in on another device',
    expectedMessage: SIGNED_IN_ELSEWHERE_MESSAGE,
  },
  {
    detail: 'Session has been revoked; sign in again',
    expectedMessage: SESSION_REVOKED_MESSAGE,
  },
  {
    detail: 'Access token expired',
    expectedMessage: SESSION_EXPIRED_MESSAGE,
  },
];

for (const { detail, expectedMessage } of SESSION_END_CASES) {
  test(`maps backend 401 detail "${detail}" to its Vietnamese message`, async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ detail }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });

    try {
      const result = await apiRequest('/api/v1/users', {
        redirectOnSessionExpiry: false,
      });

      assert.equal(result.success, false);
      assert.equal(result.status, 401);
      assert.equal(result.message, expectedMessage);
      assert.equal(result.sessionExpired, true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
}

test('returns a blob for a successful file export', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('{"version":1}', {
    headers: { 'Content-Type': 'application/json' },
  });
  try {
    const result = await apiRequest('/api/v1/backups/public-data', { responseType: 'blob' });
    assert.equal(result.success, true);
    assert.equal(await result.data.text(), '{"version":1}');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('keeps API error details for a failed file export', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ detail: 'Xuất dữ liệu thất bại.' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
  try {
    const result = await apiRequest('/api/v1/backups/public-data', { responseType: 'blob' });
    assert.equal(result.success, false);
    assert.equal(result.message, 'Xuất dữ liệu thất bại.');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
