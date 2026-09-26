/**
 * "Tiện ích › Xăng dầu": markets (one tab each), known products and the
 * period → table/chart row transform. Prices come from BE
 * (`/api/v1/fuel-prices/{market}`).
 */

/** @typedef {import('../types/index.js').FuelPricePeriod} FuelPricePeriod */

/**
 * One tab per market; `hasSource` = BE can sync it from a public page.
 * @type {ReadonlyArray<{ id: string, label: string, market: string, sourceLabel?: string, note: string }>}
 */
export const FUEL_MARKETS = [
  {
    id: 'vn',
    label: 'Việt Nam',
    market: 'VN',
    sourceLabel: 'giaxanghomnay.com',
    note: 'Giá bán lẻ (đ/lít) theo bảng giá PVOIL từ 08/2018, điều hành theo chu kỳ thứ Năm hằng tuần. Từ 01/06/2026 xăng E10 RON 95 thay xăng RON 95-III khoáng. Kỳ mới được gợi ý cập nhật từ',
  },
];

/**
 * Products in display order; `isDefault` ones are shown in the chart first.
 * Codes BE's VN source produces — unknown codes still show, after these.
 * `stoppedNote` explains a product the market no longer sells.
 * @type {ReadonlyArray<{ code: string, label: string, isDefault?: boolean, stoppedNote?: string }>}
 */
export const FUEL_PRODUCTS = [
  { code: 'E10_RON95_III', label: 'Xăng E10 RON 95-III', isDefault: true },
  { code: 'E10_RON95_V', label: 'Xăng E10 RON 95-V' },
  {
    code: 'RON95_III',
    label: 'Xăng RON 95-III',
    isDefault: true,
    stoppedNote:
      'Xăng khoáng RON 95 được thay bằng xăng E10 RON 95 bắt buộc từ 01/06/2026.',
  },
  { code: 'RON95_V', label: 'Xăng RON 95-V' },
  { code: 'E5_RON92_II', label: 'Xăng E5 RON 92-II', isDefault: true },
  { code: 'DO_005S_II', label: 'Dầu DO 0,05S-II', isDefault: true },
  { code: 'DO_0001S_V', label: 'Dầu DO 0,001S-V' },
  { code: 'KEROSENE_2K', label: 'Dầu hỏa 2-K', isDefault: true },
];

/**
 * @typedef {{
 *   date: string,
 *   label: string,
 *   source: string,
 *   prices: Record<string, number | undefined>,
 *   changes: Record<string, number | undefined>,
 * } & Record<string, unknown>} FuelPriceRow
 * One period: `label` dd/MM/yyyy, `prices[code]`, and `changes[code]` = the
 * đ/lít change vs the previous period that priced the same product. Prices
 * are also spread as `row[code]` for the chart's `yKeys`.
 */

/** @param {string} isoDate */
export function formatPeriodDate(isoDate) {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * The products present in `periods`: known ones in `FUEL_PRODUCTS` order,
 * then unknown codes by name.
 * @param {ReadonlyArray<FuelPricePeriod>} periods
 * @returns {Array<{ code: string, label: string, isDefault: boolean }>}
 */
export function productsIn(periods) {
  /** @type {Map<string, string>} */
  const names = new Map();
  for (const period of periods) {
    for (const item of period.items) {
      if (!names.has(item.productCode)) {
        names.set(item.productCode, item.productName);
      }
    }
  }
  const known = FUEL_PRODUCTS.filter((product) => names.has(product.code)).map(
    (product) => ({ ...product, isDefault: Boolean(product.isDefault) }),
  );
  const unknown = [...names]
    .filter(([code]) => !FUEL_PRODUCTS.some((product) => product.code === code))
    .map(([code, label]) => ({ code, label, isDefault: false }))
    .sort((a, b) => a.label.localeCompare(b.label, 'vi'));
  return [...known, ...unknown];
}

/**
 * Periods (oldest first) as rows with the change vs the previous price of
 * each product.
 * @param {ReadonlyArray<FuelPricePeriod>} periods
 * @returns {FuelPriceRow[]}
 */
export function toPriceRows(periods) {
  const sorted = [...periods].sort((a, b) =>
    a.effectiveDate.localeCompare(b.effectiveDate),
  );
  /** @type {Record<string, number>} */
  const lastPrice = {};

  return sorted.map((period) => {
    /** @type {Record<string, number | undefined>} */
    const prices = {};
    /** @type {Record<string, number | undefined>} */
    const changes = {};
    for (const item of period.items) {
      prices[item.productCode] = item.price;
      const previous = lastPrice[item.productCode];
      changes[item.productCode] =
        previous === undefined ? undefined : item.price - previous;
      lastPrice[item.productCode] = item.price;
    }
    return {
      ...prices,
      date: period.effectiveDate,
      label: formatPeriodDate(period.effectiveDate),
      source: period.source,
      prices,
      changes,
    };
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

/** @param {string} code */
export function fuelCategory(code) {
  return code.startsWith('DO_') || code.startsWith('KEROSENE') ? 'dau' : 'xang';
}

/**
 * @typedef {{
 *   code: string,
 *   label: string,
 *   category: 'xang' | 'dau',
 *   price: number,
 *   change: number | undefined,
 *   pricedOn: string,
 *   previousOn?: string,
 *   stoppedFrom?: string,
 * }} FuelProductStatus
 * `pricedOn` = the product's latest priced period; `previousOn` = the one
 * before it (what `change` compares against). `stoppedFrom` is set when
 * the latest period no longer lists the product: the first period after
 * `pricedOn` (the product has not been priced since).
 */

/**
 * Each product's latest price, split into still-sold ones and ones the
 * latest period no longer lists (e.g. RON 95-III after E10 replaced it).
 * @param {FuelPriceRow[]} rows oldest first
 * @param {Array<{ code: string, label: string }>} products
 * @returns {{ active: FuelProductStatus[], stopped: FuelProductStatus[] }}
 */
export function productStatuses(rows, products) {
  const latest = rows.at(-1);
  /** @type {FuelProductStatus[]} */
  const active = [];
  /** @type {FuelProductStatus[]} */
  const stopped = [];
  for (const { code, label } of products) {
    let pricedIndex = -1;
    let previousIndex = -1;
    rows.forEach((candidate, index) => {
      if (candidate.prices[code] === undefined) return;
      previousIndex = pricedIndex;
      pricedIndex = index;
    });
    if (pricedIndex < 0) continue;
    const row = rows[pricedIndex];
    const previous = previousIndex < 0 ? undefined : rows[previousIndex];
    /** @type {FuelProductStatus} */
    const status = {
      code,
      label,
      category: fuelCategory(code),
      price: /** @type {number} */ (row.prices[code]),
      change: row.changes[code],
      pricedOn: row.date,
      previousOn: previous?.date,
    };
    if (row === latest) active.push(status);
    else stopped.push({ ...status, stoppedFrom: rows[pricedIndex + 1].date });
  }
  return { active, stopped };
}

/**
 * Weekday of an ISO date, Vietnamese short form ("Thứ 5", "CN").
 * @param {string} isoDate
 */
export function weekdayLabel(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return weekday === 0 ? 'CN' : `Thứ ${weekday + 1}`;
}
