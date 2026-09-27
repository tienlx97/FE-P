'use client';

import { useQuery } from '@tanstack/react-query';

import { listShipmentOverview } from '../api/shipment-overview.js';
import { TRACKING_STALE_TIME } from './use-shipment-journey-query.js';

/** Every shipment still in progress (logistics home schedule). */
export function useShipmentOverviewQuery() {
  return useQuery({
    queryKey: ['logistics-contracts', 'shipment-overview'],
    queryFn: listShipmentOverview,
    staleTime: TRACKING_STALE_TIME,
  });
}
