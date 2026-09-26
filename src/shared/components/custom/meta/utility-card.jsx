'use client';

import { Card } from '@astryxdesign/core/Card';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import {
  SegmentedControl,
  SegmentedControlItem,
} from '@astryxdesign/core/SegmentedControl';
import { StackItem } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import {
  Check,
  CircleAlert,
  CircleCheck,
  Copy,
  Info,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { metaPaymentStepTone } from './payment-term-row.jsx';

/**
 * "Tiện ích › Giá trị" building blocks (Figma 156:2): utility module
 * cards, the "Bằng chữ" words box, the installment split bar and items,
 * and the footer note. Composed from Astryx only (golden rule #15).
 */

const COPIED_RESET_MS = 2000;

/** @typedef {import('./payment-term-row.jsx').MetaPaymentStepTone} MetaPaymentStepTone */

/**
 * Module card: icon tile + title + "MODULE 0n" tag, a muted description,
 * then the card body. Fields inside take the Figma form height (40px).
 * @param {{
 *   icon: import('lucide-react').LucideIcon,
 *   title: string,
 *   tag?: string,
 *   description?: string,
 *   children: import('react').ReactNode,
 * }} props
 */
export function MetaUtilityCard({ icon, title, tag, description, children }) {
  return (
    <Card padding={5} xstyle={styles.card}>
      <VStack gap={4} hAlign="stretch">
        <VStack gap={1.5} hAlign="stretch">
          <HStack hAlign="between" vAlign="center" gap={3} wrap="nowrap">
            <HStack gap={2} vAlign="center" wrap="nowrap">
              <HStack
                as="span"
                hAlign="center"
                vAlign="center"
                xstyle={styles.iconTile}
              >
                <Icon icon={icon} size="sm" color="inherit" />
              </HStack>
              <Text as="h2" size="lg" weight="bold">
                {title}
              </Text>
            </HStack>
            {tag ? (
              <HStack as="span" xstyle={styles.tag}>
                <Text
                  as="span"
                  size="sm"
                  weight="semibold"
                  color="meta-subtle"
                  xstyle={styles.caps}
                >
                  {tag}
                </Text>
              </HStack>
            ) : null}
          </HStack>
          {description ? (
            <Text as="p" size="sm" color="secondary">
              {description}
            </Text>
          ) : null}
        </VStack>
        {children}
      </VStack>
    </Card>
  );
}

/**
 * Label over a full-width segmented control on the tinted Figma track, as
 * tall as the fields beside it.
 * @param {{
 *   label: string,
 *   value: string,
 *   onChange: (value: string) => void,
 *   options: Array<{ value: string, label: string }>,
 * }} props
 */
export function MetaSegmentedField({ label, value, onChange, options }) {
  return (
    <VStack gap={1} hAlign="stretch">
      <Text as="span" weight="medium">
        {label}
      </Text>
      <SegmentedControl
        label={label}
        value={value}
        onChange={onChange}
        layout="fill"
        xstyle={styles.segmented}
      >
        {options.map((option) => (
          <SegmentedControlItem
            key={option.value}
            value={option.value}
            label={option.label}
            xstyle={styles.segmentedItem}
          />
        ))}
      </SegmentedControl>
    </VStack>
  );
}

/**
 * Tinted "Bằng chữ" box: optional uppercase caption over the words, and a
 * copy button. `isCompact` is the per-installment variant (no caption,
 * medium weight, tighter padding).
 * @param {{
 *   words: string,
 *   placeholder: string,
 *   caption?: string,
 *   isCompact?: boolean,
 * }} props
 */
export function MetaWordsBox({
  words,
  placeholder,
  caption,
  isCompact = false,
}) {
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!isCopied) return undefined;
    const timer = setTimeout(() => setIsCopied(false), COPIED_RESET_MS);
    return () => clearTimeout(timer);
  }, [isCopied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(words);
      setIsCopied(true);
    } catch (error) {
      console.error('Không sao chép được chữ số tiền', error);
    }
  };

  return (
    <HStack
      gap={3}
      vAlign="center"
      wrap="nowrap"
      xstyle={[styles.wordsBox, isCompact && styles.wordsBoxCompact]}
    >
      <StackItem size="fill">
        <VStack gap={0.5} hAlign="stretch">
          {caption ? (
            <Text
              as="span"
              size="sm"
              weight="semibold"
              color="meta-subtle"
              xstyle={styles.caps}
            >
              {caption}
            </Text>
          ) : null}
          <Text
            as="p"
            weight={words ? (isCompact ? 'medium' : 'semibold') : 'normal'}
            color={words ? 'primary' : 'meta-subtle'}
          >
            {words || placeholder}
          </Text>
        </VStack>
      </StackItem>
      <IconButton
        label={isCopied ? 'Đã sao chép' : 'Sao chép bằng chữ'}
        tooltip={isCopied ? 'Đã sao chép' : 'Sao chép'}
        icon={<Icon icon={isCopied ? Check : Copy} size="sm" />}
        type="button"
        variant="ghost"
        size="sm"
        isDisabled={!words}
        onClick={handleCopy}
      />
    </HStack>
  );
}

