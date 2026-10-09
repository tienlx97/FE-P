'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createCustomer,
  deleteCustomer,
  getCustomer,
  getNextCustomerCode,
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
export function useSearchCustomersQuery({
  page,
  pageSize,
  conditions = [],
  sort = null,
}) {
  return useQuery({
    queryKey: [...SEARCH_QUERY_KEY, page, pageSize, conditions, sort],
    queryFn: () => searchCustomers({ page, pageSize, conditions, sort }),
  });
}

/**
 * One customer by id — key under `QUERY_KEY`, so every customer mutation's
 * `invalidateQueries({ queryKey: QUERY_KEY })` refreshes it too.
 * @param {string} customerId
 */
export function useCustomerQuery(customerId) {
  return useQuery({
    queryKey: [...QUERY_KEY, customerId],
    queryFn: () => getCustomer(customerId),
  });
}

/**
 * `BankAccountsPanel.onChanged` for a customer: the per-account endpoints
 * return the whole customer — written into the detail query — then the
 * customer lists refetch.
 * @param {string} customerId
 */
export function useCustomerBankAccountsChanged(customerId) {
  const queryClient = useQueryClient();
  return (/** @type {{ data: any }} */ { data }) => {
    queryClient.setQueryData([...QUERY_KEY, customerId], {
      success: true,
      customer: data,
    });
    queryClient.invalidateQueries({ queryKey: SEARCH_QUERY_KEY });
  };
}

/**
 * The next running code ("KH-0042") for the create form; refetched on
 * mount and after every customer change (the key sits under `QUERY_KEY`),
 * so it never offers a code that was just taken.
 * @param {boolean} enabled
 */
export function useNextCustomerCodeQuery(enabled) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'next-code'],
    queryFn: getNextCustomerCode,
    enabled,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useDeleteCustomerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (/** @type {string} */ customerId) => deleteCustomer(customerId),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        queryClient.invalidateQueries({ queryKey: SEARCH_QUERY_KEY });
        queryClient.invalidateQueries({
          queryKey: ['logistics-contracts', 'customer-groups'],
        });
      }
    },
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
    ) =>
      createCustomer(values, extraFieldRows, bankAccounts, deliveryAddresses),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        queryClient.invalidateQueries({ queryKey: SEARCH_QUERY_KEY });
        queryClient.invalidateQueries({
          queryKey: ['logistics-contracts', 'customer-groups'],
        });
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
    ) =>
      updateCustomer(
        customerId,
        values,
        extraFieldRows,
        bankAccounts,
        deliveryAddresses,
      ),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        queryClient.invalidateQueries({ queryKey: SEARCH_QUERY_KEY });
        queryClient.invalidateQueries({
          queryKey: ['logistics-contracts', 'customer-groups'],
        });
      }
    },
  });
}
