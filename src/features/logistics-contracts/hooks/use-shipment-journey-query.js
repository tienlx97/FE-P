'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  confirmShipmentMilestone,
  getShipmentJourney,
  getShipmentJourneyEvents,
  reopenShipmentMilestone,
} from '../api/shipment-journey.js';

/** Prefix shared by every shipment's journey — invalidated whenever a
 * shipment, its VGM records or their empty returns change. */
export const SHIPMENT_JOURNEY_QUERY_PREFIX = [
  'logistics-contracts',
  'shipment-journey',
];

export const SHIPMENT_JOURNEY_EVENTS_QUERY_PREFIX = [
  'logistics-contracts',
  'shipment-journey-events',
];

/** Prefix shared by every shipment's schedule (history, free time). */
export const SHIPMENT_SCHEDULE_QUERY_PREFIX = [
  'logistics-contracts',
  'shipment-schedule',
];

/**
 * Tracking data changes on user saves (which refresh it explicitly), not on
 * its own: keep it fresh for 30 s so refocusing the window or remounting a
 * tab does not refetch the journey, schedule and alerts every time.
 */
export const TRACKING_STALE_TIME = 30_000;

/**
 * Reference data (cost groups, supplier directory) changes on explicit admin
 * saves, which invalidate their own keys: do not refetch it on every mount
 * or window focus.
 */
export const REFERENCE_DATA_STALE_TIME = 5 * 60_000;

/** The cross-shipment alert list. */
export const SHIPMENT_ALERTS_QUERY_KEY = ['logistics-contracts', 'shipment-alerts'];

/**
 * Refreshes everything computed from a shipment's tracking data — the
 * journey, the schedule and the alerts — after a shipment, its containers
 * or its schedule change.
 * @param {import('@tanstack/react-query').QueryClient} queryClient
 */
export function invalidateShipmentTracking(queryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: SHIPMENT_JOURNEY_QUERY_PREFIX }),
    queryClient.invalidateQueries({ queryKey: SHIPMENT_JOURNEY_EVENTS_QUERY_PREFIX }),
    queryClient.invalidateQueries({ queryKey: SHIPMENT_SCHEDULE_QUERY_PREFIX }),
    queryClient.invalidateQueries({ queryKey: SHIPMENT_ALERTS_QUERY_KEY }),
  ]);
}

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
    staleTime: TRACKING_STALE_TIME,
  });
}

/** @param {string} contractId @param {string | undefined} shipmentId @param {boolean} enabled */
export function useShipmentJourneyEventsQuery(contractId, shipmentId, enabled = true) {
  return useQuery({
    queryKey: [...SHIPMENT_JOURNEY_EVENTS_QUERY_PREFIX, shipmentId ?? ''],
    queryFn: () => getShipmentJourneyEvents(contractId, /** @type {string} */ (shipmentId)),
    enabled: enabled && Boolean(shipmentId),
    staleTime: TRACKING_STALE_TIME,
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
      queryClient.invalidateQueries({ queryKey: SHIPMENT_ALERTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SHIPMENT_JOURNEY_EVENTS_QUERY_PREFIX });
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
