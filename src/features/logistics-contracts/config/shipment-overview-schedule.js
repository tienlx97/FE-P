/**
 * `/logistics` home: shipments in progress on the Astryx lab `Schedule`
 * (BE-kt-xnk `GET /shipments/overview`), built to be read at a glance:
 * every view shows what happens on each day — a departure, an arrival or a
 * deadline (SI / CY cut-off until it sails, the earliest running free-time
 * day) — and the color says which kind (legend = the header filter):
 * blue departs, green arrives, yellow deadline, red overdue (a deadline
 * past, or ETD / ETA past without ATD / ATA). Titles lead with the verb.
 * Overdue items roll forward onto today (with their own date in the
 * title): the lab Schedule mutes past days' events, and overdue is exactly
 * what must stay visible.
 * Events are plain ISO descriptors here; the component turns them into
 * Schedule events.
 */

/** @typedef {import('../types/index.js').ShipmentOverview} ShipmentOverview */
/** @typedef {'waiting' | 'sailing' | 'arrived' | 'unscheduled'} ShipmentPhase */
/** @typedef {'departure' | 'arrival' | 'deadline' | 'overdue'} OverviewCategory */

/**
 * @typedef {Object} OverviewEvent
 * @property {string} id
 * @property {string} shipmentId
 * @property {string} title
 * @property {OverviewCategory} category
 * @property {string} start - YYYY-MM-DD
 * @property {string} end - YYYY-MM-DD, inclusive
 */

/**
 * Schedule categories (label + Token color) and the matching legend dot
 * (`StatusDot` variant; the Meta accent is blue).
 */
export const OVERVIEW_CATEGORIES = /** @type {const} */ ({
  departure: { label: 'Tàu chạy', color: 'blue', dot: 'accent' },
  arrival: { label: 'Tàu đến', color: 'green', dot: 'success' },
  deadline: { label: 'Hạn chót', color: 'yellow', dot: 'warning' },
  overdue: { label: 'Quá hạn', color: 'red', dot: 'error' },
});

/** Drawer group labels per phase. */
const PHASE_LABELS = {
  waiting: 'Chờ tàu chạy',
  sailing: 'Đang trên tàu',
  arrived: 'Đã đến cảng',
};

/** @param {ShipmentOverview} row */
export function departureOf(row) {
  return row.actualDeparture ?? row.etd;
}

/** @param {ShipmentOverview} row */
export function arrivalOf(row) {
  return row.actualArrival ?? row.eta;
}

/**
 * @param {ShipmentOverview} row
 * @returns {ShipmentPhase}
 */
export function shipmentPhase(row) {
  if (row.actualArrival) return 'arrived';
  if (row.actualDeparture) return 'sailing';
  if (row.etd || row.eta) return 'waiting';
  return 'unscheduled';
}

/** @param {ShipmentOverview} row */
export function needsAttention(row) {
  return row.alerts.some((alert) => alert.severity === 'Danger');
}

/** "Hai Phong → Bangkok" (missing ports as "?"). @param {ShipmentOverview} row */
export function shipmentRoute(row) {
  if (!row.placeOfLoading && !row.placeOfDischarge) return '';
  return `${row.placeOfLoading ?? '?'} → ${row.placeOfDischarge ?? '?'}`;
}

/**
 * A place short enough for a schedule title: its first comma-separated
 * part, without a leading "Cảng" ("Cảng Bangkok" → "Bangkok",
 * "Huayyang Subdistrict, Klaeng District, …" → "Huayyang Subdistrict").
 * @param {string | null} place
 */
export function shortPlace(place) {
  if (!place) return '?';
  return place.split(',')[0].trim().replace(/^cảng\s+/i, '');
}

/**
 * Days the departure / arrival moved later than first booked (from the
 * shipment's DepartureDelayed / ArrivalDelayed alert); 0 when on time.
 * @param {ShipmentOverview} row
 * @param {'DepartureDelayed' | 'ArrivalDelayed'} kind
 */
export function delayDays(row, kind) {
  return row.alerts.find((alert) => alert.kind === kind)?.days ?? 0;
}

/** @param {number} days */
function lateTag(days) {
  return days > 0 ? `trễ ${days} ngày` : null;
}

/** "2026-09-20" → "20/09". @param {string} date */
function dayMonth(date) {
  return `${date.slice(8, 10)}/${date.slice(5, 7)}`;
}

/** @param {Array<string | null | undefined>} parts */
function join(parts) {
  return parts.filter(Boolean).join(' · ');
}

/**
 * Every Schedule event of the shipments: departure (on ATD, else ETD),
 * arrival (ATA, else ETA), SI / CY cut-off while not sailed, the earliest
 * running free-time day. Overdue relative to `today` → red, shown on today.
 * @param {ShipmentOverview[]} rows
 * @param {string} today - YYYY-MM-DD, business day in Vietnam
 * @returns {OverviewEvent[]}
 */
