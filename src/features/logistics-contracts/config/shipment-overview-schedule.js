/**
 * `/logistics` home: shipments in progress on the Astryx lab `Schedule`
 * (BE-kt-xnk `GET /shipments/overview`), built to be read at a glance:
 * every view shows what happens on each day — ETD / ATD, ETA / ATA, Cutoff
 * SI/VGM and Cutoff CY (until it sails), LFD (earliest running free-time
 * day) — and the color says which kind (legend = the header filter): blue
 * ETD/ATD, green ETA/ATA, amber Cutoff/LFD, red overdue. Titles lead with
 * the standard term, no explanations. Overdue items roll forward onto
 * today ("quá n ngày"): overdue is exactly what must be seen today.
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
 * @property {string} term - ETD, ATD, ETA, ATA, Cutoff SI/VGM, Cutoff CY, LFD
 * @property {string} title
 * @property {OverviewCategory} category
 * @property {string} start - YYYY-MM-DD
 * @property {string} end - YYYY-MM-DD, inclusive
 */

/** Each kind's label and `MetaSchedule` tone (legend = the header filter). */
export const OVERVIEW_CATEGORIES = /** @type {const} */ ({
  departure: { label: 'ETD/ATD', tone: 'accent' },
  arrival: { label: 'ETA/ATA', tone: 'success' },
  deadline: { label: 'Cutoff/LFD', tone: 'warning' },
  overdue: { label: 'Quá hạn', tone: 'danger' },
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

/**
 * "Cảng Cát Lái → Bangkok Port → Huayyang …": loading port → discharge
 * port, then the place of delivery when it is somewhere else (DDP site).
 * Missing ports read "?".
 * @param {ShipmentOverview} row
 */
export function shipmentRoute(row) {
  if (!row.placeOfLoading && !row.placeOfDischarge) return '';
  const legs = [row.placeOfLoading ?? '?', row.placeOfDischarge ?? '?'];
  const delivery = row.placeOfDelivery?.trim();
  if (delivery && delivery !== row.placeOfDischarge?.trim()) legs.push(delivery);
  return legs.join(' → ');
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

/** Whole days from `date` to `today` (both YYYY-MM-DD). */
function daysBetween(/** @type {string} */ date, /** @type {string} */ today) {
  return Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) / 86_400_000);
}

/** "quá 3 ngày". @param {string} date @param {string} today */
function overdueTag(date, today) {
  return `quá ${daysBetween(date, today)} ngày`;
}

/** @param {Array<string | null | undefined>} parts */
function join(parts) {
  return parts.filter(Boolean).join(' · ');
}

/**
 * Every Schedule event of the shipments, titled with the standard term
 * first — `ETD` / `ATD`, `ETA` / `ATA`, `Cutoff SI/VGM`, `Cutoff CY`, `LFD`
 * (last free day) — then the shipment code and a short detail. Overdue
 * relative to `today` (deadline past, ETD / ETA past without the actual)
 * → red, shown on today with "quá n ngày".
 * @param {ShipmentOverview[]} rows
 * @param {string} today - YYYY-MM-DD, business day in Vietnam
 * @returns {OverviewEvent[]}
 */
export function overviewEvents(rows, today) {
  /** @type {OverviewEvent[]} */
  const events = [];
  /**
   * @param {string} id
   * @param {ShipmentOverview} row
   * @param {string} term
   * @param {string} date
   * @param {boolean} isOverdue
   * @param {OverviewCategory} category - when not overdue
   * @param {Array<string | null | undefined>} details
   */
  const push = (id, row, term, date, isOverdue, category, details) =>
    events.push({
      id: `${id}:${row.shipmentId}`,
      shipmentId: row.shipmentId,
      term,
      title: join([term, row.shipmentCode, ...details, isOverdue ? overdueTag(date, today) : null]),
      category: isOverdue ? 'overdue' : category,
      start: isOverdue ? today : date,
      end: isOverdue ? today : date,
    });

  for (const row of rows) {
    const carrier = row.shippingLine;
    const pod = shortPlace(row.placeOfDischarge);
    const departure = departureOf(row);
    const arrival = arrivalOf(row);

    if (departure) {
      const missed = !row.actualDeparture && departure < today;
      push('dep', row, row.actualDeparture ? 'ATD' : 'ETD', departure, missed, 'departure', [
        carrier ? `${carrier} → ${pod}` : `→ ${pod}`,
        missed ? null : lateTag(delayDays(row, 'DepartureDelayed')),
      ]);
    }
    if (arrival) {
      const missed = !row.actualArrival && arrival < today;
      push('arr', row, row.actualArrival ? 'ATA' : 'ETA', arrival, missed, 'arrival', [
        carrier,
        pod,
        missed ? null : lateTag(delayDays(row, 'ArrivalDelayed')),
      ]);
    }
    if (!row.actualDeparture) {
      for (const [id, term, value] of /** @type {const} */ ([
        ['si', 'Cutoff SI/VGM', row.siCutoff],
        ['cy', 'Cutoff CY', row.cyCutoff],
      ])) {
        if (value) {
          const day = value.slice(0, 10);
          const passed = day < today;
          push(id, row, term, day, passed, 'deadline', [passed ? null : value.slice(11, 16)]);
        }
      }
    }
    if (row.freeTimeLastDay) {
      push('ft', row, 'LFD', row.freeTimeLastDay, row.freeTimeLastDay < today, 'deadline', []);
    }
  }
  return events;
}

/** @typedef {'all' | OverviewCategory} OverviewFilter */

/**
 * Header filter, doubling as the color legend: each kind with how many
 * events it has.
 * @param {OverviewEvent[]} events
 * @returns {Array<{ key: OverviewFilter, label: string, count: number, tone: 'accent' | 'success' | 'warning' | 'danger' | null }>}
 */
export function overviewFilters(events) {
  return [
    { key: 'all', label: 'Tất cả', count: events.length, tone: null },
    ...(/** @type {const} */ (['departure', 'arrival', 'deadline', 'overdue'])).map((key) => ({
      key,
      label: OVERVIEW_CATEGORIES[key].label,
      count: events.filter((event) => event.category === key).length,
      tone: OVERVIEW_CATEGORIES[key].tone,
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