/**
 * "PHÂN BỔ TỶ TRỌNG CÁC ĐỢT": caption + status, one bar segment per
 * installment in its step tone, and a dot legend "Đợt n · x% (amount)".
 * @param {{
 *   label: string,
 *   statusLabel: string,
 *   status: 'balanced' | 'under' | 'over',
 *   segments: Array<{ key: string, label: string, ratioLabel: string, detail?: string, ratio: number }>,
 * }} props
 */
export function MetaAllocationBar({ label, statusLabel, status, segments }) {
  return (
    <VStack gap={2} hAlign="stretch" xstyle={styles.allocation}>
      <HStack hAlign="between" vAlign="center" gap={3} wrap="wrap">
        <Text as="span" size="sm" weight="bold" xstyle={styles.caps}>
          {label}
        </Text>
        <Text
          as="span"
          size="sm"
          weight="semibold"
          color={
            status === 'balanced'
              ? 'meta-accent-strong'
              : status === 'over'
                ? 'meta-danger'
                : 'meta-amber'
          }
          hasTabularNumbers
          xstyle={styles.caps}
        >
          {statusLabel}
        </Text>
      </HStack>
      <HStack wrap="nowrap" xstyle={styles.track}>
        {segments.map((segment, index) => (
          <HStack
            key={segment.key}
            as="span"
            xstyle={[
              styles.segment(`${Math.min(100, Math.max(0, segment.ratio))}%`),
              toneFills[metaPaymentStepTone(index)],
            ]}
          />
        ))}
      </HStack>
      <HStack gap={6} vAlign="center" wrap="wrap">
        {segments.map((segment, index) => (
          <HStack key={segment.key} gap={2} vAlign="center" wrap="nowrap">
            <HStack
              as="span"
              xstyle={[styles.dot, toneFills[metaPaymentStepTone(index)]]}
            />
            <Text as="span" size="sm" color="secondary" hasTabularNumbers>
              {segment.label} ·{' '}
              <Text as="span" size="sm" weight="semibold" hasTabularNumbers>
                {segment.ratioLabel}
              </Text>
              {segment.detail ? ` (${segment.detail})` : ''}
            </Text>
          </HStack>
        ))}
      </HStack>
    </VStack>
  );
}

/**
 * One installment: numbered tile in the step tone + title + remove, then
 * `children` (inputs, value, words). Items are separated by a hairline.
 * @param {{
 *   index: number,
 *   title: string,
 *   isRemoveDisabled?: boolean,
 *   onRemove: () => void,
 *   children: import('react').ReactNode,
 * }} props
 */
export function MetaInstallmentItem({
  index,
  title,
  isRemoveDisabled = false,
  onRemove,
  children,
}) {
  const tone = metaPaymentStepTone(index);

  return (
    <VStack gap={3} hAlign="stretch" xstyle={styles.item}>
      <HStack hAlign="between" vAlign="center" gap={3} wrap="nowrap">
        <HStack gap={2} vAlign="center" wrap="nowrap">
          <HStack
            as="span"
            hAlign="center"
            vAlign="center"
            xstyle={[styles.stepTile, tileTones[tone]]}
          >
            <Text
              as="span"
              size="sm"
              weight="bold"
              color="inherit"
              hasTabularNumbers
            >
              {String(index + 1).padStart(2, '0')}
            </Text>
          </HStack>
          <Text as="h3" size="base" weight="bold">
            {title}
          </Text>
        </HStack>
        <IconButton
          label={`Xoá ${title}`}
          tooltip="Xoá đợt"
          icon={<Icon icon={Trash2} size="sm" color="secondary" />}
          type="button"
          variant="ghost"
          size="sm"
          isDisabled={isRemoveDisabled}
          onClick={onRemove}
        />
      </HStack>
      {children}
    </VStack>
  );
}

/**
 * Read-only value under a field label: big tabular figure in the step
 * tone + a small unit ("3,000.08 USD"), or "—".
 * @param {{ label: string, index: number, value?: string, unit: string }} props
 */
