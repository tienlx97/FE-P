'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createSupplier,
  deleteSupplier,
  listSuppliers,
  searchSuppliers,
  updateSupplier,
} from '../api/suppliers.js';

const QUERY_KEY = ['logistics-contracts', 'suppliers'];
const SEARCH_KEY = ['logistics-contracts', 'suppliers-search'];

export function useSuppliersQuery() {
  return useQuery({ queryKey: QUERY_KEY, queryFn: listSuppliers });
}

/** @param {{page: number, pageSize: number, conditions?: any[]}} params */
export function useSearchSuppliersQuery({ page, pageSize, conditions = [] }) {
  return useQuery({
    queryKey: [...SEARCH_KEY, page, pageSize, conditions],
    queryFn: () => searchSuppliers({ page, pageSize, conditions }),
  });
}

/** @param {(value: any) => Promise<any>} mutationFn */
function useSupplierMutation(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        queryClient.invalidateQueries({ queryKey: SEARCH_KEY });
      }
    },
  });
}

export function useCreateSupplierMutation() {
  /** @param {any} payload */
  const mutation = (payload) => {
    const { values, extraFieldRows, bankAccounts, deliveryAddresses } = payload;
    return createSupplier(
      values,
      extraFieldRows,
      bankAccounts,
      deliveryAddresses,
    );
  };
  return useSupplierMutation(mutation);
}

export function useUpdateSupplierMutation() {
  /** @param {any} payload */
  const mutation = (payload) =>
    updateSupplier(
      payload.supplierId,
      payload.values,
      payload.extraFieldRows,
      payload.bankAccounts,
      payload.deliveryAddresses,
    );
  return useSupplierMutation(mutation);
}

export function useDeleteSupplierMutation() {
  return useSupplierMutation((/** @type {string} */ supplierId) =>
    deleteSupplier(supplierId),
  );
}
