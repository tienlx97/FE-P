import assert from 'node:assert/strict';
import { test } from 'node:test';

import { publisherColor, publishers, relativeTime } from './news.js';

test('known publishers get stable category colours; unknown ones stay neutral', () => {
  assert.equal(publisherColor('VnExpress'), 'purple');
  assert.equal(publisherColor('Splash247'), 'gray');
});
test('publisher list keeps first-seen order without duplicates', () => {
  assert.deepEqual(
    publishers([{ source: 'B' }, { source: 'A' }, { source: 'B' }]),
    ['B', 'A'],
  );
});
test('relative time covers minutes, hours, older dates and missing values', () => {
  const now = Date.parse('2026-10-05T05:00:00Z');
  assert.equal(relativeTime('2026-10-05T04:59:40Z', now), 'Vừa xong');
  assert.equal(relativeTime('2026-10-05T04:48:00Z', now), '12 phút trước');
  assert.equal(relativeTime('2026-10-05T02:00:00Z', now), '3 giờ trước');
  assert.equal(relativeTime('2026-10-02T02:00:00Z', now), '02-10');
  assert.equal(relativeTime(null, now), 'Chưa có thời gian đăng');
});
