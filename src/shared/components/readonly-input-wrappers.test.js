import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';

/**
 * Guards the production-only readonly-background bug fixed 2026-09-16 (see
 * `readonly-input-style.jsx`'s doc comment for the full root cause: a CSS
 * `@layer` ordering difference between dev and a production build makes
 * `theme.js`'s `'text-input'/'number-input'/'textarea': { readonly: {...} }`
 * overrides lose to Astryx's own component base styles — confirmed by
 * rendering `rgb(255, 255, 255)` instead of `rgb(237, 245, 241)` against a
 * local `next build` + `next start`). The fix moved the readonly tint to
 * app-level StyleX wrappers (`text-input.jsx`/`number-input.jsx`/
 * `text-area.jsx`), which a full rendering test can't verify here — this
 * repo's `node --test` runner has no JSX/Babel transform (`node-alias-
 * loader.mjs` only resolves the `@/*` path alias), so no test in this repo
 * renders a component; every existing one (see e.g.
 * `docs-shell-contract.test.js`) instead asserts on component *source
 * text* the same way this one does.
 */

const wrapperFiles = ['text-input.jsx', 'number-input.jsx', 'text-area.jsx'];
const wrapperSources = await Promise.all(
  wrapperFiles.map((path) => readFile(new URL(path, import.meta.url), 'utf8')),
);

const srcDirectory = new URL('../../', import.meta.url);
const allSourcePaths = (await readdir(srcDirectory, { recursive: true }))
  .filter((path) => /\.jsx$/u.test(path))
  .map((path) => path.replaceAll('\\', '/'));
const wrapperOwnPaths = new Set(
  wrapperFiles.map((path) => `shared/components/${path}`),
);
const callerPaths = allSourcePaths.filter((path) => !wrapperOwnPaths.has(path));
const callerSources = await Promise.all(
  callerPaths.map((path) => readFile(new URL(path, srcDirectory), 'utf8')),
);

test('text-input/number-input/text-area wrappers merge the shared readonly tint', () => {
  for (const [index, source] of wrapperSources.entries()) {
    const label = wrapperFiles[index];
    assert.match(
      source,
      /from '\.\/readonly-input-style\.jsx'/,
      `${label} should import the shared readonly tint style`,
    );
    assert.match(
      source,
      /isReadOnly[\s\S]*readonlyInputStyle\.tinted/,
      `${label} should merge readonlyInputStyle.tinted when isReadOnly`,
    );
  }
});

test('read-only-lock.jsx shares the same tint style, not its own copy', async () => {
  const readOnlyLockSource = await readFile(
    new URL('./read-only-lock.jsx', import.meta.url),
    'utf8',
  );
  assert.match(
    readOnlyLockSource,
    /from '\.\/readonly-input-style\.jsx'/,
    'read-only-lock.jsx should import the shared tint style',
  );
  assert.doesNotMatch(
    readOnlyLockSource,
    /stylex\.create\(/,
    'read-only-lock.jsx should not define its own stylex.create — it would duplicate readonly-input-style.jsx',
  );
});

test('nothing outside the wrappers imports TextInput/NumberInput/TextArea straight from Astryx', () => {
  const offenders = [];
  callerPaths.forEach((path, index) => {
    if (
      /@astryxdesign\/core\/(TextInput|NumberInput|TextArea)'/.test(
        callerSources[index],
      )
    ) {
      offenders.push(path);
    }
  });
  assert.deepEqual(
    offenders,
    [],
    'these files should import from shared/components/text-input.jsx, number-input.jsx, or text-area.jsx instead',
  );
});
