'use client';

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  createContract,
  deleteContract,
  getContract,
  listCompanies,
  searchContracts,
  updateContract,
} from '../api/contracts.js';

export const CONTRACTS_KEY = ['accounting', 'contracts'];

/** @param {string} id */
export function contractKey(id) {
  return [...CONTRACTS_KEY, 'detail', id];
}

/** @param {{ page: number, pageSize: number, sort: { field: string, direction: 'Ascending' | 'Descending' } | null }} query */
export function useContractsSearchQuery(query) {
  return useQuery({
    queryKey: [...CONTRACTS_KEY, 'search', query],
    queryFn: () => searchContracts(query),
    placeholderData: keepPreviousData,
  });
}

/** @param {string} id */
export function useContractQuery(id) {
  return useQuery({
    queryKey: contractKey(id),
    queryFn: () => getContract(id),
  });
}

export function useCompaniesQuery() {
  return useQuery({
    queryKey: ['accounting', 'companies'],
    queryFn: listCompanies,
    staleTime: 5 * 60_000,
  });
}

export function useSaveContractMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      /** @type {{ values: import('../types/index.js').AccountingContractFormValues, id?: string, version?: number }} */ {
        values,
        id,
        version,
      },
    ) =>
      id ? updateContract(id, version ?? 0, values) : createContract(values),
    onSuccess: (result) => {
      if (!result.success) return;
      queryClient.setQueryData(contractKey(result.data.contract.id), result);
      queryClient.invalidateQueries({ queryKey: [...CONTRACTS_KEY, 'search'] });
    },
  });
}

export function useDeleteContractMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (/** @type {string} */ id) => deleteContract(id),
    onSuccess: (result) => {
      if (result.success)
        queryClient.invalidateQueries({
          queryKey: [...CONTRACTS_KEY, 'search'],
        });
    },
  });
}
