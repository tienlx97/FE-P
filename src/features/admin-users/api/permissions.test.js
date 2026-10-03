import assert from 'node:assert/strict';
import test from 'node:test';

import { previewInheritedPermissions } from './permissions.js';

test('loads inherited permissions for the selected department', async () => {
  const originalFetch = globalThis.fetch;
  /** @type {{ input?: string, init?: RequestInit }} */
  const captured = {};
  const permissions = [
    {
      key: 'logistics:view',
      description: 'Xem nghiệp vụ logistics',
      scopeType: 'branch',
      scopeId: 'branch-1',
    },
  ];
  globalThis.fetch = async (input, init) => {
    captured.input = String(input);
    captured.init = init;
    return Response.json(permissions);
  };

  try {
    const result = await previewInheritedPermissions('department / logistics');

    assert.deepEqual(result, permissions);
    assert.equal(
      captured.input,
      '/api/backend/api/v1/permissions/inherited?departmentId=department%20%2F%20logistics',
    );
    assert.equal(captured.init?.method, 'GET');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('a failed permission preview is an error, not an empty permission set', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    Response.json({ detail: 'Unavailable' }, { status: 503 });
  try {
    await assert.rejects(
      () => previewInheritedPermissions('department-1'),
      /Unavailable/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
