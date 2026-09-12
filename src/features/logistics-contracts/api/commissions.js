import { apiRequest } from '@/shared/api/api-client.js';

const GENERIC_LIST_ERROR = 'Không thể tải danh sách Commission';
const GENERIC_GET_ERROR = 'Không thể tải Commission';
const GENERIC_CREATE_ERROR = 'Không thể tạo Commission';
const GENERIC_UPDATE_ERROR = 'Không thể cập nhật Commission';
const GENERIC_EXISTS_ERROR = 'Không thể kiểm tra trùng mã Commission';

/**
 * System-wide list across every contract (unlike the other functions here,
 * not scoped under `/contracts/{contractId}`) — non-Admin callers only see
 * commissions whose parent contract's `CompanyId` they have
 * `logistics:contracts:view` on; Admin sees all (see
 * `docs/api/Commissions.md`, BE-kt-xnk).
 * @param {{ page?: number, pageSize?: number }} [options]
 * @returns {Promise<{ success: true, commissions: import('../types/index.js').Commission[], page: number, pageSize: number, totalCount: number, totalPages: number } | { success: false, message: string }>}
 */
export async function listCommissions({ page = 1, pageSize = 25 } = {}) {
  const result = await apiRequest(
    `/api/v1/commissions?page=${page}&pageSize=${pageSize}`,
    { errorMessage: GENERIC_LIST_ERROR },
  );

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return {
    success: true,
    commissions: result.data?.items ?? [],
    page: result.data?.page ?? page,
    pageSize: result.data?.pageSize ?? pageSize,
    totalCount: result.data?.totalCount ?? 0,
    totalPages: result.data?.totalPages ?? 0,
  };
}

/**
 * Same as `listCommissions`, additionally narrowed by `conditions` (the
 * advanced-search condition builder). An empty `conditions` array behaves
 * identically to `listCommissions` — filtering happens server-side (`POST
 * /api/v1/commissions/search`, BE-kt-xnk).
 *
 * Unlike `listCommissions`, the response is `{ page: {...}, totals: [...] }`
 * rather than the flat paging envelope — `totals` sums `value` per currency
 * (the parent contract's, since a Commission carries none of its own)
 * across every matching commission (not just this page), backing the
 * list's per-column totals row.
 * @param {{ page?: number, pageSize?: number, conditions?: import('@/shared/components/advanced-filter-builder.jsx').AdvancedFilterCondition[] }} [options]
 * @returns {Promise<{ success: true, commissions: import('../types/index.js').Commission[], page: number, pageSize: number, totalCount: number, totalPages: number, totals: { currency: string, value: number }[] } | { success: false, message: string }>}
 */
