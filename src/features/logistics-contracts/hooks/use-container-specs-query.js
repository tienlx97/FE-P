'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { getContainerSpecs } from '../api/container-specs.js';
import {
  isValidContainerNumber,
  normalizeContainerNumber,
} from '../config/container-specs.js';

/**
 * A container's specs hardly change and each lookup spends the BoxTech
 * quota (the backend caches too): keep an answer for the whole session.
 * @param {string} number normalized
 */
function containerSpecsQueryOptions(number) {
  return {
    queryKey: ['logistics-contracts', 'container-specs', number],
    queryFn: () => getContainerSpecs(number),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 60 * 60_000,
  };
}

/**
 * BIC BoxTech specs of the container number typed in the drawer, looked
 * up once it is a valid ISO 6346 number; `fetchSpecs` returns them for an
 * event handler (fill on blur) from the same cache.
 * @param {string} containerNumber as typed
 */
export function useContainerSpecsQuery(containerNumber) {
  const queryClient = useQueryClient();
  const number = normalizeContainerNumber(containerNumber);
  const isValid = isValidContainerNumber(number);
  const query = useQuery({
    ...containerSpecsQueryOptions(number),
    enabled: isValid,
  });

  /** @returns {Promise<import('../types/index.js').ContainerSpecs | null>} */
  async function fetchSpecs() {
    if (!isValid) return null;
    const result = await queryClient.fetchQuery(
      containerSpecsQueryOptions(number),
    );
    return result.success ? result.specs : null;
  }

  return { number, isValid, query, fetchSpecs };
}
