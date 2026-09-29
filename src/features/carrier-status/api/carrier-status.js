import { apiRequest } from '@/shared/api/api-client.js';

/**
 * `logistics:contracts:view`. Every carrier's schedule / tracking API state.
 * @returns {Promise<{ success: true, status: import('../types/index.js').CarrierStatus } | { success: false, message: string }>}
 */
export async function getCarrierStatus() {
  const result = await apiRequest('/api/v1/carrier-status', {
    errorMessage: 'Không tải được trạng thái API hãng tàu',
  });
  return result.success ? { success: true, status: result.data } : { success: false, message: result.message };
}

/**
 * "Kiểm tra ngay": the BE probes the carriers now (at most once per 2
 * minutes) and answers with the new status.
 * @returns {Promise<{ success: true, status: import('../types/index.js').CarrierStatus } | { success: false, message: string }>}
 */
export async function checkCarrierStatus() {
  const result = await apiRequest('/api/v1/carrier-status/check', {
    method: 'POST',
    errorMessage: 'Không kiểm tra được API hãng tàu',
  });
  return result.success ? { success: true, status: result.data } : { success: false, message: result.message };
}
