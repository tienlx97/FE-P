import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  hourLabel,
  isLikelyRain,
  newsTime,
  uvLabel,
  weatherLabel,
} from './weather.js';

test('unknown weather never gets a fabricated sunny fallback', () => {
  assert.equal(weatherLabel(999), 'Chưa rõ trạng thái');
  assert.equal(weatherLabel(95), 'Mưa dông');
});
test('missing/invalid publication time is explicit; UTC is converted to Vietnam time', () => {
  assert.equal(newsTime(null), 'Chưa có thời gian đăng');
  assert.equal(newsTime('invalid'), 'Chưa có thời gian đăng');
  assert.match(newsTime('2026-10-05T03:00:00Z'), /10:00/);
});
test('UV bands, hour labels and rain threshold', () => {
  assert.equal(uvLabel(8.9), 'Rất cao');
  assert.equal(uvLabel(2), 'Thấp');
  assert.equal(uvLabel(null), null);
  assert.equal(hourLabel('2026-10-05T09:00'), '9h');
  assert.equal(isLikelyRain(50), true);
  assert.equal(isLikelyRain(49), false);
});
