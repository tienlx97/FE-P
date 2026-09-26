'use client';

import { Button } from '@astryxdesign/core/Button';
import { DateInput } from '@astryxdesign/core/DateInput';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Selector } from '@astryxdesign/core/Selector';
import { StackItem } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { TimeInput } from '@astryxdesign/core/TimeInput';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { CalendarClock, MoveRight, Save } from 'lucide-react';
import { useState } from 'react';

import {
  MetaFormSection,
  MetaPill,
} from '@/shared/components/custom/meta/index.js';
import { MetaFormDialog } from '@/shared/components/meta-form-dialog.jsx';
import { TextArea } from '@/shared/components/text-area.jsx';
import { TextInput } from '@/shared/components/text-input.jsx';
import { formatDateInputValue } from '@/shared/config/date-input-format.js';
import { useAppToast } from '@/shared/hooks/use-app-toast.js';

import {
  daysBetween,
  scheduleChangeReasonOptions,
  scheduleFormErrors,
  scheduleFormValues,
  shiftIsoDate,
  tracksDestinationFreeTime,
  tracksOriginFreeTime,
} from '../config/shipment-schedule.js';
import { useUpdateShipmentScheduleMutation } from '../hooks/use-shipment-schedule-query.js';
import { ShipmentFreeTimeFields } from './shipment-free-time-fields.jsx';

const TWO_COLUMNS = { minWidth: 220, max: 2 };

/** Local calendar date as ISO "YYYY-MM-DD". */
function todayIso() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * "Cập nhật lịch tàu": a carrier notice revises ETD / ETA / cut-offs /
 * vessel (kept as a revision with its reason), and sets ATD / ATA and the
 * free time. Spec `docs/shipment-journey-incoterms.md` §4.1–4.2.
 * @param {{
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 *   contractId: string,
 *   shipmentId: string,
 *   incoterm: import('../types/index.js').Incoterm,
 *   schedule: import('../types/index.js').ShipmentSchedule,
 * }} props
 */
