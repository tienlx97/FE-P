// @ts-nocheck — vendored/ejected source (`astryx swizzle TabList`), stripped
// of its original TypeScript types by a one-off `tsc --jsx preserve`
// transpile rather than hand-annotated with JSDoc; `checkJs` has no type
// info to infer from (e.g. `createContext(null)` reads as type `null`) and
// floods this file with noise unrelated to the actual edits made here. See
// this file's own doc comment below for what those edits are.
'use client';

/**
 * Swizzled from Astryx's `TabList`'s `Tab` (`astryx swizzle TabList`,
 * 2026-09-18) — ejected instead of theming/`xstyle`-ing the packaged
 * component because the *selected* tab's text color is hard-coded to one
 * of Astryx's specificity-boosted atomic color classes with no themeable
 * hook (unlike `Text`, `Tab` doesn't swap classes per a `color` prop — see
 * `tab-nav.jsx`'s own file header for the full reasoning). Owning this
 * source directly means no cascade fight: the pill background/border/
 * colors below are just literal values, editable in place.
 *
 * Also patches two runtime incompatibilities the ejected source hit
 * against this project's installed `@stylexjs/stylex@0.15.4` (Astryx core
 * wants `^0.19.0` — not upgraded here, out of scope for a tab-nav tweak,
 * would touch every StyleX-styled component in the app):
 * - `stylex.defineMarker()` / `stylex.when.ancestor(...)` (the ejected
 *   source's ancestor-scoped hover marker) don't exist in 0.15.4 — the
 *   hover background below uses the plain `':hover'` +
 *   `'@media (hover: hover)'` pseudo pattern this repo already uses
 *   elsewhere (`button.jsx`, `payment-summary-card.jsx`) instead, and the
 *   separate `hoverBg` overlay span + `tab.markers.stylex.ts` marker file
 *   are dropped — a plain hover pseudo on `base` covers it.
 * - The underline "selected" indicator element is dropped outright — the
 *   mockup's tabs are filled pills, not underlined text, so the indicator
 *   has no role here regardless of the version issue.
 *
 * Figma (node 7:1182, "3. TAB NAVIGATION", 2026-09-18): filled accent pill
 * when selected (white text), a white bordered pill otherwise
 * (`--maritime-text-subtle` text) — see `tab-nav.jsx` for the full
 * color/token reasoning.
 */
import { EDGE_COMP_ATTR } from '@astryxdesign/core/Layout';
import {
  durationVars,
  easeVars,
  fontWeightVars,
  sizeVars,
  spacingVars,
} from '@astryxdesign/core/theme/tokens.stylex';
import { mergeProps, themeProps } from '@astryxdesign/core/utils';
import { focusOutlineProps } from '@astryxdesign/core/utils';
import * as stylex from '@stylexjs/stylex';
import { useCallback } from 'react';

import { useTabListContext } from './TabListContext.js';

const styles = stylex.create({
  base: {
    alignItems: 'center',
    // `--maritime-tab-resting-bg` (`theme.js`), not
    // `--color-background-surface` directly — same resolved white, but a
    // value string that isn't already one of Astryx's own specificity-
    // boosted atomic classes. See that token's own comment for why: with
    // the common token, the hover variant below silently lost regardless
    // of source order (user feedback, 2026-09-18).
    backgroundColor: {
      default: 'var(--maritime-tab-resting-bg)',
      ':hover': {
        '@media (hover: hover)': 'var(--maritime-button-secondary-hover)',
      },
    },
    borderColor: 'var(--maritime-tab-border)',
    borderRadius: '6px', // Figma: 6px — no existing radius token matches
    borderStyle: 'solid',
    borderWidth: '1px',
    // `--color-text-primary` (#0B1C30, user feedback, 2026-09-18) — was
    // `--maritime-text-subtle` (#45464D, the Figma-exact muted gray);
    // the darker primary-text token reads clearer at the bumped 16px
    // label size.
    color: 'var(--color-text-primary)',
    cursor: {
      default: 'pointer',
      ':is(:disabled,[aria-disabled="true"])': 'default',
    },
    display: 'inline-flex',
    flexShrink: 0,
    fontFamily: 'inherit',
    fontSize: '14px', // user feedback, 2026-09-18 — bumped from the Figma-exact 12px
    fontWeight: fontWeightVars['--font-weight-medium'],
    gap: spacingVars['--spacing-1'],
    justifyContent: 'center',
    lineHeight: '24px',
    paddingInline: spacingVars['--spacing-3'],
    position: 'relative',
    textDecoration: 'none',
    transitionDuration: durationVars['--duration-fast'],
    transitionProperty: 'background-color, border-color, color',
    transitionTimingFunction: easeVars['--ease-standard'],
    whiteSpace: 'nowrap',
  },
  selected: {
    // Literal `#0051D5`, reusing `--maritime-badge-info-text` (same
    // value, documented there as the mockup's literal accent hex)
    // instead of `--color-accent` — Astryx's color-role generator
    // derives `--color-accent` from that seed for contrast/dark-mode
    // safety, so it no longer matches the Figma hex exactly.
    backgroundColor: {
      default: 'var(--maritime-badge-info-text)',
      ':hover': { '@media (hover: hover)': 'var(--maritime-badge-info-text)' },
    },
    borderColor: 'var(--maritime-badge-info-text)',
    color: 'var(--color-on-accent)',
    fontWeight: fontWeightVars['--font-weight-semibold'],
  },
  icon: {
    alignItems: 'center',
    display: 'inline-flex',
    flexShrink: 0,
    justifyContent: 'center',
  },
  labelContainer: {
    display: 'inline-grid',
  },
  labelText: {
    gridColumnStart: '1',
    gridRowStart: '1',
  },
  labelSizer: {
    fontWeight: fontWeightVars['--font-weight-semibold'],
    gridColumnStart: '1',
    gridRowStart: '1',
    pointerEvents: 'none',
    visibility: 'hidden',
  },
  endContentWrapper: {
    alignItems: 'center',
    display: 'inline-flex',
    flexShrink: 0,
  },
});
const sizeStyles = stylex.create({
  sm: { height: sizeVars['--size-element-sm'] },
  md: { height: sizeVars['--size-element-md'] },
  lg: { height: sizeVars['--size-element-lg'] },
});

