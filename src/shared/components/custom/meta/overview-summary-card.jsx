'use client';

import { Card } from '@astryxdesign/core/Card';
import { Carousel } from '@astryxdesign/core/Carousel';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Link } from '@astryxdesign/core/Link';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Heading, Text } from '@astryxdesign/core/Text';
import { Tooltip } from '@astryxdesign/core/Tooltip';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import {
  ArrowRight,
  CircleCheck,
  CircleDollarSign,
  Clock,
  Hourglass,
} from 'lucide-react';

import { MetaPill } from './pill.jsx';

/**
 * @typedef {'primary' | 'secondary' | 'success' | 'accent'} MetaTone
 *
 * @typedef {{
 *   icon?: import('react').ComponentType,
 *   dotTone?: 'accent' | 'success',
 *   label?: string,
 *   value?: string,
 *   hint?: string,
 *   tooltip?: string,
 *   tone?: MetaTone,
 * }} MetaMetricNote
 *
 * @typedef {{
 *   id: string,
 *   label: string,
 *   hasLabelDot?: boolean,
 *   icon: import('react').ComponentType,
 *   tone?: 'primary' | 'success' | 'accent',
 *   iconTone?: 'accent' | 'success' | 'neutral',
 *   value: string,
 *   unit?: string,
 *   start?: MetaMetricNote,
 *   end?: MetaMetricNote,
 *   segments: Array<{ percent: number, tone: 'accent' | 'success' | 'neutral' }>,
 * }} MetaMetric
 *
 * @typedef {{
 *   id: string,
 *   label: string,
 *   amount: string,
 *   dueDate?: string,
 *   term?: string,
 *   status: 'paid' | 'active' | 'upcoming',
 * }} MetaInstallment
 */

/** Text `color` per tone — `success` / `subtle` are Meta theme variants. */
const TEXT_COLOR = /** @type {const} */ ({
  primary: 'primary',
  secondary: 'secondary',
  success: 'meta-success',
  accent: 'accent',
});

/**
 * "Meta" contract-detail summary card — Figma node 89:1064's "TOP KPI
 * CARDS" block: a titled card holding 4 metric cards (Quyết toán / Đã
 * xuất / Đã xuất (VNĐ) / Chưa xuất, each with a note row and a thin
 * progress bar), then the "Tiến độ đối soát thanh toán" row, a segmented
 * paid / current / remaining bar and one fixed-width chip per installment
 * ("Đợt 01"…) in an Astryx `Carousel` (swipe / prev-next), paid chips in emerald, the current one outlined cobalt with an "ĐANG
 * THU" tag, upcoming ones neutral. Due date / payment term show in a
 * tooltip on each chip. Composed from Astryx `Card` / `Grid` / `Carousel` / `HStack` /
 * `Text` / `Link` / `Tooltip` / `Skeleton` + `MetaPill` (golden rule #15).
 * `isMetricsLoading` / `isPaymentsLoading` swap the figures that are still
 * being fetched for Astryx `Skeleton` placeholders of the same shape.
 *
 * @param {{
 *   title?: string,
 *   metrics: MetaMetric[],
 *   progressLabel?: string,
 *   paidPercent: number,
 *   currentPercent: number,
 *   paidPercentLabel: string,
 *   paidAmountValue: string,
 *   totalAmountValue: string,
 *   detailLabel?: string,
 *   onViewDetail?: () => void,
 *   installments: MetaInstallment[],
 *   activeBadgeLabel?: string,
 *   installmentDateLabel?: string,
 *   installmentTermLabel?: string,
 *   installmentsLabel?: string,
 *   isMetricsLoading?: boolean,
 *   isPaymentsLoading?: boolean,
 * }} props
 */
