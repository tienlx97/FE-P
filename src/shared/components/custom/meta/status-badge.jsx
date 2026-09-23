'use client';

import { HStack } from '@astryxdesign/core/HStack';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Text } from '@astryxdesign/core/Text';
import * as stylex from '@stylexjs/stylex';

/**
 * "Meta" status pill — the mockup's `rounded-full` tinted pill with a 6px
 * dot before the label (`Đang thực hiện` / `Hoàn thành` / `Bản nháp`, and
 * the "142 hợp đồng" count next to the page title). Composed from Astryx
 * `HStack` + `StatusDot` + `Text` (golden rule #15); `Text color="inherit"`
 * picks up the tone color from the pill, same reason as `MaritimeBadge`.
 *
 * @param {{
 *   label: string,
 *   tone?: 'accent' | 'success' | 'error' | 'neutral',
 *   isPulsing?: boolean,
 *   hasBorder?: boolean,
 * }} props
 */
export function MetaStatusBadge({
  label,
  tone = 'neutral',
  isPulsing = false,
  hasBorder = false,
}) {
  return (
    <HStack
      as="span"
      vAlign="center"
      gap={1}
      wrap="nowrap"
      xstyle={[styles.base, tones[tone], hasBorder && borders[tone]]}
    >
      <StatusDot variant={tone} label={label} isPulsing={isPulsing} />
      <Text
        as="span"
        type="supporting"
        color="inherit"
        weight="semibold"
        xstyle={styles.label}
      >
        {label}
      </Text>
    </HStack>
  );
}

const styles = stylex.create({
  base: {
    borderColor: 'transparent',
    borderRadius: 'var(--radius-full)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    display: 'inline-flex',
    paddingBlock: 'var(--spacing-0-5)',
    paddingInline: 'var(--spacing-3)',
  },
  label: {
    whiteSpace: 'nowrap',
  },
});

const tones = stylex.create({
  accent: {
    backgroundColor: 'var(--meta-accent-tint-strong)',
    color: 'var(--color-accent)',
  },
  success: {
    backgroundColor: 'var(--meta-success-pill-bg)',
    color: 'var(--color-success)',
  },
  error: {
    backgroundColor: 'var(--color-error-muted)',
    color: 'var(--meta-on-error-container)',
  },
  neutral: {
    backgroundColor: 'var(--meta-neutral-pill-bg)',
    color: 'var(--color-text-secondary)',
  },
});

const borders = stylex.create({
  accent: { borderColor: 'var(--meta-accent-tint-border)' },
  success: { borderColor: 'var(--meta-success-pill-border)' },
  error: { borderColor: 'var(--color-error)' },
  neutral: { borderColor: 'var(--color-border)' },
});
