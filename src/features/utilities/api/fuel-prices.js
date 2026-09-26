import { apiRequest } from '@/shared/api/api-client.js';

/** @typedef {import('../types/index.js').FuelPricePeriod} FuelPricePeriod */
/** @typedef {import('../types/index.js').FuelPriceItem} FuelPriceItem */
/** @typedef {import('../types/index.js').FuelPriceSourceCheck} FuelPriceSourceCheck */
/** @typedef {import('../types/index.js').FuelPriceSyncResult} FuelPriceSyncResult */

/** @param {string} market */
function endpoint(market) {
  return `/api/v1/fuel-prices/${encodeURIComponent(market)}`;
}

/**
 * Requires `logistics:view`. Periods oldest first.
 * @param {string} market
 * @returns {Promise<{ success: true, periods: FuelPricePeriod[] } | { success: false, message: string }>}
 */
export async function listFuelPricePeriods(market) {
  const result = await apiRequest(endpoint(market), {
    errorMessage: 'Không thể tải giá xăng dầu',
  });
  if (!result.success) return { success: false, message: result.message };
  return { success: true, periods: result.data ?? [] };
}

/**
 * Requires `logistics:manage`. Creates the period or replaces all its prices.
 * @param {string} market
 * @param {string} effectiveDate ISO `YYYY-MM-DD`
 * @param {FuelPriceItem[]} items
 * @returns {Promise<{ success: true, period: FuelPricePeriod } | { success: false, message: string }>}
 */
export async function upsertFuelPricePeriod(market, effectiveDate, items) {
  const result = await apiRequest(`${endpoint(market)}/${effectiveDate}`, {
    method: 'PUT',
    errorMessage: 'Không thể lưu kỳ giá',
    body: {
      Items: items.map((item) => ({
        ProductCode: item.productCode,
        ProductName: item.productName,
        Price: item.price,
      })),
    },
  });
  if (!result.success) return { success: false, message: result.message };
  return { success: true, period: result.data };
}

/**
 * Requires `logistics:manage`.
 * @param {string} market
 * @param {string} effectiveDate
 * @returns {Promise<{ success: true } | { success: false, message: string }>}
 */
export async function deleteFuelPricePeriod(market, effectiveDate) {
  const result = await apiRequest(`${endpoint(market)}/${effectiveDate}`, {
    method: 'DELETE',
    errorMessage: 'Không thể xoá kỳ giá',
  });
  if (!result.success) return { success: false, message: result.message };
  return { success: true };
}

/**
 * Requires `logistics:view`. What a sync would add / change; saves nothing.
 * @param {string} market
 * @returns {Promise<{ success: true, check: FuelPriceSourceCheck } | { success: false, message: string }>}
 */
export async function checkFuelPriceSource(market) {
  const result = await apiRequest(`${endpoint(market)}/source-check`, {
    errorMessage: 'Không đọc được nguồn giá xăng dầu',
  });
  if (!result.success) return { success: false, message: result.message };
  return { success: true, check: result.data };
}

/**
 * Requires `logistics:manage`. Saves every new / changed period of the source.
 * @param {string} market
 * @returns {Promise<{ success: true, sync: FuelPriceSyncResult } | { success: false, message: string }>}
 */
export async function syncFuelPrices(market) {
  const result = await apiRequest(`${endpoint(market)}/sync`, {
    method: 'POST',
    errorMessage: 'Không cập nhật được giá từ nguồn',
  });
  if (!result.success) return { success: false, message: result.message };
  return { success: true, sync: result.data };
}
