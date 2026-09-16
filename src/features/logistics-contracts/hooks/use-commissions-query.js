'use client';

import { useQuery } from '@tanstack/react-query';

import { searchCommissions } from '../api/commissions.js';

const QUERY_KEY = ['logistics-contracts', 'commissions-list'];

/**
 * `conditions` defaults to `[]`, which the backend treats identically to
 * the unfiltered list — existing unfiltered callers keep working unchanged.
 * @param {{ page: number, pageSize: number, conditions?: import('@/shared/components/advanced-filter-builder.jsx').AdvancedFilterCondition[], sort?: { field: string, direction: 'Ascending' | 'Descending' } | null }} params
 */
export function useCommissionsQuery({ page, pageSize, conditions = [], sort = null }) {
  return useQuery({
    queryKey: [...QUERY_KEY, page, pageSize, conditions, sort],
    queryFn: () => searchCommissions({ page, pageSize, conditions, sort }),
  });
}
