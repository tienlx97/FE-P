import { formatDisplayDate } from '@/shared/config/date-input-format.js';

import { splitSiCutoff } from './shipment-operational-details.js';

/**
 * Schedule history, DEM / DET free time and alerts (BE-kt-xnk
 * `add-shipment-schedule-free-time`, spec
 * `docs/shipment-journey-incoterms.md` §4). Free time counts calendar
 * days, the start event's day = day 1.
 */

/** @type {Record<import('../types/index.js').ScheduleChangeReason, string>} */
const REASON_LABELS = {
  Edited: 'Sửa thông tin lô hàng',
  CarrierDelay: 'Hãng tàu báo trễ',
  VesselChange: 'Đổi tàu / chuyến',
  PortCongestion: 'Ùn tắc cảng',
  Other: 'Khác',
};

/** Reasons offered in "Cập nhật lịch tàu" (`Edited` = the edit form). */
export const scheduleChangeReasonOptions = /** @type {const} */ ([
  'CarrierDelay',
  'VesselChange',
  'PortCongestion',
  'Other',
]).map((reason) => ({ value: reason, label: REASON_LABELS[reason] }));

/** @param {import('../types/index.js').ScheduleChangeReason} reason */
export function labelForScheduleChangeReason(reason) {
  return REASON_LABELS[reason] ?? reason;
}

/**
 * The seller picks up the empties (origin free time) except under EXW,
 * and books the carriage (destination free time) under CIF / DDP.
 * @param {import('../types/index.js').Incoterm | string | undefined} incoterm
 */
export function tracksOriginFreeTime(incoterm) {
  return incoterm === 'FOB' || incoterm === 'CIF' || incoterm === 'DDP';
}

/** @param {import('../types/index.js').Incoterm | string | undefined} incoterm */
export function tracksDestinationFreeTime(incoterm) {
  return incoterm === 'CIF' || incoterm === 'DDP';
}

/** @type {import('../types/index.js').FreeTimeFormValues} */
export const EMPTY_FREE_TIME = {
  mode: '',
  demDays: undefined,
  detDays: undefined,
  combinedDays: undefined,
};

/**
 * @param {import('../types/index.js').ContainerFreeTime | null | undefined} freeTime
 * @returns {import('../types/index.js').FreeTimeFormValues}
 */
export function freeTimeFormValues(freeTime) {
  if (!freeTime) return EMPTY_FREE_TIME;
  return {
    mode: freeTime.mode,
    demDays: freeTime.demDays ?? undefined,
    detDays: freeTime.detDays ?? undefined,
    combinedDays: freeTime.combinedDays ?? undefined,
  };
}

/**
 * Request body of one side, or null when no free time is agreed.
 * @param {import('../types/index.js').FreeTimeFormValues} values
 */
export function freeTimeRequestBody(values) {
  if (!values.mode) return null;
  return values.mode === 'Separate'
    ? { Mode: 'Separate', DemDays: values.demDays ?? null, DetDays: values.detDays ?? null }
    : { Mode: 'Combined', CombinedDays: values.combinedDays ?? null };
}

/**
 * Validation message per field of one side (empty when valid).
 * @param {import('../types/index.js').FreeTimeFormValues} values
 * @returns {Partial<Record<'demDays' | 'detDays' | 'combinedDays', string>>}
 */
export function freeTimeErrors(values) {
  /** @type {Partial<Record<'demDays' | 'detDays' | 'combinedDays', string>>} */
  const errors = {};
  /** @param {'demDays' | 'detDays' | 'combinedDays'} field */
  const check = (field) => {
    const days = values[field];
    if (days === undefined) errors[field] = 'Vui lòng nhập số ngày';
    else if (!Number.isInteger(days) || days > 365) {
      errors[field] = 'Số ngày nguyên từ 0 đến 365';
    }
  };
  if (values.mode === 'Separate') {
    check('demDays');
    check('detDays');
  } else if (values.mode === 'Combined') {
    check('combinedDays');
  }
  return errors;
}

/**
 * "DEM 7 + DET 7 ngày" / "Combined 14 ngày" / "—".
 * @param {import('../types/index.js').ContainerFreeTime | null | undefined} freeTime
 */
export function freeTimeSummary(freeTime) {
  if (!freeTime) return '—';
  return freeTime.mode === 'Separate'
    ? `DEM ${freeTime.demDays ?? 0} + DET ${freeTime.detDays ?? 0} ngày`
    : `Combined ${freeTime.combinedDays ?? 0} ngày`;
}

/** @type {Record<import('../types/index.js').FreeTimeKind, string>} */
const KIND_LABELS = { Dem: 'DEM', Det: 'DET', Combined: 'DEM/DET' };

