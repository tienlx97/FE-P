/**
 * Vessel schedule page (`/logistics/schedule`): carriers' sailings as
 * Astryx lab `Schedule` events. Carrier times are local port times without
 * an offset; they are read and shown in one fixed zone (Việt Nam, no DST),
 * so every time appears exactly as the carrier gives it.
 */

export const SCHEDULE_TIMEZONE = 'Asia/Ho_Chi_Minh';

const ZONE_OFFSET = '+07:00';

/** BE limit of one `GET /shipments/schedules` call. */
export const MAX_SEARCH_DAYS = 62;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Length of a sailing's event on the calendar (it marks the ETD). */
const EVENT_DURATION_MS = 60 * 60 * 1000;

/** @type {ReadonlyArray<import('@astryxdesign/lab').ScheduleEventColor>} */
const CARRIER_COLORS = ['blue', 'teal', 'orange', 'purple', 'pink', 'green', 'cyan', 'yellow', 'red'];

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
 * `2026-10-06T20:00:00` (carrier local time) → epoch ms in
 * {@link SCHEDULE_TIMEZONE}; null when missing or unreadable.
 * @param {string | null | undefined} localDateTime
 */
export function localToInstant(localDateTime) {
  if (!localDateTime) return null;
  const instant = Date.parse(`${localDateTime.slice(0, 19)}${ZONE_OFFSET}`);
  return Number.isNaN(instant) ? null : instant;
}

/**
 * Epoch ms → `yyyy-MM-dd` in {@link SCHEDULE_TIMEZONE}.
 * @param {number} instant
 */
export function instantToDate(instant) {
  return new Date(instant + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/**
 * The visible range of the `Schedule` (`[start, end)` epoch ms) as the
 * `from` / `to` date windows of the search, each at most
 * {@link MAX_SEARCH_DAYS} days.
 * @param {number} start
 * @param {number} end - exclusive
 * @returns {Array<{ from: string, to: string }>}
 */
export function searchWindows(start, end) {
  const windows = [];
  const last = Date.parse(`${instantToDate(end - 1)}T00:00:00Z`);

  for (let from = Date.parse(`${instantToDate(start)}T00:00:00Z`); from <= last; ) {
    const to = Math.min(from + (MAX_SEARCH_DAYS - 1) * DAY_MS, last);
    windows.push({ from: utcDate(from), to: utcDate(to) });
    from = to + DAY_MS;
  }

  return windows;
}

/** @param {number} utcMidnight */
function utcDate(utcMidnight) {
  return new Date(utcMidnight).toISOString().slice(0, 10);
}

/**
 * One `Schedule` event per sailing with an ETD, at the ETD, in the
 * carrier's category (`Schedule` matches categories by label = carrier name).
 * @param {import('../types/index.js').ShippingCarrier} carrier
 * @param {import('../types/index.js').CarrierSailing[]} sailings
 * @returns {import('@astryxdesign/lab').CalendarInstantEvent[]}
 */
export function sailingEvents(carrier, sailings) {
  return sailings.flatMap((sailing) => {
    const etd = localToInstant(sailing.etd);
    if (etd == null) return [];

    return [
      {
        id: `${carrier.code}:${sailing.vesselName}:${sailing.voyageNumber ?? ''}:${sailing.etd}`,
        title: sailingTitle(carrier.name, sailing),
        category: carrier.name,
        start: etd,
        end: Math.min(etd + EVENT_DURATION_MS, endOfDay(etd)),
      },
    ];
  });
}

/**
 * The last minute of the {@link SCHEDULE_TIMEZONE} day holding `instant`,
 * so a late ETD (23:30) does not spill into the next day's cell.
 * @param {number} instant
 */
function endOfDay(instant) {
  return Date.parse(`${instantToDate(instant)}T23:59:00${ZONE_OFFSET}`);
}

/**
 * One category (label + colour) per carrier, stable by list order.
 * @param {import('../types/index.js').ShippingCarrier[]} carriers
 * @returns {import('@astryxdesign/lab').ScheduleCategory[]}
 */
export function carrierCategories(carriers) {
  return carriers.map((carrier, index) => ({
    label: carrier.name,
    color: CARRIER_COLORS[index % CARRIER_COLORS.length],
  }));
}

/** The carrier selector's "every carrier" value. */
export const ALL_CARRIERS = 'ALL';

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
 * The value sent to the BE for a picked port: its UN/LOCODE (the BE maps it
 * to each carrier's own codes); '' when the port has none.
 * @param {{ code?: string | null } | null | undefined} port
 */
export function portQueryValue(port) {
  return port?.code ?? '';
}
