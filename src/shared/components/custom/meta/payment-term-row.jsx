'use client';

import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { StackItem } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { Check, CircleAlert, CircleCheck, Pencil, Trash2 } from 'lucide-react';

import { MetaPill } from './pill.jsx';

/** @typedef {'accent' | 'indigo' | 'success'} MetaPaymentStepTone */

/** Figma colors payment steps blue → indigo → emerald, repeating. */
/** @type {MetaPaymentStepTone[]} */
export const META_PAYMENT_STEP_TONES = ['accent', 'indigo', 'success'];

/** @param {number} index @returns {MetaPaymentStepTone} */
export function metaPaymentStepTone(index) {
  return META_PAYMENT_STEP_TONES[index % META_PAYMENT_STEP_TONES.length];
}

/**
 * Payment split header + stacked bar: one segment per step, sized by its
 * ratio, in the step's tone (Figma 103:4983). `hasLegend` (Figma 104:5399)
 * lists "Đợt N (x%)" after `label` in the step tones and shows `totalLabel`
 * as a compact status with a check / alert icon instead of the uppercase
 * "Tổng tỷ lệ" caption.
 *
 * @param {{
 *   label: string,
 *   totalLabel: string,
 *   isBalanced: boolean,
 *   ratios: number[],
 *   hasLegend?: boolean,
 * }} props
 */
export function MetaPaymentSplitBar({
  label,
  totalLabel,
  isBalanced,
  ratios,
  hasLegend = false,
}) {
  return (
    <VStack gap={2} hAlign="stretch">
      <HStack hAlign="between" vAlign="center" gap={2} wrap="wrap">
        {hasLegend ? (
          <HStack gap={2} vAlign="center" wrap="wrap">
            <Text size="sm" weight="medium" color="secondary">
              {label}
            </Text>
            {ratios.map((ratio, index) => (
              <HStack
                // Ratios are positional; a step has no id of its own here.
                key={index}
                gap={2}
                vAlign="center"
                wrap="nowrap"
              >
                {index > 0 ? (
                  <Text size="sm" color="secondary" aria-hidden>
                    +
                  </Text>
                ) : null}
                <Text
                  size="sm"
                  weight="bold"
                  color="inherit"
                  xstyle={legendTones[metaPaymentStepTone(index)]}
                >
                  Đợt {index + 1} ({ratio}%)
                </Text>
              </HStack>
            ))}
          </HStack>
        ) : (
          <Text
            size="sm"
            weight="semibold"
            color="secondary"
            xstyle={styles.caps}
          >
            {label}
          </Text>
        )}
        {hasLegend ? (
          <HStack
            gap={1}
            vAlign="center"
            wrap="nowrap"
            xstyle={isBalanced ? styles.statusOk : styles.error}
          >
            <Icon
              icon={isBalanced ? CircleCheck : CircleAlert}
              size="sm"
              color="inherit"
            />
            <Text size="sm" weight="bold" color="inherit">
              {totalLabel}
            </Text>
          </HStack>
        ) : (
          <HStack gap={1} vAlign="center" wrap="nowrap">
            <Text
              size="sm"
              weight="semibold"
              color="secondary"
              xstyle={styles.caps}
            >
              Tổng tỷ lệ:
            </Text>
            <Text
              weight="bold"
              color={isBalanced ? 'meta-success' : 'inherit'}
              hasTabularNumbers
              xstyle={!isBalanced && styles.error}
            >
              {totalLabel}
            </Text>
          </HStack>
        )}
      </HStack>
      <HStack wrap="nowrap" xstyle={styles.track}>
        {ratios.map((ratio, index) => (
          <HStack
            // Ratios are positional; a step has no id of its own here.
            key={index}
            as="span"
            xstyle={[
              styles.segment(`${Math.max(0, ratio)}%`),
              segmentTones[metaPaymentStepTone(index)],
            ]}
          />
        ))}
      </HStack>
    </VStack>
  );
}

/**
 * One payment step card (Figma 104:5399): a header line — numbered tile,
 * title + ratio pill over a one-line `subtitle`, then the amount (in the
 * step's tone) and edit / remove actions — and the step's full condition in
 * a tinted note box underneath (clamped to `descriptionLines`, full text in
 * the truncation tooltip). The card border is tinted by the step's tone.
 * While `isEditing`, `editor` (the step's inputs) replaces the note box.
 *
 * @param {{
 *   sequence: number,
 *   title: string,
 *   subtitle?: string,
 *   ratioLabel: string,
 *   amount?: string,
 *   description?: string,
 *   descriptionLines?: number,
 *   isEditing: boolean,
 *   isReadOnly?: boolean,
 *   onToggleEdit: () => void,
 *   onRemove: () => void,
 *   isRemoveDisabled?: boolean,
 *   editor: import('react').ReactNode,
 * }} props
 */
