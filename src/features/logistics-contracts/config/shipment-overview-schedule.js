/**
 * `/logistics` home: shipments in progress on the Astryx lab `Schedule`
 * (BE-kt-xnk `GET /shipments/overview`). Each scheduled shipment is a bar
 * from departure to arrival (actual when known, else estimated), plus
 * one-day deadlines: SI / CY cut-off (until it sails) and the earliest
 * running free-time day. Events are plain ISO descriptors here; the
 * component turns them into Schedule events.
 */

/** @typedef {import('../types/index.js').ShipmentOverview} ShipmentOverview */
/** @typedef {'waiting' | 'sailing' | 'arrived' | 'unscheduled'} ShipmentPhase */
/** @typedef {'waiting' | 'sailing' | 'arrived' | 'attention' | 'cutoff' | 'freeTime'} OverviewCategory */

/**
 * @typedef {Object} OverviewEvent
 * @property {string} id
 * @property {string} shipmentId
 * @property {string} title
 * @property {OverviewCategory} category
 * @property {string} start - YYYY-MM-DD
 * @property {string} end - YYYY-MM-DD, inclusive
 */

/** Schedule categories: label + Token color. */
export const OVERVIEW_CATEGORIES = /** @type {const} */ ({
  waiting: { label: 'Chờ tàu chạy', color: 'blue' },
  sailing: { label: 'Đang trên tàu', color: 'teal' },
  arrived: { label: 'Đã đến cảng', color: 'green' },
  attention: { label: 'Cần chú ý', color: 'red' },
  cutoff: { label: 'Cut-off', color: 'purple' },
  freeTime: { label: 'Hạn free time', color: 'orange' },
});

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
 * part ("Huayyang Subdistrict, Klaeng District, …" → "Huayyang Subdistrict").
 * @param {string | null} place
 */
export function shortPlace(place) {
  return place ? place.split(',')[0].trim() : '?';
}

