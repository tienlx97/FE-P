import { apiRequest } from '@/shared/api/api-client.js';

const GENERIC_LIST_ERROR = 'Không thể tải danh sách phụ lục';
const GENERIC_CREATE_ERROR = 'Không thể thêm phụ lục';
const GENERIC_UPDATE_ERROR = 'Không thể cập nhật phụ lục';
const GENERIC_DELETE_ERROR = 'Không thể xoá phụ lục';

/**
 * Requires `logistics:contracts:view`, scoped to the contract's branch.
 * @param {string} contractId
 * @returns {Promise<{ success: true, annexes: import('../types/index.js').ContractAnnex[] } | { success: false, message: string }>}
 */
export async function listContractAnnexes(contractId) {
  const result = await apiRequest(`/api/v1/contracts/${contractId}/annexes`, {
    errorMessage: GENERIC_LIST_ERROR,
  });

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return { success: true, annexes: result.data ?? [] };
}

/**
 * Requires `logistics:contracts:manage`, scoped to the contract's branch.
 * `annexNumber`/`annexCode` are assigned by the backend, never sent here.
 * @param {string} contractId
 * @param {import('../types/index.js').ContractAnnexFormValues} values
 * @returns {Promise<{ success: true, annex: import('../types/index.js').ContractAnnex } | { success: false, message: string }>}
 */
export async function createContractAnnex(contractId, values) {
  const result = await apiRequest(`/api/v1/contracts/${contractId}/annexes`, {
    method: 'POST',
    errorMessage: GENERIC_CREATE_ERROR,
    body: {
      Type: values.type,
      Amount: values.amount,
      SignedDate: values.signedDate,
      BuyerSigned: values.buyerSigned,
      SellerSigned: values.sellerSigned,
      Note: values.note || null,
    },
  });

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return { success: true, annex: result.data };
}

/**
 * Requires `logistics:contracts:manage`, scoped to the contract's branch.
 * `annexNumber` is immutable — not part of the request body.
 * @param {string} contractId
 * @param {string} annexId
 * @param {import('../types/index.js').ContractAnnexFormValues} values
 * @returns {Promise<{ success: true, annex: import('../types/index.js').ContractAnnex } | { success: false, message: string }>}
 */
export async function updateContractAnnex(contractId, annexId, values) {
  const result = await apiRequest(
    `/api/v1/contracts/${contractId}/annexes/${annexId}`,
    {
      method: 'PUT',
      errorMessage: GENERIC_UPDATE_ERROR,
      body: {
        Type: values.type,
        Amount: values.amount,
        SignedDate: values.signedDate,
        BuyerSigned: values.buyerSigned,
        SellerSigned: values.sellerSigned,
        Note: values.note || null,
      },
    },
  );

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return { success: true, annex: result.data };
}

/**
 * Requires `logistics:contracts:manage`, scoped to the contract's branch.
 * @param {string} contractId
 * @param {string} annexId
 * @returns {Promise<{ success: true } | { success: false, message: string }>}
 */
export async function deleteContractAnnex(contractId, annexId) {
  const result = await apiRequest(
    `/api/v1/contracts/${contractId}/annexes/${annexId}`,
    { method: 'DELETE', errorMessage: GENERIC_DELETE_ERROR },
  );

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return { success: true };
}
