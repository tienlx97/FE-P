'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { Container, Route, Ship } from 'lucide-react';
import { useState } from 'react';

import {
  MetaEventTimeline,
  MetaMilestoneStrip,
  MetaShipmentSection,
  MetaTabNav,
} from '@/shared/components/custom/meta/index.js';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';

import {
  buildMilestoneStrip,
  buildPhysicalTimeline,
  PHYSICAL_EVENT_CLASSIFIERS,
  PHYSICAL_EVENT_LABELS,
  PHYSICAL_EVENT_SOURCES,
  stripStepForMilestone,
  weekdayLabel,
  WHOLE_SHIPMENT,
} from '../config/shipment-journey-events.js';
import { useShipmentJourneyEventsQuery } from '../hooks/use-shipment-journey-query.js';

/** @param {import('../types/index.js').PhysicalJourneyEvent | null} event */
const timeOf = (event) => event?.eventAt?.slice(11, 16) || undefined;

/**
 * Plan-vs-actual note under an event: how a confirmed date compares with
 * the latest estimate, or how late an unconfirmed one is.
 * @param {import('../config/shipment-journey-events.js').PhysicalTimelineItem} item
 * @returns {import('@/shared/components/custom/meta/event-timeline.jsx').MetaTimelineItem['note']}
 */
function noteFor(item) {
  if (item.state === 'done') {
    if (!item.expected || item.deltaDays === null) return undefined;
    const planned = formatDisplayDate(item.expected.eventOn);
    if (item.deltaDays === 0) {
      return { label: `Đúng dự kiến ${planned}`, tone: 'success' };
    }
    return item.deltaDays > 0
      ? {
          label: `Trễ ${item.deltaDays} ngày so với ${planned}`,
          tone: 'warning',
        }
      : {
          label: `Sớm ${-item.deltaDays} ngày so với ${planned}`,
          tone: 'success',
        };
  }
  if (item.state === 'overdue') {
    return {
      label: `Quá ${item.deltaDays} ngày, chưa xác nhận`,
      tone: 'warning',
    };
  }
  const classifier = item.expected?.classifier ?? 'Planned';
  return {
    label: PHYSICAL_EVENT_CLASSIFIERS[classifier] ?? classifier,
    tone: 'neutral',
  };
}

/**
 * One Incoterm journey milestone as the workspace prepares it (places,
 * vessel, key date, action) for the strip.
 * @typedef {{
 *   id: string,
 *   state: 'done' | 'current' | 'upcoming',
 *   scope: 'seller' | 'buyer',
 *   label: string,
 *   title: string,
 *   footLabel: string,
 *   footValue: string,
 *   alert?: { label: string, tone: 'danger' | 'warning' },
 *   marker?: { label: string, tone: 'warning' | 'indigo' | 'success' },
 *   actionLabel?: string,
 *   onAction?: () => void,
 * }} JourneyStripStep
 */

/** @param {import('../types/index.js').PhysicalJourneyEvent} event */
const whenOf = (event) =>
  [weekdayLabel(event.eventOn), timeOf(event)].filter(Boolean).join(' · ');

/**
 * Strip steps: the Incoterm journey (every milestone, the buyer's dashed,
 * markers, alerts and the confirm / record actions), each dated by its
 * physical event when there is one (weekday · time, "x/y cont", overdue);
 * without the journey, the physical events alone.
 * @param {JourneyStripStep[] | null} journeySteps
 * @param {import('../config/shipment-journey-events.js').MilestoneStripStep[]} strip
 * @returns {import('@/shared/components/custom/meta/milestone-strip.jsx').MetaMilestoneStep[]}
 */
function stripSteps(journeySteps, strip) {
  if (!journeySteps?.length) {
    return strip.map((step) => ({
      id: step.id,
      title: PHYSICAL_EVENT_LABELS[step.code] ?? step.code,
      state: step.state,
      date: formatDisplayDate(step.shown.eventOn),
      detail: whenOf(step.shown),
      pills: step.containerTotal > 0 ? [countPill(step)] : [],
    }));
  }
  return journeySteps.map((step) => {
    const physical = stripStepForMilestone(step.id, strip);
    return {
      id: step.id,
      title: step.label,
      state:
        step.state === 'done'
          ? 'done'
          : physical?.state === 'overdue'
            ? 'overdue'
            : step.state === 'current'
              ? 'next'
              : 'upcoming',
      date: physical
        ? formatDisplayDate(physical.shown.eventOn)
        : step.footValue,
      detail: physical
        ? whenOf(physical.shown) || step.footLabel
        : step.footLabel,
      // The card title falls back to the label when there is no place.
      caption: step.title === step.label ? undefined : step.title,
      isOutOfScope: step.scope === 'buyer',
      pills: [
        ...(physical && physical.containerTotal > 1
          ? [countPill(physical)]
          : []),
        ...(step.marker ? [{ ...step.marker, isMarker: true }] : []),
        ...(step.alert ? [step.alert] : []),
      ],
      action:
        step.onAction && step.actionLabel
          ? { label: step.actionLabel, onClick: step.onAction }
          : undefined,
    };
  });
}

