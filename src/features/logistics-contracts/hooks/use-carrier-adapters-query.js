'use client';

import { useQuery } from '@tanstack/react-query';

import { listCarrierAdapters } from '../api/carrier-schedules.js';

/** Every carrier with its tracking / vessel schedule adapters (rarely changes). */
export function useCarrierAdaptersQuery() {
  return useQuery({
    queryKey: ['logistics-contracts', 'carrier-adapters'],
    queryFn: listCarrierAdapters,
    staleTime: 10 * 60 * 1000,
  });
}
