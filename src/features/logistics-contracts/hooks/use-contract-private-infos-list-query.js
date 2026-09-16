'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { searchContractPrivateInfos } from '../api/contract-private-info.js';

const QUERY_KEY = ['logistics-contracts', 'contract-private-infos-list'];

/**
 * System-wide, paginated "BOQ" list — same convention as
 * `useShipmentsListQuery` (`use-shipments-list-query.js`): always calls the
 * search endpoint, since the backend treats an empty `conditions` array
 * identically to the unfiltered list.
 *
 * `placeholderData: keepPreviousData` avoids the double flicker a
 * page/conditions/sort change otherwise causes (full skeleton-row swap on
 * `isLoading`, then swap again for the real data) — see
 * `use-shipments-list-query.js`'s `useShipmentsListQuery` doc comment for
 * the detailed mechanism, identical here.
 * @param {{ page: number, pageSize: number, conditions?: import('@/shared/components/advanced-filter-builder.jsx').AdvancedFilterCondition[], sort?: { field: string, direction: 'Ascending' | 'Descending' } | null, enabled?: boolean }} params
 */
export function useContractPrivateInfosListQuery({
  page,
  pageSize,
  conditions = [],
  sort = null,
  enabled = true,
}) {
  return useQuery({
    queryKey: [...QUERY_KEY, page, pageSize, conditions, sort],
    queryFn: () =>
      searchContractPrivateInfos({ page, pageSize, conditions, sort }),
    enabled,
    placeholderData: keepPreviousData,
  });
}
