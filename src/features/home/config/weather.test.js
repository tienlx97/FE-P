import assert from 'node:assert/strict';
import { test } from 'node:test';

import { newsTime, weatherLabel } from './weather.js';

test('unknown weather never gets a fabricated sunny fallback', () => {
  assert.equal(weatherLabel(999), 'Chưa rõ trạng thái');
  assert.equal(weatherLabel(95), 'Mưa dông');
});
test('missing/invalid publication time is explicit; UTC is converted to Vietnam time', () => {
  assert.equal(newsTime(null), 'Chưa có thời gian đăng');
  assert.equal(newsTime('invalid'), 'Chưa có thời gian đăng');
  assert.match(newsTime('2026-10-05T03:00:00Z'), /10:00/);
});