/** @param {import('../config/shipment-journey-events.js').MilestoneStripStep} step */
function countPill(step) {
  return {
    label: `${step.containerDone}/${step.containerTotal} cont`,
    tone: /** @type {'success' | 'neutral'} */ (
      step.containerDone === step.containerTotal ? 'success' : 'neutral'
    ),
  };
}

/**
 * "Hành trình vận chuyển": first the whole shipment as a horizontal
 * milestone strip (the Incoterm journey dated by the physical events, like
 * a carrier's tracking bar), then the physical events as a vertical
 * timeline, one per container (switched with tabs; "Toàn lô" holds the
 * vessel facts shared by every container). The planned / estimated and
 * actual dates of one event are merged into one row with the delay.
 * @param {{
 *   contractId: string,
 *   shipmentId: string,
 *   journeySteps?: JourneyStripStep[] | null,
 *   journeySummary?: string,
 * }} props
 */
export function ShipmentPhysicalTimeline({
  contractId,
  shipmentId,
  journeySteps = null,
  journeySummary,
}) {
  const query = useShipmentJourneyEventsQuery(contractId, shipmentId);
  const [activeId, setActiveId] = useState(/** @type {string | null} */ (null));

  if (query.isLoading) {
    return <Skeleton width="100%" height="var(--spacing-40)" />;
  }
  if (!query.data?.success) {
    return (
      <Banner
        status="error"
        title={query.data?.message ?? 'Không thể tải timeline vận chuyển'}
        container="card"
      />
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const groups = buildPhysicalTimeline(query.data.events, today);
  const steps = stripSteps(journeySteps, buildMilestoneStrip(groups));
  const active =
    groups.find((group) => group.id === activeId) ?? groups[0] ?? null;
  const done = steps.filter((step) => step.state === 'done').length;

  return (
    <MetaShipmentSection
      icon={Route}
      title="Hành trình vận chuyển"
      subtitle={
        journeySummary || 'Mỗi mốc gộp ngày kế hoạch / dự kiến và ngày thực tế'
      }
      pill={{
        label: `${done}/${steps.length} mốc`,
        tone: steps.length > 0 && done === steps.length ? 'success' : 'neutral',
        hasDot: steps.length > 0 && done === steps.length,
      }}
    >
      <VStack gap={4} hAlign="stretch">
        {steps.length > 0 ? (
          <VStack gap={4} hAlign="stretch" xstyle={styles.overview}>
            <MetaMilestoneStrip label="Hành trình vận chuyển" steps={steps} />
          </VStack>
        ) : null}
        {steps.length > 0 ? (
          <Text size="sm" weight="bold" color="secondary">
            CHI TIẾT THEO CONTAINER
          </Text>
        ) : null}
        {groups.length > 1 ? (
          <MetaTabNav
            isSticky={false}
            activeId={active?.id ?? ''}
            onChange={setActiveId}
            tabs={groups.map((group) => ({
              id: group.id,
              label:
                group.id === WHOLE_SHIPMENT ? 'Tàu · toàn lô' : group.label,
              icon: group.id === WHOLE_SHIPMENT ? Ship : Container,
              count: `${group.doneCount}/${group.items.length}`,
              countTone:
                group.doneCount === group.items.length ? 'success' : 'neutral',
            }))}
          />
        ) : null}
        <MetaEventTimeline
          emptyLabel="Chưa có mốc nào có ngày. Ghi nhận container, lịch tàu hoặc xác nhận mốc để bắt đầu."
          items={(active?.items ?? []).map((item) => {
            const shown = item.actual ?? item.expected;
            const source = shown
              ? [
                  PHYSICAL_EVENT_SOURCES[shown.source] ?? shown.source,
                  shown.sourceDetail,
                ]
                  .filter(Boolean)
                  .join(' · ')
              : '';
            return {
              id: item.id,
              title: PHYSICAL_EVENT_LABELS[item.code] ?? item.code,
              state: item.state,
              date: formatDisplayDate(shown?.eventOn),
              time: timeOf(shown),
              subtitle: item.location ?? undefined,
              meta: [item.voyage, source && `Nguồn: ${source}`]
                .filter(Boolean)
                .join(' · '),
              note: noteFor(item),
              tags:
                shown?.source === 'Carrier'
                  ? [{ label: 'API', tone: 'accent' }]
                  : undefined,
            };
          })}
        />
      </VStack>
    </MetaShipmentSection>
  );
}

const styles = stylex.create({
  // The strip reads as the section's summary: a hairline under it before
  // the per-container detail.
  overview: {
    borderBottomColor: 'var(--color-border)',
    borderBottomStyle: 'solid',
    borderBottomWidth: 'var(--border-width)',
    paddingBottom: 'var(--spacing-4)',
  },
});
