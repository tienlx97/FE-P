import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

import { metaTheme } from './meta.js';

test('compact mode shrinks every Meta text size (xs and up) by 1px', async () => {
  const css = await readFile(
    new URL('./compact-mode.css', import.meta.url),
    'utf8',
  );
  const steps = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'];
  for (const step of steps) {
    const token = `--font-size-${step}`;
    assert.ok(
      css.includes(`${token}: calc(${metaTheme.tokens[token]} - 1px);`),
      token,
    );
  }
});
