import { accountingRequest } from './request.js';

/**
 * Customers of accounting contracts are the shared customer directory
 * (`/api/v1/customers`, the Logistics "Khách hàng" catalog — BE-P
 * accounting-contracts task 1.7). Managed on the Khách hàng pages; this
 * feature only reads them, in the shape its screens use.
 */
const BASE = '/api/v1/customers';

/**
 * @param {{ id: string, companyName: string, address?: string | null,
 *   representativeName?: string | null,
 *   profile?: { code?: string | null, taxCode?: string | null, phone?: string | null,
 *     contactName?: string | null, contactEmail?: string | null, notes?: string | null } | null }} customer
 * @returns {import('../types/index.js').AccountingCustomer}
 */
export function toAccountingCustomer(customer) {
  const profile = customer.profile ?? {};
  return {
    id: customer.id,
    code: profile.code || null,
    name: customer.companyName,
    taxCode: profile.taxCode || null,
    address: customer.address || null,
    phone: profile.phone || null,
    email: profile.contactEmail || null,
    contactPerson: profile.contactName || customer.representativeName || null,
    note: profile.notes || null,
  };
}

/** @returns {Promise<import('../types/index.js').AccountingResult<import('../types/index.js').AccountingCustomer[]>>} */
export async function listCustomers() {
  /** @type {import('../types/index.js').AccountingResult<Parameters<typeof toAccountingCustomer>[0][]>} */
  const result = await accountingRequest(BASE, {
    errorMessage: 'Không thể tải danh sách khách hàng',
  });
  return result.success
    ? {
        success: true,
        data: (result.data ?? [])
          .map(toAccountingCustomer)
          .sort((a, b) => a.name.localeCompare(b.name, 'vi')),
      }
    : result;
}
