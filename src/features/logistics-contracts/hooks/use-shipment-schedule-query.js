'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { listShipmentAlerts } from '../api/shipment-alerts.js';
import {
  getShipmentSchedule,
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

/** Every visible shipment with alerts. */
export function useShipmentAlertsQuery() {
  return useQuery({
    queryKey: SHIPMENT_ALERTS_QUERY_KEY,
    queryFn: listShipmentAlerts,
  });
}
