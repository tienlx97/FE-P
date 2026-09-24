'use client';

import { Card } from '@astryxdesign/core/Card';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Heading, Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { ShieldCheck } from 'lucide-react';

import { MetaPill } from './pill.jsx';

/**
 * @typedef {'accent' | 'success' | 'indigo' | 'warning' | 'danger' | 'neutral'} MetaBlockTone
 *
 * @typedef {{
 *   label: string,
 *   tone?: MetaBlockTone,
 *   hasDot?: boolean,
 *   icon?: import('react').ComponentType,
 * }} MetaBlockPill
 */

/** Text color per tone (Meta theme variants for success / amber). */
const TONE_TEXT = /** @type {const} */ ({
  accent: 'accent',
  success: 'meta-success',
  indigo: 'accent',
  warning: 'meta-amber',
  danger: 'meta-danger',
  neutral: 'secondary',
});

/**
 * "Meta" shipment financial figure — Figma node 111:7829's "Highlighted 3
 * Financial KPI Cards": tinted icon tile + uppercase label + tag pill, a
 * large tabular value with a coloured unit, and a footer row (caption /
 * value on the left, a status on the right) under a hairline.
 *
 * @param {{
 *   icon: import('react').ComponentType,
 *   tone: 'accent' | 'success' | 'indigo',
 *   label: string,
 *   tag?: MetaBlockPill,
 *   value: string,
 *   unit?: string,
 *   footLabel: string,
 *   footValue?: string,
 *   footStatus?: { label: string, icon?: import('react').ComponentType, tone: MetaBlockTone },
 * }} props
 */
export function MetaShipmentKpiCard({
  icon,
  tone,
  label,
  tag,
  value,
  unit,
  footLabel,
  footValue,
  footStatus,
}) {
  return (
    <Card padding={5} xstyle={styles.card}>
      <VStack gap={2} hAlign="stretch">
        <HStack hAlign="between" vAlign="center" gap={2}>
          <HStack gap={2} vAlign="center" xstyle={styles.shrink}>
            <IconTile icon={icon} tone={tone} />
            <Text size="sm" weight="bold" color="secondary" maxLines={1}>
              {label}
            </Text>
          </HStack>
          {tag ? (
            <MetaPill
              label={tag.label}
              tone={tag.tone ?? tone}
              hasDot={tag.hasDot}
            />
          ) : null}
        </HStack>

        <HStack gap={2} vAlign="end" wrap="wrap" xstyle={styles.kpiValue}>
          <Text size="3xl" weight="bold" type="code" hasTabularNumbers>
            {value}
          </Text>
          {unit ? (
            <Text
              weight="bold"
              type="code"
              color={/** @type {any} */ (TONE_TEXT[tone])}
            >
              {unit}
            </Text>
          ) : null}
        </HStack>

        <HStack
          hAlign="between"
          vAlign="center"
          gap={2}
          wrap="wrap"
          xstyle={styles.footer}
        >
          <Text color="secondary">
            {footLabel}
            {footValue ? (
              <>
                {' '}
                <Text
                  as="span"
                  type="code"
                  weight="bold"
                  color="primary"
                  hasTabularNumbers
                >
                  {footValue}
                </Text>
              </>
            ) : null}
          </Text>
          {footStatus ? (
            <HStack gap={1} vAlign="center">
              {footStatus.icon ? (
                <Icon
                  icon={footStatus.icon}
                  size="sm"
                  color={/** @type {any} */ (TONE_TEXT[footStatus.tone])}
                />
              ) : null}
              <Text
                weight="semibold"
                color={/** @type {any} */ (TONE_TEXT[footStatus.tone])}
              >
                {footStatus.label}
              </Text>
            </HStack>
          ) : null}
        </HStack>
      </VStack>
    </Card>
  );
}

/**
 * "Meta" shipment-detail content card ("Section - Container Thẻ Độc
 * Lập"): tinted icon tile + 16px bold title, an optional pill on the
 * right, a hairline, then the body (usually a grid of
 * `MetaShipmentField`s).
 *
 * @param {{
 *   icon: import('react').ComponentType,
 *   tone?: 'accent' | 'warning',
 *   title: string,
 *   pill?: MetaBlockPill,
 *   children: import('react').ReactNode,
 * }} props
 */
