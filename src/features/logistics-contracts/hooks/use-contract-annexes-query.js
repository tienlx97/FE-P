'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createContractAnnex,
  deleteContractAnnex,
  listContractAnnexes,
  updateContractAnnex,
} from '../api/contract-annexes.js';

/** @param {string} contractId */
const queryKey = (contractId) => [
  'logistics-contracts',
  'contract-annexes',
  contractId,
];

/**
 * Per-contract annex list — only meaningful once a contract exists, so
 * disabled until `contractId` is set (e.g. before the row expansion panel
 * that owns this query has mounted).
 * @param {string | undefined} contractId
 */
export function useContractAnnexesQuery(contractId) {
  return useQuery({
    queryKey: queryKey(contractId ?? ''),
    queryFn: () => listContractAnnexes(/** @type {string} */ (contractId)),
    enabled: Boolean(contractId),
  });
}

/** @param {string} contractId */
export function useCreateContractAnnexMutation(contractId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      /** @type {import('../types/index.js').ContractAnnexFormValues} */ values,
    ) => createContractAnnex(contractId, values),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: queryKey(contractId) });
      }
    },
  });
}

/** @param {string} contractId */
export function useUpdateContractAnnexMutation(contractId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      /** @type {{ annexId: string, values: import('../types/index.js').ContractAnnexFormValues }} */ {
        annexId,
        values,
      },
    ) => updateContractAnnex(contractId, annexId, values),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: queryKey(contractId) });
      }
    },
  });
}

/** @param {string} contractId */
export function useDeleteContractAnnexMutation(contractId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (/** @type {string} */ annexId) =>
      deleteContractAnnex(contractId, annexId),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: queryKey(contractId) });
      }
    },
  });
}
