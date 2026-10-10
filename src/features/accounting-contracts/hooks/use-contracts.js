'use client';

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { useSessionPermissions } from '@/shared/hooks/use-session-permissions.js';

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

/**
 * Every accounting contract of one customer, newest signed first (the
 * customer detail page's "Hợp đồng" tab).
 * @param {string | null | undefined} customerId
 */
export function useCustomerAccountingContractsQuery(customerId) {
  // Logistics users open the same customer page without Kế toán access.
  const canView = useSessionPermissions().includes('accounting:contracts:view');
  return useQuery({
    queryKey: [...CONTRACTS_KEY, 'by-customer', customerId],
    queryFn: () =>
      searchContracts({
        page: 1,
        pageSize: 100,
        sort: { field: 'signedDate', direction: 'Descending' },
        conditions: [
          {
            field: 'customerId',
            operator: 'Equals',
            value: /** @type {string} */ (customerId),
          },
        ],
      }),
    enabled: Boolean(customerId) && canView,
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
