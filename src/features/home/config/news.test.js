import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  articlesInTopic,
  findTopic,
  LOGISTICS_TOPICS,
  NEWS_TOPICS,
  relativeTime,
} from './news.js';

test('topic tabs start with an all-topics entry and have unique values', () => {
  for (const topics of [NEWS_TOPICS, LOGISTICS_TOPICS]) {
    assert.equal(topics[0].value, 'all');
    assert.equal(
      new Set(topics.map((topic) => topic.value)).size,
      topics.length,
    );
  }
  assert.equal(findTopic(NEWS_TOPICS, 'cong-nghe')?.label, 'Công nghệ');
  assert.equal(findTopic(NEWS_TOPICS, 'unknown'), null);
});
test('topic filter keeps everything for "all"', () => {
  const articles = [
    { topic: 'the-thao' },
    { topic: 'cong-nghe' },
    { topic: null },
  ];
  assert.equal(articlesInTopic(articles, 'all').length, 3);
  assert.deepEqual(articlesInTopic(articles, 'cong-nghe'), [
    { topic: 'cong-nghe' },
  ]);
});
test('relative time covers minutes, hours, older dates and missing values', () => {
  const now = Date.parse('2026-10-05T05:00:00Z');
  assert.equal(relativeTime('2026-10-05T04:59:40Z', now), 'Vừa xong');
  assert.equal(relativeTime('2026-10-05T04:48:00Z', now), '12 phút trước');
  assert.equal(relativeTime('2026-10-05T02:00:00Z', now), '3 giờ trước');
  assert.equal(relativeTime('2026-10-02T02:00:00Z', now), '02-10');
  assert.equal(relativeTime(null, now), 'Chưa có thời gian đăng');
});
