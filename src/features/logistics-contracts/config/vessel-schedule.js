/**
 * Vessel schedule page (`/logistics/schedule`): carriers' sailings as
 * `MetaSchedule` items (the same calendar as `/logistics`). Carrier times
 * are local port times without an offset (`2026-10-06T20:00:00`); they are
 * shown as given, never converted.
 */

import { addDays, dayRange, monthWeeks } from '@/shared/config/schedule-calendar.js';

import { formatScheduleValue } from './shipment-schedule.js';

/** The carrier selector's "every carrier" value. */
export const ALL_CARRIERS = 'ALL';

/** `MetaSchedule` tones given to carriers in list order (danger is kept for errors). */
const CARRIER_TONES = /** @type {const} */ (['accent', 'success', 'warning', 'neutral']);

/** Days in `MetaSchedule`'s "2 tuần" view. */
const TWO_WEEKS = 14;

/**
 * The tag of a sailing: `[HÃNG TÀU] - [TÊN TÀU] / [SỐ CHUYẾN]`.
 * @param {string} carrierName
 * @param {{ vesselName: string, voyageNumber: string | null }} sailing
 */
export function sailingTitle(carrierName, { vesselName, voyageNumber }) {
  return voyageNumber
    ? `${carrierName} - ${vesselName} / ${voyageNumber}`
    : `${carrierName} - ${vesselName}`;
}

/**
 * A carrier local date-time for display: `06/10/2026 20:00`, `—` when missing.
 * @param {string | null | undefined} localDateTime
 */
export function formatCarrierTime(localDateTime) {
  return formatScheduleValue('siCutoff', localDateTime ?? null);
}

/**
 * The dates the calendar shows (`from` / `to`, inclusive `yyyy-MM-dd`): the
 * month grid's full weeks, or the 14 days of the "2 tuần" view.
 * @param {import('@/shared/components/custom/meta/schedule.jsx').MetaScheduleView} view
 * @param {string} anchor - `yyyy-MM-dd`
 */
export function visibleRange(view, anchor) {
  if (view === 'month') {
    const weeks = monthWeeks(anchor);
    return { from: weeks[0][0], to: weeks[weeks.length - 1][6] };
  }
  const days = dayRange(anchor, TWO_WEEKS);
  return { from: days[0], to: addDays(days[0], TWO_WEEKS - 1) };
}

/**
 * A carrier's tone, stable whatever carrier is chosen (index in the full list).
 * @param {import('../types/index.js').ShippingCarrier[]} carriers - every carrier
 * @param {string} code
 * @returns {import('@/shared/components/custom/meta/schedule.jsx').MetaScheduleTone}
 */
export function carrierTone(carriers, code) {
  const index = carriers.findIndex((carrier) => carrier.code === code);
  return CARRIER_TONES[Math.max(index, 0) % CARRIER_TONES.length];
}

/**
 * The id of a sailing's calendar item (also how a click finds the sailing).
 * @param {string} carrierCode
 * @param {import('../types/index.js').CarrierSailing} sailing
 */
export function sailingId(carrierCode, sailing) {
  return `${carrierCode}:${sailing.vesselName}:${sailing.voyageNumber ?? ''}:${sailing.etd}`;
}

/**
 * Now as a Việt Nam local date-time (`2026-09-29T11:05:00`), comparable with
 * carrier times.
 * @param {number} [instant]
 */
export function localNow(instant = Date.now()) {
  return new Date(instant + 7 * 60 * 60 * 1000).toISOString().slice(0, 19);
}

/**
 * @typedef {'departed' | 'full' | 'closed' | 'notYetOpen' | 'open' | 'unknown'} BookingState
 */

/** Label and pill tone of each booking state. */
export const BOOKING_STATES = /** @type {const} */ ({
  departed: { label: 'Đã qua giờ khởi hành', tone: 'danger' },
  full: { label: 'Hết chỗ', tone: 'danger' },
  closed: { label: 'Đã đóng booking', tone: 'danger' },
  notYetOpen: { label: 'Chưa mở booking', tone: 'danger' },
  open: { label: 'Còn nhận booking', tone: 'success' },
  unknown: { label: 'Hãng không cho biết', tone: 'neutral' },
});