export function MetaShipmentSection({
  icon,
  tone = 'accent',
  title,
  pill,
  children,
}) {
  return (
    <Card padding={6} xstyle={styles.card}>
      <VStack gap={6} hAlign="stretch">
        <HStack
          hAlign="between"
          vAlign="center"
          gap={3}
          wrap="wrap"
          xstyle={styles.sectionHeader}
        >
          <HStack gap={3} vAlign="center">
            <IconTile icon={icon} tone={tone} size="lg" />
            <Heading level={3} accessibilityLevel={2}>
              {title}
            </Heading>
          </HStack>
          {pill ? (
            <MetaPill
              label={pill.label}
              tone={pill.tone ?? 'neutral'}
              hasDot={pill.hasDot}
              icon={pill.icon}
              hasBorder
            />
          ) : null}
        </HStack>
        {children}
      </VStack>
    </Card>
  );
}

/**
 * One read-only label-above-value tile (Figma "Overlay+Border"): muted
 * uppercase label, bold value (optionally with a leading icon and a
 * trailing pill), and an optional caption line. Empty values show "—".
 *
 * @param {{
 *   label: string,
 *   value?: import('react').ReactNode,
 *   icon?: import('react').ComponentType,
 *   iconTone?: MetaBlockTone,
 *   valueTone?: 'primary' | 'accent' | 'warning',
 *   isCode?: boolean,
 *   trailing?: MetaBlockPill,
 *   caption?: string,
 *   captionTone?: 'secondary' | 'accent',
 * }} props
 */
export function MetaShipmentField({
  label,
  value,
  icon,
  iconTone = 'neutral',
  valueTone = 'primary',
  isCode = false,
  trailing,
  caption,
  captionTone = 'secondary',
}) {
  const isEmpty = value === undefined || value === null || value === '';

  return (
    <VStack gap={1.5} hAlign="stretch" xstyle={styles.field}>
      <Text size="sm" weight="bold" color="secondary" maxLines={1}>
        {label.toUpperCase()}
      </Text>
      <HStack hAlign="between" vAlign="center" gap={2}>
        <HStack gap={1.5} vAlign="center" xstyle={styles.shrink}>
          {icon && !isEmpty ? (
            <Icon
              icon={icon}
              size="sm"
              color={/** @type {any} */ (ICON_COLOR[iconTone])}
            />
          ) : null}
          {isEmpty ? (
            <Text color={/** @type {any} */ ('meta-subtle')}>—</Text>
          ) : typeof value === 'string' ? (
            <Text
              weight="semibold"
              type={isCode ? 'code' : undefined}
              color={/** @type {any} */ (VALUE_COLOR[valueTone])}
              hasTabularNumbers
              maxLines={2}
            >
              {value}
            </Text>
          ) : (
            value
          )}
        </HStack>
        {trailing ? (
          <MetaPill
            label={trailing.label}
            tone={trailing.tone ?? 'accent'}
            hasDot={trailing.hasDot}
          />
        ) : null}
      </HStack>
      {caption ? (
        <Text
          size="sm"
          weight={captionTone === 'accent' ? 'semibold' : 'normal'}
          type="code"
          color={captionTone}
        >
          {caption}
        </Text>
      ) : null}
    </VStack>
  );
}

/**
 * One container (VGM record) card of the "DANH SÁCH CONTAINER" grid:
 * "CONT #n" + type chip, container number, seal, then packing date and
 * VGM weight under a hairline.
 *
 * @param {{
 *   indexLabel: string,
 *   typeLabel: string,
 *   containerNumber: string,
 *   sealNumber?: string,
 *   packingDateLabel?: string,
 *   packingDate: string,
 *   vgmLabel?: string,
 *   vgm: string,
 * }} props
 */
