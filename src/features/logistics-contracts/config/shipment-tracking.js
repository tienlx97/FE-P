import { formatDisplayDate } from '@/shared/config/date-input-format.js';

/**
 * Carrier tracking (BE-kt-xnk `add-carrier-tracking`, plan
 * `docs/carrier-tracking-integration-plan.md`): labels for the tracking
 * section on "Lịch tàu & Free time".
 */

/** @type {Record<import('../types/index.js').TrackedField, string>} */
const FIELD_LABELS = {
  EmptyPickedUpOn: 'Ngày lấy rỗng',
  GatedInOn: 'Ngày hạ bãi',
  DestinationGatedOutOn: 'Ngày lấy hàng ra cảng đích',
  EmptyReturnedOn: 'Ngày trả rỗng',
  ActualDeparture: 'ATD',
  ActualArrival: 'ATA',
  TransshipmentAta: 'ATA chuyển tải',
  TransshipmentAtd: 'ATD chuyển tải',
};

/** @param {import('../types/index.js').TrackedField} field */
export function labelForTrackedField(field) {
  return FIELD_LABELS[field] ?? field;
}

/**
 * What a discrepancy is about: "Ngày lấy rỗng · TCLU1234567",
 * "ATA chuyển tải · chặng 1 (Singapore)", "ATD".
 * @param {import('../types/index.js').ShipmentTrackingDiscrepancy} discrepancy
 * @param {import('../types/index.js').TransshipmentLeg[]} [legs]
 */
export function discrepancyTargetLabel(discrepancy, legs = []) {
  const label = labelForTrackedField(discrepancy.field);
  if (discrepancy.containerNumber) return `${label} · ${discrepancy.containerNumber}`;
  if (discrepancy.legSequence) {
    const port = legs[discrepancy.legSequence - 1]?.port;
    return `${label} · chặng ${discrepancy.legSequence}${port ? ` (${port})` : ''}`;
  }
  return label;
}

/**
 * Plain-language event, after the plan's §3 table (GTOT empty = empty out
 * of the depot, GTIN full = gated in at the POL…).
 * @param {Pick<import('../types/index.js').ShipmentTrackingEvent, 'code' | 'isEmpty' | 'classifier' | 'locationRole'>} event
 */
export function trackingEventLabel(event) {
  const label = (() => {
    switch (event.code) {
      case 'GateOut':
        return event.isEmpty
          ? 'Cont rỗng ra depot'
          : event.locationRole === 'PortOfDischarge'
            ? 'Cont hàng ra cảng đích'
            : 'Cont ra cổng';
      case 'GateIn':
        return event.isEmpty
          ? 'Cont rỗng về depot'
          : event.locationRole === 'PortOfLoading'
            ? 'Cont hàng vào cảng xếp'
            : 'Cont vào cổng';
      case 'Load':
        return 'Xếp lên tàu';
      case 'Discharge':
        return 'Dỡ hàng';
      case 'Departure':
        return event.locationRole === 'Transshipment' ? 'Tàu rời cảng chuyển tải' : 'Tàu rời cảng';
      case 'Arrival':
        return event.locationRole === 'Transshipment' ? 'Tàu đến cảng chuyển tải' : 'Tàu đến cảng';
      default:
        return event.code;
    }
  })();
  return event.classifier === 'Actual' ? label : `${label} (dự kiến)`;
}

/** @param {string | null | undefined} value */
const lettersAndDigits = (value) => (value ?? '').toUpperCase().replace(/[^\p{L}\p{N}]/gu, '');

/**
 * Principle 4 "hiển thị nguồn": a predicate telling whether a date shown on
 * the shipment came from the carrier — an event filled (or, accepted,
 * supplied) that field with that same date. A date changed by hand
 * afterwards no longer matches, so it reads as hand-entered again.
 * Container fields match by container number, leg fields by port.
 * @param {import('../types/index.js').ShipmentTrackingEvent[]} events
 * @returns {(target: { field: import('../types/index.js').TrackedField, value: string | null | undefined, containerNumber?: string, port?: string }) => boolean}
 */
