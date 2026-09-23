'use client';

import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { StackItem } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { Check, Pencil, Trash2 } from 'lucide-react';

import { MetaPill } from './pill.jsx';

/** @typedef {'accent' | 'indigo' | 'success'} MetaPaymentStepTone */

/** Figma 103:4983 colors payment steps blue → indigo → emerald, repeating. */
/** @type {MetaPaymentStepTone[]} */
export const META_PAYMENT_STEP_TONES = ['accent', 'indigo', 'success'];

/** @param {number} index @returns {MetaPaymentStepTone} */
export function metaPaymentStepTone(index) {
  return META_PAYMENT_STEP_TONES[index % META_PAYMENT_STEP_TONES.length];
}

/**
 * "CÁC ĐỢT THANH TOÁN CAM KẾT" header + stacked split bar (Figma 103:4983):
 * one segment per payment step, sized by its ratio, in the step's tone.
 *
 * @param {{
 *   label: string,
 *   totalLabel: string,
 *   isBalanced: boolean,
 *   ratios: number[],
 * }} props
 */
export function MetaPaymentSplitBar({ label, totalLabel, isBalanced, ratios }) {
  return (
    <VStack gap={2} hAlign="stretch">
      <HStack hAlign="between" vAlign="center" gap={2} wrap="wrap">
        <Text
          size="xsm"
          weight="semibold"
          color="secondary"
          xstyle={styles.caps}
        >
          {label}
        </Text>
        <HStack gap={1} vAlign="center" wrap="nowrap">
          <Text
            size="xsm"
            weight="semibold"
            color="secondary"
            xstyle={styles.caps}
          >
            Tổng tỷ lệ:
          </Text>
          <Text
            size="sm"
            weight="bold"
            color={isBalanced ? 'meta-success' : 'inherit'}
            hasTabularNumbers
            xstyle={!isBalanced && styles.error}
          >
            {totalLabel}
          </Text>
        </HStack>
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
 * One payment step card (Figma 103:4983): numbered tile, title, ratio pill,
 * amount and a one-line condition, with edit / remove actions. While
 * `isEditing`, `editor` (the step's input controls) renders under it.
 *
 * @param {{
 *   sequence: number,
 *   title: string,
 *   ratioLabel: string,
 *   amount?: string,
 *   description?: string,
 *   isEditing: boolean,
 *   onToggleEdit: () => void,
 *   onRemove: () => void,
 *   isRemoveDisabled?: boolean,
 *   editor: import('react').ReactNode,
 * }} props
 */
export function MetaPaymentTermRow({
  sequence,
  title,
  ratioLabel,
  amount,
  description,
  isEditing,
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
      xstyle={[styles.row, isEditing && styles.rowEditing]}
    >
      <HStack gap={3} vAlign="center" wrap="nowrap">
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
            <HStack gap={2} vAlign="center" wrap="wrap">
              <Text size="base" weight="bold" maxLines={1}>
                {title}
              </Text>
              <MetaPill label={ratioLabel} tone={tone} size="sm" />
              {amount ? (
                <Text size="sm" weight="bold" hasTabularNumbers>
                  ({amount})
                </Text>
              ) : null}
            </HStack>
            {description ? (
              <Text size="xsm" color="secondary" maxLines={1}>
                {description}
              </Text>
            ) : null}
          </VStack>
        </StackItem>
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
      </HStack>
      {isEditing ? editor : null}
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
  track: {
    backgroundColor: 'var(--color-border)',
    borderRadius: 'var(--radius-full)',
    height: 'var(--spacing-2)',
    overflow: 'hidden',
  },
  segment: (/** @type {string} */ basis) => ({
    flexBasis: basis,
    flexShrink: 0,
    height: '100%',
  }),
  row: {
    backgroundColor: 'var(--color-background-surface)',
    borderColor: 'var(--color-border)',
    borderRadius: 'var(--meta-radius-inset)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    padding: 'var(--spacing-3)',
  },
  rowEditing: {
    borderColor: 'var(--meta-blue-active-border)',
  },
  tile: {
    borderRadius: 'var(--radius-element)',
    flexShrink: 0,
    height: 'var(--spacing-8)',
    width: 'var(--spacing-8)',
  },
  minZero: {
    minWidth: 0,
  },
});

const tileTones = stylex.create({
  accent: {
    backgroundColor: 'var(--meta-blue-wash)',
    color: 'var(--color-accent)',
  },
  indigo: {
    backgroundColor: 'var(--meta-indigo-wash)',
    color: 'var(--meta-indigo)',
  },
  success: {
    backgroundColor: 'var(--meta-emerald-wash)',
    color: 'var(--meta-emerald-fill)',
  },
});

const segmentTones = stylex.create({
  accent: { backgroundColor: 'var(--color-accent)' },
  indigo: { backgroundColor: 'var(--meta-indigo)' },
  success: { backgroundColor: 'var(--meta-emerald-fill)' },
});
