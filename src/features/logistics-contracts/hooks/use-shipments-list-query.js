'use client';

import { useQuery } from '@tanstack/react-query';

import { searchAllShipments } from '../api/shipments.js';

const QUERY_KEY = ['logistics-contracts', 'shipments-list'];

/**
 * System-wide, paginated Shipment list — separate from `useShipmentsQuery`
 * (`use-shipments-query.js`), which is per-contract and already owns that
 * name. `conditions` defaults to `[]`, which the backend treats identically
 * to the unfiltered list.
 * @param {{ page: number, pageSize: number, conditions?: import('@/shared/components/advanced-filter-builder.jsx').AdvancedFilterCondition[], sort?: { field: string, direction: 'Ascending' | 'Descending' } | null }} params
 */
export function useShipmentsListQuery({ page, pageSize, conditions = [], sort = null }) {
  return useQuery({
    queryKey: [...QUERY_KEY, page, pageSize, conditions, sort],
    queryFn: () => searchAllShipments({ page, pageSize, conditions, sort }),
  });
}
