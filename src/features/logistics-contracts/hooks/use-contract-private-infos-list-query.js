'use client';

import { useQuery } from '@tanstack/react-query';

import { searchContractPrivateInfos } from '../api/contract-private-info.js';

const QUERY_KEY = ['logistics-contracts', 'contract-private-infos-list'];

/**
 * System-wide, paginated "BOQ" list — same convention as
 * `useShipmentsListQuery` (`use-shipments-list-query.js`): always calls the
 * search endpoint, since the backend treats an empty `conditions` array
 * identically to the unfiltered list.
 * @param {{ page: number, pageSize: number, conditions?: import('@/shared/components/advanced-filter-builder.jsx').AdvancedFilterCondition[], enabled?: boolean }} params
 */
export function useContractPrivateInfosListQuery({
  page,
  pageSize,
  conditions = [],
  enabled = true,
}) {
  return useQuery({
    queryKey: [...QUERY_KEY, page, pageSize, conditions],
    queryFn: () => searchContractPrivateInfos({ page, pageSize, conditions }),
    enabled,
  });
}
