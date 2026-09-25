'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import {
  changeBankAccount,
  partyBankAccountEndpoint,
} from '@/shared/api/bank-accounts.js';

import { createSeller, deleteSeller, listSellers } from '../api/sellers.js';

const QUERY_KEY = ['logistics-contracts', 'sellers'];

export function useSellersQuery() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: listSellers,
  });
}

/**
 * Every seller's bank account by id — a contract's beneficiary banks
 * (`bankIds`) are accounts of its seller (BE-kt-xnk `unify-bank-accounts`).
 * @returns {Map<string, import('@/shared/api/bank-accounts.js').BankAccount>}
 */
export function useSellerBankAccountsById() {
  const sellersQuery = useSellersQuery();
  return useMemo(
    () =>
      new Map(
        (sellersQuery.data?.success ? sellersQuery.data.sellers : []).flatMap(
          (seller) =>
            (seller.bankAccounts ?? []).map((account) => [
              /** @type {string} */ (account.id),
              account,
            ]),
        ),
      ),
    [sellersQuery.data],
  );
}

/**
 * Adds / edits one of a seller's bank accounts (shared per-account
 * endpoint), then refetches the sellers so pickers see it.
 */
export function useChangeSellerBankAccount() {
  const queryClient = useQueryClient();
  return async (
    /** @type {string} */ sellerId,
    /** @type {Parameters<typeof changeBankAccount>[1]} */ operation,
  ) => {
    const result = await changeBankAccount(
      partyBankAccountEndpoint('sellers', sellerId),
      operation,
    );
    if (result.success) {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    }
    return result;
  };
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
