import { apiRequest } from '@/shared/api/api-client.js';

/** @param {string} route @param {string} label */
export async function listPartyLookups(route, label) {
  const result = await apiRequest(`/api/v1/${route}`, {
    errorMessage: `Không thể tải ${label}`,
  });
  return result.success
    ? { success: true, items: result.data ?? [] }
    : { success: false, message: result.message };
}

/** @param {'customer' | 'supplier'} kind */
export function partyGroupRoute(kind) {
  return kind === 'customer' ? 'customer-groups' : 'supplier-groups';
}

/**
 * Requires `logistics:contracts:manage`.
 * @param {'customer' | 'supplier'} kind
 * @param {string} name
 * @returns {Promise<{ success: true, group: import('../types/index.js').PartyLookup } | { success: false, message: string }>}
 */
export async function createPartyGroup(kind, name) {
  const result = await apiRequest(`/api/v1/${partyGroupRoute(kind)}`, {
    method: 'POST',
    errorMessage: `Không thể tạo nhóm ${kind === 'customer' ? 'khách hàng' : 'nhà cung cấp'}`,
    body: { Name: name },
  });
  return result.success
    ? { success: true, group: result.data }
    : { success: false, message: result.message };
}
