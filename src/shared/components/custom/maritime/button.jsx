'use client';

import { Button } from '@astryxdesign/core/Button';
import { borderVars } from '@astryxdesign/core/theme/tokens.stylex';
import * as stylex from '@stylexjs/stylex';

/**
 * "Maritime" button — two problems `defineTheme` alone can't fix:
 * 1. Astryx's `Button` has no themeable hover-state CSS variable
 *    (`astryx component Button`'s "States" column is empty: hover comes
 *    from an internal black/white tint overlay computed from the
 *    variant's base color, not a swappable token).
 * 2. The mockup's secondary/outline buttons ("Xuất PDF", "Chỉnh sửa")
 *    rest on `bg-surface-container-low` (`#EFF4FF`, a pale blue-tinted
 *    well), not white — Astryx's own `secondary` variant defaults to
 *    `--color-background-surface` (white), a distinct token nothing in
 *    `defineTheme`'s `components.button` can repoint per-variant.
 * `xstyle` is the documented escape hatch for exactly this (`astryx docs
 * styling`'s "component-specific overrides, ... pseudo-classes" row) —
 * this wrapper pins both the resting and hover background per variant to
 * the mockup's own literal Tailwind classes instead of trusting Astryx's
 * defaults or auto-derived tint (2026-09-18; colors sourced from the
 * mockup HTML's own embedded Tailwind config, see `theme.js`'s file
 * header for why that beats the DESIGN.md prose).
 * @param {import('@astryxdesign/core/Button').ButtonProps & {
 *   treatment?: 'default' | 'add',
 * }} props
 */
export function MaritimeButton({
  variant = 'secondary',
  treatment = 'default',
  xstyle,
  ...props
}) {
  return (
    <Button
      variant={variant}
      xstyle={[
        maritimeButtonHoverStyles[variant],
        treatmentStyles[treatment],
        ...(Array.isArray(xstyle) ? xstyle : xstyle ? [xstyle] : []),
      ]}
      {...props}
    />
  );
}

/**
 * Exported so `DropdownMenu`'s `button` prop (a plain Button-props object,
 * not a `<Button>` element `MaritimeButton` could wrap) can apply the same
 * hover fix to its trigger — see `contract-overview-card.jsx`'s "+ Thao
 * tác" dropdown.
 */
export const maritimeButtonHoverStyles = stylex.create({
  primary: {
    backgroundColor: {
      default: 'var(--color-accent)',
      // spec: Primary hover — `--maritime-button-primary-hover`
      // (`theme.js`, this same folder; no standard token fits since
      // Astryx doesn't expose a hover-state var for Button).
      ':hover': {
        '@media (hover: hover)': 'var(--maritime-button-primary-hover)',
      },
    },
  },
  secondary: {
    backgroundColor: {
      // mockup: bg-surface-container-low
      default: 'var(--color-background-muted)',
      // mockup: hover:bg-surface-container —
      // `--maritime-button-secondary-hover` (`theme.js`, this same
      // folder): one step darker than `--color-background-muted`, no
      // standard token holds that second well shade.
      ':hover': {
        '@media (hover: hover)': 'var(--maritime-button-secondary-hover)',
      },
    },
  },
  ghost: {
    backgroundColor: {
      default: 'transparent',
      ':hover': { '@media (hover: hover)': 'var(--color-background-muted)' },
    },
  },
  destructive: {},
});

const treatmentStyles = stylex.create({
  default: {},
  add: {
    backgroundColor: {
      default: 'var(--maritime-bank-add-background)',
      ':hover': {
        '@media (hover: hover)': 'var(--maritime-button-secondary-hover)',
      },
    },
    borderColor: 'var(--maritime-bank-add-border)',
    borderRadius: 'var(--maritime-bank-add-radius)',
    borderStyle: 'dashed',
    borderWidth: borderVars['--border-width'],
    color: 'var(--color-accent)',
    // fontSize: 'var(--font-size-sm)',
    // height: 'var(--maritime-bank-add-height)',
    // lineHeight: 'var(--line-height-sm)',
  },
});
