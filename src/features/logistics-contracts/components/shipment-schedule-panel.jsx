'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import {
  CalendarClock,
  CalendarRange,
  FileText,
  History,
  Split,
  Timer,
} from 'lucide-react';

import {
  MetaCompactTable,
  MetaEventTimeline,
  MetaPill,
  MetaShipmentSection,
} from '@/shared/components/custom/meta/index.js';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';

import { containerDateFields } from '../config/shipment-container-dates.js';
import {
  billOfLadingSteps,
  labelForBillOfLadingType,
} from '../config/shipment-documents.js';
import {
  formatScheduleValue,
  freeTimeClockLabel,
  freeTimeClockStatus,
  freeTimeSummary,
  labelForScheduleChangeReason,
  originalScheduleValues,
  revisionChanges,
  SCHEDULE_FIELDS,
  tracksDestinationFreeTime,
  tracksOriginFreeTime,
} from '../config/shipment-schedule.js';
import {
  carrierSourcedDates,
  CONTAINER_DATE_TRACKED_FIELD,
} from '../config/shipment-tracking.js';
import { useShipmentTrackingQuery } from '../hooks/use-shipment-tracking-query.js';
import { ShipmentCarrierTrackingSection } from './shipment-carrier-tracking-section.jsx';
import { ShipmentPhysicalTimeline } from './shipment-physical-timeline.jsx';

/** Marks a date the carrier supplied (principle 4, "hiển thị nguồn"). */
function CarrierSourceTag() {
  return <MetaPill label="API" tone="accent" size="sm" />;
}

/**
 * One label / value line of a side card: the label on the left, the value
 * (and its notes) right-aligned, a hairline under every line but the last.
 * @param {{ label: string, children: import('react').ReactNode }} props
 */
function InfoLine({ label, children }) {
  return (
    <HStack
      hAlign="between"
      vAlign="start"
      gap={3}
      wrap="nowrap"
      xstyle={styles.infoLine}
    >
      <Text color="secondary" xstyle={styles.infoLabel}>
        {label}
      </Text>
      <VStack gap={1} hAlign="end" xstyle={styles.infoValue}>
        {children}
      </VStack>
    </HStack>
  );
}

/**
 * Shipment detail "Timeline & lịch tàu" tab. Wide screens: the physical
 * vessel schedule before the physical timeline, side by side only when both
 * columns have room. B/L and transshipment follow as two cards; carrier tracking, per-container
 * free time and the schedule history (as a timeline). Spec
 * `docs/shipment-journey-incoterms.md` §4, `docs/carrier-tracking-integration-plan.md`.
 * @param {{
 *   contractId: string,
 *   shipmentId: string,
 *   incoterm: import('../types/index.js').Incoterm,
 *   schedule: import('../types/index.js').ShipmentSchedule | null,
 *   scheduleError: string | null,
 *   isScheduleLoading: boolean,
 *   journey: import('../types/index.js').ShipmentJourney | null,
 *   canEdit: boolean,
 *   onUpdateSchedule: () => void,
 *   onEditContainerDates: () => void,
 *   onEditDocuments: () => void,
 *   onEditTransshipment: () => void,
 * }} props
 */
