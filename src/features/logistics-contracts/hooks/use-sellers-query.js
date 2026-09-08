'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createSeller, deleteSeller, listSellers } from '../api/sellers.js';

const QUERY_KEY = ['logistics-contracts', 'sellers'];

export function useSellersQuery() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: listSellers,
  });
}

export function useCreateSellerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      /** @type {{ values: import('../types/index.js').SellerFormValues, extraFieldRows: import('../types/index.js').ExtraFieldRow[] }} */ {
        values,
        extraFieldRows,
      },
    ) => createSeller(values, extraFieldRows),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      }
    },
  });
}

export function useDeleteSellerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (/** @type {string} */ sellerId) => deleteSeller(sellerId),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      }
    },
  });
}
