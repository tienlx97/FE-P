import { apiRequest } from '@/shared/api/api-client.js';

const GENERIC_LIST_ERROR = 'Không thể tải danh sách nước';
const GENERIC_CREATE_ERROR = 'Không thể tạo nước';

/**
 * Requires `logistics:contracts:view`.
 * @returns {Promise<{ success: true, countries: import('../types/index.js').Country[] } | { success: false, message: string }>}
 */
export async function listCountries() {
  const result = await apiRequest('/api/v1/countries', {
    errorMessage: GENERIC_LIST_ERROR,
  });

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return { success: true, countries: result.data ?? [] };
}

/**
 * Requires `logistics:contracts:manage`.
 * @param {import('../types/index.js').CountryFormValues} values
 * @returns {Promise<{ success: true, country: import('../types/index.js').Country } | { success: false, message: string }>}
 */
export async function createCountry(values) {
  const result = await apiRequest('/api/v1/countries', {
    method: 'POST',
    errorMessage: GENERIC_CREATE_ERROR,
    body: {
      Name: values.name,
      Code: values.code || null,
    },
  });

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return { success: true, country: result.data };
}