export function ShipmentSchedulePanel({
  contractId,
  shipmentId,
  incoterm,
  schedule,
  scheduleError,
  isScheduleLoading,
  journey,
  canEdit,
  onUpdateSchedule,
  onEditContainerDates,
  onEditDocuments,
  onEditTransshipment,
}) {
  const trackingQuery = useShipmentTrackingQuery(contractId, shipmentId);
  const isFromCarrier = carrierSourcedDates(
    trackingQuery.data?.success ? trackingQuery.data.tracking.events : [],
  );

  if (isScheduleLoading) {
    return (
      <VStack gap={4} hAlign="stretch">
        <Skeleton width="100%" height="var(--spacing-40)" />
        <Skeleton width="100%" height="var(--spacing-40)" index={1} />
      </VStack>
    );
  }
  if (!schedule) {
    return (
      <Banner
        status="error"
        title={scheduleError ?? 'Không thể tải lịch tàu'}
        container="card"
      />
    );
  }

  const original = originalScheduleValues(schedule);
  const { summary } = schedule;
  /** @type {Partial<Record<string, string | null>>} */
  const actual = {
    etd: schedule.actualDeparture,
    eta: schedule.actualArrival,
  };
  const scheduleLines = SCHEDULE_FIELDS.map(([field, label]) => {
    const current = formatScheduleValue(field, schedule.current[field]);
    const first = formatScheduleValue(field, original[field]);
    const isChanged = original[field] !== schedule.current[field];
    const actualValue =
      field === 'etd' || field === 'eta' ? (actual[field] ?? null) : null;
    return (
      <InfoLine key={field} label={label}>
        <Text type="code" weight="bold">
          {current}
        </Text>
        {isChanged ? (
          <Text size="sm" type="code" color="meta-subtle">
            Ban đầu: {first}
          </Text>
        ) : null}
        {actualValue ? (
          <HStack gap={1.5} vAlign="center" wrap="nowrap">
            <MetaPill
              label={`${field === 'etd' ? 'ATD' : 'ATA'} ${formatDisplayDate(actualValue)}`}
              tone="success"
              size="sm"
              hasDot
            />
            {isFromCarrier({
              field: field === 'etd' ? 'ActualDeparture' : 'ActualArrival',
              value: actualValue,
            }) ? (
              <CarrierSourceTag />
            ) : null}
          </HStack>
        ) : null}
      </InfoLine>
    );
  });

  const dateFields = containerDateFields(
    incoterm,
    schedule.destinationFreeTime,
  );
  const containerRows = (journey?.containerFreeTime ?? []).map((container) => ({
    id: container.containerId,
    cells: {
      container: (
        <Text type="code" weight="bold">
          {container.containerNumber}
        </Text>
      ),
      ...Object.fromEntries(
        dateFields.map((field) => [
          field.key,
          <HStack key={field.key} gap={1.5} vAlign="center">
            <Text type="code" color="secondary">
              {formatDisplayDate(container[field.key] ?? undefined)}
            </Text>
            {isFromCarrier({
              field: CONTAINER_DATE_TRACKED_FIELD[field.key],
              value: container[field.key],
              containerNumber: container.containerNumber,
            }) ? (
              <CarrierSourceTag />
            ) : null}
          </HStack>,
        ]),
      ),
      clocks: (
        <HStack gap={1.5} wrap="wrap">
          {container.clocks.length === 0 ? (
            <Text size="sm" color="meta-subtle">
              Chưa có free time
            </Text>
          ) : (
            container.clocks.map((clock) => {
              const status = freeTimeClockStatus(clock);
              return (
                <MetaPill
                  key={`${clock.side}-${clock.kind}`}
                  label={`${freeTimeClockLabel(clock.side, clock.kind)}: ${status.label}`}
                  tone={status.tone}
                  size="sm"
                  hasDot={status.tone === 'danger'}
                />
              );
            })
          )}
        </HStack>
      ),
    },
  }));

  const blSteps = billOfLadingSteps(schedule.documents);
  const blDone = blSteps.filter((step) => step.date).length;
  const firstOpenStep = blSteps.findIndex((step) => !step.date);
  const legs = schedule.transshipmentLegs ?? [];

  return (
    <VStack gap={4} hAlign="stretch">
      <HStack gap={4} vAlign="start" xstyle={styles.split}>
        <VStack gap={4} hAlign="stretch" xstyle={styles.side}>
          <MetaShipmentSection
            icon={CalendarClock}
            title="Lịch tàu"
            subtitle="Hiện tại · ban đầu khi đã dời · thực tế"
            pill={
              summary.departureDelayDays
                ? {
                    label: `ETD trễ ${summary.departureDelayDays} ngày · dời ${summary.etdChangeCount} lần`,
                    tone: 'warning',
                  }
                : { label: 'Đúng lịch', tone: 'success', hasDot: true }
            }
            actions={
              canEdit ? (
                <Button
                  label="Cập nhật"
                  variant="primary"
                  size="sm"
                  icon={<Icon icon={CalendarClock} size="sm" />}
                  onClick={onUpdateSchedule}
                />
              ) : null
            }
          >
            <VStack gap={0} hAlign="stretch">
              {scheduleLines}
            </VStack>
          </MetaShipmentSection>
        </VStack>

        <VStack gap={4} hAlign="stretch" xstyle={styles.main}>
          <ShipmentPhysicalTimeline
            contractId={contractId}
            shipmentId={shipmentId}
          />
        </VStack>
      </HStack>

      <Grid columns={{ minWidth: 320, max: 2 }} gap={4}>
        <MetaShipmentSection
          icon={FileText}
          title="Chứng từ B/L"
          subtitle={
            [
              labelForBillOfLadingType(schedule.documents?.billOfLadingType),
              schedule.documents?.blReleaseReference,
            ]
              .filter(Boolean)
              .join(' · ') || undefined
          }
          pill={{
            label: `${blDone}/${blSteps.length} bước`,
            tone: blDone === blSteps.length ? 'success' : 'neutral',
            hasDot: blDone === blSteps.length,
          }}
          actions={
            canEdit ? (
              <Button
                label="Cập nhật"
                variant="secondary"
                size="sm"
                icon={<Icon icon={FileText} size="sm" />}
                onClick={onEditDocuments}
              />
            ) : null
          }
        >
          <MetaEventTimeline
            emptyLabel="Chưa có bước B/L."
            items={blSteps.map((step, index) => ({
              id: step.key,
              title: step.label,
              state: step.date
                ? 'done'
                : index === firstOpenStep
                  ? 'next'
                  : 'upcoming',
              date: step.date ? formatDisplayDate(step.date) : 'Chưa có',
            }))}
          />
        </MetaShipmentSection>

        <MetaShipmentSection
          icon={Split}
          title="Chuyển tải"
          subtitle={
            legs.length > 0
              ? `${legs.length} cảng chuyển tải`
              : 'Đi thẳng — không chuyển tải'
          }
          actions={
            canEdit ? (
              <Button
                label="Sửa"
                variant="secondary"
                size="sm"
                icon={<Icon icon={Split} size="sm" />}
                onClick={onEditTransshipment}
              />
            ) : null
          }
        >
          {legs.length === 0 ? (
            <Text color="secondary">Tàu đi thẳng từ POL đến POD.</Text>
          ) : (
            <VStack gap={0} hAlign="stretch">
              {legs.map((leg, index) => {
                const arrival = leg.ata || leg.eta;
                const departure = leg.atd || leg.etd;
                return (
                  <InfoLine
                    key={`${index}-${leg.port}`}
                    label={`${index + 1}. ${leg.port}`}
                  >
                    <Text size="sm">
                      {[leg.vesselName, leg.voyageNumber]
                        .filter(Boolean)
                        .join(' / ') || 'Chưa có tàu nối'}
                    </Text>
                    <HStack gap={1.5} vAlign="center" wrap="wrap" hAlign="end">
                      <MetaPill
                        label={`${leg.ata ? 'ATA' : 'ETA'} ${arrival ? formatDisplayDate(arrival) : '—'}`}
                        tone={leg.ata ? 'success' : 'neutral'}
                        size="sm"
                      />
                      <MetaPill
                        label={`${leg.atd ? 'ATD' : 'ETD'} ${departure ? formatDisplayDate(departure) : '—'}`}
                        tone={leg.atd ? 'success' : 'neutral'}
                        size="sm"
                      />
                      {isFromCarrier({
                        field: 'TransshipmentAta',
                        value: leg.ata,
                        port: leg.port,
                      }) ||
                      isFromCarrier({
                        field: 'TransshipmentAtd',
                        value: leg.atd,
                        port: leg.port,
                      }) ? (
                        <CarrierSourceTag />
                      ) : null}
                    </HStack>
                  </InfoLine>
                );
              })}
            </VStack>
          )}
        </MetaShipmentSection>
      </Grid>

      <ShipmentCarrierTrackingSection
        contractId={contractId}
        shipmentId={shipmentId}
        legs={legs}
        canEdit={canEdit}
      />

      {tracksOriginFreeTime(incoterm) || tracksDestinationFreeTime(incoterm) ? (
        <MetaShipmentSection
          icon={Timer}
          title="Free time theo container"
          subtitle={[
            tracksOriginFreeTime(incoterm)
              ? `Đầu xuất: ${freeTimeSummary(schedule.originFreeTime)}`
              : null,
            tracksDestinationFreeTime(incoterm)
              ? `Đầu đích: ${freeTimeSummary(schedule.destinationFreeTime)}`
              : null,
          ]
            .filter(Boolean)
            .join(' · ')}
          actions={
            canEdit ? (
              <Button
                label="Ngày container"
                variant="secondary"
                size="sm"
                icon={<Icon icon={CalendarRange} size="sm" />}
                onClick={onEditContainerDates}
              />
            ) : null
          }
        >
          <MetaCompactTable
            columns={[
              { key: 'container', header: 'Container' },
              ...dateFields.map((field) => ({
                key: field.key,
                header: field.shortLabel,
              })),
              { key: 'clocks', header: 'Free time', isWrapping: true },
            ]}
            rows={containerRows}
            emptyLabel="Chưa có container — thêm ở tab Container & VGM."
          />
        </MetaShipmentSection>
      ) : null}

      <MetaShipmentSection
        icon={History}
        title="Lịch sử lịch tàu"
        subtitle="Mỗi lần ETD / ETA / cut-off / tàu thay đổi, mới nhất trước"
        pill={{
          label: `${schedule.revisions.length} lần thay đổi`,
          tone: 'neutral',
        }}
      >
        <MetaEventTimeline
          emptyLabel="Lịch tàu chưa thay đổi lần nào."
          items={[...schedule.revisions]
            .sort((a, b) => b.noticeOn.localeCompare(a.noticeOn))
            .map((revision) => ({
              id: revision.id,
              title: labelForScheduleChangeReason(revision.reason),
              state: 'done',
              date: formatDisplayDate(revision.noticeOn),
              subtitle: revisionChanges(revision).join(' · '),
              meta: revision.note ?? undefined,
              tags:
                revision.reason === 'Edited'
                  ? undefined
                  : [{ label: 'Hãng tàu / cảng', tone: 'warning' }],
            }))}
        />
      </MetaShipmentSection>
    </VStack>
  );
}

const styles = stylex.create({
  // The page sidebar leaves less room than the viewport implies: split only
  // when each side can hold dates, badges and action buttons comfortably.
  split: {
    alignItems: {
      default: 'stretch',
      '@media (min-width: 1400px)': 'flex-start',
    },
    flexDirection: {
      default: 'column',
      '@media (min-width: 1400px)': 'row',
    },
  },
  main: {
    flexBasis: 0,
    flexGrow: 1,
    minWidth: 0,
  },
  side: {
    flexBasis: 0,
    flexGrow: 1,
    minWidth: 0,
  },
  infoLine: {
    borderBottomColor: 'var(--color-border)',
    borderBottomStyle: {
      default: 'solid',
      ':last-child': 'none',
    },
    borderBottomWidth: 'var(--border-width)',
    paddingBlock: 'var(--spacing-3)',
  },
  infoLabel: {
    flexShrink: 0,
  },
  infoValue: {
    minWidth: 0,
    textAlign: 'end',
  },
});
