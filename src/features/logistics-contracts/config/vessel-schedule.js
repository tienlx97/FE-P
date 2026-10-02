/**
 * Vessel schedule page (`/logistics/schedule`): carriers' sailings as
 * `MetaSchedule` items (the same calendar as `/logistics`). Carrier times
 * are local port times without an offset (`2026-10-06T20:00:00`); they are
 * shown as given, never converted.
 */

import { addDays, dayRange, monthWeeks } from '@/shared/config/schedule-calendar.js';

import { formatScheduleValue } from './shipment-schedule.js';

/** The carrier selector's "every carrier" value. */
/** "Tải lại từ hãng" stays off this long after use — carriers throttle / block bursts. */
export const REFRESH_COOLDOWN_MS = 60_000;

/** How many recently picked PODs the POD selector lists when opened. */
export const RECENT_PORTS_LIMIT = 8;

/**
 * `MetaSchedule` tones given to carriers in list order (danger is kept for
 * sailings that cannot be booked). Six, so the six carriers with a connected
 * schedule (KMTC, Heung-A, Namsung, SITC, Evergreen, RCL) never share one.
 */
const CARRIER_TONES = /** @type {const} */ (['accent', 'success', 'warning', 'neutral', 'indigo', 'pink']);

/** Days in `MetaSchedule`'s "2 tuần" view. */
const TWO_WEEKS = 14;

/**
 * The tag of a sailing: `[HÃNG TÀU] - [TÊN TÀU] / [SỐ CHUYẾN]`, with `TS`
 * after the carrier when it transships (also when the vessel stops short of
 * the POD and the cargo goes on by barge): `[HÃNG TÀU] - [TS] - [TÊN TÀU] / [SỐ CHUYẾN]`.
 * @param {string} carrierName
 * @param {{ vesselName: string, voyageNumber: string | null, transshipmentPorts?: string[] }} sailing
 */
export function sailingTitle(carrierName, { vesselName, voyageNumber, transshipmentPorts = [] }) {
  const vessel = voyageNumber ? `${vesselName} / ${voyageNumber}` : vesselName;
  return transshipmentPorts.length > 0
    ? `${carrierName} - [TS] - ${vessel}`
    : `${carrierName} - ${vessel}`;
}

/** How the cargo goes on after the vessel's last port, by `onCarriage`. */
const ON_CARRIAGE_LABELS = /** @type {Record<string, string>} */ ({
  Barge: 'sà lan (barge)',
  Truck: 'xe tải',
  Rail: 'tàu hoả',
});

/**
 * The note of a sailing whose vessel does not reach the POD
 * (`onCarriage`): "Dỡ tại LAEM CHABANG, đi tiếp bằng sà lan (barge) tới
 * BANGKOK — hãng chưa có giờ đến". Null when the vessel calls at the POD.
 * @param {import('../types/index.js').CarrierSailing} sailing
 */
