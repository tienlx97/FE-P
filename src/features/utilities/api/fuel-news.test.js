import assert from 'node:assert/strict';
import test from 'node:test';

import { parseFuelNews } from './fuel-news.js';

const XML = `<rss><channel>
<item><title>Giá xăng hôm nay giảm - Laodong.vn</title><link>https://news.google.com/a</link><pubDate>Sat, 26 Sep 2026 02:53:48 GMT</pubDate><source url="https://laodong.vn">Laodong.vn</source></item>
<item><title>Xăng tăng &amp; dầu giảm - VnExpress</title><link>https://news.google.com/b</link><pubDate>Fri, 25 Sep 2026 09:00:00 GMT</pubDate><source url="https://vnexpress.net">VnExpress</source></item>
<item><title>Tin mới nhất - Báo X</title><link>https://news.google.com/c</link><pubDate>Sat, 26 Sep 2026 08:00:00 GMT</pubDate><source url="https://x.vn">Báo X</source></item>
<item><title>Link lạ</title><link>javascript:alert(1)</link><pubDate>Sat, 26 Sep 2026 09:00:00 GMT</pubDate></item>
</channel></rss>`;

test('parseFuelNews sorts newest first, strips the source suffix, drops unsafe links', () => {
  const articles = parseFuelNews(XML);
  assert.deepEqual(
    articles.map((article) => article.title),
    ['Tin mới nhất', 'Giá xăng hôm nay giảm', 'Xăng tăng & dầu giảm'],
  );
  assert.equal(articles[1].source, 'Laodong.vn');
  assert.equal(articles[1].publishedAt, '2026-09-26T02:53:48.000Z');
});

test('parseFuelNews respects the limit and tolerates junk', () => {
  assert.equal(parseFuelNews(XML, 1).length, 1);
  assert.deepEqual(parseFuelNews('not xml'), []);
});
