const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const { pathToFileURL } = require('node:url');

const load = () => import(pathToFileURL(path.resolve(__dirname, '..', 'checks', 'no-format-churn.mjs')).href);

test('changedLines counts inserted and deleted lines', async () => {
  const { changedLines } = await load();
  assert.equal(changedLines('a\nb\nc', 'a\nb\nc'), 0);
  assert.equal(changedLines('a\nb\nc', 'a\nX\nc'), 2);
  assert.equal(changedLines('a\nc', 'a\nb\nc'), 1);
});

test('a reformat with no real change, or one burying a small edit, is churn', async () => {
  const { churnKind } = await load();
  assert.equal(churnKind(0, 0), null);
  assert.equal(churnKind(120, 0), 'format-only');
  assert.equal(churnKind(120, 6), 'mixed');
  assert.equal(churnKind(30, 25), null, 'a real edit that also touches nearby lines');
  assert.equal(churnKind(12, 2), null, 'too small to matter');
});