export async function searchCommissions({ page = 1, pageSize = 25, conditions = [] } = {}) {
  const result = await apiRequest('/api/v1/commissions/search', {
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
    commissions: result.data?.page?.items ?? [],
    page: result.data?.page?.page ?? page,
    pageSize: result.data?.page?.pageSize ?? pageSize,
    totalCount: result.data?.page?.totalCount ?? 0,
    totalPages: result.data?.page?.totalPages ?? 0,
    totals: result.data?.totals ?? [],
  };
}

/**
 * At most one per contract. A `404` means the contract has none yet —
 * not an error the UI should show, so it is folded into `exists: false`
 * rather than `success: false`.
 * @param {string} contractId
 * @returns {Promise<{ success: true, exists: true, commission: import('../types/index.js').Commission } | { success: true, exists: false } | { success: false, message: string }>}
 */
export async function getCommission(contractId) {
  const result = await apiRequest(`/api/v1/contracts/${contractId}/commission`, {
    errorMessage: GENERIC_GET_ERROR,
  });

  if (!result.success) {
    if (result.status === 404) {
      return { success: true, exists: false };
    }
    return { success: false, message: result.message };
  }

  return { success: true, exists: true, commission: result.data };
}

/**
 * @param {string} contractId
 * @param {import('../types/index.js').CommissionFormValues} values
 * @param {{ paymentRatioPercent: number, paymentCondition: string }[]} paymentTerms
 * @param {{ paymentDate: string, amount: number, note: string }[]} [paymentHistory]
 * @returns {Promise<{ success: true, commission: import('../types/index.js').Commission } | { success: false, message: string }>}
 */
export async function createCommission(
  contractId,
  values,
  paymentTerms,
  paymentHistory = [],
) {
  const result = await apiRequest(`/api/v1/contracts/${contractId}/commission`, {
    method: 'POST',
    errorMessage: GENERIC_CREATE_ERROR,
    body: {
      Code: values.code,
      SignedDate: values.signedDate,
      PartyCustomerId: values.partyCustomerId,
      Value: values.value,
      SellerSigned: values.sellerSigned,
      PartySigned: values.partySigned,
      PaymentTerms: paymentTerms.map((term) => ({
        PaymentRatioPercent: term.paymentRatioPercent,
        PaymentCondition: term.paymentCondition,
      })),
      PaymentHistory: paymentHistory.map((payment) => ({
        PaymentDate: payment.paymentDate,
        Amount: payment.amount,
        Note: payment.note || null,
      })),
    },
  });

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return { success: true, commission: result.data };
}

/**
 * @param {string} contractId
 * @param {import('../types/index.js').CommissionFormValues} values
 * @param {{ paymentRatioPercent: number, paymentCondition: string }[]} paymentTerms
 * @param {{ paymentDate: string, amount: number, note: string }[]} [paymentHistory]
 * @returns {Promise<{ success: true, commission: import('../types/index.js').Commission } | { success: false, message: string }>}
 */
export async function updateCommission(
  contractId,
  values,
  paymentTerms,
  paymentHistory = [],
) {
  const result = await apiRequest(`/api/v1/contracts/${contractId}/commission`, {
    method: 'PUT',
    errorMessage: GENERIC_UPDATE_ERROR,
    body: {
      Code: values.code,
      SignedDate: values.signedDate,
      PartyCustomerId: values.partyCustomerId,
      Value: values.value,
      SellerSigned: values.sellerSigned,
      PartySigned: values.partySigned,
      PaymentTerms: paymentTerms.map((term) => ({
        PaymentRatioPercent: term.paymentRatioPercent,
        PaymentCondition: term.paymentCondition,
      })),
      PaymentHistory: paymentHistory.map((payment) => ({
        PaymentDate: payment.paymentDate,
        Amount: payment.amount,
        Note: payment.note || null,
      })),
    },
  });

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return { success: true, commission: result.data };
}

/**
 * Real-time duplicate check for the "Mã" field — backs the Commission
 * form's live validation, separate from the `409 Conflict` the backend
 * still returns on submit (this is a UX aid, not the source of truth).
 * Not scoped under a contract — a code must be unique across every
 * commission, not just within one contract's own (at most one) commission.
 * `excludeCommissionId` lets the edit form check "does any *other*
 * commission use this code" without the commission colliding with its own
 * current code (see `GET /commissions/exists`, `docs/api/Commissions.md`,
 * BE-kt-xnk).
 * @param {{ code: string, excludeCommissionId?: string | null }} params
 * @returns {Promise<{ success: true, exists: boolean } | { success: false, message: string, conflict: boolean }>}
 */
export async function checkCommissionCodeExists({ code, excludeCommissionId }) {
  const params = new URLSearchParams({ code });
  if (excludeCommissionId) {
    params.set('excludeCommissionId', excludeCommissionId);
  }

  const result = await apiRequest(
    `/api/v1/commissions/exists?${params.toString()}`,
    { errorMessage: GENERIC_EXISTS_ERROR },
  );

  if (!result.success) {
    return { success: false, message: result.message, conflict: result.status === 409 };
  }

  return { success: true, exists: Boolean(result.data?.exists) };
}