export function MetaOverviewSummaryCard({
  title = 'GIÁ TRỊ & TIẾN ĐỘ TỔNG QUAN',
  metrics,
  progressLabel = 'TIẾN ĐỘ THANH TOÁN:',
  paidPercent,
  currentPercent,
  paidPercentLabel,
  paidAmountValue,
  totalAmountValue,
  detailLabel = 'Chi tiết thanh toán',
  onViewDetail,
  installments,
  activeBadgeLabel = 'ĐANG THU',
  installmentDateLabel = 'Ngày thanh toán',
  installmentTermLabel = 'Hình thức',
  installmentsLabel = 'Các đợt thanh toán',
  isMetricsLoading = false,
  isPaymentsLoading = false,
}) {
  const remainingPercent = Math.max(0, 100 - paidPercent - currentPercent);

  return (
    <Card padding={6} xstyle={styles.card}>
      <VStack gap={5} hAlign="stretch">
        <HStack gap={2} vAlign="center" xstyle={styles.titleRow}>
          <Icon icon={CircleDollarSign} size="md" color="accent" />
          <Heading level={3} accessibilityLevel={2}>
            {title}
          </Heading>
        </HStack>

        <Grid
          columns={{ minWidth: 280, max: 4 }}
          maxWidth="calc(4 * var(--meta-kpi-card-max) + 3 * var(--spacing-4))"
          gap={4}
          xstyle={styles.metricGrid}
        >
          {metrics.map((metric) => (
            <MetricCard
              key={metric.id}
              {...metric}
              isLoading={isMetricsLoading}
            />
          ))}
        </Grid>

        <VStack gap={3} hAlign="stretch" xstyle={styles.progressSection}>
          <HStack gap={3} vAlign="center" hAlign="between" wrap="wrap">
            <HStack gap={2} vAlign="center" wrap="wrap">
              <Text weight="bold" color="secondary">
                {progressLabel}
              </Text>
              {isPaymentsLoading ? (
                <Skeleton
                  width={96}
                  height="var(--spacing-6)"
                  radius="rounded"
                />
              ) : (
                <MetaPill label={paidPercentLabel} tone="success" />
              )}
            </HStack>
            <HStack gap={3} vAlign="center" wrap="wrap">
              {isPaymentsLoading ? (
                <Skeleton width={180} height="var(--spacing-4)" radius={2} />
              ) : (
                <Text size="sm" weight="bold" hasTabularNumbers>
                  <Text
                    as="span"
                    type="inherit"
                    weight="bold"
                    color={/** @type {any} */ ('meta-success')}
                  >
                    {paidAmountValue}
                  </Text>{' '}
                  / {totalAmountValue}
                </Text>
              )}
              {onViewDetail ? (
                <Link weight="bold" color="accent" onClick={onViewDetail}>
                  <HStack as="span" gap={1} vAlign="center" wrap="nowrap">
                    <Text as="span" type="inherit" color="inherit" size="sm">
                      {detailLabel}
                    </Text>
                    <Icon icon={ArrowRight} size="xsm" color="inherit" />
                  </HStack>
                </Link>
              ) : null}
            </HStack>
          </HStack>

          {isPaymentsLoading ? (
            <Skeleton
              height="calc(var(--spacing-2) + var(--spacing-0-5))"
              radius="rounded"
            />
          ) : (
            <HStack gap={0.5} xstyle={[styles.track, styles.mainTrack]}>
              <SegmentFill percent={paidPercent} tone="success" />
              <SegmentFill percent={currentPercent} tone="accent" />
              <SegmentFill percent={remainingPercent} tone="remaining" />
            </HStack>
          )}

          <Carousel gap={3} hasSnap aria-label={installmentsLabel}>
            {isPaymentsLoading
              ? SKELETON_CHIPS.map((index) => (
                  <InstallmentSkeleton key={index} index={index} />
                ))
              : installments.map((installment) => (
                  <InstallmentChip
                    key={installment.id}
                    {...installment}
                    activeBadgeLabel={activeBadgeLabel}
                    dateLabel={installmentDateLabel}
                    termLabel={installmentTermLabel}
                  />
                ))}
          </Carousel>
        </VStack>
      </VStack>
    </Card>
  );
}

const SKELETON_CHIPS = [0, 1, 2, 3];

/**
 * The top block of `MetaOverviewSummaryCard` on its own: titled card over a
 * grid of the same metric cards (value, note row, thin progress bar pinned
 * to the bottom) — reused by the commission tab / page so their KPI cards
 * read exactly like the contract overview's.
 * @param {{
 *   title: string,
 *   icon?: import('react').ComponentType,
 *   metrics: MetaMetric[],
 *   maxColumns?: number,
 *   isLoading?: boolean,
 * }} props
 */
export function MetaMetricsCard({
  title,
  icon = CircleDollarSign,
  metrics,
  maxColumns = 4,
  isLoading = false,
}) {
  return (
    <Card padding={6} xstyle={styles.card}>
      <VStack gap={5} hAlign="stretch">
        <HStack gap={2} vAlign="center" xstyle={styles.titleRow}>
          <Icon icon={icon} size="md" color="accent" />
          <Heading level={3} accessibilityLevel={2}>
            {title}
          </Heading>
        </HStack>
        <Grid
          columns={{ minWidth: 280, max: maxColumns }}
          gap={4}
          xstyle={styles.metricGrid}
        >
          {metrics.map((metric) => (
            <MetricCard key={metric.id} {...metric} isLoading={isLoading} />
          ))}
        </Grid>
      </VStack>
    </Card>
  );
}

