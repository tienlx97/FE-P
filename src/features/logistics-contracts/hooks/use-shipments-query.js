'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createShipment,
  listShipments,
  updateShipment,
} from '../api/shipments.js';

/** @param {string} contractId */
const queryKey = (contractId) => [
  'logistics-contracts',
  'shipments',
  contractId,
];

/**
 * Per-contract shipment list — only meaningful once a contract exists, so
 * disabled until `contractId` is set (e.g. before the row expansion panel
 * that owns this query has mounted).
 * @param {string | undefined} contractId
 */
export function useShipmentsQuery(contractId) {
  return useQuery({
    queryKey: queryKey(contractId ?? ''),
    queryFn: () => listShipments(/** @type {string} */ (contractId)),
    enabled: Boolean(contractId),
  });
}

/** @param {string} contractId */
export function useCreateShipmentMutation(contractId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      /** @type {{ values: import('../types/index.js').ShipmentFormValues, costLines?: Parameters<typeof createShipment>[2] }} */ {
        values,
        costLines,
      },
    ) => createShipment(contractId, values, costLines),
    onSuccess: (result) => {
      if (result.success || result.conflict) {
        return Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKey(contractId) }),
          queryClient.invalidateQueries({
            queryKey: ['logistics-contracts', 'shipments-list'],
          }),
        ]);
      }
    },
  });
}

/** @param {string} contractId */
export function useUpdateShipmentMutation(contractId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      /** @type {{ shipmentId: string, version?: number, values: import('../types/index.js').ShipmentFormValues, costLines?: Parameters<typeof updateShipment>[3] }} */ {
        shipmentId,
        version,
        values,
        costLines,
      },
    ) => updateShipment(contractId, shipmentId, values, costLines, version),
    onSuccess: (result) => {
      if (result.success || result.conflict) {
        return Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKey(contractId) }),
          queryClient.invalidateQueries({
            queryKey: ['logistics-contracts', 'shipments-list'],
          }),
        ]);
      }
    },
  });
}
