'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  checkFuelPriceSource,
  deleteFuelPricePeriod,
  listFuelPricePeriods,
  syncFuelPrices,
  upsertFuelPricePeriod,
} from '../api/fuel-prices.js';

/** @param {string} market */
const periodsKey = (market) => ['utilities', 'fuel-prices', market];
/** @param {string} market */
const sourceKey = (market) => ['utilities', 'fuel-prices', market, 'source'];

/** @param {string} market */
export function useFuelPricePeriodsQuery(market) {
  return useQuery({
    queryKey: periodsKey(market),
    queryFn: () => listFuelPricePeriods(market),
  });
}

/**
 * Asks BE whether the source has periods we don't have. Reads a public web
 * page on the server, so it is cached for 30 minutes and never retried.
 * @param {string} market
 * @param {boolean} isEnabled
 */
export function useFuelPriceSourceCheckQuery(market, isEnabled) {
  return useQuery({
    queryKey: sourceKey(market),
    queryFn: () => checkFuelPriceSource(market),
    enabled: isEnabled,
    staleTime: 30 * 60 * 1000,
    retry: false,
  });
}

/** @param {string} market */
function useInvalidateMarket(market) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: periodsKey(market) });
}

/** @param {string} market */
export function useSyncFuelPricesMutation(market) {
  const invalidate = useInvalidateMarket(market);
  return useMutation({
    mutationFn: () => syncFuelPrices(market),
    onSuccess: (result) => {
      if (result.success) invalidate();
    },
  });
}

/** @param {string} market */
export function useUpsertFuelPricePeriodMutation(market) {
  const invalidate = useInvalidateMarket(market);
  return useMutation({
    mutationFn: (
      /** @type {{ effectiveDate: string, items: import('../types/index.js').FuelPriceItem[] }} */ {
        effectiveDate,
        items,
      },
    ) => upsertFuelPricePeriod(market, effectiveDate, items),
    onSuccess: (result) => {
      if (result.success) invalidate();
    },
  });
}

/** @param {string} market */
export function useDeleteFuelPricePeriodMutation(market) {
  const invalidate = useInvalidateMarket(market);
  return useMutation({
    mutationFn: (/** @type {string} */ effectiveDate) =>
      deleteFuelPricePeriod(market, effectiveDate),
    onSuccess: (result) => {
      if (result.success) invalidate();
    },
  });
}