/** @param {{ index: number }} props */
function InstallmentSkeleton({ index }) {
  return (
    <VStack
      gap={2}
      hAlign="stretch"
      xstyle={[styles.installment, installmentTones.upcoming]}
    >
      <HStack
        hAlign="between"
        vAlign="center"
        xstyle={[styles.installmentHeader, installmentDividers.upcoming]}
      >
        <Skeleton
          width="45%"
          height="var(--spacing-4)"
          radius={2}
          index={index}
        />
        <Skeleton
          width="var(--spacing-4)"
          height="var(--spacing-4)"
          radius="rounded"
          index={index}
        />
      </HStack>
      <Skeleton
        width="70%"
        height="var(--spacing-6)"
        radius={2}
        index={index}
      />
    </VStack>
  );
}

/** @param {MetaMetric & { isLoading?: boolean }} props */
function MetricCard({
  label,
  hasLabelDot = false,
  icon,
  tone = 'primary',
  iconTone = 'accent',
  value,
  unit,
  start,
  end,
  segments,
  isLoading = false,
}) {
  return (
    <VStack gap={3} hAlign="stretch" xstyle={styles.metric}>
      <HStack gap={2} vAlign="center" hAlign="between" wrap="nowrap">
        <HStack gap={1.5} vAlign="center">
          {hasLabelDot ? (
            <HStack as="span" xstyle={[styles.dot, dotTones.accent]} />
          ) : null}
          <Text
            size="sm"
            weight="bold"
            color={tone === 'accent' ? 'accent' : 'secondary'}
            xstyle={styles.caps}
          >
            {label}
          </Text>
        </HStack>
        <HStack
          as="span"
          vAlign="center"
          hAlign="center"
          xstyle={[styles.iconBubble, iconBubbleTones[iconTone]]}
        >
          <Icon icon={icon} size="sm" color="inherit" />
        </HStack>
      </HStack>

      {isLoading ? (
        <VStack gap={3} hAlign="stretch" xstyle={styles.metricBody}>
          <Skeleton width="60%" height="var(--spacing-7)" radius={2} />
          <VStack gap={2} hAlign="stretch" xstyle={styles.metricFooter}>
            <Skeleton width="80%" height="var(--spacing-4)" radius={2} />
            <Skeleton height="var(--spacing-2)" radius="rounded" />
          </VStack>
        </VStack>
      ) : (
        <>
          <HStack gap={1.5} wrap="wrap" xstyle={styles.baseline}>
            <Text
              size="2xl"
              weight="bold"
              color={/** @type {any} */ (TEXT_COLOR[tone])}
              hasTabularNumbers
              xstyle={styles.metricValue}
            >
              {value}
            </Text>
            {unit ? (
              <Text
                size="sm"
                weight="semibold"
                color={/** @type {any} */ ('meta-subtle')}
              >
                {unit}
              </Text>
            ) : null}
          </HStack>

          <VStack gap={2} hAlign="stretch" xstyle={styles.metricFooter}>
            <HStack gap={2} vAlign="center" hAlign="between" wrap="wrap">
              {start ? <MetricNote {...start} /> : <HStack />}
              {end ? <MetricNote {...end} /> : null}
            </HStack>
            <HStack gap={0.5} xstyle={[styles.track, styles.metricTrack]}>
              {segments.map((segment, index) => (
                <SegmentFill
                  key={`${segment.tone}-${index}`}
                  percent={segment.percent}
                  tone={segment.tone}
                />
              ))}
            </HStack>
          </VStack>
        </>
      )}
    </VStack>
  );
}

/** @param {MetaMetricNote} props */
function MetricNote({
  icon,
  dotTone,
  label,
  value,
  hint,
  tooltip,
  tone = 'secondary',
}) {
  const labelColor = TEXT_COLOR[tone];
  const valueColor = tone === 'secondary' ? 'primary' : TEXT_COLOR[tone];
  return (
    <Tooltip
      isEnabled={Boolean(tooltip)}
      hasHoverIndication={false}
      content={tooltip}
    >
      <HStack gap={1} vAlign="center" wrap="nowrap">
        {dotTone ? (
          <HStack as="span" xstyle={[styles.smallDot, dotTones[dotTone]]} />
        ) : null}
        {icon ? (
          <Icon
            icon={icon}
            size="xsm"
            color={
              /** @type {any} */ (
                tone === 'success' ? 'meta-success' : labelColor
              )
            }
          />
        ) : null}
        {label ? (
          <Text size="sm" color={/** @type {any} */ (labelColor)}>
            {label}
          </Text>
        ) : null}
        {value ? (
          <Text
            size="sm"
            weight="bold"
            color={/** @type {any} */ (valueColor)}
            hasTabularNumbers
          >
            {value}
          </Text>
        ) : null}
        {hint ? (
          <Text size="sm" color={/** @type {any} */ ('meta-subtle')}>
            {hint}
          </Text>
        ) : null}
      </HStack>
    </Tooltip>
  );
}

