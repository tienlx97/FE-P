// `pnpm dev` runs this instead of `pnpm theme:build`: the Meta theme build
// output is tracked in Git, so it is rebuilt (~4 s) only when theme.js is
// newer than theme.built.css. `pnpm build` and verify still always rebuild.
import { execSync } from 'node:child_process';
import { statSync } from 'node:fs';

const source = 'src/shared/components/custom/meta/theme.js';
const output = 'src/shared/components/custom/meta/theme.built.css';

const mtime = (file) => {
  try {
    return statSync(file).mtimeMs;
  } catch {
    return -1;
  }
};

if (mtime(output) < mtime(source)) {
  execSync('pnpm run theme:build', { stdio: 'inherit' });
}
