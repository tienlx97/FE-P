'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { listShipmentAlerts } from '../api/shipment-alerts.js';
import {
  getShipmentSchedule,
  replaceShipmentTransshipment,
  updateShipmentDocuments,
  updateShipmentSchedule,
} from '../api/shipment-schedule.js';
import {
  invalidateShipmentTracking,
  SHIPMENT_ALERTS_QUERY_KEY,
  SHIPMENT_SCHEDULE_QUERY_PREFIX,
} from './use-shipment-journey-query.js';

/**
 * @param {string} contractId
 * @param {string | undefined} shipmentId
 */
export function useShipmentScheduleQuery(contractId, shipmentId) {
  return useQuery({
    queryKey: [...SHIPMENT_SCHEDULE_QUERY_PREFIX, shipmentId ?? ''],
    queryFn: () =>
      getShipmentSchedule(contractId, /** @type {string} */ (shipmentId)),
    enabled: Boolean(shipmentId),
  });
}

/**
 * "Cập nhật lịch tàu". The shipment itself changes too (ETD / ETA,
 * version), so its lists are refreshed with the tracking queries.
 * @param {string} contractId
 * @param {string} shipmentId
 */
export function useUpdateShipmentScheduleMutation(contractId, shipmentId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      /** @type {{ version: number, values: import('../types/index.js').ShipmentScheduleFormValues }} */ {
        version,
        values,
      },
    ) => updateShipmentSchedule(contractId, shipmentId, version, values),
    onSuccess: (result) =>
      result.success
        ? Promise.all([
            queryClient.invalidateQueries({
              queryKey: ['logistics-contracts', 'shipments', contractId],
            }),
            queryClient.invalidateQueries({
              queryKey: ['logistics-contracts', 'shipments-list'],
            }),
            invalidateShipmentTracking(queryClient),
          ])
        : undefined,
  });
}

/**
 * B/L progress and transshipment legs; both answer with the schedule and
 * change the alerts (and the routing flag on the shipment).
 * @param {string} contractId
 * @param {string} shipmentId
 */
export function useShipmentDocumentsMutations(contractId, shipmentId) {
  const queryClient = useQueryClient();
  const refresh = (/** @type {{ success: boolean }} */ result) =>
    result.success
      ? Promise.all([
          queryClient.invalidateQueries({
            queryKey: ['logistics-contracts', 'shipments', contractId],
          }),
          invalidateShipmentTracking(queryClient),
        ])
      : undefined;

  const documents = useMutation({
    mutationFn: (
      /** @type {import('../types/index.js').ShipmentDocuments} */ values,
    ) => updateShipmentDocuments(contractId, shipmentId, values),
    onSuccess: refresh,
  });
  const transshipment = useMutation({
    mutationFn: (
      /** @type {import('../types/index.js').TransshipmentLegFormRow[]} */ rows,
    ) => replaceShipmentTransshipment(contractId, shipmentId, rows),
    onSuccess: refresh,
  });

  return { documents, transshipment };
}

/** Every visible shipment with alerts. */
export function useShipmentAlertsQuery() {
  return useQuery({
    queryKey: SHIPMENT_ALERTS_QUERY_KEY,
    queryFn: listShipmentAlerts,
  });
}
