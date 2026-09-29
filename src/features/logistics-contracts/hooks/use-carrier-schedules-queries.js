'use client';

import { useQueries } from '@tanstack/react-query';

import { searchCarrierSchedules } from '../api/carrier-schedules.js';

/**
 * One `GET /shipments/schedules` per carrier for the dates shown. Nothing
 * runs until a search is made (`search` null). Months already seen are
 * served from the cache when paging back.
 * @param {{
 *   search: { pol: string, pod: string, carriers: import('../types/index.js').ShippingCarrier[] } | null,
 *   from: string,
 *   to: string,
 * }} params
 */
export function useCarrierSchedulesQueries({ search, from, to }) {
  return useQueries({
    queries: (search?.carriers ?? []).map((carrier) => ({
      queryKey: ['logistics-contracts', 'carrier-schedules', carrier.code, search?.pol, search?.pod, from, to],
      queryFn: () =>
        searchCarrierSchedules({
          carrier: carrier.code,
          pol: /** @type {string} */ (search?.pol),
          pod: /** @type {string} */ (search?.pod),
          from,
          to,
        }),
      staleTime: 10 * 60 * 1000,
    })),
  });
}
