'use client';

import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Carousel } from '@astryxdesign/core/Carousel';
import { DropdownMenu } from '@astryxdesign/core/DropdownMenu';
import { useClipboard } from '@astryxdesign/core/hooks';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Heading, Text } from '@astryxdesign/core/Text';
import { Tooltip } from '@astryxdesign/core/Tooltip';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import {
  Check,
  Compass,
  Copy,
  Ellipsis,
  Info,
  Pencil,
  Printer,
  Star,
} from 'lucide-react';

import { MetaPill } from './pill.jsx';

/**
 * @typedef {'done' | 'current' | 'upcoming'} MetaJourneyStepState
 *
 * @typedef {{
 *   id: string,
 *   icon: import('react').ComponentType,
 *   state: MetaJourneyStepState,
 *   scope?: 'seller' | 'buyer',
 *   label: string,
 *   badge: string,
 *   badgeTone?: 'danger',
 *   markerLabel?: string,
 *   markerTone?: 'warning' | 'indigo' | 'success' | 'danger',
 *   liveLabel?: string,
 *   actionLabel?: string,
 *   actionIcon?: import('react').ComponentType,
 *   onAction?: () => void,
 *   title: string,
 *   footLabel: string,
 *   footValue: string,
 * }} MetaJourneyStep
 */

/**
 * "Meta" shipment-detail header card — Figma node 111:7829 ("Section -
 * Main Shipment Header"): shipment code + copy button + type / status
 * pills, the incoterm chip under it, "In" / "Chỉnh sửa" / "…" on the
 * right, then the journey (Figma 115:8469 "Visual Stepper Journey"):
 * fixed-width leg cards in an Astryx `Carousel` (swipe / prev-next) joined
 * by connectors, the current leg outlined in cobalt with a floating live
 * status, and a "TIẾN ĐỘ LỘ TRÌNH" progress row. Legs, scopes and markers
 * ("Chuyển rủi ro"…) come from the caller (Incoterm-driven). Composed
 * from Astryx components + `MetaPill` (golden rule #15).
 *
 * @param {{
 *   code: string,
 *   typeLabel: string,
 *   statusLabel: string,
 *   statusTone: 'accent' | 'success' | 'indigo' | 'warning' | 'neutral',
 *   incotermLabel?: string,
 *   steps: MetaJourneyStep[],
 *   journeySummary?: string,
 *   isJourneyLoading?: boolean,
 *   journeyTitle?: string,
 *   printLabel?: string,
 *   onPrint?: () => void,
 *   editLabel?: string,
 *   onEdit?: () => void,
 *   moreLabel?: string,
 *   moreItems?: import('@astryxdesign/core/DropdownMenu').DropdownMenuOption[],
 * }} props
 */
