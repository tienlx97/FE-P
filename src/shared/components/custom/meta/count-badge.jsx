'use client';

import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import * as stylex from '@stylexjs/stylex';

/**
 * "Meta" count pill — the small `rounded-full` number beside each status
 * tab label in the mockup (`142`, `38`, `89`…). `on-accent` is the
 * translucent white pill sitting on the selected (filled cobalt) tab.
 * Composed from Astryx `HStack` + `Text` (golden rule #15). Figma node
 * 83:539: `--font-size-xs` bold at 1.5 line-height with 2px/8px padding,
 * sitting inside an `md` (32px) tab. `Text type="inherit"` takes that
 * size/line-height from the pill (a Text `type` would force its own).
 *
 * @param {{
 *   value: number | string,
 *   tone?: 'accent' | 'success' | 'warning' | 'neutral' | 'on-accent',
 * }} props
 */
export function MetaCountBadge({ value, tone = 'neutral' }) {
  return (
    <HStack
      as="span"
      vAlign="center"
      hAlign="center"
      wrap="nowrap"
      xstyle={[styles.base, tones[tone]]}
    >
      <Text as="span" type="inherit" color="inherit" hasTabularNumbers>
        {value}
      </Text>
    </HStack>
  );
}

const styles = stylex.create({
  base: {
    borderRadius: 'var(--radius-full)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    display: 'inline-flex',
    fontSize: 'var(--font-size-xs)',
    fontWeight: 'var(--font-weight-bold)',
    lineHeight: 1.5,
    paddingBlock: 'var(--spacing-0-5)',
    paddingInline: 'var(--spacing-2)',
  },
});

const tones = stylex.create({
  accent: {
    backgroundColor: 'var(--meta-accent-tint)',
    borderColor: 'var(--meta-accent-tint-border)',
    color: 'var(--color-accent)',
  },
  success: {
    backgroundColor: 'var(--meta-success-pill-bg)',
    borderColor: 'var(--meta-success-pill-border)',
    color: 'var(--color-success)',
  },
  warning: {
    backgroundColor: 'var(--meta-amber-wash)',
    borderColor: 'var(--meta-amber-border)',
    color: 'var(--meta-amber-text)',
  },
  neutral: {
    backgroundColor: 'var(--color-background-surface)',
    borderColor: 'var(--color-border)',
    color: 'var(--color-text-secondary)',
  },
  'on-accent': {
    backgroundColor: 'var(--meta-on-accent-pill-bg)',
    borderColor: 'transparent',
    color: 'var(--color-on-accent)',
  },
});
