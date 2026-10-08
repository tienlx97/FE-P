import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const cssPath = path.join(import.meta.dirname, 'theme.built.css');

// Astryx 0.6.6 renders the table scroll wrapper as an inline-only
// ScrollableArea (overflow-y: hidden). Without this override a fixed-height
// AdvanceTable can't scroll its rows; an Astryx bump must not drop it.
test('table scroll wrapper keeps vertical scrolling', async () => {
  const css = await readFile(cssPath, 'utf8');
  const rule = css.match(/\.astryx-table-scroll-wrapper\s*\{(?<body>[^}]*)\}/u);
  assert.ok(rule, 'theme.built.css has an .astryx-table-scroll-wrapper rule');
  assert.match(rule.groups.body, /overflow-y:\s*auto\s*!important/u);
  assert.match(rule.groups.body, /height:\s*100%/u);
});
