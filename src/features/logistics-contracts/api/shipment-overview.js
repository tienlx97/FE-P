import { apiRequest } from '@/shared/api/api-client.js';

/**
 * Every visible shipment still in progress, for the `/logistics` schedule
 * (BE-kt-xnk `add-shipment-overview`). Requires `logistics:contracts:view`.
 * @returns {Promise<{ success: true, shipments: import('../types/index.js').ShipmentOverview[] } | { success: false, message: string }>}
 */
export async function listShipmentOverview() {
  const result = await apiRequest('/api/v1/shipments/overview', {
    errorMessage: 'Không thể tải các lô hàng đang làm',
  });

  return result.success
    ? {
        success: true,
        shipments: /** @type {import('../types/index.js').ShipmentOverview[]} */ (result.data),
      }
    : { success: false, message: result.message };
}
