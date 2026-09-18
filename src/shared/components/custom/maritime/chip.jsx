'use client';

import { Token } from '@astryxdesign/core/Token';
import * as stylex from '@stylexjs/stylex';

/**
 * "Maritime" mono data chip (e.g. "CIF 2020"). Astryx's `Token` `color`
 * variants are generic swatches (`blue`, `gray`, ...) that don't match the
 * mockup's specific `bg-secondary-fixed`/`text-on-secondary-fixed`/
 * `border-blue-200` combination (colors sourced from the mockup HTML's
 * own embedded Tailwind config, see `theme.js`'s file header).
 *
 * First pass pinned those colors via `xstyle` directly on `Token`, which
 * silently lost: Token's own built CSS sets its label color through its
 * `[data-color]` rule, at higher specificity/later cascade layer than a
 * StyleX `xstyle` atomic class (same bug as `badge.jsx`'s label color).
 * `xstyle` also can't reach Token's *internal* label element at all, only
 * properties on the root. Fixed by registering a real `color="maritime"`
 * variant in `theme.js` (`components.token['color:maritime']` — the
 * "Custom Variants" mechanism, `astryx docs theme`) instead: it lives in
 * the same themed layer as Token's other colors, so it reliably wins and
 * covers the label too (2026-09-18).
 * @param {import('@astryxdesign/core/Token').TokenProps} props
 */
export function MaritimeChip(props) {
  return <Token color="maritime" xstyle={styles.chip} {...props} />;
}

const styles = stylex.create({
  chip: {
    fontFamily: 'var(--font-family-code)',
    fontWeight: 700,
  },
});