export function MetaShipmentHeaderCard({
  code,
  typeLabel,
  statusLabel,
  statusTone,
  incotermLabel,
  steps,
  journeySummary,
  isJourneyLoading = false,
  journeyTitle = 'HÀNH TRÌNH VẬN CHUYỂN',
  printLabel = 'In',
  onPrint,
  editLabel = 'Chỉnh sửa',
  onEdit,
  moreLabel = 'Thao tác khác',
  moreItems = [],
}) {
  const { copy, isCopied } = useClipboard({
    announce: 'Đã sao chép mã lô hàng',
  });
  const doneCount = steps.filter((step) => step.state === 'done').length;
  const currentCount = steps.filter((step) => step.state === 'current').length;
  const upcomingCount = steps.length - doneCount - currentCount;
  const progressPercent =
    steps.length === 0
      ? 0
      : Math.round(((doneCount + currentCount * 0.5) / steps.length) * 100);

  return (
    <Card padding={6} xstyle={styles.card}>
      <VStack gap={6} hAlign="stretch">
        <HStack
          hAlign="between"
          vAlign="start"
          gap={4}
          wrap="wrap"
          xstyle={styles.titleRow}
        >
          <VStack gap={2} hAlign="start">
            <HStack gap={2} vAlign="center" wrap="wrap">
              <Heading level={1}>{code}</Heading>
              <IconButton
                label="Sao chép mã lô hàng"
                tooltip={isCopied ? 'Đã sao chép' : 'Sao chép'}
                icon={
                  <Icon
                    icon={isCopied ? Check : Copy}
                    size="sm"
                    color="secondary"
                  />
                }
                variant="secondary"
                size="sm"
                onClick={() => copy(code)}
              />
              <MetaPill label={typeLabel} tone="accent" />
              <MetaPill label={statusLabel} tone={statusTone} hasDot />
            </HStack>
            {incotermLabel ? (
              <MetaPill label={incotermLabel} tone="neutral" hasBorder />
            ) : null}
          </VStack>

          <HStack gap={2} vAlign="center" wrap="wrap">
            {onPrint ? (
              <Button
                label={printLabel}
                variant="secondary"
                icon={<Icon icon={Printer} size="sm" color="secondary" />}
                onClick={onPrint}
              />
            ) : null}
            {onEdit ? (
              <Button
                label={editLabel}
                variant="primary"
                icon={<Icon icon={Pencil} size="sm" />}
                onClick={onEdit}
              />
            ) : null}
            {moreItems.length > 0 ? (
              <DropdownMenu
                button={{
                  label: moreLabel,
                  isIconOnly: true,
                  variant: 'secondary',
                  icon: <Icon icon={Ellipsis} size="sm" />,
                }}
                items={moreItems}
              />
            ) : null}
          </HStack>
        </HStack>

        <VStack gap={4} hAlign="stretch">
          <HStack hAlign="between" vAlign="center" gap={3} wrap="wrap">
            <HStack gap={3} vAlign="center" wrap="wrap" xstyle={styles.shrink}>
              <HStack
                hAlign="center"
                vAlign="center"
                xstyle={styles.headerIcon}
              >
                <Icon icon={Compass} size="sm" color="inherit" />
              </HStack>
              <Text size="base" weight="bold">
                {journeyTitle}
              </Text>
              {incotermLabel ? (
                <Tooltip
                  isEnabled={Boolean(journeySummary)}
                  content={journeySummary}
                >
                  <HStack as="span" gap={1} vAlign="center">
                    <MetaPill label={incotermLabel} tone="accent" />
                    {journeySummary ? (
                      <Icon icon={Info} size="sm" color="secondary" />
                    ) : null}
                  </HStack>
                </Tooltip>
              ) : null}
            </HStack>
          </HStack>

          {isJourneyLoading ? (
            <JourneySkeleton label={journeyTitle} />
          ) : (
            <Carousel gap={0} hasSnap aria-label={journeyTitle}>
              {steps.map((step, index) => (
                <HStack key={step.id} vAlign="start" gap={0}>
                  {index > 0 ? (
                    <HStack
                      xstyle={[
                        styles.connector,
                        connectorTones[steps[index - 1].state],
                      ]}
                      aria-hidden
                    />
                  ) : null}
                  <JourneyStep
                    step={step}
                    index={index}
                    liveLabel={statusLabel}
                  />
                </HStack>
              ))}
            </Carousel>
          )}

          {steps.length > 0 ? (
            <HStack
              hAlign="between"
              vAlign="center"
              gap={4}
              wrap="wrap"
              xstyle={styles.progressRow}
            >
              <HStack gap={3} vAlign="center">
                <Text size="sm" weight="bold" color="secondary">
                  TIẾN ĐỘ LỘ TRÌNH:
                </Text>
                <HStack
                  xstyle={styles.progressTrack}
                  role="progressbar"
                  aria-label="Tiến độ lộ trình"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progressPercent}
                >
                  <HStack
                    xstyle={[
                      styles.progressFill,
                      progressWidth.fill(progressPercent),
                    ]}
                  />
                </HStack>
                <Text size="sm" weight="bold" type="code" color="accent">
                  {progressPercent}% hoàn thành
                </Text>
              </HStack>
              <HStack gap={4} vAlign="center" wrap="wrap">
                <LegendDot tone="done" label={`${doneCount} mốc xong`} />
                {currentCount > 0 ? (
                  <LegendDot
                    tone="current"
                    label={`${currentCount} đang chạy`}
                  />
                ) : null}
                <LegendDot
                  tone="upcoming"
                  label={`${upcomingCount} kế hoạch tới`}
                />
              </HStack>
            </HStack>
          ) : null}
        </VStack>
      </VStack>
    </Card>
  );
}

/** Placeholder step cards shown while the journey loads. */
const SKELETON_STEPS = 5;

/**
 * Loading state of the journey: the same step card frames (size, border,
 * connectors) as `JourneyStep`, filled with skeleton bars, plus the
 * progress row — so the card doesn't jump when the data arrives.
 * @param {{ label: string }} props
 */