/** @type {Record<import('../types/index.js').FreeTimeSide, string>} */
const SIDE_LABELS = { Origin: 'đầu xuất', Destination: 'đầu đích' };

/**
 * "DET đầu xuất".
 * @param {import('../types/index.js').FreeTimeSide} side
 * @param {import('../types/index.js').FreeTimeKind} kind
 */
export function freeTimeClockLabel(side, kind) {
  return `${KIND_LABELS[kind]} ${SIDE_LABELS[side]}`;
}

/**
 * Remaining free time of a clock as a short label and its tone.
 * @param {import('../types/index.js').FreeTimeClock} clock
 * @returns {{ label: string, tone: 'success' | 'warning' | 'danger' | 'neutral' }}
 */
export function freeTimeClockStatus(clock) {
  if (clock.state === 'NotStarted') return { label: 'Chưa bắt đầu', tone: 'neutral' };
  if (clock.state === 'Stopped') {
    return clock.overdueDays > 0
      ? { label: `Quá ${clock.overdueDays} ngày`, tone: 'danger' }
      : { label: 'Trong free time', tone: 'success' };
  }
  if (clock.overdueDays > 0) return { label: `Quá ${clock.overdueDays} ngày`, tone: 'danger' };
  if (clock.daysLeft === 0) return { label: 'Hết free time hôm nay', tone: 'warning' };
  return {
    label: `Còn ${clock.daysLeft} ngày`,
    tone: (clock.daysLeft ?? 0) <= 2 ? 'warning' : 'success',
  };
}

/**
 * One line per alert, in Vietnamese.
 * @param {import('../types/index.js').ShipmentAlert} alert
 */
export function alertMessage(alert) {
  const due = formatDisplayDate(alert.dueOn ?? undefined);
  const container = alert.containerNumber ? `Cont ${alert.containerNumber}: ` : '';
  const clock =
    alert.side && alert.freeTimeKind
      ? freeTimeClockLabel(alert.side, alert.freeTimeKind)
      : 'free time';
  const cont = alert.containerCount ? `, còn ${alert.containerCount} cont chưa hạ bãi` : '';
  switch (alert.kind) {
    case 'FreeTimeDueSoon':
      return alert.days === 0
        ? `${container}${clock} hết hôm nay (${due})`
        : `${container}${clock} còn ${alert.days} ngày (hết ${due})`;
    case 'FreeTimeOverdue':
      return `${container}${clock} quá ${alert.days} ngày (hết ${due})`;
    case 'SiCutoffSoon':
      return `Cut-off SI / VGM ${due} (còn ${alert.days} ngày), chưa có VGM`;
    case 'SiCutoffPassed':
      return `Đã qua cut-off SI / VGM ${due} (${alert.days} ngày), chưa có VGM`;
    case 'CyCutoffSoon':
      return `Cut-off hạ bãi ${due} (còn ${alert.days} ngày)${cont || ', chưa có cont'}`;
    case 'CyCutoffPassed':
      return `Đã qua cut-off hạ bãi ${due} (${alert.days} ngày)${cont || ', chưa có cont'}`;
    case 'DepartureDelayed':
      return `ETD dời ${alert.days} ngày so với ban đầu (nay ${due})`;
    case 'ArrivalDelayed':
      return `ETA dời ${alert.days} ngày so với ban đầu (nay ${due})`;
    default:
      return alert.kind;
  }
}

/**
 * "13/10/2026 · trễ 3 ngày" — the actual date when known, else the current
 * estimate, with the delay against the original.
 * @param {string | null | undefined} actual
 * @param {string | null | undefined} estimate
 * @param {number | null | undefined} delayDays
 */
export function scheduleDateLabel(actual, estimate, delayDays) {
  const date = formatDisplayDate((actual || estimate) ?? undefined);
  if (!delayDays) return date;
  return delayDays > 0 ? `${date} · trễ ${delayDays} ngày` : `${date} · sớm ${-delayDays} ngày`;
}

/**
 * "Cập nhật lịch tàu" form from the current schedule; the notice date
 * defaults to `today`.
 * @param {import('../types/index.js').ShipmentSchedule} schedule
 * @param {string} today - ISO date
 * @returns {import('../types/index.js').ShipmentScheduleFormValues}
 */
