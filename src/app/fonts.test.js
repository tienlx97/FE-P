import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const cssPath = path.join(projectRoot, 'src/app/globals.css');
const fontDirectory = path.join(projectRoot, 'public/fonts/react-docs');

const vietnameseFaces = [
  [
    'Optimistic Display Vietnamese',
    500,
    'normal',
    'Optimistic_Display_Viet_W_Md.woff2',
  ],
  [
    'Optimistic Display Vietnamese',
    500,
    'italic',
    'Optimistic_Display_Viet_W_MdIt.woff2',
  ],
  [
    'Optimistic Display Vietnamese',
    600,
    'normal',
    'Optimistic_Display_Viet_W_SBd.woff2',
  ],
  [
    'Optimistic Display Vietnamese',
    600,
    'italic',
    'Optimistic_Display_Viet_W_SBdIt.woff2',
  ],
  [
    'Optimistic Display Vietnamese',
    700,
    'normal',
    'Optimistic_Display_Viet_W_Bd.woff2',
  ],
  [
    'Optimistic Display Vietnamese',
    700,
    'italic',
    'Optimistic_Display_Viet_W_BdIt.woff2',
  ],
  [
    'Optimistic Text Vietnamese',
    400,
    'normal',
    'Optimistic_Text_Viet_W_Rg.woff2',
  ],
  [
    'Optimistic Text Vietnamese',
    400,
    'italic',
    'Optimistic_Text_Viet_W_It.woff2',
  ],
  [
    'Optimistic Text Vietnamese',
    500,
    'normal',
    'Optimistic_Text_Viet_W_Md.woff2',
  ],
  [
    'Optimistic Text Vietnamese',
    500,
    'italic',
    'Optimistic_Text_Viet_W_MdIt.woff2',
  ],
  [
    'Optimistic Text Vietnamese',
    700,
    'normal',
    'Optimistic_Text_Viet_W_Bd.woff2',
  ],
  [
    'Optimistic Text Vietnamese',
    700,
    'italic',
    'Optimistic_Text_Viet_W_BdIt.woff2',
  ],
];

test('declares every Vietnamese Optimistic weight and style as a complete face', async () => {
  const css = await readFile(cssPath, 'utf8');
  const faceBlocks = [...css.matchAll(/@font-face\s*\{(?<body>[^}]*)\}/gu)].map(
    (match) => match.groups.body,
  );

  for (const [family, weight, style, fileName] of vietnameseFaces) {
    const face = faceBlocks.find(
      (block) =>
        block.includes(`font-family: '${family}'`) &&
        block.includes(`font-weight: ${weight}`) &&
        block.includes(`font-style: ${style}`),
    );

    assert.ok(face, `missing ${family} ${weight} ${style}`);
    assert.match(face, new RegExp(fileName.replaceAll('.', '\\.')));
    assert.doesNotMatch(
      face,
      /unicode-range/u,
      `${family} must remain a complete face so NFD grapheme clusters stay in one font`,
    );

    const font = await readFile(path.join(fontDirectory, fileName));
    assert.ok(font.byteLength > 10_000, `${fileName} is unexpectedly empty`);
  }
});

test('self-hosts Inter variable faces and scopes them to /admin and /logistics', async () => {
  const css = await readFile(cssPath, 'utf8');
  const faceBlocks = [...css.matchAll(/@font-face\s*\{(?<body>[^}]*)\}/gu)].map(
    (match) => match.groups.body,
  );

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

  assert.match(
    css,
    /\[data-astryx-theme\]:has\(\[data-app-font='inter'\]\)\s*\{[^}]*--font-family-body:\s*InterVariable/u,
  );
  const shell = await readFile(
    path.join(projectRoot, 'src/shared/components/protected-app-shell.jsx'),
    'utf8',
  );
  assert.match(
    shell,
    /data-app-font=\{isAdminOrLogistics \? 'inter' : undefined\}/u,
  );
});