function JourneySkeleton({ label }) {
  return (
    <VStack gap={0} hAlign="stretch" aria-busy aria-label={`Đang tải ${label}`}>
      <HStack gap={0} wrap="nowrap" xstyle={styles.skeletonTrack}>
        {Array.from({ length: SKELETON_STEPS }, (_, index) => (
          <HStack key={index} vAlign="start" gap={0} wrap="nowrap">
            {index > 0 ? (
              <HStack
                xstyle={[styles.connector, connectorTones.upcoming]}
                aria-hidden
              />
            ) : null}
            <VStack hAlign="stretch" xstyle={styles.slide}>
              <VStack
                gap={3}
                hAlign="stretch"
                xstyle={[styles.step, stepTones.upcoming]}
              >
                <HStack hAlign="between" vAlign="start" gap={2}>
                  <Skeleton
                    width="var(--spacing-10)"
                    height="var(--spacing-10)"
                    radius={2}
                    index={index}
                  />
                  <Skeleton
                    width="calc(var(--spacing-10) * 2.5)"
                    height="var(--spacing-6)"
                    radius="rounded"
                    index={index}
                  />
                </HStack>
                <VStack gap={2} hAlign="stretch">
                  <Skeleton
                    width="60%"
                    height="var(--spacing-3)"
                    index={index}
                  />
                  <Skeleton
                    width="85%"
                    height="var(--spacing-5)"
                    index={index}
                  />
                </VStack>
                <HStack
                  hAlign="between"
                  vAlign="center"
                  gap={2}
                  xstyle={styles.stepFoot}
                >
                  <Skeleton
                    width="40%"
                    height="var(--spacing-3)"
                    index={index}
                  />
                  <Skeleton
                    width="calc(var(--spacing-10) * 2)"
                    height="var(--spacing-6)"
                    index={index}
                  />
                </HStack>
              </VStack>
            </VStack>
          </HStack>
        ))}
      </HStack>
      <HStack
        hAlign="between"
        vAlign="center"
        gap={4}
        wrap="wrap"
        xstyle={styles.progressRow}
      >
        <HStack gap={3} vAlign="center">
          <Skeleton
            width="calc(var(--spacing-10) * 3)"
            height="var(--spacing-3)"
          />
          <Skeleton
            width="calc(var(--spacing-10) * 5)"
            height="var(--spacing-2)"
            radius="rounded"
          />
        </HStack>
        <Skeleton
          width="calc(var(--spacing-10) * 6)"
          height="var(--spacing-3)"
        />
      </HStack>
    </VStack>
  );
}

/**
 * One leg card (Figma 115:8469): icon tile + status badge, "MỐC 0n •
 * LEG", the place / vessel (… + tooltip when long), then the leg's key
 * date under a hairline. The current leg gets a 2px cobalt
 * outline and a floating live status; buyer legs the seller no longer
 * tracks are dashed and muted. An optional action (confirm / edit the
 * milestone, record empty returns) sits after the badge.
 * @param {{ step: MetaJourneyStep, index: number, liveLabel: string }} props
 */
function JourneyStep({ step, index, liveLabel }) {
  const isCurrent = step.state === 'current';
  const isDone = step.state === 'done';
  const look =
    step.scope === 'buyer' && step.state === 'upcoming' ? 'buyer' : step.state;

  return (
    <VStack
      hAlign="stretch"
      xstyle={styles.slide}
      role="group"
      aria-current={isCurrent ? 'step' : undefined}
    >
      <VStack gap={3} hAlign="stretch" xstyle={[styles.step, stepTones[look]]}>
        {isCurrent ? (
          <HStack gap={1} vAlign="center" xstyle={styles.livePill}>
            <HStack xstyle={styles.liveDot} />
            <Text as="span" type="inherit" color="inherit">
              {(step.liveLabel ?? liveLabel).toUpperCase()}
            </Text>
          </HStack>
        ) : null}

        <HStack hAlign="between" vAlign="start" gap={2}>
          <HStack
            hAlign="center"
            vAlign="center"
            xstyle={[styles.stepIcon, stepIconTones[look]]}
          >
            <Icon icon={isDone ? Check : step.icon} size="md" color="inherit" />
          </HStack>
          <HStack gap={1} vAlign="center" hAlign="end" wrap="nowrap">
            {step.markerLabel ? (
              <MetaPill
                label={step.markerLabel}
                tone={step.markerTone ?? 'warning'}
                icon={Star}
              />
            ) : null}
            <MetaPill
              label={step.badge}
              tone={step.badgeTone ?? BADGE_TONE[look]}
              hasDot={isDone}
              hasBorder={!isCurrent}
            />
            {step.onAction && step.actionLabel ? (
              <IconButton
                label={step.actionLabel}
                tooltip={step.actionLabel}
                icon={
                  <Icon
                    icon={step.actionIcon ?? Pencil}
                    size="sm"
                    color="secondary"
                  />
                }
                variant="ghost"
                size="sm"
                onClick={step.onAction}
              />
            ) : null}
          </HStack>
        </HStack>

        <VStack gap={1} hAlign="stretch">
          <Text
            size="sm"
            weight="bold"
            color={isCurrent ? 'accent' : /** @type {any} */ ('meta-subtle')}
            maxLines={1}
          >
            MỐC {String(index + 1).padStart(2, '0')} •{' '}
            {step.label.toUpperCase()}
          </Text>
          <Text size="lg" weight="bold" maxLines={1} hasTruncateTooltip>
            {step.title}
          </Text>
        </VStack>

        <HStack
          hAlign="between"
          vAlign="center"
          gap={2}
          xstyle={[styles.stepFoot, isCurrent && styles.stepFootCurrent]}
        >
          <Text
            size="sm"
            weight={isCurrent ? 'bold' : 'medium'}
            color={isCurrent ? 'accent' : 'secondary'}
            maxLines={1}
          >
            {step.footLabel}
          </Text>
          <HStack xstyle={[styles.dateChip, dateChipTones[look]]}>
            <Text as="span" type="inherit" color="inherit">
              {step.footValue}
            </Text>
          </HStack>
        </HStack>
      </VStack>
    </VStack>
  );
}

