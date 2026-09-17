'use client';

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  createContract,
  getContract,
  searchContracts,
  updateContract,
} from '../api/contracts.js';

const QUERY_KEY = ['logistics-contracts', 'contracts'];

/**
 * One Contract by id — backs `/logistics/contract/[id]`. Refetches
 * automatically after an edit: `useUpdateContractMutation`'s own
 * `invalidateQueries({ queryKey: QUERY_KEY })` matches this query too
 * (react-query invalidates by key prefix), so there is no separate
 * cache-write needed here.
 * @param {string | null | undefined} contractId
 */
export function useContractQuery(contractId) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'by-id', contractId],
    queryFn: () => getContract(/** @type {string} */ (contractId)),
    enabled: Boolean(contractId),
  });
}

/**
 * `conditions` defaults to `[]`, which the backend treats identically to
 * the unfiltered list (`searchContracts`'s own doc comment) — so every
 * existing caller (e.g. `shipments-list.jsx`'s cross-reference fetch) keeps
 * working unchanged.
 *
 * `placeholderData: keepPreviousData` avoids the double flicker a
 * page/conditions/sort change otherwise causes (full skeleton-row swap on
 * `isLoading`, then swap again for the real data) — see
 * `use-shipments-list-query.js`'s `useShipmentsListQuery` doc comment for
 * the detailed mechanism, identical here.
 * @param {{ page: number, pageSize: number, conditions?: import('@/shared/components/advanced-filter-builder.jsx').AdvancedFilterCondition[], sort?: { field: string, direction: 'Ascending' | 'Descending' } | null }} params
 */
export function useContractsQuery({
  page,
  pageSize,
  conditions = [],
  sort = null,
}) {
  return useQuery({
    queryKey: [...QUERY_KEY, page, pageSize, conditions, sort],
    queryFn: () => searchContracts({ page, pageSize, conditions, sort }),
    placeholderData: keepPreviousData,
  });
}

/**
 * Every contract for one customer (Buyer), newest-signed first — backs
 * `CustomerDetailDialog`'s "Hợp đồng đã làm" table. Filters on
 * `buyerSourceCustomerId` (BE-kt-xnk's `add-contract-project-completion-date`),
 * which only matches contracts where this customer was linked as Buyer via
 * the catalog (`sourceCustomerId`) — an inline, not-catalog-linked Buyer
 * with the same company name has no such link and won't appear here.
 * @param {string | null | undefined} customerId
 */
export function useCustomerContractsQuery(customerId) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'by-customer', customerId],
    queryFn: () =>
      searchContracts({
        page: 1,
        pageSize: 100,
        conditions: [
          {
            id: 'buyerSourceCustomerId',
            field: 'buyerSourceCustomerId',
            operator: 'Equals',
            // `enabled` below only runs this queryFn once customerId is set.
            value: /** @type {string} */ (customerId),
            connector: 'And',
          },
        ],
        sort: { field: 'createdDate', direction: 'Descending' },
      }),
    enabled: Boolean(customerId),
  });
}

export function useCreateContractMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      /** @type {{ values: import('../types/index.js').ContractFormValues, extra: Parameters<typeof createContract>[1] }} */ {
        values,
        extra,
      },
    ) => createContract(values, extra),
    onSuccess: (result) => {
      if (result.success || result.conflict) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      }
    },
  });
}

export function useUpdateContractMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      /** @type {{ contractId: string, values: import('../types/index.js').ContractFormValues, extra: Parameters<typeof updateContract>[2] }} */ {
        contractId,
        values,
        extra,
      },
    ) => updateContract(contractId, values, extra),
    onSuccess: (result) => {
      if (result.success || result.conflict) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      }
    },
  });
}
