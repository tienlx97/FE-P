'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { saveContractChild } from '../api/contract-children.js';
import { contractKey, CONTRACTS_KEY } from './use-contracts.js';

/**
 * Saves an appendix / invoice / instalment change and puts the refreshed
 * contract the backend returns straight into the detail cache.
 * @param {string} contractId
 */
export function useContractChildMutation(contractId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      /** @type {import('../api/contract-children.js').ChildChange} */ change,
    ) => saveContractChild(contractId, change),
    onSuccess: (result) => {
      if (!result.success) return;
      queryClient.setQueryData(contractKey(contractId), result);
      queryClient.invalidateQueries({ queryKey: [...CONTRACTS_KEY, 'search'] });
    },
  });
}
