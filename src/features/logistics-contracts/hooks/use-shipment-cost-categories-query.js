'use client';

import { useQuery } from '@tanstack/react-query';

import { listShipmentCostCategories } from '../api/shipment-cost-categories.js';

const QUERY_KEY = ['logistics-contracts', 'shipment-cost-categories'];

/** The fixed LOG-01 … LOG-08 cost groups, in code order. */
export function useShipmentCostCategoriesQuery() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => listShipmentCostCategories(),
  });
}
