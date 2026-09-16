'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { searchAllShipments } from '../api/shipments.js';

const QUERY_KEY = ['logistics-contracts', 'shipments-list'];

/**
 * System-wide, paginated Shipment list — separate from `useShipmentsQuery`
 * (`use-shipments-query.js`), which is per-contract and already owns that
 * name. `conditions` defaults to `[]`, which the backend treats identically
 * to the unfiltered list.
 *
 * `placeholderData: keepPreviousData` — a page/pageSize/conditions/sort
 * change is a brand-new `queryKey`, which React Query otherwise treats as a
 * from-scratch query (`isLoading: true`, no data) even though the table
 * already has a perfectly good previous page on screen. Without this,
 * `AdvanceTable` (`isLoading ? skeletonRows : renderedData`) blanks the
 * whole table out to skeleton rows on every keystroke-driven search or
 * pagination change, then swaps in the real rows once the response lands —
 * a double flicker reported 2026-09-16 (`shipments-list.jsx`'s quick-search
 * box, once it started round-tripping to the server for out-of-page
 * matches). With this, the previous rows stay on screen — `isLoading` only
 * goes `true` on the very first mount — and `isFetching` (already wired to
 * `AdvanceTable`'s `isRefreshing`, which only spins the toolbar's reload
 * icon, not a full-table swap) is the one that flips during the refetch.
 * @param {{ page: number, pageSize: number, conditions?: import('@/shared/components/advanced-filter-builder.jsx').AdvancedFilterCondition[], sort?: { field: string, direction: 'Ascending' | 'Descending' } | null }} params
 */
export function useShipmentsListQuery({
  page,
  pageSize,
  conditions = [],
  sort = null,
}) {
  return useQuery({
    queryKey: [...QUERY_KEY, page, pageSize, conditions, sort],
    queryFn: () => searchAllShipments({ page, pageSize, conditions, sort }),
    placeholderData: keepPreviousData,
  });
}