export function MetaValueFigure({ label, index, value, unit }) {
  const tone = metaPaymentStepTone(index);

  return (
    <VStack gap={1} hAlign="stretch">
      <Text as="span" weight="medium">
        {label}
      </Text>
      <HStack gap={1.5} vAlign="end" wrap="nowrap" xstyle={styles.figure}>
        {value === undefined ? (
          <Text as="span" size="xl" weight="bold" color="meta-subtle">
            —
          </Text>
        ) : (
          <>
            <Text
              as="span"
              size="xl"
              weight="bold"
              color={figureTones[tone]}
              hasTabularNumbers
            >
              {value}
            </Text>
            <Text as="span" size="sm" weight="semibold" color="secondary">
              {unit}
            </Text>
          </>
        )}
      </HStack>
    </VStack>
  );
}

/**
 * "TỔNG CÁC ĐỢT: 10,000.25 USD" + a "Còn lại" pill: emerald with a check
 * when the split covers the total, amber (short) / red (over) otherwise.
 * @param {{
 *   label: string,
 *   total: string,
 *   remainingLabel?: string,
 *   status: 'balanced' | 'under' | 'over',
 * }} props
 */
export function MetaAllocationFooter({ label, total, remainingLabel, status }) {
  return (
    <HStack
      hAlign="between"
      vAlign="center"
      gap={3}
      wrap="wrap"
      xstyle={styles.footer}
    >
      <HStack gap={2} vAlign="center" wrap="nowrap">
        <Text
          as="span"
          size="sm"
          weight="bold"
          color="secondary"
          xstyle={styles.caps}
        >
          {label}
        </Text>
        <Text as="span" weight="bold" hasTabularNumbers>
          {total}
        </Text>
      </HStack>
      {remainingLabel ? (
        <HStack
          as="span"
          gap={1.5}
          vAlign="center"
          wrap="nowrap"
          xstyle={[styles.remaining, remainingTones[status]]}
        >
          <Icon
            icon={status === 'balanced' ? CircleCheck : CircleAlert}
            size="sm"
            color="inherit"
          />
          <Text
            as="span"
            size="sm"
            weight="bold"
            color="inherit"
            hasTabularNumbers
          >
            {remainingLabel}
          </Text>
        </HStack>
      ) : null}
    </HStack>
  );
}

/**
 * Muted footnote card with an info tile.
 * @param {{ children: import('react').ReactNode }} props
 */
export function MetaInfoNote({ children }) {
  return (
    <HStack gap={3} vAlign="center" wrap="nowrap" xstyle={styles.note}>
      <HStack
        as="span"
        hAlign="center"
        vAlign="center"
        xstyle={styles.noteTile}
      >
        <Icon icon={Info} size="sm" color="secondary" />
      </HStack>
      <Text as="p" size="sm" color="secondary">
        {children}
      </Text>
    </HStack>
  );
}

/**
 * Inline code chip for a character inside `MetaInfoNote` (",", ".").
 * @param {{ children: string }} props
 */
export function MetaInlineCode({ children }) {
  return (
    <Text
      as="span"
      size="sm"
      color="primary"
      hasTabularNumbers
      xstyle={styles.code}
    >
      {children}
    </Text>
  );
}

/** @type {Record<MetaPaymentStepTone, 'meta-accent-strong' | 'meta-indigo' | 'meta-success'>} */
const figureTones = {
  accent: 'meta-accent-strong',
  indigo: 'meta-indigo',
  success: 'meta-success',
};

const toneFills = stylex.create({
  accent: { backgroundColor: 'var(--meta-primary-strong)' },
  indigo: { backgroundColor: 'var(--meta-indigo)' },
  success: { backgroundColor: 'var(--meta-emerald-fill)' },
});

const tileTones = stylex.create({
  accent: {
    backgroundColor: 'var(--meta-primary-fixed)',
    color: 'var(--meta-primary-strong)',
  },
  indigo: {
    backgroundColor: 'var(--meta-indigo-wash)',
    color: 'var(--meta-indigo-deep)',
  },
  success: {
    backgroundColor: 'var(--meta-emerald-wash)',
    color: 'var(--meta-emerald-text)',
  },
});

const remainingTones = stylex.create({
  balanced: {
    backgroundColor: 'var(--meta-emerald-wash)',
    borderColor: 'var(--meta-emerald-border)',
    color: 'var(--meta-emerald-deep)',
  },
  under: {
    backgroundColor: 'var(--meta-amber-wash)',
    borderColor: 'var(--meta-amber-border)',
    color: 'var(--meta-amber-text)',
  },
  over: {
    backgroundColor: 'var(--color-error-muted)',
    borderColor: 'var(--color-error-muted)',
    color: 'var(--color-error)',
  },
});

