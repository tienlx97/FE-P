'use client';

import { HStack } from '@astryxdesign/core/HStack';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Text } from '@astryxdesign/core/Text';
import * as stylex from '@stylexjs/stylex';

/**
 * "Maritime" badge — the mockup's status pill (`.status-badge`,
 * `Đang thực hiện`) is a plain 6px dot sitting flush inline before the
 * label (`<span class="w-1.5 h-1.5 rounded-full ... animate-pulse">`).
 * Astryx's own `Badge` renders its `icon` prop inside a fixed icon-sized
 * slot, so nesting `StatusDot` there reads as a distinct icon chip next
 * to the text instead of a small inline dot — the "badge còn icon chấm
 * bên trong" mismatch (2026-09-18). This wrapper drops `Badge` for a
 * plain `HStack` pill instead, placing `StatusDot` as an ordinary flex
 * child so it renders at its own small size, no icon-slot padding.
 * Reuses `StatusDot` itself (not a hand-rolled dot) for its accessibility
 * contract — label, `prefers-reduced-motion` handling — see
 * `astryx component StatusDot`.
 * `Text`'s own built CSS sets color with a 2-class selector
 * (`.astryx-text.primary { color: var(--color-text-primary) }`, per its
 * default `color` variant), which beats a StyleX `xstyle` override's
 * single atomic class on specificity — passing `color: '...'` in `xstyle`
 * silently lost that fight and the label stayed `--color-text-primary`
 * regardless of `tone` (2026-09-18). Fixed by passing the `color="inherit"`
 * *prop* Text already exposes for exactly this, instead of fighting the
 * class via `xstyle`; the tone color then comes from the parent
 * `HStack`'s `color` (plain CSS inheritance, no competing class there).
 * @typedef {{
 *   label: string,
 *   tone?: 'blue' | 'success' | 'warning' | 'error' | 'neutral',
 * } & MaritimeBadgeSizeProps & {
 *   dotVariant?: import('@astryxdesign/core/StatusDot').StatusDotProps['variant'],
 *   isDotPulsing?: boolean,
 *   isUppercase?: boolean,
 * }} MaritimeBadgeProps
 */
/**
 * Same size scale/naming as Astryx's own `IconSize` (`astryx component
 * Icon`'s `size` prop) instead of a badge-only `'sm' | 'md'` pair, so a
 * badge sitting next to an `Icon` can be handed the same size value.
 * @typedef {{
 *   size?: 'xsm' | 'sm' | 'md' | 'lg',
 * }} MaritimeBadgeSizeProps
 */
/** @param {MaritimeBadgeProps} props */
export function MaritimeBadge({
  label,
  tone = 'neutral',
  size = 'md',
  dotVariant,
  isDotPulsing,
  isUppercase = true,
}) {
  return (
    <HStack
      as="span"
      vAlign="center"
      gap={1}
      xstyle={[styles.base, styles[tone], sizeStyles[size]]}
    >
      {dotVariant ? (
        <StatusDot
          variant={dotVariant}
          label={label}
          isPulsing={isDotPulsing}
        />
      ) : null}
      <Text
        as="span"
        type="label"
        color="inherit"
        xstyle={[labelSizeStyles[size], !isUppercase && styles.normalCase]}
      >
        {label}
      </Text>
    </HStack>
  );
}

const styles = stylex.create({
  normalCase: { textTransform: 'none' },
  base: {
    borderRadius: 'var(--radius-inner)', // spec: 4px, badges/tags
    borderStyle: 'solid',
    borderWidth: '1px',
    display: 'inline-flex',
  },
  // Tone colors are bare Tailwind default swatches in the mockup, not
  // part of its custom design-token palette — see `theme.js`'s own
  // comment on why they're separate `--maritime-badge-*` tokens instead
  // of Astryx's `success`/`warning`/`error` roles (e.g. the emerald badge
  // text is literally Tailwind `emerald-800`, not any semantic color).
  blue: {
    backgroundColor: 'var(--maritime-badge-info-bg)',
    borderColor: 'var(--maritime-badge-info-border)',
    color: 'var(--maritime-badge-info-text)',
  },
  success: {
    backgroundColor: 'var(--maritime-badge-success-bg)',
    borderColor: 'var(--maritime-badge-success-border)',
    color: 'var(--maritime-badge-success-text)',
  },
  warning: {
    backgroundColor: 'var(--maritime-badge-warning-bg)',
    borderColor: 'var(--maritime-badge-warning-border)',
    color: 'var(--maritime-badge-warning-text)',
  },
  error: {
    backgroundColor: 'var(--maritime-badge-error-bg)',
    borderColor: 'var(--maritime-badge-error-border)',
    color: 'var(--maritime-badge-error-text)',
  },
  neutral: {
    backgroundColor: 'var(--maritime-badge-neutral-bg)',
    borderColor: 'var(--maritime-badge-neutral-border)',
    color: 'var(--maritime-badge-neutral-text)',
  },
});

// `md` matches the mockup's original `.status-badge` sizing (py-0.5 px-2,
// 11px label) and is the default, same as `IconSize`'s own `'md'` default.
// `sm`/`xsm` shrink it for tighter contexts (e.g. a badge inline with
// other small text), `lg` grows it for a badge standing on its own —
// same tone colors at every step, just a smaller/larger box.
const sizeStyles = stylex.create({
  xsm: {
    paddingBlock: '0px',
    paddingInline: 'var(--spacing-1)',
  },
  sm: {
    paddingBlock: '1px',
    paddingInline: 'var(--spacing-1)',
  },
  md: {
    paddingBlock: '3px', // spec: py-0.5
    paddingInline: 'var(--spacing-2)', // spec: px-2
  },
  lg: {
    paddingBlock: '3px',
    paddingInline: 'var(--spacing-3)',
  },
});

const labelSizeStyles = stylex.create({
  xsm: {
    fontSize: '13px',
    fontWeight: 700,
    letterSpacing: '0.02em',
    lineHeight: '17px',
    textTransform: 'uppercase',
  },
  sm: {
    fontSize: '14px',
    fontWeight: 700,
    letterSpacing: '0.02em',
    lineHeight: '18px',
    textTransform: 'uppercase',
  },
  md: {
    fontSize: '15px',
    fontWeight: 700,
    letterSpacing: '0.02em',
    lineHeight: '20px',
    textTransform: 'uppercase',
  },
  lg: {
    fontSize: '16px',
    fontWeight: 700,
    letterSpacing: '0.02em',
    lineHeight: '22px',
    textTransform: 'uppercase',
  },
});
