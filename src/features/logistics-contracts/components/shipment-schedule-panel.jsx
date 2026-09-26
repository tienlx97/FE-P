'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { CalendarClock, CalendarRange, History, Timer } from 'lucide-react';

import {
  MetaCompactTable,
  MetaPill,
  MetaShipmentSection,
} from '@/shared/components/custom/meta/index.js';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';

import { containerDateFields } from '../config/shipment-container-dates.js';
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

/**
 * Shipment detail "Lịch tàu & Free time" tab: the schedule (original /
 * current / actual), each container's event dates and free-time clocks,
 * and the schedule history. Spec `docs/shipment-journey-incoterms.md` §4.
 * @param {{
 *   incoterm: import('../types/index.js').Incoterm,
 *   schedule: import('../types/index.js').ShipmentSchedule | null,
 *   scheduleError: string | null,
 *   isScheduleLoading: boolean,
 *   journey: import('../types/index.js').ShipmentJourney | null,
 *   canEdit: boolean,
 *   onUpdateSchedule: () => void,
 *   onEditContainerDates: () => void,
 * }} props
 */
export function ShipmentSchedulePanel({
  incoterm,
  schedule,
  scheduleError,
  isScheduleLoading,
  journey,
  canEdit,
  onUpdateSchedule,
  onEditContainerDates,
}) {
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
  const scheduleRows = SCHEDULE_FIELDS.map(([field, label]) => {
    const isChanged = original[field] !== schedule.current[field];
    return {
      id: field,
      cells: {
        label: <Text weight="semibold">{label}</Text>,
        original: (
          <Text type="code" color="secondary">
            {formatScheduleValue(field, original[field])}
          </Text>
        ),
        current: (
          <Text type="code" weight={isChanged ? 'bold' : 'normal'}>
            {formatScheduleValue(field, schedule.current[field])}
          </Text>
        ),
        actual:
          field === 'etd' || field === 'eta' ? (
            <Text type="code" weight="bold">
              {formatDisplayDate(actual[field] ?? undefined)}
            </Text>
          ) : null,
      },
    };
  });

  const dateFields = containerDateFields(incoterm, schedule.destinationFreeTime);
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
          <Text key={field.key} type="code" color="secondary">
            {formatDisplayDate(container[field.key] ?? undefined)}
          </Text>,
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

  const revisionRows = schedule.revisions.map((revision) => ({
    id: revision.id,
    cells: {
      noticeOn: (
        <Text type="code" color="secondary">
          {formatDisplayDate(revision.noticeOn)}
        </Text>
      ),
      reason: (
        <MetaPill
          label={labelForScheduleChangeReason(revision.reason)}
          tone={revision.reason === 'Edited' ? 'neutral' : 'warning'}
          size="sm"
        />
      ),
      changes: (
        <VStack gap={0.5}>
          {revisionChanges(revision).map((change) => (
            <Text key={change} size="sm">
              {change}
            </Text>
          ))}
        </VStack>
      ),
      note: (
        <Text size="sm" color="secondary">
          {revision.note ?? '—'}
        </Text>
      ),
    },
  }));

  return (
    <VStack gap={4} hAlign="stretch">
      <MetaShipmentSection
        icon={CalendarClock}
        title="Lịch tàu"
        subtitle="Ban đầu = lúc nhận booking · Hiện tại = thông báo mới nhất"
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
              label="Cập nhật lịch tàu"
              variant="primary"
              size="sm"
              icon={<Icon icon={CalendarClock} size="sm" />}
              onClick={onUpdateSchedule}
            />
          ) : null
        }
      >
        <MetaCompactTable
          columns={[
            { key: 'label', header: 'Mốc' },
            { key: 'original', header: 'Ban đầu' },
            { key: 'current', header: 'Hiện tại' },
            { key: 'actual', header: 'Thực tế (ATD / ATA)' },
          ]}
          rows={scheduleRows}
          emptyLabel="Chưa có lịch tàu."
        />
      </MetaShipmentSection>

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
            emptyLabel="Chưa có container — thêm ở tab VGM."
          />
        </MetaShipmentSection>
      ) : null}

      <MetaShipmentSection
        icon={History}
        title="Lịch sử lịch tàu"
        subtitle="Mỗi lần ETD / ETA / cut-off / tàu thay đổi"
      >
        <MetaCompactTable
          columns={[
            { key: 'noticeOn', header: 'Ngày thông báo' },
            { key: 'reason', header: 'Lý do' },
            { key: 'changes', header: 'Thay đổi', isWrapping: true },
            { key: 'note', header: 'Ghi chú', isWrapping: true },
          ]}
          rows={revisionRows}
          emptyLabel="Lịch tàu chưa thay đổi lần nào."
        />
      </MetaShipmentSection>
    </VStack>
  );
}
