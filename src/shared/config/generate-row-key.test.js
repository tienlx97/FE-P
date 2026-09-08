import assert from 'node:assert/strict';
import test from 'node:test';

import { generateRowKey } from './generate-row-key.js';

// `globalThis.crypto` is a getter-only accessor in Node — redefine it
// (configurable: true) rather than assigning, so each test can swap it out.
function stubCrypto(value) {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
  Object.defineProperty(globalThis, 'crypto', {
    value,
    configurable: true,
    writable: true,
  });
  return () => Object.defineProperty(globalThis, 'crypto', original);
}

test('uses crypto.randomUUID when the context is secure', () => {
  const restore = stubCrypto({ randomUUID: () => 'fixed-uuid' });
  try {
    assert.equal(generateRowKey(), 'fixed-uuid');
  } finally {
    restore();
  }
});

test('falls back to a non-crypto token when crypto.randomUUID is unavailable', () => {
  const restore = stubCrypto({});
  try {
    const key = generateRowKey();
    assert.match(key, /^[0-9a-z]+-[0-9a-z]+$/);
  } finally {
    restore();
  }
});

test('fallback keys are unique across calls', () => {
  const restore = stubCrypto({});
  try {
    const keys = new Set(Array.from({ length: 100 }, () => generateRowKey()));
    assert.equal(keys.size, 100);
  } finally {
    restore();
  }
});
