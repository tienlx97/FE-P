import { apiRequest } from '@/shared/api/api-client.js';

const GENERIC_LIST_ERROR = 'Không thể tải danh sách gợi ý khoản chi phí';
const GENERIC_CREATE_ERROR = 'Không thể tạo gợi ý khoản chi phí';

/**
 * Requires `logistics:contracts:view`. Autocomplete-suggestion catalog only
 * — `ShipmentCost.Name` stays free text, never constrained to a template
 * (see `docs/api/ShipmentCostItemTemplates.md`, BE-kt-xnk).
 * @param {{ costCategoryId?: string }} [options] Filter to templates of one
 *   cost category; omit to list templates of every category.
 * @returns {Promise<{ success: true, costItemTemplates: import('../types/index.js').ShipmentCostItemTemplate[] } | { success: false, message: string }>}
 */
export async function listShipmentCostItemTemplates({ costCategoryId } = {}) {
  const query = costCategoryId
    ? `?${new URLSearchParams({ costCategoryId }).toString()}`
    : '';
  const result = await apiRequest(
    `/api/v1/shipment-cost-item-templates${query}`,
    {
      errorMessage: GENERIC_LIST_ERROR,
    },
  );

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return { success: true, costItemTemplates: result.data ?? [] };
}

/**
 * Requires `logistics:contracts:manage`.
 * @param {import('../types/index.js').ShipmentCostItemTemplateFormValues} values
 * @returns {Promise<{ success: true, costItemTemplate: import('../types/index.js').ShipmentCostItemTemplate } | { success: false, message: string }>}
 */
export async function createShipmentCostItemTemplate(values) {
  const result = await apiRequest('/api/v1/shipment-cost-item-templates', {
    method: 'POST',
    errorMessage: GENERIC_CREATE_ERROR,
    body: {
      Name: values.name,
      CostCategoryId: values.costCategoryId,
    },
  });

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return { success: true, costItemTemplate: result.data };
}
