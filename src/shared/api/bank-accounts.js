import { apiRequest } from './api-client.js';

/**
 * Where an owner's accounts live — every owner shares the same per-account
 * routes except set-default (`POST …/{id}/default` for customers /
 * suppliers / sellers, `PUT …/{id}/primary` for employees).
 * @typedef {{ basePath: string, defaultRoute?: { method: 'POST' | 'PUT', suffix: string } }} BankAccountEndpoint
 */

/** @param {'customers' | 'suppliers' | 'sellers'} owner @param {string} ownerId @returns {BankAccountEndpoint} */
export function partyBankAccountEndpoint(owner, ownerId) {
  return {
    basePath: `/api/v1/${owner}/${ownerId}/bank-accounts`,
    defaultRoute: { method: 'POST', suffix: 'default' },
  };
}

/** @param {string | 'me'} userId @returns {BankAccountEndpoint} */
export function userBankAccountEndpoint(userId) {
  return {
    basePath: `/api/v1/users/${userId}/bank-accounts`,
    defaultRoute: { method: 'PUT', suffix: 'primary' },
  };
}

/**
 * One account as BE-kt-xnk `PartyBankAccountDto`. Every field is sent so a
 * full save keeps holder / currency / SWIFT / status / default / extra
 * fields; `Id` keeps an existing account's identity on full partner saves.
 * @param {any} account
 */
export function toBankAccountBody(account) {
  return {
    Id: account.id || null,
    AccountNumber: account.accountNumber,
    BankName: account.bankName,
    Branch: account.branch ?? '',
    Province: account.province ?? '',
    Holder: account.holder || null,
    Currency: account.currency || 'VND',
    SwiftCode: account.swiftCode || null,
    IsActive: account.isActive ?? true,
    IsDefault: account.isDefault ?? false,
    ExtraFields: (account.extraFields ?? [])
      .filter((/** @type {any} */ field) => field.key?.trim())
      .map((/** @type {any} */ field) => ({
        Key: field.key.trim(),
        Value: field.value ?? '',
      })),
  };
}

/**
 * Add / update / delete / set-default one account. Owners answer with the
 * whole owner (accounts in `bankAccounts`), employees with the list — both
 * come back as `accounts`, the raw body as `data`.
 * @param {BankAccountEndpoint} endpoint
 * @param {{ kind: 'add' | 'update' | 'delete' | 'default', accountId?: string, account?: any }} operation
 * @returns {Promise<{ success: true, data: any, accounts: import('@/shared/api/bank-accounts.js').BankAccount[] } | { success: false, message: string }>}
 */
export async function changeBankAccount(endpoint, { kind, accountId, account }) {
  const defaultRoute = endpoint.defaultRoute ?? { method: 'POST', suffix: 'default' };
  const request = {
    add: { method: 'POST', path: endpoint.basePath, errorMessage: 'Không thể thêm tài khoản ngân hàng' },
    update: { method: 'PUT', path: `${endpoint.basePath}/${accountId}`, errorMessage: 'Không thể sửa tài khoản ngân hàng' },
    delete: { method: 'DELETE', path: `${endpoint.basePath}/${accountId}`, errorMessage: 'Không thể xoá tài khoản ngân hàng' },
    default: {
      method: defaultRoute.method,
      path: `${endpoint.basePath}/${accountId}/${defaultRoute.suffix}`,
      errorMessage: 'Không thể đặt tài khoản mặc định',
    },
  }[kind];
  const result = await apiRequest(request.path, {
    method: /** @type {any} */ (request.method),
    errorMessage: request.errorMessage,
    body: account ? toBankAccountBody(account) : undefined,
  });
  if (!result.success) return { success: false, message: result.message };
  const data = result.data;
  return {
    success: true,
    data,
    accounts: Array.isArray(data) ? data : (data?.bankAccounts ?? []),
  };
}

/**
 * @typedef {{
 *   id?: string,
 *   accountNumber: string,
 *   bankName: string,
 *   branch: string,
 *   province: string,
 *   holder?: string | null,
 *   currency?: string,
 *   swiftCode?: string | null,
 *   isActive?: boolean,
 *   isDefault?: boolean,
 *   extraFields?: { key: string, value: string }[],
 * }} BankAccount
 */
