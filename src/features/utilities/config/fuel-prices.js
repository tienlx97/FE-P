/**
 * "Tiện ích › Xăng dầu": markets (one tab each), known products and the
 * period → table/chart row transform. Prices come from BE
 * (`/api/v1/fuel-prices/{market}`).
 */

/** @typedef {import('../types/index.js').FuelPricePeriod} FuelPricePeriod */

/**
 * @typedef {{
 *   code: string,
 *   label: string,
 *   category: 'xang' | 'dau',
 *   isDefault?: boolean,
 *   stoppedNote?: string,
 * }} FuelProduct
 * A market's product in display order; `isDefault` ones are shown in the
 * chart first (and in the drawer while the market has no period);
 * `stoppedNote` explains a product the market no longer sells.
 */

/**
 * @typedef {{
 *   id: string,
 *   label: string,
 *   market: string,
 *   currency: string,
 *   unit: string,
 *   fractionDigits: number,
 *   effectiveTime: string,
 *   sourceLabel?: string,
 *   note: string,
 *   products: ReadonlyArray<FuelProduct>,
 * }} FuelMarket
 * One tab: `market` = BE ISO-2 code, `currency` / `unit` label prices,
 * `fractionDigits` = decimals of a price, `effectiveTime` = when a period's
 * prices take effect that day, `sourceLabel` = BE can sync it from there.
 */

