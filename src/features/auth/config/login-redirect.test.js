import assert from 'node:assert/strict';
import test from 'node:test';

import { loginDestination } from './login-redirect.js';
import { loginSchema } from './login-schema.js';

test('login returns only to an internal page without a login loop', () => {
  for (const next of [
    null,
    '',
    '//evil.example',
    'https://evil.example',
    '/\\evil.example',
    '/login?next=/',
    '/ logistics',
  ]) {
    assert.equal(loginDestination(next), '/');
  }
  assert.equal(
    loginDestination('/logistics/contracts?status=draft'),
    '/logistics/contracts?status=draft',
  );
});

test('login validates 12 digit CCCD and preserves leading zeros', () => {
  const values = {
    nationalId: ' 000000000001 ',
    password: 'password',
    rememberMe: false,
  };
  assert.equal(loginSchema.parse(values).nationalId, '000000000001');
  for (const nationalId of ['', '123', '12345678901a']) {
    assert.equal(
      loginSchema.safeParse({ ...values, nationalId }).success,
      false,
    );
  }
});
