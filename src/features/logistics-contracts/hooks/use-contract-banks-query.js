'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createContractBank,
  listContractBanks,
} from '../api/contract-banks.js';

const QUERY_KEY = ['logistics-contracts', 'contract-banks'];

export function useContractBanksQuery() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: listContractBanks,
  });
}

export function useCreateContractBankMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      /** @type {{ values: import('../types/index.js').ContractBankFormValues, extraFieldRows: import('../types/index.js').ExtraFieldRow[] }} */ {
        values,
        extraFieldRows,
      },
    ) => createContractBank(values, extraFieldRows),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      }
    },
  });
}
