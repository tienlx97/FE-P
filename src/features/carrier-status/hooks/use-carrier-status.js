'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { checkCarrierStatus, getCarrierStatus } from '../api/carrier-status.js';
import { STATUS_REFRESH_MS } from '../config/carrier-status.js';

const QUERY_KEY = ['carrier-status'];

export function useCarrierStatusQuery() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getCarrierStatus,
    refetchInterval: STATUS_REFRESH_MS,
  });
}

/** Probes now; the answer replaces the cached status. */
export function useCheckCarrierStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: checkCarrierStatus,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.setQueryData(QUERY_KEY, result);
      }
    },
  });
}