export function MetaContainerCard({
  indexLabel,
  typeLabel,
  containerNumber,
  sealNumber,
  packingDateLabel = 'Ngày đóng hàng:',
  packingDate,
  vgmLabel = 'VGM:',
  vgm,
}) {
  return (
    <VStack gap={4} hAlign="stretch" xstyle={styles.container}>
      <HStack
        hAlign="between"
        vAlign="center"
        gap={2}
        xstyle={styles.sectionHeaderTight}
      >
        <Text weight="bold" color={/** @type {any} */ ('meta-subtle')}>
          {indexLabel}
        </Text>
        <MetaPill label={typeLabel} tone="neutral" hasBorder />
      </HStack>
      <VStack gap={1} hAlign="start">
        <Text weight="bold" type="code">
          {containerNumber}
        </Text>
        {sealNumber ? (
          <HStack gap={1} vAlign="center">
            <Icon icon={ShieldCheck} size="sm" color="secondary" />
            <Text type="code" color="secondary">
              Seal:{' '}
              <Text as="span" type="inherit" weight="semibold" color="primary">
                {sealNumber}
              </Text>
            </Text>
          </HStack>
        ) : null}
      </VStack>
      <VStack gap={2} hAlign="stretch" xstyle={styles.footer}>
        <HStack hAlign="between" vAlign="center" gap={2}>
          <Text color="secondary">{packingDateLabel}</Text>
          <Text weight="medium" hasTabularNumbers>
            {packingDate}
          </Text>
        </HStack>
        <HStack hAlign="between" vAlign="center" gap={2}>
          <Text color="secondary">{vgmLabel}</Text>
          <Text weight="bold" type="code" hasTabularNumbers>
            {vgm}
          </Text>
        </HStack>
      </VStack>
    </VStack>
  );
}

/**
 * @param {{
 *   icon: import('react').ComponentType,
 *   tone: 'accent' | 'success' | 'indigo' | 'warning',
 *   size?: 'md' | 'lg',
 * }} props
 */
function IconTile({ icon, tone, size = 'md' }) {
  return (
    <HStack
      hAlign="center"
      vAlign="center"
      xstyle={[styles.iconTile, tileSizes[size], tileTones[tone]]}
    >
      <Icon icon={icon} size={size === 'lg' ? 'md' : 'sm'} color="inherit" />
    </HStack>
  );
}

const ICON_COLOR = /** @type {const} */ ({
  accent: 'accent',
  success: 'meta-success',
  indigo: 'accent',
  warning: 'meta-amber',
  danger: 'meta-danger',
  neutral: 'secondary',
});

const VALUE_COLOR = /** @type {const} */ ({
  primary: 'primary',
  accent: 'accent',
  warning: 'meta-amber',
});

const styles = stylex.create({
  card: {
    boxShadow: 'var(--meta-shadow-card)',
  },
  shrink: {
    minWidth: 0,
  },
  kpiValue: {
    paddingTop: 'var(--spacing-1)',
  },
  footer: {
    borderTopColor: 'var(--meta-hairline)',
    borderTopStyle: 'solid',
    borderTopWidth: 'var(--border-width)',
    paddingTop: 'var(--spacing-3)',
  },
  sectionHeader: {
    borderBottomColor: 'var(--meta-hairline)',
    borderBottomStyle: 'solid',
    borderBottomWidth: 'var(--border-width)',
    paddingBottom: 'var(--spacing-4)',
  },
  sectionHeaderTight: {
    borderBottomColor: 'var(--meta-hairline)',
    borderBottomStyle: 'solid',
    borderBottomWidth: 'var(--border-width)',
    paddingBottom: 'var(--spacing-2)',
  },
  // Same white inner card as the contract "Lô hàng" tab's partner cards.
  field: {
    backgroundColor: 'var(--color-background-card)',
    borderColor: 'var(--color-border)',
    borderRadius: 'var(--radius-element)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    minWidth: 0,
    padding: 'var(--spacing-3)',
  },
  container: {
    backgroundColor: 'var(--color-background-card)',
    borderColor: 'var(--color-border)',
    borderRadius: 'var(--radius-container)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    minWidth: 0,
    padding: 'var(--spacing-4)',
  },
  iconTile: {
    borderRadius: 'var(--radius-element)',
    flexShrink: 0,
  },
});

const tileSizes = stylex.create({
  md: {
    height: 'var(--spacing-8)',
    width: 'var(--spacing-8)',
  },
  lg: {
    height: 'var(--spacing-9)',
    width: 'var(--spacing-9)',
  },
});

const tileTones = stylex.create({
  accent: {
    backgroundColor: 'var(--meta-blue-wash)',
    color: 'var(--color-accent)',
  },
  success: {
    backgroundColor: 'var(--meta-emerald-wash)',
    color: 'var(--meta-emerald-fill)',
  },
  indigo: {
    backgroundColor: 'var(--meta-indigo-wash)',
    color: 'var(--meta-indigo)',
  },
  warning: {
    backgroundColor: 'var(--meta-amber-wash)',
    color: 'var(--meta-amber-text)',
  },
});
