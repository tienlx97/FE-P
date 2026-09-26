/**
 * One payment installment in the "Giá trị" utility. `mode` "percent" reads
 * `value` as a % of the total, "amount" as a fixed amount.
 * @typedef {{
 *   key: string,
 *   mode: 'percent' | 'amount',
 *   value: number | undefined,
 * }} Installment
 */

/**
 * A product's price in a fuel price period (đ/lít for VN).
 * @typedef {{ productCode: string, productName: string, price: number }} FuelPriceItem
 */

/**
 * A stored price-setting period (BE `FuelPricesController`). `effectiveDate`
 * is ISO `YYYY-MM-DD`; `source` is "manual" or the sync source's name.
 * @typedef {{
 *   id: string,
 *   market: string,
 *   effectiveDate: string,
 *   source: string,
 *   updatedAtUtc: string,
 *   items: FuelPriceItem[],
 * }} FuelPricePeriod
 */

/**
 * `GET /fuel-prices/{market}/source-check`: the source's periods a sync
 * would add ("New") or overwrite ("Changed"), oldest first.
 * @typedef {{
 *   source: string,
 *   latestSourceDate: string | null,
 *   pending: Array<{ kind: 'New' | 'Changed', effectiveDate: string, items: FuelPriceItem[] }>,
 * }} FuelPriceSourceCheck
 */

/** @typedef {{ source: string, added: number, updated: number, unchanged: number }} FuelPriceSyncResult */

export {};
