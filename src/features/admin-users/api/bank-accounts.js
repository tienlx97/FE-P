import { apiRequest } from '@/shared/api/api-client.js';
import { listVietnamBanks as listSharedVietnamBanks } from '@/shared/api/vietnam-banks.js';

const GENERIC_ERROR_MESSAGE = 'Không thể lưu tài khoản ngân hàng';
const GENERIC_LIST_ERROR_MESSAGE = 'Không thể tải danh sách tài khoản ngân hàng';

/**
 * Populates the bank Selector in the bank accounts grid. Requires a signed-in
 * caller (authentication only, no `Admin` role) — this catalogue used to be an
 * anonymous endpoint, see the backend's
 * `openspec/changes/fix-401-vs-403-authentication/`.
 * @returns {Promise<import('../types/index.js').VietnamBank[]>}
 */
export async function listVietnamBanks() {
  return /** @type {Promise<import('../types/index.js').VietnamBank[]>} */ (
    listSharedVietnamBanks()
  );
}

/**
 * Admin-only endpoint.
 * @param {string} userId
 * @returns {Promise<import('../types/index.js').BankAccountListResult>}
 */
export async function adminListBankAccounts(userId) {
  const result = await apiRequest(
    `/api/v1/users/${userId}/bank-accounts`,
    { errorMessage: GENERIC_LIST_ERROR_MESSAGE },
  );

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return { success: true, bankAccounts: result.data ?? [] };
}

/**
 * Admin-only endpoint.
 * @param {string} userId
 * @param {import('../types/index.js').BankAccountRow} row
 * @returns {Promise<import('../types/index.js').BankAccountResult>}
 */
export async function adminAddBankAccount(userId, row) {
  return sendBankAccountRequest(
    `/api/v1/users/${userId}/bank-accounts`,
    'POST',
    {
      VietnamBankId: row.vietnamBankId,
      AccountNumber: row.accountNumber,
      Branch: row.branch || null,
      IsPrimary: row.isPrimary,
    },
  );
}

/**
 * Admin-only endpoint.
 * @param {string} userId
 * @param {string} bankAccountId
 * @param {import('../types/index.js').BankAccountRow} row
 * @returns {Promise<import('../types/index.js').BankAccountResult>}
 */
export async function adminUpdateBankAccount(userId, bankAccountId, row) {
  return sendBankAccountRequest(
    `/api/v1/users/${userId}/bank-accounts/${bankAccountId}`,
    'PUT',
    {
      VietnamBankId: row.vietnamBankId,
      AccountNumber: row.accountNumber,
      Branch: row.branch || null,
    },
  );
}

/**
 * Admin-only endpoint.
 * @param {string} userId
 * @param {string} bankAccountId
 * @returns {Promise<import('../types/index.js').BankAccountResult>}
 */
export async function adminSetPrimaryBankAccount(userId, bankAccountId) {
  return sendBankAccountRequest(
    `/api/v1/users/${userId}/bank-accounts/${bankAccountId}/primary`,
    'PUT',
    undefined,
  );
}

/**
 * Admin-only endpoint.
 * @param {string} userId
 * @param {string} bankAccountId
 * @returns {Promise<{ success: true } | { success: false, message: string }>}
 */
export async function adminRemoveBankAccount(userId, bankAccountId) {
  const result = await apiRequest(
    `/api/v1/users/${userId}/bank-accounts/${bankAccountId}`,
    { method: 'DELETE', errorMessage: GENERIC_ERROR_MESSAGE },
  );

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return { success: true };
}

/**
 * @param {string} url
 * @param {'POST' | 'PUT'} method
 * @param {Record<string, unknown> | undefined} body
 * @returns {Promise<import('../types/index.js').BankAccountResult>}
 */
async function sendBankAccountRequest(url, method, body) {
  const result = await apiRequest(url, {
    method,
    body,
    errorMessage: GENERIC_ERROR_MESSAGE,
  });

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return { success: true, bankAccount: result.data };
}