/** @param {{ percent: number, tone: 'accent' | 'success' | 'neutral' | 'remaining' }} props */
function SegmentFill({ percent, tone }) {
  if (percent <= 0) return null;
  return (
    <HStack
      as="span"
      xstyle={[styles.segment, segmentTones[tone], styles.width(percent)]}
    />
  );
}

/**
 * @param {MetaInstallment & {
 *   activeBadgeLabel: string,
 *   dateLabel: string,
 *   termLabel: string,
 * }} props
 */
function InstallmentChip({
  label,
  amount,
  dueDate,
  term,
  status,
  activeBadgeLabel,
  dateLabel,
  termLabel,
}) {
  const StatusIcon = INSTALLMENT_ICONS[status];
  const hasDetails = Boolean(dueDate || term);
  return (
    <Tooltip
      isEnabled={hasDetails}
      hasHoverIndication={false}
      content={
        <VStack gap={0.5} hAlign="start">
          {dueDate ? (
            <Text color="inherit">
              {dateLabel}:{' '}
              <Text as="span" weight="bold" color="inherit">
                {dueDate}
              </Text>
            </Text>
          ) : null}
          {term ? (
            <Text color="inherit">
              {termLabel}:{' '}
              <Text as="span" weight="bold" color="inherit">
                {term}
              </Text>
            </Text>
          ) : null}
        </VStack>
      }
    >
      <VStack
        gap={2}
        hAlign="stretch"
        xstyle={[styles.installment, installmentTones[status]]}
      >
        <HStack
          gap={1.5}
          vAlign="center"
          hAlign="between"
          wrap="nowrap"
          xstyle={[styles.installmentHeader, installmentDividers[status]]}
        >
          <HStack gap={1.5} vAlign="center" wrap="nowrap">
            <Text
              weight={status === 'upcoming' ? 'medium' : 'bold'}
              color={/** @type {any} */ (INSTALLMENT_LABEL_COLOR[status])}
              textWrap="nowrap"
            >
              {label}
            </Text>
            {status === 'active' ? (
              <MetaPill label={activeBadgeLabel} tone="solid" size="sm" />
            ) : null}
          </HStack>
          <Icon
            icon={StatusIcon}
            size="sm"
            color={/** @type {any} */ (INSTALLMENT_ICON_COLOR[status])}
          />
        </HStack>
        <Text
          size="lg"
          weight="bold"
          color={/** @type {any} */ (INSTALLMENT_AMOUNT_COLOR[status])}
          hasTabularNumbers
        >
          {amount}
        </Text>
      </VStack>
    </Tooltip>
  );
}

const INSTALLMENT_ICONS = {
  paid: CircleCheck,
  active: Hourglass,
  upcoming: Clock,
};
const INSTALLMENT_LABEL_COLOR = {
  paid: 'meta-success-deep',
  active: 'accent',
  upcoming: 'secondary',
};
const INSTALLMENT_ICON_COLOR = {
  paid: 'meta-success',
  active: 'accent',
  upcoming: 'secondary',
};
const INSTALLMENT_AMOUNT_COLOR = {
  paid: 'meta-success',
  active: 'accent',
  upcoming: 'primary',
};