export function overviewEvents(rows, today) {
  /** @type {OverviewEvent[]} */
  const events = [];
  for (const row of rows) {
    const carrier = row.shippingLine;
    const departure = departureOf(row);
    const arrival = arrivalOf(row);

    if (departure) {
      const missed = !row.actualDeparture && departure < today;
      events.push({
        id: `dep:${row.shipmentId}`,
        shipmentId: row.shipmentId,
        title: join([
          row.actualDeparture ? 'Đã chạy' : missed ? 'Quá ETD, chưa chạy' : 'Tàu chạy',
          row.shipmentCode,
          `${carrier ? `${carrier} ` : ''}→ ${shortPlace(row.placeOfDischarge)}`,
          missed ? `ETD ${dayMonth(departure)}` : lateTag(delayDays(row, 'DepartureDelayed')),
        ]),
        category: missed ? 'overdue' : 'departure',
        start: missed ? today : departure,
        end: missed ? today : departure,
      });
    }
    if (arrival) {
      const missed = !row.actualArrival && arrival < today;
      events.push({
        id: `arr:${row.shipmentId}`,
        shipmentId: row.shipmentId,
        title: join([
          row.actualArrival ? 'Đã đến' : missed ? 'Quá ETA, chưa đến' : 'Tàu đến',
          row.shipmentCode,
          carrier,
          `tại ${shortPlace(row.placeOfDischarge)}`,
          missed ? `ETA ${dayMonth(arrival)}` : lateTag(delayDays(row, 'ArrivalDelayed')),
        ]),
        category: missed ? 'overdue' : 'arrival',
        start: missed ? today : arrival,
        end: missed ? today : arrival,
      });
    }
    if (!row.actualDeparture) {
      for (const [key, label, value] of /** @type {const} */ ([
        ['si', 'Cut-off SI / VGM', row.siCutoff],
        ['cy', 'Cut-off hạ bãi', row.cyCutoff],
      ])) {
        if (value) {
          const day = value.slice(0, 10);
          const passed = day < today;
          events.push({
            id: `${key}:${row.shipmentId}`,
            shipmentId: row.shipmentId,
            title: join([
              passed ? `Đã qua ${label}` : label,
              row.shipmentCode,
              passed ? `từ ${dayMonth(day)}` : value.slice(11, 16),
            ]),
            category: passed ? 'overdue' : 'deadline',
            start: passed ? today : day,
            end: passed ? today : day,
          });
        }
      }
    }
    if (row.freeTimeLastDay) {
      const overdue = row.freeTimeLastDay < today;
      events.push({
        id: `ft:${row.shipmentId}`,
        shipmentId: row.shipmentId,
        title: join([
          overdue ? 'Quá hạn free time' : 'Hết free time',
          row.shipmentCode,
          overdue ? `từ ${dayMonth(row.freeTimeLastDay)}` : null,
        ]),
        category: overdue ? 'overdue' : 'deadline',
        start: overdue ? today : row.freeTimeLastDay,
        end: overdue ? today : row.freeTimeLastDay,
      });
    }
  }
  return events;
}

/** @typedef {'all' | OverviewCategory} OverviewFilter */

/**
 * Header filter, doubling as the color legend: each kind with how many
 * events it has (overdue ones counted even when their day is past).
 * @param {OverviewEvent[]} events
 * @returns {Array<{ key: OverviewFilter, label: string, count: number, dot: 'accent' | 'success' | 'warning' | 'error' | null }>}
 */
export function overviewFilters(events) {
  return [
    { key: 'all', label: 'Tất cả', count: events.length, dot: null },
    ...(/** @type {const} */ (['departure', 'arrival', 'deadline', 'overdue'])).map((key) => ({
      key,
      label: OVERVIEW_CATEGORIES[key].label,
      count: events.filter((event) => event.category === key).length,
      dot: OVERVIEW_CATEGORIES[key].dot,
    })),
  ];
}

/**
 * @param {OverviewEvent[]} events
 * @param {OverviewFilter} filter
 */
export function filterEvents(events, filter) {
  return filter === 'all' ? events : events.filter((event) => event.category === filter);
}

/**
 * The shipment behind a clicked Schedule element (the lab Schedule gives
 * events no ids or handlers): the element's text is exactly one event's
 * title.
 * @param {string} text
 * @param {OverviewEvent[]} events
 */
export function eventFromText(text, events) {
  return events.find((event) => event.title === text) ?? null;
}

/**
 * Drawer list: "Cần chú ý" first, then by phase, unscheduled last; each
 * group keeps the API's order (by departure). Empty groups are dropped.
 * @param {ShipmentOverview[]} rows
 */
export function overviewGroups(rows) {
  /** @type {Array<{ key: string, label: string, rows: ShipmentOverview[] }>} */
  const groups = [
    { key: 'attention', label: 'Cần chú ý', rows: rows.filter(needsAttention) },
    ...(/** @type {const} */ (['waiting', 'sailing', 'arrived'])).map((phase) => ({
      key: phase,
      label: PHASE_LABELS[phase],
      rows: rows.filter((row) => !needsAttention(row) && shipmentPhase(row) === phase),
    })),
    {
      key: 'unscheduled',
      label: 'Chưa có lịch tàu',
      rows: rows.filter((row) => !needsAttention(row) && shipmentPhase(row) === 'unscheduled'),
    },
  ];
  return groups.filter((group) => group.rows.length > 0);
}
