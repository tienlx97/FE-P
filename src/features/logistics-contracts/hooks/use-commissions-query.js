'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { searchCommissions } from '../api/commissions.js';

const QUERY_KEY = ['logistics-contracts', 'commissions-list'];

/**
 * `conditions` defaults to `[]`, which the backend treats identically to
 * the unfiltered list — existing unfiltered callers keep working unchanged.
 *
 * `placeholderData: keepPreviousData` avoids the double flicker a
 * page/conditions/sort change otherwise causes (full skeleton-row swap on
 * `isLoading`, then swap again for the real data) — see
 * `use-shipments-list-query.js`'s `useShipmentsListQuery` doc comment for
 * the detailed mechanism, identical here.
 * @param {{ page: number, pageSize: number, conditions?: import('@/shared/components/advanced-filter-builder.jsx').AdvancedFilterCondition[], sort?: { field: string, direction: 'Ascending' | 'Descending' } | null }} params
 */
export function useCommissionsQuery({
  page,
  pageSize,
  conditions = [],
  sort = null,
}) {
  return useQuery({
    queryKey: [...QUERY_KEY, page, pageSize, conditions, sort],
    queryFn: () => searchCommissions({ page, pageSize, conditions, sort }),
    placeholderData: keepPreviousData,
  });
}