export function MetaPaymentTermRow({
  sequence,
  title,
  subtitle,
  ratioLabel,
  amount,
  description,
  descriptionLines = 2,
  isEditing,
  isReadOnly = false,
  onToggleEdit,
  onRemove,
  isRemoveDisabled = false,
  editor,
}) {
  const tone = metaPaymentStepTone(sequence - 1);

  return (
    <VStack
      gap={3}
      hAlign="stretch"
      xstyle={[styles.row, rowTones[tone], isEditing && styles.rowEditing]}
    >
      <HStack hAlign="between" vAlign="center" gap={3} wrap="nowrap">
        <HStack gap={3} vAlign="center" wrap="nowrap" xstyle={styles.minZero}>
          <HStack
            as="span"
            hAlign="center"
            vAlign="center"
            xstyle={[styles.tile, tileTones[tone]]}
          >
            <Text
              as="span"
              size="sm"
              weight="bold"
              color="inherit"
              hasTabularNumbers
            >
              {String(sequence).padStart(2, '0')}
            </Text>
          </HStack>
          <StackItem size="fill" xstyle={styles.minZero}>
            <VStack gap={0.5} hAlign="stretch">
              <HStack gap={2} vAlign="center" wrap="nowrap">
                <Text weight="bold" maxLines={1}>
                  {title}
                </Text>
                <MetaPill label={ratioLabel} tone={tone} size="sm" />
              </HStack>
              {subtitle ? (
                <Text size="sm" color="secondary" maxLines={1}>
                  {subtitle}
                </Text>
              ) : null}
            </VStack>
          </StackItem>
        </HStack>
        <HStack gap={2} vAlign="center" wrap="nowrap">
          {amount ? (
            <Text
              weight="bold"
              color="inherit"
              hasTabularNumbers
              xstyle={[styles.amount, amountTones[tone]]}
            >
              {amount}
            </Text>
          ) : null}
          {isReadOnly ? null : (
            <HStack gap={0.5} wrap="nowrap">
              <IconButton
                label={isEditing ? 'Xong' : 'Sửa đợt thanh toán'}
                tooltip={isEditing ? 'Xong' : 'Sửa'}
                icon={<Icon icon={isEditing ? Check : Pencil} size="sm" />}
                type="button"
                variant="ghost"
                size="sm"
                onClick={onToggleEdit}
              />
              <IconButton
                label="Xoá đợt thanh toán"
                tooltip="Xoá"
                icon={<Icon icon={Trash2} size="sm" />}
                type="button"
                variant="ghost"
                size="sm"
                isDisabled={isRemoveDisabled}
                onClick={onRemove}
              />
            </HStack>
          )}
        </HStack>
      </HStack>
      {isEditing ? (
        <VStack gap={3} hAlign="stretch">
          {editor}
        </VStack>
      ) : description ? (
        <Text
          size="sm"
          color="secondary"
          maxLines={descriptionLines}
          xstyle={styles.note}
        >
          {description}
        </Text>
      ) : null}
    </VStack>
  );
}

const styles = stylex.create({
  caps: {
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  error: {
    color: 'var(--color-error)',
  },
  statusOk: {
    color: 'var(--meta-emerald-text)',
  },
  track: {
    backgroundColor: 'var(--meta-split-track)',
    borderRadius: 'var(--radius-full)',
    gap: 'var(--spacing-0-5)',
    height: 'var(--spacing-2)',
    overflow: 'hidden',
  },
  segment: (/** @type {string} */ basis) => ({
    flexBasis: basis,
    flexShrink: 1,
    height: '100%',
  }),
  row: {
    backgroundColor: 'var(--color-background-surface)',
    borderRadius: 'var(--radius-element)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    padding: 'var(--spacing-4)',
  },
  rowEditing: {
    borderColor: 'var(--color-accent)',
  },
  tile: {
    borderRadius: 'var(--radius-element)',
    flexShrink: 0,
    height: 'var(--spacing-7)',
    width: 'var(--spacing-7)',
  },
  note: {
    backgroundColor: 'var(--meta-surface-container-low)',
    borderRadius: 'var(--radius-element)',
    paddingBlock: 'var(--spacing-2)',
    paddingInline: 'var(--spacing-3)',
  },
  amount: {
    flexShrink: 0,
  },
  minZero: {
    minWidth: 0,
  },
});

const rowTones = stylex.create({
  accent: { borderColor: 'var(--color-border-emphasized)' },
  indigo: { borderColor: 'var(--meta-indigo-border)' },
  success: { borderColor: 'var(--meta-emerald-border)' },
});

const tileTones = stylex.create({
  accent: {
    backgroundColor: 'var(--meta-primary-fixed)',
    color: 'var(--meta-primary-strong)',
  },
  indigo: {
    backgroundColor: 'var(--meta-indigo-soft)',
    color: 'var(--meta-indigo-deep)',
  },
  success: {
    backgroundColor: 'var(--meta-emerald-wash)',
    color: 'var(--meta-emerald-text)',
  },
});

const amountTones = stylex.create({
  accent: { color: 'var(--color-text-primary)' },
  indigo: { color: 'var(--meta-indigo-deep)' },
  success: { color: 'var(--meta-emerald-text)' },
});

const legendTones = stylex.create({
  accent: { color: 'var(--meta-primary-strong)' },
  indigo: { color: 'var(--meta-indigo)' },
  success: { color: 'var(--meta-emerald-text)' },
});

const segmentTones = stylex.create({
  accent: { backgroundColor: 'var(--meta-primary-strong)' },
  indigo: { backgroundColor: 'var(--meta-indigo)' },
  success: { backgroundColor: 'var(--meta-emerald-fill)' },
});
