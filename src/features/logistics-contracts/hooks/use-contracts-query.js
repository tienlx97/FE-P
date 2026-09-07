'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createContract, searchContracts, updateContract } from '../api/contracts.js';

const QUERY_KEY = ['logistics-contracts', 'contracts'];

/**
 * `conditions` defaults to `[]`, which the backend treats identically to
 * the unfiltered list (`searchContracts`'s own doc comment) — so every
 * existing caller (e.g. `shipments-list.jsx`'s cross-reference fetch) keeps
 * working unchanged.
 * @param {{ page: number, pageSize: number, conditions?: import('@/shared/components/advanced-filter-builder.jsx').AdvancedFilterCondition[] }} params
 */
export function useContractsQuery({ page, pageSize, conditions = [] }) {
  return useQuery({
    queryKey: [...QUERY_KEY, page, pageSize, conditions],
    queryFn: () => searchContracts({ page, pageSize, conditions }),
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
