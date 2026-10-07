import { apiRequest } from '@/shared/api/api-client.js';

/**
 * Cost lines a supplier paid on behalf ("chi hộ") across shipments, with
 * totals over the period (BE-P `docs/api/SupplierOnBehalfCosts.md`).
 * @param {string} supplierId
 * @param {{ from?: string, to?: string, status?: import('../types/index.js').OnBehalfCostStatus }} [filters]
 * @returns {Promise<{ success: true, costs: import('../types/index.js').SupplierOnBehalfCosts } | { success: false, message: string }>}
 */
export async function listSupplierOnBehalfCosts(supplierId, filters = {}) {
  const params = new URLSearchParams();
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  if (filters.status && filters.status !== 'all') {
    params.set('status', filters.status);
  }
  const query = params.toString();
  const result = await apiRequest(
    `/api/v1/suppliers/${supplierId}/on-behalf-costs${query ? `?${query}` : ''}`,
    { errorMessage: 'Không thể tải phí chi hộ của nhà cung cấp' },
  );
  return result.success
    ? { success: true, costs: result.data }
    : { success: false, message: result.message };
}

/**
 * Marks the lines reimbursed on `reimbursedOn` (ISO date), or clears it
 * with null. All or nothing on the server.
 * @param {string} supplierId
 * @param {{ costIds: string[], reimbursedOn: string | null, reference?: string }} values
 * @returns {Promise<{ success: true } | { success: false, message: string }>}
 */
export async function markOnBehalfCostsReimbursed(supplierId, values) {
  const result = await apiRequest(
    `/api/v1/suppliers/${supplierId}/on-behalf-costs/reimbursement`,
    {
      method: 'POST',
      errorMessage: 'Không thể cập nhật hoàn trả. Hãy tải lại rồi thử lại.',
      body: {
        CostIds: values.costIds,
        ReimbursedOn: values.reimbursedOn,
        Reference: values.reference?.trim() || null,
      },
    },
  );
  return result.success
    ? { success: true }
    : { success: false, message: result.message };
}

/**
 * Paid-on-behalf totals per supplier (only suppliers that have any).
 * @returns {Promise<{ success: true, totals: import('../types/index.js').SupplierOnBehalfTotal[] } | { success: false, message: string }>}
 */
export async function listOnBehalfCostTotals() {
  const result = await apiRequest('/api/v1/suppliers/on-behalf-totals', {
    errorMessage: 'Không thể tải tổng phí chi hộ',
  });
  return result.success
    ? { success: true, totals: result.data ?? [] }
    : { success: false, message: result.message };
}
