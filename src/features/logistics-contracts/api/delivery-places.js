import { apiRequest } from '@/shared/api/api-client.js';

const GENERIC_LIST_ERROR = 'Không thể tải danh sách nơi giao hàng';
const GENERIC_CREATE_ERROR = 'Không thể tạo nơi giao hàng';

/**
 * Requires `logistics:contracts:view`.
 * @param {{ countryId?: string }} [options] Filter to one country's delivery places;
 *   omit to list every country's.
 * @returns {Promise<{ success: true, deliveryPlaces: import('../types/index.js').DeliveryPlace[] } | { success: false, message: string }>}
 */
export async function listDeliveryPlaces({ countryId } = {}) {
  const query = countryId
    ? `?${new URLSearchParams({ countryId }).toString()}`
    : '';
  const result = await apiRequest(`/api/v1/delivery-places${query}`, {
    errorMessage: GENERIC_LIST_ERROR,
  });

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return { success: true, deliveryPlaces: result.data ?? [] };
}

/**
 * Requires `logistics:contracts:manage`.
 * @param {import('../types/index.js').DeliveryPlaceFormValues} values
 * @returns {Promise<{ success: true, deliveryPlace: import('../types/index.js').DeliveryPlace } | { success: false, message: string }>}
 */
export async function createDeliveryPlace(values) {
  const result = await apiRequest('/api/v1/delivery-places', {
    method: 'POST',
    errorMessage: GENERIC_CREATE_ERROR,
    body: {
      Name: values.name,
      CountryId: values.countryId,
    },
  });

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return { success: true, deliveryPlace: result.data };
}
