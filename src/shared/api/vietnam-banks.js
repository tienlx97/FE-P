import { apiRequest } from './api-client.js';

/**
 * @typedef {{ id: string, code: string, name: string, shortName: string }} VietnamBank
 */

/**
 * Fixed Vietnamese bank catalog (BE-kt-xnk `GET /api/v1/vietnam-banks`,
 * any signed-in user). Shared by the admin user bank accounts and the
 * logistics partner bank accounts. Empty on error.
 * @returns {Promise<VietnamBank[]>}
 */
export async function listVietnamBanks() {
  const result = await apiRequest('/api/v1/vietnam-banks');
  return result.success ? (result.data ?? []) : [];
}
