'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  confirmShipmentMilestone,
  getShipmentJourney,
  reopenShipmentMilestone,
} from '../api/shipment-journey.js';

/** Prefix shared by every shipment's journey — invalidated whenever a
 * shipment, its VGM records or their empty returns change. */
export const SHIPMENT_JOURNEY_QUERY_PREFIX = [
  'logistics-contracts',
  'shipment-journey',
];

/** @param {string} shipmentId */
const queryKey = (shipmentId) => [...SHIPMENT_JOURNEY_QUERY_PREFIX, shipmentId];

/**
 * @param {string} contractId
 * @param {string | undefined} shipmentId
 */
export function useShipmentJourneyQuery(contractId, shipmentId) {
  return useQuery({
    queryKey: queryKey(shipmentId ?? ''),
    queryFn: () =>
      getShipmentJourney(contractId, /** @type {string} */ (shipmentId)),
    enabled: Boolean(shipmentId),
  });
}

/**
 * Confirm / reopen a milestone; the response is the new journey, written
 * straight into the cache.
 * @param {string} contractId
 * @param {string} shipmentId
 */
export function useShipmentMilestoneMutations(contractId, shipmentId) {
  const queryClient = useQueryClient();
  /** @param {Awaited<ReturnType<typeof getShipmentJourney>>} result */
  const store = (result) => {
    if (result.success) {
      queryClient.setQueryData(queryKey(shipmentId), result);
    }
  };

  const confirm = useMutation({
    mutationFn: (
      /** @type {{ milestone: import('../types/index.js').ShipmentMilestone, completedOn: string, note: string }} */ {
        milestone,
        completedOn,
        note,
      },
    ) =>
      confirmShipmentMilestone(contractId, shipmentId, milestone, {
        completedOn,
        note,
      }),
    onSuccess: store,
  });

  const reopen = useMutation({
    mutationFn: (
      /** @type {import('../types/index.js').ShipmentMilestone} */ milestone,
    ) => reopenShipmentMilestone(contractId, shipmentId, milestone),
    onSuccess: store,
  });

  return { confirm, reopen };
}
