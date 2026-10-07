'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  listOnBehalfCostTotals,
  listSupplierOnBehalfCosts,
  markOnBehalfCostsReimbursed,
} from '../api/supplier-on-behalf-costs.js';

/** Every paid-on-behalf query (per supplier and the totals). */
export const ON_BEHALF_KEY = ['logistics-contracts', 'supplier-on-behalf'];

/**
 * @param {string} supplierId
 * @param {{ from?: string, to?: string, status?: import('../types/index.js').OnBehalfCostStatus }} filters
 */
export function useSupplierOnBehalfCostsQuery(supplierId, filters) {
  return useQuery({
    queryKey: [...ON_BEHALF_KEY, supplierId, filters],
    queryFn: () => listSupplierOnBehalfCosts(supplierId, filters),
  });
}

export function useOnBehalfCostTotalsQuery() {
  return useQuery({
    queryKey: [...ON_BEHALF_KEY, 'totals'],
    queryFn: listOnBehalfCostTotals,
  });
}

/**
 * Reimbursement bumps each touched shipment's version, so open shipment
 * data refetches too.
 * @param {string} supplierId
 */
export function useMarkOnBehalfCostsReimbursedMutation(supplierId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      /** @type {{ costIds: string[], reimbursedOn: string | null, reference?: string }} */ values,
    ) => markOnBehalfCostsReimbursed(supplierId, values),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ON_BEHALF_KEY }),
        queryClient.invalidateQueries({
          queryKey: ['logistics-contracts', 'shipments'],
        }),
      ]),
  });
}
