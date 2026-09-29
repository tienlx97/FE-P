/**
 * Calendar math for `MetaSchedule` on plain `YYYY-MM-DD` dates (UTC-based,
 * so no timezone shifts a day). Weeks start on Monday (Vietnamese
 * calendars).
 */

/** @param {string} iso */
function toDate(iso) {
  return new Date(`${iso}T00:00:00Z`);
}

/** @param {Date} date */
function toIso(date) {
  return date.toISOString().slice(0, 10);
}

/** @param {string} iso @param {number} days */
export function addDays(iso, days) {
  const date = toDate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return toIso(date);
}

/** First day of the month, moved by `months`. @param {string} iso @param {number} months */
export function addMonths(iso, months) {
  const date = toDate(`${iso.slice(0, 7)}-01`);
  date.setUTCMonth(date.getUTCMonth() + months);
  return toIso(date);
}

/** Monday of the week containing `iso`. @param {string} iso */
export function startOfWeek(iso) {
  const weekday = (toDate(iso).getUTCDay() + 6) % 7; // Monday = 0
  return addDays(iso, -weekday);
}

/**
 * The weeks (Monday → Sunday) covering the month of `iso`: 4–6 rows of 7
 * dates, including the neighbouring months' days that fill them.
 * @param {string} iso
 * @returns {string[][]}
 */
export function monthWeeks(iso) {
  const first = `${iso.slice(0, 7)}-01`;
  const next = addMonths(first, 1);
  const weeks = [];
  for (let day = startOfWeek(first); day < next; day = addDays(day, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, index) => addDays(day, index)));
  }
  return weeks;
}

/** `count` consecutive dates from `iso`. @param {string} iso @param {number} count */
export function dayRange(iso, count) {
  return Array.from({ length: count }, (_, index) => addDays(iso, index));
}

/** @param {string} a @param {string} b */
export function isSameMonth(a, b) {
  return a.slice(0, 7) === b.slice(0, 7);
}

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

/** Monday-first weekday labels. */
export const WEEKDAY_LABELS = WEEKDAYS;

/** "T2" … "CN". @param {string} iso */
export function weekdayLabel(iso) {
  return WEEKDAYS[(toDate(iso).getUTCDay() + 6) % 7];
}

/** "Tháng 9, 2026". @param {string} iso */
export function monthTitle(iso) {
  return `Tháng ${Number(iso.slice(5, 7))}, ${iso.slice(0, 4)}`;
}

/** "27/09 – 10/10/2026". @param {string} start @param {string} end */
export function rangeTitle(start, end) {
  const short = (/** @type {string} */ iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
  return `${short(start)} – ${short(end)}/${end.slice(0, 4)}`;
}

/**
 * Items grouped by their `date`, keeping their order.
 * @template {{ date: string }} T
 * @param {T[]} items
 * @returns {Map<string, T[]>}
 */
export function groupByDay(items) {
  /** @type {Map<string, T[]>} */
  const byDay = new Map();
  for (const item of items) {
    const list = byDay.get(item.date);
    if (list) list.push(item);
    else byDay.set(item.date, [item]);
  }
  return byDay;
}

/**
 * Rows that fit in a month cell under its day number: every row (item or
 * "+n mục") is as tall as the day number, `gap` apart.
 * @param {{ available: number, rowHeight: number, gap: number }} size - px
 */
export function rowsThatFit({ available, rowHeight, gap }) {
  if (!(available > 0) || !(rowHeight > 0)) return 0;
  return Math.max(0, Math.floor((available - rowHeight) / (rowHeight + gap)));
}

/**
 * How many of a day's `count` items a month cell shows: all when they fit
 * in `rows`, else one row less and a "+n mục" row for the rest.
 * @param {number} count
 * @param {number} rows
 * @returns {{ shown: number, hidden: number }}
 */
export function dayOverflow(count, rows) {
  if (count <= rows) return { shown: count, hidden: 0 };
  const shown = Math.max(rows - 1, 0);
  return { shown, hidden: count - shown };
}
