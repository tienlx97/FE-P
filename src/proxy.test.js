import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

// Next reads `config.matcher` statically from proxy.js (it must stay a
// literal there), and proxy.js imports `next/server`, which plain Node
// cannot load — so the pattern is read from the source.
const source = readFileSync(new URL('./proxy.js', import.meta.url), 'utf8');
const pattern = /matcher:\s*\['([^']+)'\]/.exec(source)?.[1];

/** The matcher as Next applies it: the whole pathname against the pattern. */
const matches = (/** @type {string} */ pathname) => new RegExp(`^${pattern}$`).test(pathname);

test('the route gate runs on pages, never on /api (bodies there must not be buffered)', () => {
  assert.ok(pattern, 'proxy.js has a single-pattern matcher');
  assert.equal(matches('/admin/backups'), true);
  assert.equal(matches('/logistics/schedule'), true);
  // A backup upload > 10 MB through the proxy reached the API cut short.
  assert.equal(matches('/api/backend/api/v1/backups/upload'), false);
  assert.equal(matches('/api/session'), false);
  assert.equal(matches('/_next/static/chunk.js'), false);
});