export function ShipmentScheduleDialog({
  isOpen,
  onOpenChange,
  contractId,
  shipmentId,
  incoterm,
  schedule,
}) {
  const toast = useAppToast();
  const mutation = useUpdateShipmentScheduleMutation(contractId, shipmentId);
  const [values, setValues] = useState(() =>
    scheduleFormValues(schedule, todayIso()),
  );
  const [errors, setErrors] = useState(
    /** @type {Record<string, string>} */ ({}),
  );
  const [submitError, setSubmitError] = useState('');
  const etdShift = daysBetween(schedule.current.etd ?? '', values.etd);
  const canShiftCutoffs =
    etdShift !== null &&
    etdShift !== 0 &&
    Boolean(values.siCutoffDate || values.cyCutoffDate);
  const { summary } = schedule;

  /**
   * @template {keyof import('../types/index.js').ShipmentScheduleFormValues} K
   * @param {K} field
   * @param {import('../types/index.js').ShipmentScheduleFormValues[K]} value
   */
  function setField(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  /** @param {string} key */
  const statusOf = (key) =>
    errors[key]
      ? {
          status: /** @type {const} */ ({ type: 'error', message: errors[key] }),
          statusVariant: /** @type {const} */ ('detached'),
        }
      : {};

  /** @param {'originFreeTime' | 'destinationFreeTime'} side */
  const freeTimeStatuses = (side) =>
    Object.fromEntries(
      ['demDays', 'detDays', 'combinedDays'].map((field) => [
        field,
        errors[`${side}.${field}`]
          ? { type: /** @type {const} */ ('error'), message: errors[`${side}.${field}`] }
          : undefined,
      ]),
    );

  /** @param {'etd' | 'eta' | 'siCutoffDate' | 'cyCutoffDate' | 'actualDeparture' | 'actualArrival' | 'noticeOn'} key */
  const dateValue = (key) =>
    /** @type {import('@astryxdesign/core/Calendar').ISODateString | undefined} */ (
      values[key] || undefined
    );

  function shiftCutoffs() {
    if (etdShift === null) return;
    setValues((current) => ({
      ...current,
      siCutoffDate: shiftIsoDate(current.siCutoffDate, etdShift),
      cyCutoffDate: shiftIsoDate(current.cyCutoffDate, etdShift),
    }));
  }

  /** @param {import('react').FormEvent<HTMLFormElement>} event */
  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError('');
    const nextErrors = scheduleFormErrors(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const result = await mutation.mutateAsync({
      version: schedule.version,
      values,
    });
    if (!result.success) {
      setSubmitError(result.message);
      return;
    }
    toast({ body: 'Đã cập nhật lịch tàu.' });
    onOpenChange(false);
  }

  /**
   * @param {string} label
   * @param {'siCutoff' | 'cyCutoff'} prefix
   */
  function cutoffField(label, prefix) {
    const dateKey = /** @type {'siCutoffDate' | 'cyCutoffDate'} */ (`${prefix}Date`);
    const timeKey = /** @type {'siCutoffTime' | 'cyCutoffTime'} */ (`${prefix}Time`);
    return (
      <HStack gap={2} vAlign="start" wrap="nowrap">
        <StackItem size="fill">
          <DateInput
            label={label}
            value={dateValue(dateKey)}
            onChange={(value) => setField(dateKey, value ?? '')}
            format={formatDateInputValue}
            isOptional
            {...statusOf(dateKey)}
          />
        </StackItem>
        <VStack xstyle={styles.alignWithField}>
          <TimeInput
            label={`Giờ ${label.toLowerCase()}`}
            isLabelHidden
            value={
              /** @type {import('@astryxdesign/core/TimeInput').ISOTimeString} */ (
                values[timeKey] || undefined
              )
            }
            onChange={(value) => setField(timeKey, value ?? '')}
            hourFormat="24h"
          />
        </VStack>
      </HStack>
    );
  }

  return (
    <MetaFormDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      icon={CalendarClock}
      title="Cập nhật lịch tàu"
      meta={
        <HStack gap={2} vAlign="center" wrap="wrap">
          <MetaPill
            label={
              summary.departureDelayDays
                ? `ETD trễ ${summary.departureDelayDays} ngày`
                : 'ETD đúng lịch'
            }
            tone={summary.departureDelayDays ? 'warning' : 'success'}
            hasBorder
          />
          <MetaPill
            label={`Đã dời ${summary.etdChangeCount} lần`}
            tone="neutral"
          />
        </HStack>
      }
      width={720}
      draft={values}
      submitLabel="Lưu lịch tàu"
      submitIcon={Save}
      isSubmitting={mutation.isPending}
      submitError={submitError}
      onSubmit={handleSubmit}
    >
      <MetaFormSection isBoxed isTitleUppercase={false} index={1} title="Thông báo">
        <Grid columns={TWO_COLUMNS} gap={4}>
          <Selector
            label="Lý do"
            value={values.reason || 'CarrierDelay'}
            onChange={(value) =>
              setField(
                'reason',
                /** @type {import('../types/index.js').ScheduleChangeReason} */ (
                  value
                ),
              )
            }
            options={scheduleChangeReasonOptions}
            isRequired
            width="100%"
            {...statusOf('reason')}
          />
          <DateInput
            label="Ngày nhận thông báo"
            value={dateValue('noticeOn')}
            onChange={(value) => setField('noticeOn', value ?? '')}
            format={formatDateInputValue}
            isRequired
            {...statusOf('noticeOn')}
          />
        </Grid>
        <TextArea
          label="Ghi chú"
          placeholder="Ví dụ: Tàu trễ tại cảng trung chuyển"
          value={values.note}
          onChange={(value) => setField('note', value.slice(0, 500))}
          isOptional
          rows={2}
        />
      </MetaFormSection>

      <MetaFormSection
        isBoxed
        isTitleUppercase={false}
        index={2}
        title="Lịch tàu mới"
        action={
          <Button
            label="Dời cut-off theo ETD"
            type="button"
            variant="secondary"
            size="sm"
            icon={<Icon icon={MoveRight} size="sm" />}
            isDisabled={!canShiftCutoffs}
            onClick={shiftCutoffs}
          />
        }
      >
        <Grid columns={TWO_COLUMNS} gap={4}>
          <DateInput
            label="ETD"
            value={dateValue('etd')}
            onChange={(value) => setField('etd', value ?? '')}
            format={formatDateInputValue}
            isOptional
          />
          <DateInput
            label="ETA"
            value={dateValue('eta')}
            onChange={(value) => setField('eta', value ?? '')}
            format={formatDateInputValue}
            isOptional
          />
          <TextInput
            label="Tên tàu"
            value={values.vesselName}
            onChange={(value) => setField('vesselName', value)}
            isOptional
            width="100%"
            {...statusOf('vesselName')}
          />
          <TextInput
            label="Số chuyến"
            value={values.voyageNumber}
            onChange={(value) => setField('voyageNumber', value)}
            isOptional
            width="100%"
            {...statusOf('voyageNumber')}
          />
        </Grid>
        {/* Date + time side by side need the full row. */}
        {cutoffField('Cut-off SI / VGM', 'siCutoff')}
        {cutoffField('Cut-off hạ bãi (CY)', 'cyCutoff')}
        {etdShift ? (
          <Text size="sm" color="meta-subtle">
            ETD {etdShift > 0 ? 'lùi' : 'sớm'} {Math.abs(etdShift)} ngày so với
            hiện tại. Cut-off không tự dời — kiểm tra lại theo thông báo.
          </Text>
        ) : null}
      </MetaFormSection>

      <MetaFormSection isBoxed isTitleUppercase={false} index={3} title="Thực tế">
        <Grid columns={TWO_COLUMNS} gap={4}>
          <DateInput
            label="Tàu chạy thực tế (ATD)"
            value={dateValue('actualDeparture')}
            onChange={(value) => setField('actualDeparture', value ?? '')}
            format={formatDateInputValue}
            isOptional
          />
          <DateInput
            label="Tàu đến thực tế (ATA)"
            value={dateValue('actualArrival')}
            onChange={(value) => setField('actualArrival', value ?? '')}
            format={formatDateInputValue}
            isOptional
          />
        </Grid>
      </MetaFormSection>

      {tracksOriginFreeTime(incoterm) || tracksDestinationFreeTime(incoterm) ? (
        <MetaFormSection
          isBoxed
          isTitleUppercase={false}
          index={4}
          title="Free time"
          meta="Ngày lịch · ngày sự kiện là ngày 1"
        >
          <VStack gap={4} hAlign="stretch">
            {tracksOriginFreeTime(incoterm) ? (
              <ShipmentFreeTimeFields
                label="Đầu xuất"
                description="DET: lấy rỗng → hạ bãi · DEM: hạ bãi → xếp tàu"
                value={values.originFreeTime}
                onChange={(value) => setField('originFreeTime', value)}
                statuses={freeTimeStatuses('originFreeTime')}
              />
            ) : null}
            {tracksDestinationFreeTime(incoterm) ? (
              <ShipmentFreeTimeFields
                label="Đầu đích"
                description="DEM: dỡ hàng → lấy hàng ra · DET: lấy hàng ra → trả rỗng"
                value={values.destinationFreeTime}
                onChange={(value) => setField('destinationFreeTime', value)}
                statuses={freeTimeStatuses('destinationFreeTime')}
              />
            ) : null}
          </VStack>
        </MetaFormSection>
      ) : null}
    </MetaFormDialog>
  );
}

const styles = stylex.create({
  alignWithField: {
    // Field label line (label size × leading) + Field's label gap.
    paddingTop:
      'calc(var(--text-label-size) * var(--text-label-leading) + var(--spacing-1))',
  },
});