/**
 * Whether a sailing can still be booked. The carrier's `Full` (it closed
 * the sailing itself) is "hết chỗ" only while its SI cut-off (else CY) is
 * still ahead; once past it the sailing is simply closed, like one whose
 * cut-off passed.
 * @param {import('../types/index.js').CarrierSailing} sailing
 * @param {string} now - local date-time (`localNow()`)
 * @returns {BookingState}
 */
export function bookingState(sailing, now) {
  if (sailing.etd && sailing.etd <= now) return 'departed';
  switch (sailing.bookingStatus) {
    case 'Full': {
      const deadline = sailing.siCutoff ?? sailing.cyCutoff;
      return !deadline || deadline > now ? 'full' : 'closed';
    }
    case 'CutoffPassed':
      return 'closed';
    case 'NotYetOpen':
      return 'notYetOpen';
    case 'Open':
      return 'open';
    default:
      return 'unknown';
  }
}

/**
 * One calendar item per sailing with an ETD, on the ETD's date. Confirmed
 * unavailable sailings are red and carry the reason after their tag.
 * @param {import('../types/index.js').ShippingCarrier} carrier
 * @param {import('../types/index.js').CarrierSailing[]} sailings
 * @param {import('@/shared/components/custom/meta/schedule.jsx').MetaScheduleTone} tone
 * @param {string} now - local date-time (`localNow()`)
 * @returns {import('@/shared/components/custom/meta/schedule.jsx').MetaScheduleItem[]}
 */
export function sailingItems(carrier, sailings, tone, now) {
  return sailings.flatMap((sailing) => {
    if (!sailing.etd) return [];
    const state = BOOKING_STATES[bookingState(sailing, now)];
    const isUnavailable = state.tone === 'danger';

    return [
      {
        id: sailingId(carrier.code, sailing),
        date: sailing.etd.slice(0, 10),
        title: isUnavailable ? `${sailingTitle(carrier.name, sailing)} · ${state.label}` : sailingTitle(carrier.name, sailing),
        tone: isUnavailable ? 'danger' : tone,
      },
    ];
  });
}

/**
 * Whether the carrier's vessel schedule is connected (adapter enabled and
 * implemented, not a placeholder).
 * @param {import('../types/index.js').CarrierTrackingAdapter} adapter
 */
function hasSchedule(adapter) {
  return Boolean(adapter.schedule?.enabled && adapter.schedule.isImplemented);
}

/**
 * The carriers whose vessel schedule is connected.
 * @param {import('../types/index.js').CarrierTrackingAdapter[]} adapters
 */
export function scheduleCarriers(adapters) {
  return adapters.filter(hasSchedule).map((adapter) => adapter.carrier);
}

/**
 * Carrier selector options: "Tất cả hãng" first, then every carrier; a
 * carrier without a connected schedule is marked (choosing it shows why).
 * @param {import('../types/index.js').CarrierTrackingAdapter[]} adapters
 */
export function carrierOptions(adapters) {
  return [
    { value: ALL_CARRIERS, label: 'Tất cả hãng' },
    ...adapters.map((adapter) => ({
      value: adapter.carrier.code,
      label: hasSchedule(adapter) ? adapter.carrier.name : `${adapter.carrier.name} (chưa kết nối)`,
    })),
  ];
}

/**
 * The carriers one search asks: every connected one for "Tất cả hãng", else
 * the chosen carrier (even when not connected, so its status is shown).
 * @param {import('../types/index.js').CarrierTrackingAdapter[]} adapters
 * @param {string} choice - a carrier code or {@link ALL_CARRIERS}
 */
export function carriersToSearch(adapters, choice) {
  if (choice === ALL_CARRIERS) {
    return scheduleCarriers(adapters);
  }
  return adapters.filter((adapter) => adapter.carrier.code === choice).map((adapter) => adapter.carrier);
}

/**
 * Port selector options: only ports with a UN/LOCODE (the vessel schedule
 * is looked up by it), code first, sorted by code — `VNCLI — Cát Lái`.
 * @param {import('../types/index.js').Port[]} ports
 */
export function portOptions(ports) {
  return ports
    .filter((port) => Boolean(port.code))
    .map((port) => ({ value: /** @type {string} */ (port.code), label: `${port.code} — ${port.name}` }))
    .sort((a, b) => a.value.localeCompare(b.value));
}
