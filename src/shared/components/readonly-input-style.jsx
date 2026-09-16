import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import * as stylex from '@stylexjs/stylex';

/**
 * The muted background a read-only value-editing control gets, shared by
 * `read-only-lock.jsx` (Selector/DateInput/CheckboxList, which clone this
 * onto the child's `xstyle`) and `text-input.jsx`/`number-input.jsx`/
 * `text-area.jsx` (which have a native `isReadOnly` of their own, so they
 * apply it directly instead of going through `ReadOnlyLock`'s click/key
 * interception).
 *
 * Deliberately app-level `@stylexjs/stylex`, not `theme.js`'s
 * `'text-input': { readonly: {...} }`-style override — confirmed by
 * reproducing against a local production build (`next build` + `next
 * start`, 2026-09-16) that `theme.js`'s compiled override renders
 * `rgb(255, 255, 255)` (plain white) instead of this color in production,
 * while an app-level `xstyle` like this one correctly renders `rgb(237,
 * 245, 241)` in that same build. Root cause: both compile into real CSS
 * `@layer`s (Astryx's own component base styles into `astryx-base`,
 * `theme.js`'s overrides into `astryx-theme`), and cascade layers resolve
 * purely by layer declaration order — selector specificity never enters
 * into it once two rules are in different layers. Production's chunk
 * split ends up registering `astryx-base` after `astryx-theme` (`astryx-
 * base` never appears in the explicit `@layer reset, astryx-theme,
 * priority1, priority2, priority3, priority4, priority5;` order statement,
 * so it's appended wherever its own chunk happens to load first), so
 * `astryx-base`'s plain white background always wins there regardless of
 * `.astryx-text-input.readonly`'s higher selector specificity — a build
 * output detail outside this app's control, not something `theme.js` can
 * reliably override by rewriting its selector. Dev mode's CSS delivery
 * doesn't split chunks the same way, so the same rule happens to land in
 * the right order there — which is why this bug was invisible until a
 * local production build was actually run.
 */
export const readonlyInputStyle = stylex.create({
  tinted: { backgroundColor: colorVars['--color-background-muted'] },
});
