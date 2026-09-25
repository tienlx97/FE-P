import { apiRequest } from '@/shared/api/api-client.js';

const GENERIC_LIST_ERROR = 'Không thể tải danh sách cảng';
const GENERIC_CREATE_ERROR = 'Không thể tạo cảng';

/**
 * Requires `logistics:contracts:view`. Ports of one country, sorted by
 * name (BE-kt-xnk `port-catalog-unlocode`). Without `countryId` the BE
 * returns every UN/LOCODE seaport (~17.5k) — callers always pass one; the
 * list page uses `searchPorts` instead.
 * @param {{ countryId?: string }} [options]
 * @returns {Promise<{ success: true, ports: import('../types/index.js').Port[] } | { success: false, message: string }>}
 */
export async function listPorts({ countryId } = {}) {
  const query = countryId
    ? `?${new URLSearchParams({ countryId }).toString()}`
    : '';
  const result = await apiRequest(`/api/v1/ports${query}`, {
    errorMessage: GENERIC_LIST_ERROR,
  });

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return { success: true, ports: result.data ?? [] };
}

/**
 * Paged, filterable port search (sorted by UN/LOCODE). Filter fields:
 * `code`, `name`, `fullName`, `subdivision` (string), `countryId` (guid).
 * @param {{ page?: number, pageSize?: number, conditions?: import('@/shared/components/advanced-filter-builder.jsx').AdvancedFilterCondition[] }} [options]
 * @returns {Promise<{ success: true, ports: import('../types/index.js').Port[], totalCount: number, totalPages: number } | { success: false, message: string }>}
 */
export async function searchPorts({
  page = 1,
  pageSize = 25,
  conditions = [],
} = {}) {
  const result = await apiRequest('/api/v1/ports/search', {
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
    ports: result.data?.items ?? [],
    totalCount: result.data?.totalCount ?? 0,
    totalPages: result.data?.totalPages ?? 0,
  };
}

/**
 * Requires `logistics:contracts:manage`. 409 when the UN/LOCODE exists.
 * @param {import('../types/index.js').PortFormValues} values
 * @returns {Promise<{ success: true, port: import('../types/index.js').Port } | { success: false, message: string }>}
 */
export async function createPort(values) {
  const result = await apiRequest('/api/v1/ports', {
    method: 'POST',
    errorMessage: GENERIC_CREATE_ERROR,
    body: {
      CountryId: values.countryId,
      Code: values.code,
      Name: values.name,
      FullName: values.fullName || null,
    },
  });

  if (!result.success) {
    return {
      success: false,
      message:
        result.status === 409 ? 'Mã cảng UN/LOCODE này đã có.' : result.message,
    };
  }

  return { success: true, port: result.data };
}