/** @param {ShipmentOverview} row */
function shortRoute(row) {
  if (!row.placeOfLoading && !row.placeOfDischarge) return '';
  return `${shortPlace(row.placeOfLoading)} → ${shortPlace(row.placeOfDischarge)}`;
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

/** @param {number} days @param {string} label */
function delayTag(days, label) {
  return days > 0 ? `${label} trễ ${days} ngày` : null;
}

/**
 * Titles always start with the shipment code (a clicked event is matched
 * back to its shipment by it — see `shipmentFromEventText`).
 * @param {ShipmentOverview} row
 * @param {Array<string | null>} parts
 */
function titleOf(row, parts) {
  return [row.shipmentCode, ...parts].filter(Boolean).join(' · ');
}

/**
 * Every Schedule event of the shipments.
 * - `bars` (month / week): one bar departure → arrival; a bar whose arrival
 *   is before its departure (bad data) shows on the departure day only.
 * - `milestones` (day list): the departure and the arrival as separate
 *   one-day events, so a shipment at sea is not repeated on every day.
 * @param {ShipmentOverview[]} rows
 * @param {string} today - YYYY-MM-DD, business day in Vietnam
 * @param {'bars' | 'milestones'} [mode]
 * @returns {OverviewEvent[]}
 */
export function overviewEvents(rows, today, mode = 'bars') {
  /** @type {OverviewEvent[]} */
  const events = [];
  for (const row of rows) {
    const phase = shipmentPhase(row);
    const departure = departureOf(row);
    const arrival = arrivalOf(row);
    const category = needsAttention(row) ? 'attention' : phase;
    const etdLate = delayTag(delayDays(row, 'DepartureDelayed'), 'ETD');
    const etaLate = delayTag(delayDays(row, 'ArrivalDelayed'), 'ETA');
    if (phase !== 'unscheduled' && mode === 'bars') {
      const start = /** @type {string} */ (departure ?? arrival);
      const end = arrival && arrival >= start ? arrival : start;
      events.push({
        id: `ship:${row.shipmentId}`,
        shipmentId: row.shipmentId,
        title: titleOf(row, [row.shippingLine, shortRoute(row), etaLate ?? etdLate]),
        category: /** @type {OverviewCategory} */ (category),
        start,
        end,
      });
    }
    if (phase !== 'unscheduled' && mode === 'milestones') {
      if (departure) {
        events.push({
          id: `dep:${row.shipmentId}`,
          shipmentId: row.shipmentId,
          title: titleOf(row, [
            row.actualDeparture ? 'Tàu đã chạy (ATD)' : 'Tàu chạy (ETD)',
            row.shippingLine,
            shortRoute(row),
            etdLate,
          ]),
          category: /** @type {OverviewCategory} */ (category),
          start: departure,
          end: departure,
        });
      }
      if (arrival) {
        events.push({
          id: `arr:${row.shipmentId}`,
          shipmentId: row.shipmentId,
          title: titleOf(row, [
            row.actualArrival ? 'Tàu đã đến (ATA)' : 'Tàu đến (ETA)',
            row.shippingLine,
            shortRoute(row),
            etaLate,
          ]),
          category: /** @type {OverviewCategory} */ (category),
          start: arrival,
          end: arrival,
        });
      }
    }
    if (!row.actualDeparture) {
      for (const [key, label, value] of /** @type {const} */ ([
        ['si', 'Cut-off SI / VGM', row.siCutoff],
        ['cy', 'Cut-off hạ bãi', row.cyCutoff],
      ])) {
        if (value) {
          const day = value.slice(0, 10);
          events.push({ id: `${key}:${row.shipmentId}`, shipmentId: row.shipmentId, title: titleOf(row, [label]), category: 'cutoff', start: day, end: day });
        }
      }
    }
    if (row.freeTimeLastDay) {
      events.push({
        id: `ft:${row.shipmentId}`,
        shipmentId: row.shipmentId,
        title: titleOf(row, ['Hết free time']),
        category: row.freeTimeLastDay < today ? 'attention' : 'freeTime',
        start: row.freeTimeLastDay,
        end: row.freeTimeLastDay,
      });
    }
  }
  return events;
}

/**
 * The shipment a clicked Schedule event belongs to, from the event's text
 * (the lab Schedule renders events without ids or handlers): every title
 * starts with the shipment code; the longest code found wins.
 * @param {string} text
 * @param {ShipmentOverview[]} rows
 */
export function shipmentFromEventText(text, rows) {
  return (
    rows
      .filter((row) => text.includes(row.shipmentCode))
      .sort((a, b) => b.shipmentCode.length - a.shipmentCode.length)[0] ?? null
  );
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
      label: OVERVIEW_CATEGORIES[phase].label,
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

/** @typedef {'all' | 'attention' | 'waiting' | 'sailing' | 'arrived'} OverviewFilter */

/**
 * Stage filter above the schedule (like a tracking dashboard's status bar):
 * each option with how many shipments it keeps. Unscheduled shipments are
 * counted in "Tất cả" only (they are not on the schedule; see the drawer).
 * @param {ShipmentOverview[]} rows
 * @returns {Array<{ key: OverviewFilter, label: string, count: number }>}
 */
export function overviewFilters(rows) {
  return /** @type {const} */ (['all', 'attention', 'waiting', 'sailing', 'arrived']).map((key) => ({
    key,
    label: key === 'all' ? 'Tất cả' : OVERVIEW_CATEGORIES[key].label,
    count: filterRows(rows, key).length,
  }));
}

/**
 * @param {ShipmentOverview[]} rows
 * @param {OverviewFilter} filter
 */
export function filterRows(rows, filter) {
  if (filter === 'all') return rows;
  if (filter === 'attention') return rows.filter(needsAttention);
  return rows.filter((row) => !needsAttention(row) && shipmentPhase(row) === filter);
}
