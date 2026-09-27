'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getShipmentTracking,
  resolveTrackingDiscrepancy,
  syncShipmentTracking,
} from '../api/shipment-tracking.js';
import {
  invalidateShipmentTracking,
  TRACKING_STALE_TIME,
} from './use-shipment-journey-query.js';

/** @param {string} shipmentId */
const queryKey = (shipmentId) => ['logistics-contracts', 'shipment-carrier-tracking', shipmentId];

/**
 * Carrier tracking of one shipment (BE-kt-xnk `add-carrier-tracking`).
 * @param {string} contractId
 * @param {string | undefined} shipmentId
 */
export function useShipmentTrackingQuery(contractId, shipmentId) {
  return useQuery({
    queryKey: queryKey(shipmentId ?? ''),
    queryFn: () => getShipmentTracking(contractId, /** @type {string} */ (shipmentId)),
    enabled: Boolean(shipmentId),
    staleTime: TRACKING_STALE_TIME,
  });
}

/**
 * "Đồng bộ ngay" and accept / dismiss of "Hãng tàu báo khác". A sync or an
 * accepted value can fill container dates, ATD / ATA and revise ETD / ETA,
 * so the shipment, its containers, journey, schedule and alerts refresh.
 * @param {string} contractId
 * @param {string} shipmentId
 */
export function useShipmentTrackingMutations(contractId, shipmentId) {
  const queryClient = useQueryClient();
  const refresh = (/** @type {Awaited<ReturnType<typeof syncShipmentTracking>>} */ result) => {
    if (!result.success) return undefined;
    queryClient.setQueryData(queryKey(shipmentId), result);
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: ['logistics-contracts', 'shipments', contractId] }),
      queryClient.invalidateQueries({ queryKey: ['logistics-contracts', 'shipments-list'] }),
      queryClient.invalidateQueries({ queryKey: ['logistics-contracts', 'shipment-vgms', shipmentId] }),
      invalidateShipmentTracking(queryClient),
    ]);
  };

  const sync = useMutation({
    mutationFn: () => syncShipmentTracking(contractId, shipmentId),
    onSuccess: refresh,
  });
  const resolve = useMutation({
    mutationFn: (
      /** @type {{ discrepancyId: string, action: 'accept' | 'dismiss' }} */ { discrepancyId, action },
    ) => resolveTrackingDiscrepancy(contractId, shipmentId, discrepancyId, action),
    onSuccess: refresh,
  });

  return { sync, resolve };
}
