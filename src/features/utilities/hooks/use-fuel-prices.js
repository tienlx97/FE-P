'use client';

import {
  useIsMutating,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { useAppToast } from '@/shared/hooks/use-app-toast.js';

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
const syncKey = (market) => ['utilities', 'fuel-prices', market, 'sync'];

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
  const queryClient = useQueryClient();
  const invalidate = useInvalidateMarket(market);
  return useMutation({
    mutationKey: syncKey(market),
    mutationFn: () => syncFuelPrices(market),
    onSuccess: (result) => {
      if (!result.success) return;
      invalidate();
      // The source check's "pending" list is stale after a sync.
      queryClient.invalidateQueries({ queryKey: sourceKey(market) });
    },
  });
}

/**
 * "Cập nhật giá" (header button and update banner): syncs the market from
 * its source and toasts the outcome.
 * @param {string} market
 */
export function useFuelPriceSync(market) {
  const toast = useAppToast();
  const mutation = useSyncFuelPricesMutation(market);
  // Header button and banner share the loading state (one sync at a time).
  const isPending = useIsMutating({ mutationKey: syncKey(market) }) > 0;

  async function sync() {
    if (isPending) return;
    const result = await mutation.mutateAsync();
    if (!result.success) {
      toast({ type: 'error', body: result.message });
      return;
    }
    const { added, updated } = result.sync;
    toast({
      body:
        added + updated === 0
          ? 'Giá đã là mới nhất, nguồn không có kỳ mới.'
          : `Đã cập nhật: ${added} kỳ mới, ${updated} kỳ sửa giá.`,
    });
  }

  return { sync, isPending };
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
