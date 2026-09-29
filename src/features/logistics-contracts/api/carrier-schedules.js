import { apiRequest } from '@/shared/api/api-client.js';

/**
 * Every carrier with its tracking and vessel schedule adapters (BE-kt-xnk
 * `add-carrier-tracking` / `add-carrier-schedules`). Requires
 * `logistics:contracts:view`.
 * @returns {Promise<{ success: true, carriers: import('../types/index.js').CarrierTrackingAdapter[] } | { success: false, message: string }>}
 */
export async function listCarrierAdapters() {
  const result = await apiRequest('/api/v1/shipments/tracking/carriers', {
    errorMessage: 'Không thể tải danh sách hãng tàu',
  });

  return result.success
    ? { success: true, carriers: result.data ?? [] }
    : { success: false, message: result.message };
}

/**
 * One carrier's vessel schedule POL → POD for sailings departing
 * `from`–`to` (`yyyy-MM-dd`, at most 62 days). Ports: UN/LOCODE or catalog
 * name. A carrier that cannot answer is still a success with `status` /
 * `error` set. Requires `logistics:contracts:view`.
 * @param {{ carrier: string, pol: string, pod: string, from: string, to: string }} params
 * @returns {Promise<{ success: true, search: import('../types/index.js').CarrierScheduleSearch } | { success: false, message: string }>}
 */
export async function searchCarrierSchedules({ carrier, pol, pod, from, to }) {
  return fetchSchedules('GET', { carrier, pol, pod, from, to });
}

/**
 * "Tải lại từ hãng": the same search, asking the carrier again instead of
 * its cached answer (BE Redis, up to 30 minutes old) — the new answer
 * replaces the cached one for everyone. As slow as a first search.
 * @param {{ carrier: string, pol: string, pod: string, from: string, to: string }} params
 * @returns {Promise<{ success: true, search: import('../types/index.js').CarrierScheduleSearch } | { success: false, message: string }>}
 */
export async function refreshCarrierSchedules({ carrier, pol, pod, from, to }) {
  return fetchSchedules('POST', { carrier, pol, pod, from, to });
}

/**
 * @param {'GET' | 'POST'} method
 * @param {{ carrier: string, pol: string, pod: string, from: string, to: string }} params
 * @returns {Promise<{ success: true, search: import('../types/index.js').CarrierScheduleSearch } | { success: false, message: string }>}
 */
async function fetchSchedules(method, { carrier, pol, pod, from, to }) {
  const query = new URLSearchParams({ carrier, pol, pod, from, to });
  const path = method === 'POST' ? '/api/v1/shipments/schedules/refresh' : '/api/v1/shipments/schedules';
  const result = await apiRequest(`${path}?${query.toString()}`, {
    method,
    errorMessage: 'Không thể tải lịch tàu',
  });

  return result.success
    ? {
        success: true,
        search: /** @type {import('../types/index.js').CarrierScheduleSearch} */ (result.data),
      }
    : { success: false, message: result.message };
}
