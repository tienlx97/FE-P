import { apiRequest } from '@/shared/api/api-client.js';
import {
  changeBankAccount,
  userBankAccountEndpoint,
} from '@/shared/api/bank-accounts.js';
import { listVietnamBanks as listSharedVietnamBanks } from '@/shared/api/vietnam-banks.js';

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
 * Admin-only. The user's accounts on the shared model (BE-kt-xnk
 * `unify-bank-accounts`); edits go through the shared `BankAccountsPanel`.
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
 * Admin-only. Adds one row of the create-user grid (the user exists now):
 * the grid picks a catalog bank; it is stored by its short name.
 * @param {string} userId
 * @param {import('../types/index.js').BankAccountRow} row
 * @param {import('../types/index.js').VietnamBank[]} vietnamBanks
 * @returns {Promise<{ success: true } | { success: false, message: string }>}
 */
export async function adminAddBankAccount(userId, row, vietnamBanks) {
  const bank = vietnamBanks.find((item) => item.id === row.vietnamBankId);
  const result = await changeBankAccount(userBankAccountEndpoint(userId), {
    kind: 'add',
    account: {
      bankName: bank?.shortName ?? bank?.name ?? '',
      accountNumber: row.accountNumber.trim(),
      branch: row.branch ?? '',
      province: '',
      isDefault: row.isPrimary,
    },
  });
  return result.success ? { success: true } : result;
}
