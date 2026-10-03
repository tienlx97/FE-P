import assert from 'node:assert/strict';
import test from 'node:test';

import { login } from './login.js';

test('wrong credentials show Vietnamese feedback rather than backend English', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    Response.json({ detail: 'Invalid credentials' }, { status: 401 });
  try {
    const result = await login({
      nationalId: '000000000001',
      password: 'incorrect',
      rememberMe: false,
    });
    assert.deepEqual(result, {
      success: false,
      message: 'Sai số CCCD hoặc mật khẩu',
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
