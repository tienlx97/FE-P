import { apiRequest } from '@/shared/api/api-client.js';

import { buildPartyBody } from './suppliers.js';

const GENERIC_LIST_ERROR = 'Không thể tải danh sách khách hàng';
const GENERIC_CREATE_ERROR = 'Không thể thêm khách hàng';
const GENERIC_UPDATE_ERROR = 'Không thể sửa khách hàng';

/**
 * Requires `logistics:contracts:view`.
 * @returns {Promise<{ success: true, customers: import('../types/index.js').Customer[] } | { success: false, message: string }>}
 */
export async function listCustomers() {
  const result = await apiRequest('/api/v1/customers', {
    errorMessage: GENERIC_LIST_ERROR,
  });

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return { success: true, customers: result.data ?? [] };
}

/**
 * Same directory as `listCustomers`, but paginated and narrowed by
 * `conditions` (the advanced-search condition builder) — the backend
 * endpoint behind this one (`POST /api/v1/customers/search`, BE-kt-xnk)
 * is the only Customer endpoint with pagination; `listCustomers`/`GET
 * /api/v1/customers` stays unpaged for its existing callers (name-lookup
 * maps in other lists).
 * @param {{ page?: number, pageSize?: number, conditions?: import('@/shared/components/advanced-filter-builder.jsx').AdvancedFilterCondition[] }} [options]
 * @returns {Promise<{ success: true, customers: import('../types/index.js').Customer[], page: number, pageSize: number, totalCount: number, totalPages: number } | { success: false, message: string }>}
 */
export async function searchCustomers({ page = 1, pageSize = 25, conditions = [] } = {}) {
  const result = await apiRequest('/api/v1/customers/search', {
    method: 'POST',
    errorMessage: GENERIC_LIST_ERROR,
    body: {
      Page: page,
      PageSize: pageSize,
      Conditions: conditions.map((condition) => ({
        Field: condition.field,
        Operator: condition.operator,
        Value: condition.value || null,
        ValueTo: condition.valueTo || null,
        Connector: condition.connector,
      })),
    },
  });

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return {
    success: true,
    customers: result.data?.items ?? [],
    page: result.data?.page ?? page,
    pageSize: result.data?.pageSize ?? pageSize,
    totalCount: result.data?.totalCount ?? 0,
    totalPages: result.data?.totalPages ?? 0,
  };
}

/**
 * Requires `logistics:contracts:manage`.
 * @param {import('../types/index.js').PartyFormValues} values
 * @param {import('../types/index.js').ExtraFieldRow[]} [extraFieldRows]
 * @param {any[]} [bankAccounts]
 * @param {any[]} [deliveryAddresses]
 * @returns {Promise<{ success: true, customer: import('../types/index.js').Customer } | { success: false, message: string }>}
 */
export async function createCustomer(values, extraFieldRows = [], bankAccounts = [], deliveryAddresses = []) {
  const result = await apiRequest('/api/v1/customers', {
    method: 'POST',
    errorMessage: GENERIC_CREATE_ERROR,
    body: buildPartyBody(values, extraFieldRows, bankAccounts, deliveryAddresses),
  });

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return { success: true, customer: result.data };
}

/**
 * Requires `logistics:contracts:manage`. Replaces `ExtraFields` entirely —
 * the backend does not merge, so `extraFieldRows` must be the full desired
 * set, not just the changed rows.
 * @param {string} customerId
 * @param {import('../types/index.js').PartyFormValues} values
 * @param {import('../types/index.js').ExtraFieldRow[]} [extraFieldRows]
 * @param {any[]} [bankAccounts]
 * @param {any[]} [deliveryAddresses]
 * @returns {Promise<{ success: true, customer: import('../types/index.js').Customer } | { success: false, message: string }>}
 */
export async function updateCustomer(customerId, values, extraFieldRows = [], bankAccounts = [], deliveryAddresses = []) {
  const result = await apiRequest(`/api/v1/customers/${customerId}`, {
    method: 'PUT',
    errorMessage: GENERIC_UPDATE_ERROR,
    body: buildPartyBody(values, extraFieldRows, bankAccounts, deliveryAddresses),
  });

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return { success: true, customer: result.data };
}