/** @param {{ tone: 'done' | 'current' | 'upcoming', label: string }} props */
function LegendDot({ tone, label }) {
  return (
    <HStack gap={1.5} vAlign="center">
      <HStack xstyle={[styles.legendDot, legendDotTones[tone]]} />
      <Text
        size="sm"
        weight={tone === 'current' ? 'semibold' : 'normal'}
        color={tone === 'current' ? 'accent' : 'secondary'}
      >
        {label}
      </Text>
    </HStack>
  );
}

/** @type {Record<string, 'success' | 'accent' | 'neutral' | 'muted'>} */
const BADGE_TONE = {
  done: 'success',
  current: 'accent',
  upcoming: 'neutral',
  buyer: 'muted',
};

const styles = stylex.create({
  card: {
    boxShadow: 'var(--meta-shadow-card)',
  },
  titleRow: {
    borderBottomColor: 'var(--meta-hairline)',
    borderBottomStyle: 'solid',
    borderBottomWidth: 'var(--border-width)',
    paddingBottom: 'var(--spacing-6)',
  },
  shrink: {
    minWidth: 0,
  },
  headerIcon: {
    backgroundColor: 'var(--meta-blue-active-bg)',
    borderColor: 'var(--meta-blue-wash-border)',
    borderRadius: 'var(--radius-element)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    color: 'var(--color-accent)',
    flexShrink: 0,
    height: 'var(--spacing-8)',
    width: 'var(--spacing-8)',
  },
  // Room above for the floating live pill and around for the outline.
  slide: {
    paddingBlock: 'var(--spacing-3)',
    paddingInline: 'var(--spacing-0-5)',
  },
  // Fixed card width: every leg reads the same in the carousel.
  step: {
    backgroundColor: 'var(--color-background-card)',
    borderRadius: 'var(--radius-container)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    flexGrow: 1,
    flexShrink: 0,
    // Tall enough for a badge + marker row, so every card lines up.
    minHeight: 'calc(var(--spacing-10) * 4.5)',
    padding: 'var(--spacing-4)',
    position: 'relative',
    width: 'calc(var(--spacing-10) * 9)',
  },
  livePill: {
    backgroundColor: 'var(--color-accent)',
    borderRadius: 'var(--radius-full)',
    boxShadow: 'var(--meta-shadow-card)',
    color: 'var(--color-on-accent)',
    fontFamily: 'var(--font-family-code)',
    fontSize: 'var(--font-size-xs)',
    fontWeight: 'var(--font-weight-bold)',
    paddingBlock: 'var(--spacing-0-5)',
    paddingInline: 'var(--spacing-2)',
    position: 'absolute',
    right: 'var(--spacing-4)',
    top: 'calc(var(--spacing-3) * -1)',
    whiteSpace: 'nowrap',
  },
  liveDot: {
    backgroundColor: 'var(--color-on-accent)',
    borderRadius: 'var(--radius-full)',
    height: 'var(--spacing-1-5)',
    width: 'var(--spacing-1-5)',
  },
  stepIcon: {
    borderRadius: 'var(--radius-element)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    flexShrink: 0,
    height: 'var(--spacing-10)',
    width: 'var(--spacing-10)',
  },
  stepFoot: {
    borderTopColor: 'var(--meta-hairline)',
    borderTopStyle: 'solid',
    borderTopWidth: 'var(--border-width)',
    marginTop: 'auto',
    paddingTop: 'var(--spacing-3)',
  },
  stepFootCurrent: {
    borderTopColor: 'var(--meta-blue-wash-border)',
  },
  dateChip: {
    borderRadius: 'var(--radius-inner)',
    flexShrink: 0,
    fontFamily: 'var(--font-family-code)',
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-bold)',
    paddingBlock: 'var(--spacing-0-5)',
    paddingInline: 'var(--spacing-2)',
    whiteSpace: 'nowrap',
  },
  // Joins two cards at the height of their icon tiles.
  connector: {
    flexShrink: 0,
    height: 'var(--spacing-0-5)',
    marginTop: 'calc(var(--spacing-3) + var(--spacing-4) + var(--spacing-5))',
    width: 'var(--spacing-4)',
  },
  // Skeleton cards clip at the card edge like the carousel's track.
  skeletonTrack: {
    overflow: 'hidden',
  },
  progressRow: {
    borderTopColor: 'var(--meta-hairline)',
    borderTopStyle: 'solid',
    borderTopWidth: 'var(--border-width)',
    paddingTop: 'var(--spacing-4)',
  },
  progressTrack: {
    backgroundColor: 'var(--color-border)',
    borderRadius: 'var(--radius-full)',
    height: 'var(--spacing-2)',
    overflow: 'hidden',
    width: 'calc(var(--spacing-10) * 5)',
  },
  progressFill: {
    backgroundImage:
      'linear-gradient(to right, var(--meta-emerald-dot), var(--color-accent))',
    borderRadius: 'var(--radius-full)',
    height: '100%',
  },
  legendDot: {
    borderRadius: 'var(--radius-full)',
    height: 'var(--spacing-2)',
    width: 'var(--spacing-2)',
  },
});

