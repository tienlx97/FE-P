'use client';

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { createPort, listPorts, searchPorts } from '../api/ports.js';

const QUERY_KEY = ['logistics-contracts', 'ports'];

/**
 * Ports of one country (contract pickers). `enabled` lets a caller skip
 * fetching until `countryId` is known — never the unfiltered ~17.5k list.
 * @param {{ countryId?: string, enabled?: boolean }} [options]
 */
export function usePortsQuery({ countryId, enabled = true } = {}) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'by-country', countryId ?? null],
    queryFn: () => listPorts({ countryId }),
    enabled: enabled && Boolean(countryId),
  });
}

/** @param {{ page: number, pageSize: number, conditions?: any[] }} params */
export function useSearchPortsQuery({ page, pageSize, conditions = [] }) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'search', page, pageSize, conditions],
    queryFn: () => searchPorts({ page, pageSize, conditions }),
    placeholderData: keepPreviousData,
  });
}

export function useCreatePortMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      /** @type {{ values: import('../types/index.js').PortFormValues }} */ {
        values,
      },
    ) => createPort(values),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      }
    },
  });
}
