import { blankToNull } from '../config/catalog-schemas.js';
import { accountingRequest } from './request.js';

const BASE = '/api/v1/accounting/sources';

/** @returns {Promise<import('../types/index.js').AccountingResult<import('../types/index.js').AccountingSource[]>>} */
export async function listSources() {
  const result = await accountingRequest(BASE, {
    errorMessage: 'Không thể tải danh sách nguồn',
  });
  return result.success
    ? {
        success: true,
        data: /** @type {import('../types/index.js').AccountingSource[]} */ (
          result.data ?? []
        ),
      }
    : result;
}

/** @param {import('../types/index.js').AccountingSourceFormValues} values */
function toBody(values) {
  return { name: values.name.trim(), note: blankToNull(values.note) };
}

/**
 * @param {import('../types/index.js').AccountingSourceFormValues} values
 * @param {string} [id] Update when given, else create.
 * @returns {Promise<import('../types/index.js').AccountingResult<import('../types/index.js').AccountingSource>>}
 */
export function saveSource(values, id) {
  return accountingRequest(id ? `${BASE}/${id}` : BASE, {
    method: id ? 'PUT' : 'POST',
    body: toBody(values),
    errorMessage: 'Không thể lưu nguồn',
  });
}

/**
 * @param {string} id
 * @returns {Promise<import('../types/index.js').AccountingResult<null>>}
 */
export function deleteSource(id) {
  return accountingRequest(`${BASE}/${id}`, {
    method: 'DELETE',
    errorMessage: 'Không thể xoá nguồn',
  });
}
