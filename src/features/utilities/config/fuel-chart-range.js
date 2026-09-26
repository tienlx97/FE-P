/**
 * Time range of the "Biến động giá" chart. The x axis is real time (UTC
 * ms of each period's day) because periods are irregular (weekly, plus
 * extra ones in a crisis), so a band axis would stretch busy weeks.
 */

/** @typedef {import('./fuel-prices.js').FuelPriceRow} FuelPriceRow */
/** @typedef {{ start: string, end: string }} IsoRange ISO `YYYY-MM-DD`, both ends included. */

/**
 * Quick ranges, counted back from the latest period (not from today, so a
 * stale market still shows data). `ytd` = from 1 January of that year.
 */
export const RANGE_PRESETS = [
  { value: '3m', label: '3 tháng', months: 3 },
  { value: '6m', label: '6 tháng', months: 6 },
  { value: 'ytd', label: 'Năm nay' },
  { value: '12m', label: '1 năm', months: 12 },
  { value: '36m', label: '3 năm', months: 36 },
  { value: '60m', label: '5 năm', months: 60 },
  { value: 'all', label: 'Tất cả' },
];

export const DEFAULT_RANGE_PRESET = '12m';

const DAY_MS = 24 * 60 * 60 * 1000;

/** @param {string} iso `YYYY-MM-DD` → UTC midnight ms */
export function isoToTime(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

/** @param {number} time ms → `YYYY-MM-DD` (UTC) */
export function timeToIso(time) {
  return new Date(time).toISOString().slice(0, 10);
}

/**
 * @param {string} preset a `RANGE_PRESETS` value
 * @param {string} firstIso the oldest period
 * @param {string} lastIso the latest period
 * @returns {IsoRange}
 */
export function presetRange(preset, firstIso, lastIso) {
  const option = RANGE_PRESETS.find((candidate) => candidate.value === preset);
  if (!option || preset === 'all') return { start: firstIso, end: lastIso };
  if (preset === 'ytd') {
    const start = `${lastIso.slice(0, 4)}-01-01`;
    return { start: start < firstIso ? firstIso : start, end: lastIso };
  }
  const last = new Date(isoToTime(lastIso));
  last.setUTCMonth(last.getUTCMonth() - (option.months ?? 0));
  const start = timeToIso(last.getTime());
  return { start: start < firstIso ? firstIso : start, end: lastIso };
}

/**
 * Rows inside `range`. When the range starts between two periods, a
 * carried point at `range.start` holds the prices then in effect (from the
 * last earlier period), so the lines start at the left edge;
 * `carriedFrom` names that period for the tooltip.
 * @param {FuelPriceRow[]} rows oldest first
 * @param {IsoRange} range
 * @returns {Array<FuelPriceRow & { time: number, carriedFrom?: string }>}
 */
export function rowsInRange(rows, range) {
  const inside = rows
    .filter((row) => row.date >= range.start && row.date <= range.end)
    .map((row) => ({ ...row, time: isoToTime(row.date) }));
  const before = rows.filter((row) => row.date < range.start).at(-1);
  if (!before || inside[0]?.date === range.start) return inside;
  return [
    {
      ...before,
      date: range.start,
      time: isoToTime(range.start),
      changes: {},
      carriedFrom: before.label,
    },
    ...inside,
  ];
}

/**
 * Axis tick label: dd/MM for short spans, MM/yyyy past ~13 months.
 * @param {number} time
 * @param {number} spanMs
 */
export function formatAxisTime(time, spanMs) {
  const [year, month, day] = timeToIso(time).split('-');
  return spanMs > 400 * DAY_MS ? `${month}/${year}` : `${day}/${month}`;
}
