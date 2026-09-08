import { apiRequest } from '@/shared/api/api-client.js';

const GENERIC_LIST_ERROR = 'Không thể tải danh sách bên bán';
const GENERIC_CREATE_ERROR = 'Không thể thêm bên bán';
const GENERIC_DELETE_ERROR = 'Không thể xoá bên bán';

/**
 * Requires `logistics:contracts:view`.
 * @returns {Promise<{ success: true, sellers: import('../types/index.js').Seller[] } | { success: false, message: string }>}
 */
export async function listSellers() {
  const result = await apiRequest('/api/v1/sellers', {
    errorMessage: GENERIC_LIST_ERROR,
  });

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return { success: true, sellers: result.data ?? [] };
}

/**
 * Requires `logistics:contracts:manage`.
 * @param {import('../types/index.js').SellerFormValues} values
 * @param {import('../types/index.js').ExtraFieldRow[]} [extraFieldRows]
 * @returns {Promise<{ success: true, seller: import('../types/index.js').Seller } | { success: false, message: string }>}
 */
export async function createSeller(values, extraFieldRows = []) {
  const result = await apiRequest('/api/v1/sellers', {
    method: 'POST',
    errorMessage: GENERIC_CREATE_ERROR,
    body: {
      CompanyName: values.companyName,
      RepresentativeName: values.representativeName || null,
      RepresentativeTitle: values.representativeTitle || null,
      Address: values.address || null,
      ExtraFields: extraFieldRows
        .filter((row) => row.key.trim())
        .map((row) => ({ Key: row.key, Value: row.value })),
    },
  });

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return { success: true, seller: result.data };
}

/**
 * Requires `logistics:contracts:manage`. Hard-deletes the seller from the
 * catalog — safe for existing contracts, which snapshot a seller's fields
 * into `ContractSeller` at creation time rather than referencing it live
 * (see `docs/api/Sellers.md`, BE-kt-xnk).
 * @param {string} sellerId
 * @returns {Promise<{ success: true } | { success: false, message: string }>}
 */
export async function deleteSeller(sellerId) {
  const result = await apiRequest(`/api/v1/sellers/${sellerId}`, {
    method: 'DELETE',
    errorMessage: GENERIC_DELETE_ERROR,
  });

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return { success: true };
}
