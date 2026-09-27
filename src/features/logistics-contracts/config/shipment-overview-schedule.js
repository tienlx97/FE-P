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

/** @param {ShipmentOverview} row */
function barTitle(row) {
  return [row.shipmentCode, row.shippingLine, shipmentRoute(row)].filter(Boolean).join(' · ');
}

/**
 * Every Schedule event of the shipments. A bar whose arrival is before its
 * departure (bad data) shows on the departure day only.
 * @param {ShipmentOverview[]} rows
 * @param {string} today - YYYY-MM-DD, business day in Vietnam
 * @returns {OverviewEvent[]}
 */
export function overviewEvents(rows, today) {
  /** @type {OverviewEvent[]} */
  const events = [];
  for (const row of rows) {
    const phase = shipmentPhase(row);
    const departure = departureOf(row);
    const arrival = arrivalOf(row);
    if (phase !== 'unscheduled') {
      const start = /** @type {string} */ (departure ?? arrival);
      const end = arrival && arrival >= start ? arrival : start;
      events.push({
        id: `ship:${row.shipmentId}`,
        shipmentId: row.shipmentId,
        title: barTitle(row),
        category: needsAttention(row) ? 'attention' : phase,
        start,
        end,
      });
    }
    if (!row.actualDeparture) {
      for (const [key, label, value] of /** @type {const} */ ([
        ['si', 'Cut-off SI / VGM', row.siCutoff],
        ['cy', 'Cut-off hạ bãi', row.cyCutoff],
      ])) {
        if (value) {
          const day = value.slice(0, 10);
          events.push({ id: `${key}:${row.shipmentId}`, shipmentId: row.shipmentId, title: `${row.shipmentCode} · ${label}`, category: 'cutoff', start: day, end: day });
        }
      }
    }
    if (row.freeTimeLastDay) {
      events.push({
        id: `ft:${row.shipmentId}`,
        shipmentId: row.shipmentId,
        title: `${row.shipmentCode} · Hết free time`,
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
