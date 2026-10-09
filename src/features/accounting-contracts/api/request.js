import { apiRequest } from '@/shared/api/api-client.js';

import { vietnameseMessage } from '../config/error-messages.js';

/**
 * `apiRequest` with the backend's English 404 / 409 texts in Vietnamese.
 * @template T
 * @param {string} path
 * @param {{ method?: string, body?: unknown, errorMessage: string }} options
 * @returns {Promise<import('../types/index.js').AccountingResult<T>>}
 */
export async function accountingRequest(path, options) {
  /** @type {import('@/shared/api/api-client.js').ApiResult<T>} */
  const result = await apiRequest(path, options);

  if (!result.success) {
    return { success: false, message: vietnameseMessage(result.message) };
  }

  return { success: true, data: result.data };
}