/** @type {ReadonlyArray<FuelMarket>} */
export const FUEL_MARKETS = [
  {
    id: 'vn',
    label: 'Việt Nam',
    market: 'VN',
    currency: 'đ',
    unit: 'đ/lít',
    fractionDigits: 0,
    effectiveTime: '15:00',
    sourceLabel: 'giaxanghomnay.com',
    note: 'Giá bán lẻ (đ/lít) theo bảng giá PVOIL từ 08/2018, điều hành theo chu kỳ thứ Năm hằng tuần. Từ 01/06/2026 xăng E10 RON 95 thay xăng RON 95-III khoáng. Kỳ mới được gợi ý cập nhật từ',
    // Codes BE's VN source produces — unknown codes still show, after these.
    products: [
      {
        code: 'E10_RON95_III',
        label: 'Xăng E10 RON 95-III',
        category: 'xang',
        isDefault: true,
      },
      { code: 'E10_RON95_V', label: 'Xăng E10 RON 95-V', category: 'xang' },
      {
        code: 'RON95_III',
        label: 'Xăng RON 95-III',
        category: 'xang',
        isDefault: true,
        stoppedNote:
          'Xăng khoáng RON 95 được thay bằng xăng E10 RON 95 bắt buộc từ 01/06/2026.',
      },
      { code: 'RON95_V', label: 'Xăng RON 95-V', category: 'xang' },
      {
        code: 'E5_RON92_II',
        label: 'Xăng E5 RON 92-II',
        category: 'xang',
        isDefault: true,
      },
      {
        code: 'DO_005S_II',
        label: 'Dầu DO 0,05S-II',
        category: 'dau',
        isDefault: true,
      },
      { code: 'DO_0001S_V', label: 'Dầu DO 0,001S-V', category: 'dau' },
      {
        code: 'KEROSENE_2K',
        label: 'Dầu hỏa 2-K',
        category: 'dau',
        isDefault: true,
      },
    ],
  },
  {
    id: 'th',
    label: 'Thái Lan',
    market: 'TH',
    currency: '฿',
    unit: '฿/lít',
    fractionDigits: 2,
    effectiveTime: '05:00',
    sourceLabel: 'pttor.com',
    note: 'Giá bán lẻ tại Bangkok (baht/lít) theo bảng giá PTT từ 01/01/2022, áp dụng từ 05:00, điều chỉnh không theo chu kỳ cố định. Kỳ mới được gợi ý cập nhật từ web service của',
    // Codes BE's TH source (PTT OR) produces.
    products: [
      {
        code: 'GASOHOL_95',
        label: 'Gasohol 95',
        category: 'xang',
        isDefault: true,
      },
      {
        code: 'GASOHOL_91',
        label: 'Gasohol 91',
        category: 'xang',
        isDefault: true,
      },
      {
        code: 'GASOHOL_E20',
        label: 'Gasohol E20',
        category: 'xang',
        isDefault: true,
      },
      {
        code: 'GASOLINE_95',
        label: 'Xăng 95 không pha cồn (Gasoline 95)',
        category: 'xang',
      },
      {
        code: 'SUPER_POWER_GSH95',
        label: 'Super Power Gasohol 95',
        category: 'xang',
      },
      {
        code: 'SUPER_POWER_X99',
        label: 'Super Power X99',
        category: 'xang',
      },
      { code: 'DIESEL', label: 'Diesel', category: 'dau', isDefault: true },
      { code: 'DIESEL_B20', label: 'Diesel B20', category: 'dau' },
      {
        code: 'PREMIUM_DIESEL',
        label: 'Diesel cao cấp (Premium Diesel)',
        category: 'dau',
      },
    ],
  },
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
 * The products present in `periods`: known ones (the market's `products`)
 * in order, then unknown codes by name.
 * @param {ReadonlyArray<FuelPricePeriod>} periods
 * @param {ReadonlyArray<FuelProduct>} products
 * @returns {Array<{ code: string, label: string, isDefault: boolean }>}
 */
export function productsIn(periods, products) {
  /** @type {Map<string, string>} */
  const names = new Map();
  for (const period of periods) {
    for (const item of period.items) {
      if (!names.has(item.productCode)) {
        names.set(item.productCode, item.productName);
      }
    }
  }
  const known = products
    .filter((product) => names.has(product.code))
    .map((product) => ({ ...product, isDefault: Boolean(product.isDefault) }));
  const unknown = [...names]
    .filter(([code]) => !products.some((product) => product.code === code))
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

/** @type {Map<string, Intl.NumberFormat>} */
const formatters = new Map();

/**
 * vi-VN grouping; `isFixed` pads to `digits` decimals (prices), otherwise
 * up to `digits` (axis ticks).
 * @param {number} digits
 * @param {boolean} isFixed
 */
function numberFormatter(digits, isFixed) {
  const key = `${digits}:${isFixed}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat('vi-VN', {
      minimumFractionDigits: isFixed ? digits : 0,
      maximumFractionDigits: digits,
    });
    formatters.set(key, formatter);
  }
  return formatter;
}

/** @typedef {Pick<FuelMarket, 'fractionDigits'>} FuelNumberFormat */

/**
 * @param {number} value a price in the market's unit
 * @param {FuelNumberFormat} [market] decimals: VN "27.080", TH "36,44"
 */
export function formatFuelPrice(value, market = FUEL_MARKETS[0]) {
  return numberFormatter(market.fractionDigits, true).format(value);
}

/**
 * Axis ticks, no padded decimals ("35", "37,5").
 * @param {number} value
 * @param {FuelNumberFormat} [market]
 */
export function formatFuelAxis(value, market = FUEL_MARKETS[0]) {
  return numberFormatter(market.fractionDigits, false).format(value);
}

/**
 * @param {number} change
 * @param {FuelNumberFormat} [market] decimals: "+1.450", "−550", "0" (TH "+0,75")
 */
export function formatPriceChange(change, market = FUEL_MARKETS[0]) {
  if (change === 0) return '0';
  const sign = change > 0 ? '+' : '−';
  return `${sign}${formatFuelPrice(Math.abs(change), market)}`;
}

/**
 * Xăng / dầu group of a product: the market's list, else by code (DO,
 * dầu hỏa, diesel = dầu).
 * @param {string} code
 * @param {ReadonlyArray<FuelProduct>} [products]
 * @returns {'xang' | 'dau'}
 */
export function fuelCategory(code, products = []) {
  const known = products.find((product) => product.code === code);
  if (known) return known.category;
  return code.startsWith('DO_') ||
    code.startsWith('KEROSENE') ||
    code.includes('DIESEL')
    ? 'dau'
    : 'xang';
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
 * @param {ReadonlyArray<FuelProduct>} [known] the market's list (categories)
 * @returns {{ active: FuelProductStatus[], stopped: FuelProductStatus[] }}
 */
export function productStatuses(rows, products, known = []) {
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
      category: fuelCategory(code, known),
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