/**
 * `href`/`as`/`panelId`/`role="tablist"` support (the upstream component's
 * link-tab and ARIA-tabs patterns) is dropped in this fork — `tab-nav.jsx`
 * only ever uses the plain navigation pattern (a nav landmark, tabs that
 * swap a section in place via `onChange`, never a real link), and keeping
 * the unused `useLinkComponent`/conditional-`<LinkComponent>` branch
 * tripped `react-hooks/static-components` (a component value created
 * during render) for a path this app never takes.
 * @param {{
 *   ref?: import('react').Ref<HTMLButtonElement>,
 *   value: string,
 *   label: string,
 *   isLabelHidden?: boolean,
 *   icon?: import('react').ReactNode,
 *   selectedIcon?: import('react').ReactNode,
 *   endContent?: import('react').ReactNode,
 *   xstyle?: import('@stylexjs/stylex').StyleXStyles,
 *   className?: string,
 *   style?: import('react').CSSProperties,
 * }} props
 */
export function Tab({
  ref,
  value,
  label,
  isLabelHidden = false,
  icon,
  selectedIcon,
  endContent,
  xstyle,
  className,
  style,
  ...restProps
}) {
  const tabListCtx = useTabListContext();
  const isSelected = tabListCtx.value === value;
  const size = tabListCtx.size;
  const displayIcon = isSelected && selectedIcon ? selectedIcon : icon;
  const hasVisibleLabel = !isLabelHidden && label !== '';
  const handleSelect = useCallback(() => {
    tabListCtx.onChange(value);
  }, [tabListCtx, value]);
  const iconElement = displayIcon ? (
    <span {...stylex.props(styles.icon)}>{displayIcon}</span>
  ) : null;
  const sharedProps = {
    ...restProps,
    ...(isLabelHidden ? { 'aria-label': label } : {}),
    [EDGE_COMP_ATTR]: '',
    'data-tab-value': value,
    'aria-current': isSelected ? 'true' : undefined,
    tabIndex: isSelected ? 0 : -1,
    ...mergeProps(
      themeProps('tab', { selected: isSelected ? 'selected' : null }),
      focusOutlineProps.focusVisible(
        styles.base,
        sizeStyles[size],
        isSelected && styles.selected,
        xstyle,
      ),
      className,
      style,
    ),
  };
  const labelElement = hasVisibleLabel ? (
    <span {...stylex.props(styles.labelContainer)}>
      <span {...stylex.props(styles.labelText)}>{label}</span>
      <span aria-hidden="true" {...stylex.props(styles.labelSizer)}>
        {label}
      </span>
    </span>
  ) : null;
  const endContentElement = endContent ? (
    <span {...stylex.props(styles.endContentWrapper)}>{endContent}</span>
  ) : null;
  return (
    <button ref={ref} type="button" onClick={handleSelect} {...sharedProps}>
      {iconElement}
      {labelElement}
      {endContentElement}
    </button>
  );
}
Tab.displayName = 'Tab';