const progressWidth = stylex.create({
  fill: (/** @type {number} */ percent) => ({
    width: `${percent}%`,
  }),
});

const stepTones = stylex.create({
  done: {
    borderColor: 'var(--meta-emerald-border)',
  },
  current: {
    backgroundImage:
      'linear-gradient(to bottom, var(--meta-blue-active-bg), var(--color-background-card))',
    borderColor: 'var(--color-accent)',
    boxShadow:
      '0 0 0 var(--border-width) var(--color-accent), var(--meta-shadow-float)',
  },
  upcoming: {
    borderColor: 'var(--color-border)',
  },
  buyer: {
    backgroundColor: 'var(--meta-surface-container-low)',
    borderColor: 'var(--color-border-emphasized)',
    borderStyle: 'dashed',
  },
});

const stepIconTones = stylex.create({
  done: {
    backgroundColor: 'var(--meta-emerald-fill)',
    borderColor: 'var(--meta-emerald-fill)',
    color: 'var(--color-on-accent)',
  },
  current: {
    backgroundColor: 'var(--color-accent)',
    borderColor: 'var(--color-accent)',
    color: 'var(--color-on-accent)',
  },
  upcoming: {
    backgroundColor: 'var(--meta-neutral-pill-bg)',
    borderColor: 'var(--color-border)',
    color: 'var(--color-text-secondary)',
  },
  buyer: {
    backgroundColor: 'var(--color-background-card)',
    borderColor: 'var(--color-border-emphasized)',
    borderStyle: 'dashed',
    color: 'var(--meta-text-subtle)',
  },
});

const dateChipTones = stylex.create({
  done: {
    backgroundColor: 'var(--meta-emerald-wash)',
    color: 'var(--meta-emerald-text)',
  },
  current: {
    backgroundColor: 'var(--color-accent)',
    color: 'var(--color-on-accent)',
  },
  upcoming: {
    backgroundColor: 'var(--meta-neutral-pill-bg)',
    color: 'var(--color-text-primary)',
  },
  buyer: {
    backgroundColor: 'var(--color-background-card)',
    color: 'var(--color-text-secondary)',
  },
});

const connectorTones = stylex.create({
  done: {
    backgroundColor: 'var(--meta-emerald-dot)',
  },
  current: {
    backgroundColor: 'var(--color-accent)',
  },
  upcoming: {
    backgroundColor: 'var(--color-border)',
  },
});

const legendDotTones = stylex.create({
  done: {
    backgroundColor: 'var(--meta-emerald-dot)',
  },
  current: {
    backgroundColor: 'var(--color-accent)',
  },
  upcoming: {
    backgroundColor: 'var(--color-border-emphasized)',
  },
});
