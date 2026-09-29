'use client';

import { useQuery } from '@tanstack/react-query';

import { listShipmentCostCategories } from '../api/shipment-cost-categories.js';
import { REFERENCE_DATA_STALE_TIME } from './use-shipment-journey-query.js';

const QUERY_KEY = ['logistics-contracts', 'shipment-cost-categories'];

/**
 * The fixed LOG-01 … LOG-08 cost groups, in code order.
 * @param {{ enabled?: boolean }} [options] Pass `false` to skip the fetch
 *   until a consumer (e.g. the Costs tab) actually needs the groups.
 */
export function useShipmentCostCategoriesQuery({ enabled = true } = {}) {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => listShipmentCostCategories(),
    enabled,
    staleTime: REFERENCE_DATA_STALE_TIME,
  });
}
