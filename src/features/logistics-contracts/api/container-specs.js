import { apiRequest } from '@/shared/api/api-client.js';

const GENERIC_LOAD_ERROR = 'Không thể tra thông số container';

/**
 * A container's technical data from BIC BoxTech (BE-P
 * `container-specs-boxtech`). Always a 200 for a valid ISO 6346 number —
 * `status` says whether BoxTech has it. Requires `logistics:contracts:view`.
 * @param {string} containerNumber normalized ISO 6346 number
 * @returns {Promise<{ success: true, specs: import('../types/index.js').ContainerSpecs } | { success: false, message: string }>}
 */
export async function getContainerSpecs(containerNumber) {
  const result = await apiRequest(
    `/api/v1/containers/${encodeURIComponent(containerNumber)}/specs`,
    { errorMessage: GENERIC_LOAD_ERROR },
  );

  return result.success
    ? { success: true, specs: result.data }
    : { success: false, message: result.message };
}