export function scheduleFormValues(schedule, today) {
  const si = splitSiCutoff(schedule.current.siCutoff);
  const cy = splitSiCutoff(schedule.current.cyCutoff);
  return {
    etd: schedule.current.etd ?? '',
    eta: schedule.current.eta ?? '',
    siCutoffDate: si.date,
    siCutoffTime: si.time,
    cyCutoffDate: cy.date,
    cyCutoffTime: cy.time,
    vesselName: schedule.current.vesselName ?? '',
    voyageNumber: schedule.current.voyageNumber ?? '',
    actualDeparture: schedule.actualDeparture ?? '',
    actualArrival: schedule.actualArrival ?? '',
    reason: 'CarrierDelay',
    noticeOn: today,
    note: '',
    originFreeTime: freeTimeFormValues(schedule.originFreeTime),
    destinationFreeTime: freeTimeFormValues(schedule.destinationFreeTime),
  };
}

/**
 * Field errors of the "Cập nhật lịch tàu" form, keyed like
 * `originFreeTime.demDays`.
 * @param {import('../types/index.js').ShipmentScheduleFormValues} values
 * @returns {Record<string, string>}
 */
export function scheduleFormErrors(values) {
  /** @type {Record<string, string>} */
  const errors = {};
  if (!values.reason) errors.reason = 'Vui lòng chọn lý do';
  if (!values.noticeOn) errors.noticeOn = 'Vui lòng chọn ngày';
  if (values.siCutoffTime && !values.siCutoffDate) errors.siCutoffDate = 'Vui lòng chọn ngày';
  if (values.cyCutoffTime && !values.cyCutoffDate) errors.cyCutoffDate = 'Vui lòng chọn ngày';
  if (values.vesselName.length > 200) errors.vesselName = 'Tối đa 200 ký tự';
  if (values.voyageNumber.length > 50) errors.voyageNumber = 'Tối đa 50 ký tự';
  if (values.note.length > 500) errors.note = 'Tối đa 500 ký tự';
  for (const side of /** @type {const} */ (['originFreeTime', 'destinationFreeTime'])) {
    for (const [field, message] of Object.entries(freeTimeErrors(values[side]))) {
      errors[`${side}.${field}`] = message;
    }
  }
  return errors;
}

/** @type {Array<[keyof import('../types/index.js').ShipmentScheduleValues, string]>} */
export const SCHEDULE_FIELDS = [
  ['etd', 'ETD'],
  ['eta', 'ETA'],
  ['siCutoff', 'Cut-off SI / VGM'],
  ['cyCutoff', 'Cut-off hạ bãi'],
  ['vesselName', 'Tàu'],
  ['voyageNumber', 'Chuyến'],
];

/**
 * A schedule value for display: dates as dd/MM/yyyy, cut-offs with their
 * time, text as is.
 * @param {keyof import('../types/index.js').ShipmentScheduleValues} field
 * @param {string | null} value
 */
export function formatScheduleValue(field, value) {
  if (!value) return '—';
  if (field === 'siCutoff' || field === 'cyCutoff') {
    const { date, time } = splitSiCutoff(value);
    return `${formatDisplayDate(date)} ${time}`;
  }
  if (field === 'etd' || field === 'eta') return formatDisplayDate(value);
  return value;
}

/**
 * First known value of each schedule field: the oldest revision's
 * previous value, else the current one (same rule as the backend summary).
 * @param {import('../types/index.js').ShipmentSchedule} schedule
 * @returns {import('../types/index.js').ShipmentScheduleValues}
 */
export function originalScheduleValues(schedule) {
  const oldestFirst = [...schedule.revisions].reverse();
  return /** @type {import('../types/index.js').ShipmentScheduleValues} */ (
    Object.fromEntries(
      SCHEDULE_FIELDS.map(([field]) => [
        field,
        oldestFirst.map((revision) => revision.previous[field]).find(Boolean) ??
          schedule.current[field],
      ]),
    )
  );
}

/**
 * "ETD 10/10/2026 → 12/10/2026" for each field the revision changed.
 * @param {import('../types/index.js').ShipmentScheduleRevision} revision
 */
export function revisionChanges(revision) {
  return SCHEDULE_FIELDS.filter(
    ([field]) => revision.previous[field] !== revision.next[field],
  ).map(
    ([field, label]) =>
      `${label} ${formatScheduleValue(field, revision.previous[field])} → ${formatScheduleValue(field, revision.next[field])}`,
  );
}

/**
 * Moves an ISO date by `days` (for "Dời cut-off cùng số ngày với ETD").
 * @param {string} isoDate
 * @param {number} days
 */
export function shiftIsoDate(isoDate, days) {
  if (!isoDate) return isoDate;
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Whole days from `from` to `to` (ISO dates); null when either is missing.
 * @param {string} from
 * @param {string} to
 */
export function daysBetween(from, to) {
  if (!from || !to) return null;
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}
