import assert from 'node:assert/strict';
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { announcements } from './announcements.js';
import { companies } from './companies.js';
import { events } from './events.js';
import { featuredNews, latestNews, news } from './news.js';
import { videos } from './videos.js';

const PUBLIC_DIR = fileURLToPath(
  new URL('../../../../public', import.meta.url),
);

/**
 * Every image the home page renders, as `{ where, image }` pairs.
 *
 * A wrong path here fails silently in the browser — Next.js serves a 404
 * and the layout stays intact, so nothing in lint, typecheck, or the build
 * notices. This list is what turns that into a test failure instead.
 */
const allImages = [
  ...news.map((item) => ({ where: `news/${item.id}`, image: item.image })),
  ...events.map((item) => ({ where: `events/${item.id}`, image: item.image })),
  ...videos.map((item) => ({
    where: `videos/${item.id}`,
    image: item.thumbnail,
  })),
  ...companies.map((item) => ({
    where: `companies/${item.name}`,
    image: { ...item.logo, alt: `Logo ${item.name}` },
  })),
];

test('every referenced image exists in public/', () => {
  for (const { where, image } of allImages) {
    assert.ok(
      image.src.startsWith('/images/'),
      `${where}: image src must be a public path, got "${image.src}"`,
    );
    const filePath = join(PUBLIC_DIR, image.src);
    assert.ok(existsSync(filePath), `${where}: missing file ${image.src}`);
    assert.ok(statSync(filePath).size > 0, `${where}: empty file ${image.src}`);
  }
});

test('every image declares real dimensions and alt text', () => {
  for (const { where, image } of allImages) {
    assert.ok(image.width > 0, `${where}: width must be a positive number`);
    assert.ok(image.height > 0, `${where}: height must be a positive number`);
    // next/image reserves layout space from width/height; alt text is what
    // makes the photo reachable to a screen reader at all.
    assert.ok(image.alt.trim().length > 0, `${where}: alt text is required`);
  }
});

test('every dated entry uses an ISO YYYY-MM-DD date', () => {
  const dated = [...news, ...announcements, ...events, ...videos];
  for (const entry of dated) {
    assert.match(
      entry.date,
      /^\d{4}-\d{2}-\d{2}$/,
      `${entry.id}: date must be ISO YYYY-MM-DD`,
    );
  }
});

test('events use HH:mm times or null for all-day entries', () => {
  for (const event of events) {
    if (event.time !== null) {
      assert.match(event.time, /^\d{2}:\d{2}$/, `${event.id}: bad time`);
    }
  }
});

test('news splits into a non-empty hero set and a non-empty grid', () => {
  assert.ok(featuredNews.length > 0, 'the hero carousel would render empty');
  assert.ok(latestNews.length > 0, 'the news grid would render empty');
  assert.equal(featuredNews.length + latestNews.length, news.length);
  const featuredIds = new Set(featuredNews.map(({ id }) => id));
  assert.ok(
    latestNews.every(({ id }) => !featuredIds.has(id)),
    'a story must not appear in both home regions',
  );
});

test('every link target is an in-app path or a page anchor', () => {
  const targets = [
    ...news.map(({ id, href }) => ({ id, href })),
    ...announcements.map(({ id, href }) => ({ id, href })),
  ];
  for (const { id, href } of targets) {
    assert.ok(
      href.startsWith('/') || href.startsWith('#'),
      `${id}: "${href}" is not an internal path or anchor`,
    );
  }
});

test('ids are unique within each collection', () => {
  const collections = {
    news,
    announcements,
    events,
    videos,
  };
  for (const [name, entries] of Object.entries(collections)) {
    const ids = entries.map((entry) => entry.id);
    assert.equal(
      new Set(ids).size,
      ids.length,
      `${name}: duplicate id (React keys would collide)`,
    );
  }
});
