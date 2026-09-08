import assert from 'node:assert/strict';
import test from 'node:test';

import { GET } from './route.js';

test('readiness checks HTTP status and dependency body without leaking errors', async (context) => {
  const original = process.env.API_BASE_URL;
  process.env.API_BASE_URL = 'http://api:8080';
  context.after(() => {
    if (original === undefined) delete process.env.API_BASE_URL;
    else process.env.API_BASE_URL = original;
  });
  const fetchMock = context.mock.method(
    globalThis,
    'fetch',
    async () => new Response('Healthy'),
  );
  let response = await GET();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'Healthy' });
  assert.equal(
    fetchMock.mock.calls[0].arguments[0],
    'http://api:8080/health/ready',
  );
  for (const dependency of [
    new Response('Unhealthy'),
    new Response('Healthy', { status: 503 }),
  ]) {
    fetchMock.mock.mockImplementation(async () => dependency);
    response = await GET();
    assert.equal(response.status, 503);
  }
  fetchMock.mock.mockImplementation(async () => {
    throw new Error('private connection string');
  });
  response = await GET();
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { status: 'Unhealthy' });
});
