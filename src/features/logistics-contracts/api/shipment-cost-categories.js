import { apiRequest } from '@/shared/api/api-client.js';

const GENERIC_LIST_ERROR = 'Không thể tải danh sách nhóm chi phí';

/**
 * Requires `logistics:contracts:view`. The fixed LOG-01 … LOG-08 groups,
 * ordered by code (`docs/api/ShipmentCostCategories.md`, BE-kt-xnk).
 * @returns {Promise<{ success: true, costCategories: import('../types/index.js').ShipmentCostCategory[] } | { success: false, message: string }>}
 */
export async function listShipmentCostCategories() {
  const result = await apiRequest('/api/v1/shipment-cost-categories', {
    errorMessage: GENERIC_LIST_ERROR,
  });

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return { success: true, costCategories: result.data ?? [] };
}
