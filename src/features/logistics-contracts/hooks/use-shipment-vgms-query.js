'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createShipmentVgm,
  deleteShipmentVgm,
  listShipmentVgms,
  updateShipmentVgm,
} from '../api/shipment-vgms.js';

/** @param {string} shipmentId */
const queryKey = (shipmentId) => [
  'logistics-contracts',
  'shipment-vgms',
  shipmentId,
];

/**
 * Per-shipment VGM list — only meaningful once a shipment exists, so
 * disabled until `shipmentId` is set.
 * @param {string} contractId
 * @param {string | undefined} shipmentId
 */
export function useShipmentVgmsQuery(contractId, shipmentId) {
  return useQuery({
    queryKey: queryKey(shipmentId ?? ''),
    queryFn: () =>
      listShipmentVgms(contractId, /** @type {string} */ (shipmentId)),
    enabled: Boolean(shipmentId),
  });
}

/** @param {string} contractId @param {string} shipmentId */
export function useCreateShipmentVgmMutation(contractId, shipmentId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      /** @type {import('../types/index.js').ShipmentVgmFormValues} */ values,
    ) => createShipmentVgm(contractId, shipmentId, values),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: queryKey(shipmentId) });
      }
    },
  });
}

/** @param {string} contractId @param {string} shipmentId */
export function useUpdateShipmentVgmMutation(contractId, shipmentId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      /** @type {{ vgmId: string, values: import('../types/index.js').ShipmentVgmFormValues }} */ {
        vgmId,
        values,
      },
    ) => updateShipmentVgm(contractId, shipmentId, vgmId, values),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: queryKey(shipmentId) });
      }
    },
  });
}

/** @param {string} contractId @param {string} shipmentId */
export function useDeleteShipmentVgmMutation(contractId, shipmentId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (/** @type {string} */ vgmId) =>
      deleteShipmentVgm(contractId, shipmentId, vgmId),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: queryKey(shipmentId) });
      }
    },
  });
}
