import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  hourLabel,
  isLikelyRain,
  newsTime,
  uvLabel,
  weatherLabel,
  weatherTone,
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
test('weather tones follow natural colours', () => {
  assert.equal(weatherTone(0), 'orange');
  assert.equal(weatherTone(0, false), 'yellow');
  assert.equal(weatherTone(2), 'yellow');
  assert.equal(weatherTone(3), 'gray');
  assert.equal(weatherTone(53), 'cyan');
  assert.equal(weatherTone(63), 'blue');
  assert.equal(weatherTone(95), 'purple');
  assert.equal(weatherTone(999), 'gray');
});
