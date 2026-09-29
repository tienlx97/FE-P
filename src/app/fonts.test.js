import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const cssPath = path.join(projectRoot, 'src/app/globals.css');

test('InterVariable is the only self-hosted font face', async () => {
  const css = await readFile(cssPath, 'utf8');
  const faceBlocks = [...css.matchAll(/@font-face\s*\{(?<body>[^}]*)\}/gu)].map(
    (match) => match.groups.body,
  );
  assert.equal(faceBlocks.length, 2);

  for (const [style, fileName] of [
    ['normal', 'InterVariable.woff2'],
    ['italic', 'InterVariable-Italic.woff2'],
  ]) {
    const face = faceBlocks.find(
      (block) =>
        block.includes('font-family: InterVariable') &&
        block.includes(`font-style: ${style}`),
    );
    assert.ok(face, `missing InterVariable ${style}`);
    assert.match(face, /font-weight: 100 900/u);
    assert.match(
      face,
      new RegExp(`/fonts/inter/${fileName.replaceAll('.', '\\.')}`),
    );

    const font = await readFile(
      path.join(projectRoot, 'public/fonts/inter', fileName),
    );
    assert.ok(font.byteLength > 100_000, `${fileName} is unexpectedly small`);
  }

  const shipped = (await readdir(path.join(projectRoot, 'public/fonts'))).sort();
  assert.deepEqual(shipped, ['inter']);
});

test('the app theme is Meta and names only InterVariable', async () => {
  const provider = await readFile(
    path.join(projectRoot, 'src/shared/components/theme-provider.jsx'),
    'utf8',
  );
  assert.match(provider, /<Theme theme=\{metaTheme\}/u);

  const layout = await readFile(
    path.join(projectRoot, 'src/app/layout.jsx'),
    'utf8',
  );
  assert.doesNotMatch(layout, /next\/font/u);

  const { metaTheme } = await import(
    '../shared/components/custom/meta/meta.js'
  );
  for (const token of [
    '--font-family-body',
    '--font-family-heading',
    '--font-family-code',
  ]) {
    assert.match(metaTheme.tokens[token], /^InterVariable,/u, token);
  }
});
