import { apiRequest } from '@/shared/api/api-client.js';

/**
 * Every visible shipment with alerts (free time, cut-offs, delays), most
 * dangerous first (BE-kt-xnk `add-shipment-schedule-free-time`). Requires
 * `logistics:contracts:view`.
 * @returns {Promise<{ success: true, rows: import('../types/index.js').ShipmentAlertsRow[] } | { success: false, message: string }>}
 */
export async function listShipmentAlerts() {
  const result = await apiRequest('/api/v1/shipments/alerts', {
    errorMessage: 'Không thể tải cảnh báo lô hàng',
  });

  return result.success
    ? { success: true, rows: result.data ?? [] }
    : { success: false, message: result.message };
}
