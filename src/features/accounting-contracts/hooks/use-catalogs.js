'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  deleteCustomer,
  listCustomers,
  saveCustomer,
} from '../api/customers.js';
import { deleteSource, listSources, saveSource } from '../api/sources.js';

export const SOURCES_KEY = ['accounting', 'sources'];
export const CUSTOMERS_KEY = ['accounting', 'customers'];

export function useSourcesQuery() {
  return useQuery({ queryKey: SOURCES_KEY, queryFn: listSources });
}

export function useCustomersQuery() {
  return useQuery({ queryKey: CUSTOMERS_KEY, queryFn: listCustomers });
}

export function useSaveSourceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      /** @type {{ values: import('../types/index.js').AccountingSourceFormValues, id?: string }} */ {
        values,
        id,
      },
    ) => saveSource(values, id),
    onSuccess: (result) => {
      if (result.success)
        queryClient.invalidateQueries({ queryKey: ['accounting'] });
    },
  });
}

export function useDeleteSourceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (/** @type {string} */ id) => deleteSource(id),
    onSuccess: (result) => {
      if (result.success)
        queryClient.invalidateQueries({ queryKey: SOURCES_KEY });
    },
  });
}

export function useSaveCustomerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      /** @type {{ values: import('../types/index.js').AccountingCustomerFormValues, id?: string }} */ {
        values,
        id,
      },
    ) => saveCustomer(values, id),
    onSuccess: (result) => {
      if (result.success)
        queryClient.invalidateQueries({ queryKey: ['accounting'] });
    },
  });
}

export function useDeleteCustomerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (/** @type {string} */ id) => deleteCustomer(id),
    onSuccess: (result) => {
      if (result.success)
        queryClient.invalidateQueries({ queryKey: CUSTOMERS_KEY });
    },
  });
}