const styles = stylex.create({
  // Value + unit share a baseline (Figma "$485,000 USD", "73.5 Tấn").
  baseline: { alignItems: 'baseline' },
  card: {
    boxShadow: 'var(--meta-shadow-card)',
  },
  titleRow: {
    borderBottomColor: 'var(--color-border)',
    borderBottomStyle: 'solid',
    borderBottomWidth: 'var(--border-width)',
    paddingBottom: 'var(--spacing-3)',
  },
  // Four equal cards on desktop, a single shrinkable column on phones.
  metricGrid: {
    gridTemplateColumns: {
      default: null,
      '@media (max-width: 599px)': 'minmax(0, 1fr)',
    },
  },
  metric: {
    backgroundColor: 'var(--color-background-surface)',
    borderColor: 'var(--color-border)',
    borderRadius: 'var(--radius-container)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    minWidth: 0,
    padding: 'var(--spacing-4)',
  },
  caps: {
    letterSpacing: '0.05em',
  },
  dot: {
    borderRadius: 'var(--radius-full)',
    flexShrink: 0,
    height: 'var(--spacing-2)',
    width: 'var(--spacing-2)',
  },
  smallDot: {
    borderRadius: 'var(--radius-full)',
    flexShrink: 0,
    height: 'var(--spacing-1-5)',
    width: 'var(--spacing-1-5)',
  },
  iconBubble: {
    borderRadius: 'var(--radius-full)',
    flexShrink: 0,
    height: 'var(--spacing-8)',
    width: 'var(--spacing-8)',
  },
  metricValue: {
    lineHeight: 1,
  },
  metricBody: {
    flexGrow: 1,
  },
  // Pinned to the card's bottom: a note row that wraps (e.g. Quyết toán's
  // Gốc + PL on a narrow card) must not push its bar below the others'.
  metricFooter: {
    borderTopColor: 'var(--meta-hairline)',
    borderTopStyle: 'solid',
    borderTopWidth: 'var(--border-width)',
    marginTop: 'auto',
    paddingTop: 'var(--spacing-2)',
  },
  progressSection: {
    borderTopColor: 'var(--color-border)',
    borderTopStyle: 'solid',
    borderTopWidth: 'var(--border-width)',
    paddingTop: 'var(--spacing-3)',
  },
  track: {
    backgroundColor: 'var(--meta-hairline)',
    borderRadius: 'var(--radius-full)',
    overflow: 'hidden',
    padding: 'var(--spacing-0-5)',
    width: '100%',
  },
  mainTrack: {
    height: 'calc(var(--spacing-2) + var(--spacing-0-5))',
  },
  metricTrack: {
    height: 'var(--spacing-2)',
  },
  segment: {
    borderRadius: 'var(--radius-full)',
    display: 'block',
    height: '100%',
  },
  width: (percent) => ({ width: `${percent}%` }),
  // Fixed chip width: every installment reads the same in the carousel.
  installment: {
    borderRadius: 'var(--radius-container)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    flexShrink: 0,
    minWidth: 0,
    padding: 'var(--spacing-3)',
    width: 'calc(var(--spacing-10) * 4.5)',
  },
  installmentHeader: {
    borderBottomStyle: 'solid',
    borderBottomWidth: 'var(--border-width)',
    paddingBottom: 'var(--spacing-1)',
  },
});

const dotTones = stylex.create({
  accent: { backgroundColor: 'var(--color-accent)' },
  success: { backgroundColor: 'var(--meta-emerald-fill)' },
});

const iconBubbleTones = stylex.create({
  accent: {
    backgroundColor: 'var(--meta-blue-wash)',
    color: 'var(--color-accent)',
  },
  success: {
    backgroundColor: 'var(--meta-emerald-wash)',
    color: 'var(--meta-emerald-fill)',
  },
  neutral: {
    backgroundColor: 'var(--meta-hairline)',
    color: 'var(--color-text-secondary)',
  },
});

const segmentTones = stylex.create({
  accent: { backgroundColor: 'var(--color-accent)' },
  success: { backgroundColor: 'var(--meta-emerald-fill)' },
  neutral: { backgroundColor: 'var(--color-text-secondary)' },
  remaining: { backgroundColor: 'var(--color-border)' },
});

const installmentTones = stylex.create({
  paid: {
    backgroundColor: 'var(--color-background-surface)',
    borderColor: 'var(--meta-emerald-border)',
  },
  active: {
    backgroundColor: 'var(--meta-blue-active-bg)',

    borderBottomWidth: 'calc(var(--border-width) * 2)',
    borderColor: 'var(--color-accent)',
    borderLeftWidth: 'calc(var(--border-width) * 2)',
    borderRightWidth: 'calc(var(--border-width) * 2)',
    borderTopWidth: 'calc(var(--border-width) * 2)',
    boxShadow: 'var(--meta-shadow-card)',
  },
  upcoming: {
    backgroundColor: 'var(--color-background-surface)',
    borderColor: 'var(--color-border)',
  },
});

const installmentDividers = stylex.create({
  paid: { borderBottomColor: 'var(--meta-emerald-divider)' },
  active: { borderBottomColor: 'var(--meta-blue-active-border)' },
  upcoming: { borderBottomColor: 'var(--meta-hairline)' },
});
