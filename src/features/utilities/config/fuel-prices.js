/**
 * Petrolimex retail prices (vùng 1, đ/lít), one entry per price-setting
 * period (the weekly Thursday cycle), oldest first. Source: the published
 * period table on giaxanghomnay.com/lich-su-gia-xang (checked 2026-09-26).
 * Add a new period by appending a row — every view derives from this list.
 */

/** @typedef {'e10Ron95' | 'e5Ron92' | 'diesel' | 'kerosene'} FuelProductKey */

/** @type {ReadonlyArray<{ key: FuelProductKey, label: string }>} */
export const FUEL_PRODUCTS = [
  { key: 'e10Ron95', label: 'Xăng E10 RON 95-III' },
  { key: 'e5Ron92', label: 'Xăng E5 RON 92-II' },
  { key: 'diesel', label: 'Dầu DO 0,05S-II' },
  { key: 'kerosene', label: 'Dầu hỏa 2-K' },
];

/**
 * @typedef {{ date: string } & Record<FuelProductKey, number>} FuelPricePeriod
 * `date` is ISO `YYYY-MM-DD` (the period's effective day).
 */

/** @type {ReadonlyArray<FuelPricePeriod>} */
export const FUEL_PRICE_PERIODS = [
  {
    date: '2026-07-23',
    e10Ron95: 21430,
    e5Ron92: 20880,
    diesel: 25760,
    kerosene: 26650,
  },
  {
    date: '2026-07-30',
    e10Ron95: 22850,
    e5Ron92: 22380,
    diesel: 27620,
    kerosene: 27400,
  },
  {
    date: '2026-08-06',
    e10Ron95: 22320,
    e5Ron92: 21720,
    diesel: 27540,
    kerosene: 26260,
  },
  {
    date: '2026-08-13',
    e10Ron95: 22110,
    e5Ron92: 21230,
    diesel: 27230,
    kerosene: 26170,
  },
  {
    date: '2026-08-20',
    e10Ron95: 22660,
    e5Ron92: 21830,
    diesel: 28540,
    kerosene: 27290,
  },
  {
    date: '2026-08-27',
    e10Ron95: 22600,
    e5Ron92: 21760,
    diesel: 28080,
    kerosene: 26630,
  },
  {
    date: '2026-09-03',
    e10Ron95: 23270,
    e5Ron92: 22480,
    diesel: 27740,
    kerosene: 26730,
  },
  {
    date: '2026-09-10',
    e10Ron95: 24230,
    e5Ron92: 23740,
    diesel: 28480,
    kerosene: 28370,
  },
  {
    date: '2026-09-17',
    e10Ron95: 25630,
    e5Ron92: 25130,
    diesel: 29940,
    kerosene: 31470,
  },
  {
    date: '2026-09-24',
    e10Ron95: 27080,
    e5Ron92: 26390,
    diesel: 30490,
    kerosene: 30020,
  },
];

/**
 * @typedef {FuelPricePeriod & {
 *   label: string,
 *   changes: Record<FuelProductKey, number | undefined>,
 * }} FuelPriceRow
 * `label` is `dd/MM/yyyy`; `changes[key]` is the đ/lít change vs the
 * previous period (undefined for the first one).
 */

/** @param {string} isoDate */
export function formatPeriodDate(isoDate) {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * Periods (oldest first) with their display date and the per-product change
 * from the period before.
 * @param {ReadonlyArray<FuelPricePeriod>} periods
 * @returns {FuelPriceRow[]}
 */
export function withPriceChanges(periods) {
  return periods.map((period, index) => {
    const previous = index > 0 ? periods[index - 1] : undefined;
    const changes = /** @type {Record<FuelProductKey, number | undefined>} */ (
      Object.fromEntries(
        FUEL_PRODUCTS.map(({ key }) => [
          key,
          previous ? period[key] - previous[key] : undefined,
        ]),
      )
    );
    return { ...period, label: formatPeriodDate(period.date), changes };
  });
}

const priceFormatter = new Intl.NumberFormat('vi-VN');

/** @param {number} value đ/lít → "27.080" */
export function formatFuelPrice(value) {
  return priceFormatter.format(value);
}

/** @param {number} change → "+1.450", "−550", "0" */
export function formatPriceChange(change) {
  if (change === 0) return '0';
  const sign = change > 0 ? '+' : '−';
  return `${sign}${priceFormatter.format(Math.abs(change))}`;
}
