'use client';

import { useQueries } from '@tanstack/react-query';

import { listShipmentVgms } from '../api/shipment-vgms.js';

/** @param {string} shipmentId */
const queryKey = (shipmentId) => ['logistics-contracts', 'shipment-vgms', shipmentId];

/**
 * Batch VGM fetch across every shipment of one contract, for
 * `ContractFullViewPanel`'s search (which has to match container/seal
 * numbers without the user opening each shipment's own VGM tab first).
 * Shares `queryKey`/`queryFn` with `useShipmentVgmsQuery` so opening a
 * shipment's own VGM tab afterward hits cache instead of refetching. Only
 * call this from a component that itself only mounts while its caller
 * actually needs cross-shipment search — there is no `enabled` gate here,
 * so every shipment's VGM list fetches as soon as this runs.
 * @param {string} contractId
 * @param {string[]} shipmentIds
 * @returns {Map<string, import('../types/index.js').ShipmentVgm[]>}
 */
export function useShipmentsVgmsQueries(contractId, shipmentIds) {
  const results = useQueries({
    queries: shipmentIds.map((shipmentId) => ({
      queryKey: queryKey(shipmentId),
      queryFn: () => listShipmentVgms(contractId, shipmentId),
    })),
  });

  const vgmsByShipmentId = new Map();
  shipmentIds.forEach((shipmentId, index) => {
    const data = results[index]?.data;
    vgmsByShipmentId.set(shipmentId, data?.success ? data.vgms : []);
  });
  return vgmsByShipmentId;
}
