'use client';

import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Text } from '@astryxdesign/core/Text';
import * as stylex from '@stylexjs/stylex';

/**
 * "Meta" tinted pill used across the contract-detail overview (Figma node
 * 89:1064): "CHÍNH THỨC" / "ĐANG THỰC HIỆN" / "CIF 2020" / "65% ĐÃ THU" /
 * country tags / "Bên bán đã ký" / tab counts / the solid "ĐANG THU" tag.
 * Unlike `MetaStatusBadge` (the list screen's pill, always with a dot) the
 * dot and a leading icon are both optional here, and the tones follow this
 * screen's emerald/blue swatches. Composed from Astryx `HStack` + `Icon` +
 * `Text` (golden rule #15); `Text type="inherit"` takes size and color
 * from the pill.
 *
 * @param {{
 *   label: string,
 *   tone?: 'accent' | 'success' | 'green' | 'indigo' | 'warning' | 'danger' | 'neutral' | 'muted' | 'solid' | 'on-accent',
 *   hasDot?: boolean,
 *   icon?: import('react').ComponentType,
 *   hasBorder?: boolean,
 *   size?: 'sm' | 'md' | 'lg',
 * }} props
 */
export function MetaPill({
  label,
  tone = 'neutral',
  hasDot = false,
  icon,
  hasBorder = tone === 'accent' ||
    tone === 'success' ||
    tone === 'green' ||
    tone === 'warning' ||
    tone === 'danger' ||
    tone === 'muted',
  size = 'md',
}) {
  return (
    <HStack
      as="span"
      vAlign="center"
      gap={1}
      wrap="nowrap"
      xstyle={[
        styles.base,
        sizes[size],
        tones[tone],
        hasBorder && borders[tone],
      ]}
    >
      {hasDot ? <HStack as="span" xstyle={[styles.dot, dots[tone]]} /> : null}
      {icon ? <Icon icon={icon} size="xsm" color="inherit" /> : null}
      <Text as="span" type="inherit" color="inherit" xstyle={styles.label}>
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
    flexShrink: 0,
    fontWeight: 'var(--font-weight-bold)',
    lineHeight: 1.5,
  },
  dot: {
    borderRadius: 'var(--radius-full)',
    flexShrink: 0,
    height: 'var(--spacing-2)',
    width: 'var(--spacing-2)',
  },
  label: {
    whiteSpace: 'nowrap',
  },
});

const sizes = stylex.create({
  sm: {
    fontSize: 'var(--font-size-xs)',
    paddingBlock: 'var(--spacing-0-5)',
    paddingInline: 'var(--spacing-2)',
  },
  md: {
    fontSize: 'var(--font-size-sm)',
    paddingBlock: 'var(--spacing-0-5)',
    paddingInline: 'var(--spacing-3)',
  },
  lg: {
    fontSize: 'var(--font-size-base)',
    paddingBlock: 'var(--spacing-0-5)',
    paddingInline: 'var(--spacing-3)',
  },
});

const tones = stylex.create({
  accent: {
    backgroundColor: 'var(--meta-blue-wash)',
    color: 'var(--color-accent)',
  },
  success: {
    backgroundColor: 'var(--meta-emerald-wash)',
    color: 'var(--meta-emerald-text)',
  },
  // Figma 102:4272 commission tab green ("Đã chi", "Đã ký bản gốc").
  green: {
    backgroundColor: 'var(--meta-green-wash)',
    color: 'var(--meta-green)',
  },
  // Figma 103:4983 2nd payment step.
  indigo: {
    backgroundColor: 'var(--meta-indigo-wash)',
    color: 'var(--meta-indigo)',
  },
  // Figma 108:5920 shipment "Đang đóng hàng" / "Khai HQ".
  warning: {
    backgroundColor: 'var(--meta-amber-wash)',
    color: 'var(--meta-amber-text)',
  },
  // Figma 111:7829 "Luồng Đỏ" (customs red channel).
  danger: {
    backgroundColor: 'var(--color-error-muted)',
    color: 'var(--color-error)',
  },
  neutral: {
    backgroundColor: 'var(--meta-hairline)',
    color: 'var(--color-text-primary)',
  },
  // Not-yet-due / inactive state (Figma 94:1936 "Chưa đến hạn").
  muted: {
    backgroundColor: 'var(--meta-surface-container-low)',
    color: 'var(--meta-text-subtle)',
  },
  solid: {
    backgroundColor: 'var(--color-accent)',
    color: 'var(--color-on-accent)',
  },
  // Count pill sitting on a filled cobalt (selected) tab.
  'on-accent': {
    backgroundColor: 'var(--meta-on-accent-pill-bg)',
    color: 'var(--color-on-accent)',
  },
});

const borders = stylex.create({
  accent: { borderColor: 'var(--meta-blue-wash-border)' },
  success: { borderColor: 'var(--meta-emerald-border)' },
  green: { borderColor: 'var(--meta-green-border)' },
  indigo: { borderColor: 'var(--meta-indigo-wash)' },
  warning: { borderColor: 'var(--meta-amber-border)' },
  danger: { borderColor: 'var(--color-error-muted)' },
  neutral: { borderColor: 'var(--color-border)' },
  muted: { borderColor: 'var(--color-border)' },
  solid: { borderColor: 'var(--color-accent)' },
  'on-accent': { borderColor: 'transparent' },
});

const dots = stylex.create({
  accent: { backgroundColor: 'var(--color-accent)' },
  success: { backgroundColor: 'var(--meta-emerald-dot)' },
  green: { backgroundColor: 'var(--meta-green)' },
  indigo: { backgroundColor: 'var(--meta-indigo)' },
  warning: { backgroundColor: 'var(--meta-amber-text)' },
  danger: { backgroundColor: 'var(--color-error)' },
  neutral: { backgroundColor: 'var(--color-text-secondary)' },
  muted: { backgroundColor: 'var(--meta-text-subtle)' },
  solid: { backgroundColor: 'var(--color-on-accent)' },
  'on-accent': { backgroundColor: 'var(--color-on-accent)' },
});
