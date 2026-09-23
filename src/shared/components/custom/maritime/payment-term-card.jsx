'use client';

import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { StackItem } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';

import { IconTrash } from '@/shared/components/icon/icon-trash.jsx';

import { MaritimeCard } from './card.jsx';

/**
 * Figma-matched payment milestone card built on Astryx primitives. Business
 * inputs stay with the feature and are supplied as slots, keeping this shared
 * component reusable without coupling it to a form hook or API payload.
 * @param {{
 *   sequence: number,
 *   title: string,
 *   amount: string,
 *   method: string,
 *   ratioControl: import('react').ReactNode,
 *   conditionControl: import('react').ReactNode,
 *   isHighlighted?: boolean,
 *   isRemoveDisabled?: boolean,
 *   onRemove: () => void,
 * }} props
 */
export function MaritimePaymentTermCard({
  sequence,
  title,
  amount,
  method,
  ratioControl,
  conditionControl,
  isHighlighted = false,
  isRemoveDisabled = false,
  onRemove,
}) {
  return (
    <MaritimeCard
      padding={0}
      xstyle={[styles.card, isHighlighted && styles.highlightedCard]}
    >
      <VStack gap={0} hAlign="stretch" xstyle={styles.content}>
        <HStack hAlign="between" vAlign="center" gap={3} xstyle={styles.header}>
          <HStack vAlign="center" gap={2}>
            <Text
              as="span"
              type="supporting"
              weight="bold"
              color="inherit"
              hasTabularNumbers
              xstyle={[
                styles.sequence,
                isHighlighted && styles.highlightedSequence,
              ]}
            >
              Đợt {sequence}
            </Text>
            <Text
              as="h3"
              type="body"
              weight="bold"
              color={isHighlighted ? 'accent' : 'primary'}
              xstyle={styles.title}
            >
              {title}
            </Text>
          </HStack>
          <IconButton
            label={`Xoá đợt ${sequence}`}
            tooltip="Xoá"
            icon={<Icon icon={IconTrash} size="sm" />}
            type="button"
            variant="ghost"
            size="sm"
            isDisabled={isRemoveDisabled}
            onClick={onRemove}
            xstyle={styles.removeButton}
          />
        </HStack>

        <Grid columns={{ minWidth: 260, max: 2, repeat: 'fill' }} gap={3}>
          <VStack gap={1} hAlign="stretch">
            <PaymentFieldLabel>Tỷ lệ (%)</PaymentFieldLabel>
            <HStack gap={2} vAlign="stretch">
              <StackItem size="static" xstyle={styles.ratioSlot}>
                {ratioControl}
              </StackItem>
              <StackItem size="fill">
                <HStack vAlign="center" xstyle={styles.amountBox}>
                  <Text
                    type="supporting"
                    weight="bold"
                    color="inherit"
                    hasTabularNumbers
                    size="base"
                  >
                    = {amount || '—'}
                  </Text>
                </HStack>
              </StackItem>
            </HStack>
          </VStack>
          <VStack gap={1} hAlign="stretch">
            <PaymentFieldLabel>Phương thức thanh toán</PaymentFieldLabel>
            <HStack vAlign="center" xstyle={styles.methodBox}>
              <Text type="supporting" weight="bold" color="inherit">
                {method}
              </Text>
            </HStack>
          </VStack>
        </Grid>

        <VStack gap={1} hAlign="stretch">
          <PaymentFieldLabel>Điều kiện kích hoạt thanh toán</PaymentFieldLabel>
          {conditionControl}
        </VStack>
      </VStack>
    </MaritimeCard>
  );
}

/** @param {{ children: import('react').ReactNode }} props */
function PaymentFieldLabel({ children }) {
  return (
    <Text
      type="supporting"
      weight="semibold"
      color="secondary"
      xstyle={styles.fieldLabel}
    >
      {children}
    </Text>
  );
}

const styles = stylex.create({
  card: { borderRadius: 'var(--maritime-payment-card-radius)' },
  highlightedCard: {
    backgroundColor: 'var(--maritime-payment-card-active-background)',
    borderColor: 'var(--maritime-payment-card-active-border)',
  },
  content: {
    padding: 'var(--maritime-payment-card-padding)',
    rowGap: 'var(--maritime-payment-card-gap)',
  },
  header: {
    borderBottomColor: 'var(--maritime-payment-card-divider)',
    borderBottomStyle: 'solid',
    borderBottomWidth: 'var(--border-width)',
    minHeight: 'var(--maritime-payment-card-header-height)',
    paddingBottom: 'var(--maritime-payment-header-padding-bottom)',
  },
  sequence: {
    backgroundColor: 'var(--maritime-payment-sequence-background)',
    borderColor: 'var(--maritime-payment-sequence-border)',
    borderRadius: 'var(--maritime-payment-control-radius)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    color: 'var(--color-accent)',
    fontFamily: 'var(--maritime-contract-code-font)',
    fontSize: 'var(--maritime-form-section-title-size)',
    lineHeight: 'var(--maritime-form-section-title-leading)',
    paddingBlock: 'var(--maritime-payment-sequence-padding-block)',
    paddingInline: 'var(--spacing-2)',
  },
  highlightedSequence: {
    backgroundColor: 'var(--maritime-payment-sequence-active-background)',
    borderColor: 'var(--maritime-payment-sequence-active-border)',
    color: 'var(--maritime-teal-text)',
  },
  title: {
    fontSize: 'var(--font-size-sm)',
    lineHeight: 'var(--line-height-sm)',
    margin: 0,
  },
  removeButton: {
    color: 'var(--maritime-payment-muted)',
    minHeight: 'var(--maritime-payment-remove-size)',
    minWidth: 'var(--maritime-payment-remove-size)',
  },
  fieldLabel: {
    color: 'var(--maritime-payment-muted)',
    fontSize: 'var(--maritime-payment-label-size)',
    letterSpacing: 'var(--maritime-payment-label-tracking)',
    lineHeight: 'var(--maritime-payment-label-leading)',
    textTransform: 'uppercase',
  },
  ratioSlot: {
    width: 'var(--maritime-payment-ratio-width)',
  },
  amountBox: {
    backgroundColor: 'var(--maritime-payment-amount-background)',
    borderColor: 'var(--maritime-payment-amount-border)',
    borderRadius: 'var(--maritime-payment-control-radius)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    color: 'var(--maritime-teal-value)',
    height: 'var(--maritime-payment-control-height)',
    paddingInline: 'var(--spacing-2)',
    width: '100%',
  },
  methodBox: {
    backgroundColor: 'var(--color-background-surface)',
    borderColor: 'var(--color-border)',
    borderRadius: 'var(--maritime-payment-control-radius)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    color: 'var(--color-text-primary)',
    height: 'var(--maritime-payment-control-height)',
    paddingInline: 'var(--spacing-2)',
    width: '100%',
  },
});
