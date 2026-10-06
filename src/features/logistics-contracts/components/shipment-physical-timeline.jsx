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
 * "Timeline vận chuyển": first the whole shipment as a horizontal
 * milestone strip (each event once, "x/y cont" done, like a carrier's
 * tracking bar), then the physical events as a vertical timeline, one per
 * container (switched with tabs; "Toàn lô" holds the
 * vessel facts shared by every container). The planned / estimated and
 * actual dates of one event are merged into one row with the delay.
 * @param {{contractId: string, shipmentId: string}} props
 */
export function ShipmentPhysicalTimeline({ contractId, shipmentId }) {
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
  const strip = buildMilestoneStrip(groups);
  const active =
    groups.find((group) => group.id === activeId) ?? groups[0] ?? null;
  const done = groups.reduce((sum, group) => sum + group.doneCount, 0);
  const total = groups.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <MetaShipmentSection
      icon={Route}
      title="Timeline vận chuyển"
      subtitle="Mỗi mốc gộp ngày kế hoạch / dự kiến và ngày thực tế"
      pill={{
        label: `${done}/${total} mốc đã xảy ra`,
        tone: total > 0 && done === total ? 'success' : 'neutral',
        hasDot: total > 0 && done === total,
      }}
    >
      <VStack gap={4} hAlign="stretch">
        {strip.length > 0 ? (
          <VStack gap={4} hAlign="stretch" xstyle={styles.overview}>
            <MetaMilestoneStrip
              label="Tiến trình lô hàng"
              steps={strip.map((step) => ({
                id: step.id,
                title: PHYSICAL_EVENT_LABELS[step.code] ?? step.code,
                state: step.state,
                date: formatDisplayDate(step.shown.eventOn),
                detail: [weekdayLabel(step.shown.eventOn), timeOf(step.shown)]
                  .filter(Boolean)
                  .join(' · '),
                count:
                  step.containerTotal > 0
                    ? {
                        label: `${step.containerDone}/${step.containerTotal} cont`,
                        isComplete: step.containerDone === step.containerTotal,
                      }
                    : undefined,
              }))}
            />
          </VStack>
        ) : null}
        {strip.length > 0 ? (
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
