import { apiRequest } from '@/shared/api/api-client.js';

import { blankToNull } from '../config/catalog-schemas.js';
import { accountingRequest } from './request.js';

const BASE = '/api/v1/accounting/contracts';

/** @typedef {import('../types/index.js').AccountingContractDetail} Detail */

/**
 * @param {{ page: number, pageSize: number, sort?: { field: string, direction: 'Ascending' | 'Descending' } | null,
 *   conditions?: { field: string, operator: string, value: string }[] }} query
 * @returns {Promise<import('../types/index.js').AccountingResult<{ items: import('../types/index.js').AccountingContractSummary[], totalCount: number, totalPages: number }>>}
 */
export function searchContracts({ page, pageSize, sort, conditions = [] }) {
  return accountingRequest(`${BASE}/search`, {
    method: 'POST',
    body: {
      page,
      pageSize,
      conditions: conditions.map((condition) => ({
        ...condition,
        connector: 'And',
      })),
      sort: sort ?? null,
    },
    errorMessage: 'Không thể tải danh sách hợp đồng',
  });
}

/**
 * @param {string} id
 * @returns {Promise<import('../types/index.js').AccountingResult<Detail>>}
 */
export function getContract(id) {
  return accountingRequest(`${BASE}/${id}`, {
    errorMessage: 'Không thể tải hợp đồng',
  });
}

/** @param {import('../types/index.js').AccountingContractFormValues} values */
export function contractBody(values) {
  return {
    contractNumber: values.contractNumber.trim(),
    signedDate: values.signedDate,
    projectCode: values.projectCode.trim(),
    projectName: values.projectName.trim(),
    sourceId: values.sourceId || null,
    customerId: values.customerId,
    valueBeforeTax: values.valueBeforeTax,
    taxRatePercent: values.taxRatePercent,
    paymentDueDate: values.paymentDueDate || null,
    note: blankToNull(values.note),
  };
}

/**
 * @param {import('../types/index.js').AccountingContractFormValues} values
 * @returns {Promise<import('../types/index.js').AccountingResult<Detail>>}
 */
export function createContract(values) {
  return accountingRequest(BASE, {
    method: 'POST',
    body: { companyId: values.companyId, ...contractBody(values) },
    errorMessage: 'Không thể tạo hợp đồng',
  });
}

/**
 * @param {string} id
 * @param {number} version
 * @param {import('../types/index.js').AccountingContractFormValues} values
 * @returns {Promise<import('../types/index.js').AccountingResult<Detail>>}
 */
export function updateContract(id, version, values) {
  return accountingRequest(`${BASE}/${id}`, {
    method: 'PUT',
    body: { version, ...contractBody(values) },
    errorMessage: 'Không thể lưu hợp đồng',
  });
}

/**
 * @param {string} id
 * @returns {Promise<import('../types/index.js').AccountingResult<null>>}
 */
export function deleteContract(id) {
  return accountingRequest(`${BASE}/${id}`, {
    method: 'DELETE',
    errorMessage: 'Không thể xoá hợp đồng',
  });
}

/**
 * Duplicate check for the form ("kiểm tra trùng").
 * @param {{ companyId: string, contractNumber: string, projectCode: string, excludeContractId?: string }} query
 * @returns {Promise<import('../types/index.js').AccountingResult<{ contractNumberExists: boolean, projectCodeExists: boolean, projectCodeIsLogisticsContractNumber: boolean }>>}
 */
export function checkContractCodes({
  companyId,
  contractNumber,
  projectCode,
  excludeContractId,
}) {
  const params = new URLSearchParams({
    companyId,
    contractNumber: contractNumber.trim(),
    projectCode: projectCode.trim(),
  });
  if (excludeContractId) params.set('excludeContractId', excludeContractId);
  return accountingRequest(`${BASE}/check-codes?${params}`, {
    errorMessage: 'Không thể kiểm tra trùng',
  });
}

/** @returns {Promise<import('../types/index.js').Company[]>} */
export async function listCompanies() {
  /** @type {import('@/shared/api/api-client.js').ApiResult<import('../types/index.js').Company[]>} */
  const result = await apiRequest('/api/v1/companies');
  return result.success ? (result.data ?? []) : [];
}
