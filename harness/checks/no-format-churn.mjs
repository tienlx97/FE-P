#!/usr/bin/env node
// Fails when the working tree (vs HEAD) reformats code it did not change.
// Many files are not prettier-formatted to the repo config; a broad
// `prettier --write` rewrites them wholesale and buries the real edit
// (harness/PROGRESS.md 2026-10-05 and 2026-10-07). For every changed file we
// diff HEAD vs working copy twice: as is ("raw") and after running both
// through prettier ("net", the real change). Flagged:
//   - net 0, raw > 0       → the file only changed format;
//   - raw − net ≥ MIN_EXTRA and raw ≥ RATIO × net → a real edit with a
//     reformat mixed in.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { extname } from 'node:path';
import { pathToFileURL } from 'node:url';

import * as prettier from 'prettier';

export const EXTENSIONS = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.css', '.json']);
export const MIN_EXTRA = 20;
export const RATIO = 3;

/** Lines changed between two texts (insertions + deletions, by LCS). */
export function changedLines(before, after) {
  const a = before.split('\n');
  const b = after.split('\n');
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
  }
  const x = a.slice(start, endA);
  const y = b.slice(start, endB);
  let previous = new Uint32Array(y.length + 1);
  let current = new Uint32Array(y.length + 1);
  for (let i = 1; i <= x.length; i++) {
    for (let j = 1; j <= y.length; j++) {
      current[j] = x[i - 1] === y[j - 1] ? previous[j - 1] + 1 : Math.max(previous[j], current[j - 1]);
    }
    [previous, current] = [current, previous];
  }
  return x.length + y.length - 2 * previous[y.length];
}

/** @returns {'format-only' | 'mixed' | null} */
export function churnKind(raw, net) {
  if (raw === 0) return null;
  if (net === 0) return 'format-only';
  return raw - net >= MIN_EXTRA && raw >= RATIO * net ? 'mixed' : null;
}

async function format(text, filepath) {
  const config = (await prettier.resolveConfig(filepath)) ?? {};
  return prettier.format(text, { ...config, filepath });
}

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
}

async function main() {
  const files = git('diff', '--name-only', '--diff-filter=M', 'HEAD')
    .split('\n')
    .filter((file) => file && EXTENSIONS.has(extname(file)));
  const problems = [];
  for (const file of files) {
    const before = git('show', `HEAD:${file}`).replace(/\r\n/g, '\n');
    const after = readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
    if (before === after) continue;
    let formattedBefore;
    let formattedAfter;
    try {
      [formattedBefore, formattedAfter] = await Promise.all([format(before, file), format(after, file)]);
    } catch {
      continue; // unparsable on one side: lint / typecheck report it
    }
    const raw = changedLines(before, after);
    const net = changedLines(formattedBefore, formattedAfter);
    const kind = churnKind(raw, net);
    if (kind) problems.push(`${file}: ${kind} (${raw} lines changed, ${net} after formatting both sides)`);
  }
  if (problems.length > 0) {
    console.error('Format-only churn vs HEAD:');
    for (const problem of problems) console.error(`  ${problem}`);
    console.error(
      'Fix: `git checkout -- <file>` and re-apply only your edit. Never run `prettier --write` on a whole' +
        ' directory or on files that are not already prettier-formatted; format only the lines you wrote.',
    );
    process.exit(1);
  }
  console.log(`no-format-churn: ${files.length} changed file(s) checked`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
