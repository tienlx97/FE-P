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
