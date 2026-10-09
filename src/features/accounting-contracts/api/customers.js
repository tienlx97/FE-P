import { blankToNull } from '../config/catalog-schemas.js';
import { accountingRequest } from './request.js';

const BASE = '/api/v1/accounting/customers';

/** @returns {Promise<import('../types/index.js').AccountingResult<import('../types/index.js').AccountingCustomer[]>>} */
export async function listCustomers() {
  const result = await accountingRequest(BASE, {
    errorMessage: 'Không thể tải danh sách khách hàng',
  });
  return result.success
    ? {
        success: true,
        data: /** @type {import('../types/index.js').AccountingCustomer[]} */ (
          result.data ?? []
        ),
      }
    : result;
}

/** @param {import('../types/index.js').AccountingCustomerFormValues} values */
export function customerBody(values) {
  return {
    name: values.name.trim(),
    taxCode: blankToNull(values.taxCode),
    address: blankToNull(values.address),
    phone: blankToNull(values.phone),
    email: blankToNull(values.email),
    contactPerson: blankToNull(values.contactPerson),
    note: blankToNull(values.note),
  };
}

/**
 * @param {import('../types/index.js').AccountingCustomerFormValues} values
 * @param {string} [id] Update when given, else create.
 * @returns {Promise<import('../types/index.js').AccountingResult<import('../types/index.js').AccountingCustomer>>}
 */
export function saveCustomer(values, id) {
  return accountingRequest(id ? `${BASE}/${id}` : BASE, {
    method: id ? 'PUT' : 'POST',
    body: customerBody(values),
    errorMessage: 'Không thể lưu khách hàng',
  });
}

/**
 * @param {string} id
 * @returns {Promise<import('../types/index.js').AccountingResult<null>>}
 */
export function deleteCustomer(id) {
  return accountingRequest(`${BASE}/${id}`, {
    method: 'DELETE',
    errorMessage: 'Không thể xoá khách hàng',
  });
}
