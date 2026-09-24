#!/usr/bin/env node
// Logistics font-size standard (ADR-0009, Meta theme `theme.js`):
//   base (14px) is the default body size, so a `<Text size="base">` is noise
//   that hides which texts are really overridden; sm (13px) is the smallest
//   size for notes/captions; nothing may go below it (`xsm`, `xs`, `2xs`…).
// `type="inherit"` (and the types with their own size) may still pin `base`.
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

process.chdir(path.join(path.dirname(new URL(import.meta.url).pathname), '../..'));

const files = execSync(
  "git ls-files 'src/features/logistics*/**/*.jsx' 'src/shared/components/custom/meta/*.jsx' src/shared/components/meta-form-dialog.jsx",
)
  .toString()
  .trim()
  .split('\n')
  .filter(Boolean);

const TOO_SMALL = /\ssize="(xsm|xs|2xs|3xs|4xs)"/;
const offenders = [];

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const tagStart = /<Text(?=[\s>])/g;
  let match;
  while ((match = tagStart.exec(src))) {
    let end = match.index + 5;
    for (let depth = 0; end < src.length; end++) {
      const c = src[end];
      if (c === '{') depth++;
      else if (c === '}') depth--;
      else if (c === '>' && depth === 0) break;
    }
    const tag = src.slice(match.index, end);
    const line = src.slice(0, match.index).split('\n').length;
    if (
      /\ssize="base"/.test(tag) &&
      !/type="(inherit|supporting|large|display-\d)"/.test(tag)
    ) {
      offenders.push(`${file}:${line}  size="base" is the default — drop it`);
    }
    if (TOO_SMALL.test(tag)) {
      offenders.push(`${file}:${line}  text below sm (13px) — use size="sm"`);
    }
    tagStart.lastIndex = end;
  }
}

if (offenders.length) {
  console.log('Logistics font-size standard violations (see ADR-0009):');
  for (const o of offenders) console.log('  ' + o);
  process.exit(1);
}
console.log(`logistics font sizes ok (${files.length} files)`);
