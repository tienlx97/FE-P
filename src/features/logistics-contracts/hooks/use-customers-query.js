'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createCustomer,
  listCustomers,
  searchCustomers,
  updateCustomer,
} from '../api/customers.js';

const QUERY_KEY = ['logistics-contracts', 'customers'];
const SEARCH_QUERY_KEY = ['logistics-contracts', 'customers-search'];

export function useCustomersQuery() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: listCustomers,
  });
}

/**
 * Paginated + advanced-search-filterable variant, backing the Customers
 * list page's own table (which needs paging, unlike every other caller of
 * `useCustomersQuery` — cross-reference name-lookup maps elsewhere always
 * want the full unpaged directory).
 * @param {{ page: number, pageSize: number, conditions?: import('@/shared/components/advanced-filter-builder.jsx').AdvancedFilterCondition[], sort?: { field: string, direction: 'Ascending' | 'Descending' } | null }} params
 */
export function useSearchCustomersQuery({ page, pageSize, conditions = [], sort = null }) {
  return useQuery({
    queryKey: [...SEARCH_QUERY_KEY, page, pageSize, conditions, sort],
    queryFn: () => searchCustomers({ page, pageSize, conditions, sort }),
  });
}

export function useCreateCustomerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      /** @type {any} */ {
        values,
        extraFieldRows,
        bankAccounts,
        deliveryAddresses,
      },
    ) => createCustomer(values, extraFieldRows, bankAccounts, deliveryAddresses),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        queryClient.invalidateQueries({ queryKey: SEARCH_QUERY_KEY });
      }
    },
  });
}

export function useUpdateCustomerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      /** @type {any} */ {
        customerId,
        values,
        extraFieldRows,
        bankAccounts,
        deliveryAddresses,
      },
    ) => updateCustomer(customerId, values, extraFieldRows, bankAccounts, deliveryAddresses),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        queryClient.invalidateQueries({ queryKey: SEARCH_QUERY_KEY });
      }
    },
  });
}
