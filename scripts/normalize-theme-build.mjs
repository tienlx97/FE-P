// Runs after `astryx theme build` (see package.json `theme:build`) so the
// tracked output is byte-identical on every OS: the CLI writes the paths in
// its "@generated" header with the host's separator (`\` on Windows, `/` on
// Linux), which dirtied the tree whenever the other OS rebuilt it. Header
// paths become `/`, line endings LF (pinned by .gitattributes too).
import { readFileSync, writeFileSync } from 'node:fs';

const files = [
  'src/shared/components/custom/meta/meta.js',
  'src/shared/components/custom/meta/theme.built.css',
];

for (const file of files) {
  const original = readFileSync(file, 'utf8');
  const normalized = original
    .replace(/\r\n/g, '\n')
    .replace(/^( \* (?:Source|Command): .*)$/gm, (line) =>
      line.replace(/\\/g, '/'),
    );
  if (normalized !== original) {
    writeFileSync(file, normalized);
  }
}