export function onCarriageNote(sailing) {
  if (!sailing.onCarriage) return null;
  const mode = ON_CARRIAGE_LABELS[sailing.onCarriage] ?? sailing.onCarriage;
  const from = sailing.transshipmentPorts.at(-1);
  const note = from
    ? `Dỡ tại ${from}, đi tiếp bằng ${mode} tới ${sailing.portOfDischarge}`
    : `Đi tiếp bằng ${mode} tới ${sailing.portOfDischarge}`;
  return sailing.eta ? note : `${note} — hãng chưa có giờ đến`;
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
  // The same vessel / voyage / ETD can be two sailings: a call at the POD
  // and a discharge at a nearby port with a barge on (Heung-A → Bangkok),
  // or two routings via the same transshipment port on different connecting
  // vessels, told apart only by their ETA (Evergreen via Kaohsiung).
  return [
    carrierCode,
    sailing.vesselName,
    sailing.voyageNumber ?? '',
    sailing.etd,
    sailing.eta ?? '',
    sailing.portOfDischarge,
    sailing.transshipmentPorts.join('>'),
    sailing.onCarriage ?? '',
  ].join(':');
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
 * The calendar items of every searched carrier: one per sailing with an
 * ETD, on the ETD's date, titled by its tag only. Sailings that cannot be
 * booked (departed, full, closed, not yet open) are red — the reason is in
 * the hover card and drawer. Order (kept inside each day): bookable first,
 * then by ETD, then by carrier position.
 * @param {{
 *   carrier: import('../types/index.js').ShippingCarrier,
 *   sailings: import('../types/index.js').CarrierSailing[],
 *   tone: import('@/shared/components/custom/meta/schedule.jsx').MetaScheduleTone,
 * }[]} groups - one per carrier, in list order
 * @param {string} now - local date-time (`localNow()`)
 * @returns {import('@/shared/components/custom/meta/schedule.jsx').MetaScheduleItem[]}
 */
export function scheduleItems(groups, now) {
  return groups
    .flatMap(({ carrier, sailings, tone }, carrierIndex) =>
      sailings.flatMap((sailing) => {
        if (!sailing.etd) return [];
        const isUnavailable = BOOKING_STATES[bookingState(sailing, now)].tone === 'danger';
        return [
          {
            rank: [isUnavailable ? 1 : 0, sailing.etd, carrierIndex],
            item: {
              id: sailingId(carrier.code, sailing),
              date: sailing.etd.slice(0, 10),
              title: sailingTitle(carrier.name, sailing),
              tone: isUnavailable ? /** @type {const} */ ('danger') : tone,
            },
          },
        ];
      }),
    )
    .sort(
      (a, b) =>
        Number(a.rank[0]) - Number(b.rank[0]) ||
        String(a.rank[1]).localeCompare(String(b.rank[1])) ||
        Number(a.rank[2]) - Number(b.rank[2]),
    )
    .map((entry) => entry.item);
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
 * "Hãng tàu" multi-selector options: every carrier; one without a
 * connected schedule is listed but disabled, marked "(chưa kết nối)".
 * @param {import('../types/index.js').CarrierTrackingAdapter[]} adapters
 */
export function carrierOptions(adapters) {
  return adapters.map((adapter) =>
    hasSchedule(adapter)
      ? { value: adapter.carrier.code, label: adapter.carrier.name }
      : { value: adapter.carrier.code, label: `${adapter.carrier.name} (chưa kết nối)`, isDisabled: true },
  );
}

/**
 * The carriers one search asks: the checked connected ones, in list order;
 * none checked = every connected carrier ("Tất cả hãng").
 * @param {import('../types/index.js').CarrierTrackingAdapter[]} adapters
 * @param {string[]} codes - checked carrier codes
 */
export function carriersToSearch(adapters, codes) {
  const connected = scheduleCarriers(adapters);
  const chosen = connected.filter((carrier) => codes.includes(carrier.code));
  return chosen.length > 0 ? chosen : connected;
}

/**
 * The closed "Hãng tàu" trigger: "Tất cả hãng" when none or every
 * connected carrier is checked, else the names ("KMTC, Heung-A").
 * @param {{ label: string }[]} items - checked items
 * @param {number} connectedCount
 */
export function carrierSelectionLabel(items, connectedCount) {
  return items.length === 0 || items.length === connectedCount
    ? 'Tất cả hãng'
    : items.map((item) => item.label).join(', ');
}

/**
 * `POST /ports/search` conditions for the POD selector: the text in the
 * UN/LOCODE, the name or the full name; none for blank text (every port).
 * @param {string} text
 */
export function portSearchConditions(text) {
  const value = text.trim();
  if (!value) return [];
  return ['code', 'name', 'fullName'].map((field, index) => ({
    id: field,
    field,
    operator: 'Contains',
    value,
    valueTo: '',
    connector: index === 0 ? 'And' : 'Or',
  }));
}

/**
 * The recently picked PODs with `port` first, without duplicates, at most
 * {@link RECENT_PORTS_LIMIT}.
 * @param {{ code: string, name: string }[]} recent
 * @param {{ code: string, name: string }} port
 */
export function withRecentPort(recent, port) {
  return [port, ...recent.filter((item) => item.code !== port.code)].slice(0, RECENT_PORTS_LIMIT);
}

/**
 * Recently picked PODs as stored (JSON); anything malformed is dropped.
 * @param {string | null} stored
 * @returns {{ code: string, name: string }[]}
 */
export function parseRecentPorts(stored) {
  try {
    const value = JSON.parse(stored ?? '[]');
    return Array.isArray(value)
      ? value
          .filter((item) => typeof item?.code === 'string' && typeof item?.name === 'string')
          .map((item) => ({ code: item.code, name: item.name }))
          .slice(0, RECENT_PORTS_LIMIT)
      : [];
  } catch {
    return [];
  }
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