export function carrierSourcedDates(events) {
  const applied = events.filter((event) => event.appliedTo);
  return ({ field, value, containerNumber, port }) =>
    Boolean(value) &&
    applied.some((event) => {
      if (event.appliedTo !== field || event.eventAt.slice(0, 10) !== value) return false;
      if (containerNumber !== undefined && lettersAndDigits(event.containerNumber) !== lettersAndDigits(containerNumber)) {
        return false;
      }
      if (port !== undefined) {
        const [a, b] = [lettersAndDigits(event.locationName), lettersAndDigits(port)];
        return a.length > 0 && b.length > 0 && (a.includes(b) || b.includes(a));
      }
      return true;
    });
}

/** Container date key (VGM record) → tracked field. */
export const CONTAINER_DATE_TRACKED_FIELD = /** @type {const} */ ({
  emptyPickedUpOn: 'EmptyPickedUpOn',
  gatedInOn: 'GatedInOn',
  destinationGatedOutOn: 'DestinationGatedOutOn',
  emptyReturnedOn: 'EmptyReturnedOn',
});

/**
 * The status pill and the explanation under it.
 * @param {import('../types/index.js').ShipmentTracking} tracking
 * @returns {{ label: string, tone: 'success' | 'warning' | 'danger' | 'neutral', hint: string | null, canSync: boolean }}
 */
export function trackingStatus(tracking) {
  if (!tracking.carrier) {
    return {
      label: 'Chưa nhận ra hãng tàu',
      tone: 'neutral',
      hint: 'Ghi tên hãng (KMTC, Heung-A, Namsung, SITC, Evergreen, RCL, OOCL, Yang Ming, ONE) ở ô "Hãng tàu" của lô hàng để theo dõi.',
      canSync: false,
    };
  }
  const { adapter, sync } = tracking;
  if (adapter && !adapter.enabled) {
    return { label: 'Đang tắt', tone: 'neutral', hint: `Tracking hãng ${tracking.carrier.name} đang tắt trong cấu hình.`, canSync: true };
  }
  if (!adapter?.isImplemented) {
    return {
      label: 'Chưa kết nối',
      tone: 'neutral',
      hint: `Chưa cài đặt lấy dữ liệu từ hãng ${tracking.carrier.name}${adapter?.activeVersion ? ` (adapter ${adapter.activeVersion})` : ''} — vẫn nhập tay như hiện nay.`,
      canSync: true,
    };
  }
  if (!sync?.status) return { label: 'Chưa đồng bộ', tone: 'neutral', hint: null, canSync: true };
  if (sync.status === 'Failed') {
    return { label: 'Lỗi đồng bộ', tone: 'danger', hint: sync.lastError, canSync: true };
  }
  if (sync.status === 'Synced') {
    return tracking.discrepancies.length > 0
      ? { label: `Hãng tàu báo khác: ${tracking.discrepancies.length}`, tone: 'warning', hint: null, canSync: true }
      : { label: 'Đã đồng bộ', tone: 'success', hint: null, canSync: true };
  }
  return { label: 'Chưa kết nối', tone: 'neutral', hint: sync.lastError, canSync: true };
}

/**
 * "KMTC · adapter v1 · Đồng bộ lúc 27/09/2026 14:05".
 * @param {import('../types/index.js').ShipmentTracking} tracking
 */
export function trackingSubtitle(tracking) {
  if (!tracking.carrier) return 'Tự lấy mốc container / tàu từ hãng tàu';
  return [
    tracking.carrier.name,
    tracking.adapter?.activeVersion ? `adapter ${tracking.adapter.activeVersion}` : null,
    tracking.sync?.lastSyncedAt
      ? `Đồng bộ lúc ${formatDateTime(tracking.sync.lastSyncedAt)}`
      : tracking.sync?.lastAttemptAt
        ? `Thử lúc ${formatDateTime(tracking.sync.lastAttemptAt)}`
        : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

/**
 * UTC timestamp → "27/09/2026 14:05" in Vietnam time (UTC+7), like the
 * rest of the shipment dates.
 * @param {string} utc
 */
export function formatDateTime(utc) {
  const date = new Date(/[zZ]|[+-]\d\d:\d\d$/.test(utc) ? utc : `${utc}Z`);
  if (Number.isNaN(date.getTime())) return utc;
  const local = new Date(date.getTime() + 7 * 60 * 60 * 1000).toISOString();
  return `${formatDisplayDate(local.slice(0, 10))} ${local.slice(11, 16)}`;
}