const styles = stylex.create({
  card: {
    // Figma form row: 40px fields. StyleX compiles custom-property keys;
    // its lint rule just doesn't know them.
    // eslint-disable-next-line @stylexjs/valid-styles
    '--meta-field-height': 'var(--spacing-10)',
    borderColor: 'var(--color-border-emphasized)',
    borderRadius: 'var(--meta-radius-inset)',
    boxShadow: 'var(--meta-shadow-card)',
  },
  iconTile: {
    backgroundColor: 'var(--meta-surface-container)',
    borderRadius: 'var(--radius-element)',
    color: 'var(--meta-primary-strong)',
    flexShrink: 0,
    height: 'var(--spacing-8)',
    width: 'var(--spacing-8)',
  },
  tag: {
    backgroundColor: 'var(--meta-surface-container-low)',
    borderRadius: 'var(--radius-full)',
    flexShrink: 0,
    paddingBlock: 'var(--spacing-0-5)',
    paddingInline: 'var(--spacing-3)',
  },
  caps: {
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  segmented: {
    backgroundColor: 'var(--meta-surface-container-low)',
    borderColor: 'var(--color-border-emphasized)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    height: 'var(--meta-field-height, var(--spacing-10))',
    padding: 'var(--spacing-1)',
    width: '100%',
  },
  // Fills the track, so the selected pill sits on an even inset all round
  // (the theme keeps track and item pill-shaped, i.e. concentric).
  segmentedItem: {
    height: '100%',
  },
  wordsBox: {
    backgroundColor: 'var(--meta-surface-container-low)',
    borderColor: 'var(--color-border-emphasized)',
    borderRadius: 'var(--radius-element)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    paddingBlock: 'var(--spacing-3)',
    paddingInline: 'var(--spacing-4)',
  },
  wordsBoxCompact: {
    paddingBlock: 'var(--spacing-2)',
    paddingInline: 'var(--spacing-3)',
  },
  allocation: {
    borderBlockStartColor: 'var(--color-border)',
    borderBlockStartStyle: 'solid',
    borderBlockStartWidth: 'var(--border-width)',
    paddingBlockStart: 'var(--spacing-5)',
  },
  track: {
    backgroundColor: 'var(--meta-split-track)',
    borderRadius: 'var(--radius-full)',
    height: 'var(--spacing-2)',
    overflow: 'hidden',
  },
  segment: (/** @type {string} */ basis) => ({
    flexBasis: basis,
    flexShrink: 0,
    height: '100%',
  }),
  dot: {
    borderRadius: 'var(--radius-full)',
    flexShrink: 0,
    height: 'var(--spacing-3)',
    width: 'var(--spacing-3)',
  },
  item: {
    borderBlockEndColor: 'var(--color-border)',
    borderBlockEndStyle: 'solid',
    borderBlockEndWidth: 'var(--border-width)',
    paddingBlock: 'var(--spacing-4)',
  },
  stepTile: {
    borderRadius: 'var(--radius-element)',
    flexShrink: 0,
    height: 'var(--spacing-7)',
    width: 'var(--spacing-7)',
  },
  figure: {
    minHeight: 'var(--meta-field-height, var(--spacing-10))',
    paddingInline: 'var(--spacing-1)',
  },
  footer: {
    borderBlockStartColor: 'var(--color-border)',
    borderBlockStartStyle: 'solid',
    borderBlockStartWidth: 'var(--border-width)',
    paddingBlockStart: 'var(--spacing-4)',
  },
  remaining: {
    borderRadius: 'var(--radius-full)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    paddingBlock: 'var(--spacing-1-5)',
    paddingInline: 'var(--spacing-3)',
  },
  note: {
    backgroundColor: 'var(--meta-surface-container-low)',
    borderColor: 'var(--color-border-emphasized)',
    borderRadius: 'var(--meta-radius-inset)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    padding: 'var(--spacing-4)',
  },
  noteTile: {
    backgroundColor: 'var(--meta-split-track)',
    borderRadius: 'var(--radius-full)',
    flexShrink: 0,
    height: 'var(--spacing-8)',
    width: 'var(--spacing-8)',
  },
  code: {
    backgroundColor: 'var(--color-background-surface)',
    borderRadius: 'var(--radius-element)',
    paddingInline: 'var(--spacing-1)',
  },
});
