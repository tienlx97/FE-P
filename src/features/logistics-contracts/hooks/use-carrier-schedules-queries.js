'use client';

import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';

import { refreshCarrierSchedules, searchCarrierSchedules } from '../api/carrier-schedules.js';

/**
 * @typedef {{ pol: string, pod: string, carriers: import('../types/index.js').ShippingCarrier[] }} ScheduleSearch
 */

/**
 * @param {string} carrierCode
 * @param {ScheduleSearch | null} search
 * @param {string} from
 * @param {string} to
 */
const scheduleKey = (carrierCode, search, from, to) =>
  ['logistics-contracts', 'carrier-schedules', carrierCode, search?.pol, search?.pod, from, to];

/**
 * One `GET /shipments/schedules` per carrier for the dates shown. Nothing
 * runs until a search is made (`search` null). Months already seen are
 * served from the cache when paging back.
 * @param {{ search: ScheduleSearch | null, from: string, to: string }} params
 */
export function useCarrierSchedulesQueries({ search, from, to }) {
  return useQueries({
    queries: (search?.carriers ?? []).map((carrier) => ({
      queryKey: scheduleKey(carrier.code, search, from, to),
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

/**
 * "Tải lại từ hãng": asks every searched carrier again (the BE skips and
 * then replaces its cached answer) and puts each answer in place of the
 * calendar's cached result for the same dates.
 */
export function useRefreshCarrierSchedulesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (/** @type {{ search: ScheduleSearch, from: string, to: string }} */ { search, from, to }) =>
      Promise.all(
        search.carriers.map(async (carrier) => {
          const result = await refreshCarrierSchedules({ carrier: carrier.code, pol: search.pol, pod: search.pod, from, to });
          queryClient.setQueryData(scheduleKey(carrier.code, search, from, to), result);
          return result;
        }),
      ),
  });
}
