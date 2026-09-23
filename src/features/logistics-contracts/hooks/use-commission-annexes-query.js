'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createCommissionAnnex,
  listCommissionAnnexes,
  updateCommissionAnnex,
} from '../api/commission-annexes.js';

/** @param {string} contractId */
const queryKey = (contractId) => [
  'logistics-contracts',
  'commission-annexes',
  contractId,
];

/**
 * Per-contract annex list for the contract's `Commission` — only
 * meaningful once one exists, so disabled until `contractId` is set.
 * @param {string | undefined} contractId
 */
export function useCommissionAnnexesQuery(contractId) {
  return useQuery({
    queryKey: queryKey(contractId ?? ''),
    queryFn: () => listCommissionAnnexes(/** @type {string} */ (contractId)),
    enabled: Boolean(contractId),
  });
}

/** @param {string} contractId */
export function useCreateCommissionAnnexMutation(contractId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      /** @type {import('../types/index.js').CommissionAnnexFormValues} */ values,
    ) => createCommissionAnnex(contractId, values),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: queryKey(contractId) });
      }
    },
  });
}

/** @param {string} contractId */
export function useUpdateCommissionAnnexMutation(contractId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      /** @type {{ annexId: string, values: import('../types/index.js').CommissionAnnexFormValues }} */ {
        annexId,
        values,
      },
    ) => updateCommissionAnnex(contractId, annexId, values),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: queryKey(contractId) });
      }
    },
  });
}
