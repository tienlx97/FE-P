'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createCommission,
  getCommission,
  updateCommission,
} from '../api/commissions.js';

/** @param {string} contractId */
const queryKey = (contractId) => [
  'logistics-contracts',
  'commission',
  contractId,
];

/**
 * At most one per contract, optional — a 404 folds into
 * `{ success: true, exists: false }` (see `api/commissions.js`), not
 * a query error. Disabled until `contractId` is set.
 * @param {string | undefined} contractId
 */
export function useCommissionQuery(contractId) {
  return useQuery({
    queryKey: queryKey(contractId ?? ''),
    queryFn: () => getCommission(/** @type {string} */ (contractId)),
    enabled: Boolean(contractId),
  });
}

/** @param {string} contractId */
export function useCreateCommissionMutation(contractId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      /** @type {{ values: import('../types/index.js').CommissionFormValues, paymentTerms: Parameters<typeof createCommission>[2], paymentHistory: Parameters<typeof createCommission>[3] }} */ {
        values,
        paymentTerms,
        paymentHistory,
      },
    ) => createCommission(contractId, values, paymentTerms, paymentHistory),
    onSuccess: (result) => {
      if (result.success) {
        return Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKey(contractId) }),
          queryClient.invalidateQueries({
            queryKey: ['logistics-contracts', 'commissions-list'],
          }),
        ]);
      }
    },
  });
}

/** @param {string} contractId */
export function useUpdateCommissionMutation(contractId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      /** @type {{ values: import('../types/index.js').CommissionFormValues, paymentTerms: Parameters<typeof updateCommission>[2], paymentHistory: Parameters<typeof updateCommission>[3] }} */ {
        values,
        paymentTerms,
        paymentHistory,
      },
    ) => updateCommission(contractId, values, paymentTerms, paymentHistory),
    onSuccess: (result) => {
      if (result.success) {
        return Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKey(contractId) }),
          queryClient.invalidateQueries({
            queryKey: ['logistics-contracts', 'commissions-list'],
          }),
        ]);
      }
    },
  });
}
