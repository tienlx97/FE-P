'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getContractPrivateInfo,
  upsertContractPrivateInfo,
} from '../api/contract-private-info.js';

/** @param {string} contractId */
const queryKey = (contractId) => [
  'logistics-contracts',
  'contract-private-info',
  contractId,
];

/**
 * Disabled until `contractId` is set — same guard as `useCommissionQuery`.
 * A caller lacking `logistics:secret` gets a real error here (403, folded
 * by `apiRequest` into the generic forbidden message), unlike
 * `useCommissionQuery`'s 404-as-`exists:false` fold, since the private-info
 * endpoint never 404s once the contract itself exists.
 * @param {string | undefined} contractId
 */
export function useContractPrivateInfoQuery(contractId) {
  return useQuery({
    queryKey: queryKey(contractId ?? ''),
    queryFn: () => getContractPrivateInfo(/** @type {string} */ (contractId)),
    enabled: Boolean(contractId),
  });
}

/** @param {string} contractId */
export function useUpsertContractPrivateInfoMutation(contractId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      /** @type {{ version?: number, values: import('../types/index.js').ContractPrivateInfoFormValues, extraFieldRows: import('../types/index.js').ExtraFieldRow[] }} */ {
        values,
        version,
        extraFieldRows,
      },
    ) => upsertContractPrivateInfo(contractId, values, extraFieldRows, version),
    onSuccess: (result) => {
      if (result.success || result.conflict) {
        return queryClient.invalidateQueries({ queryKey: queryKey(contractId) });
      }
    },
  });
}
