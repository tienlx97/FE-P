'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createDeliveryPlace,
  listDeliveryPlaces,
} from '../api/delivery-places.js';

const QUERY_KEY = ['logistics-contracts', 'delivery-places'];

/**
 * @param {{ countryId?: string, enabled?: boolean }} [options] Filter to
 *   places of one country; omit `countryId` to list places of every
 *   country. `enabled` (default `true`) lets a caller that only wants a
 *   country-scoped list — never the unfiltered one — skip fetching until
 *   `countryId` is known, mirroring `useBranchesQuery(companyId)`.
 */
export function useDeliveryPlacesQuery({ countryId, enabled = true } = {}) {
  return useQuery({
    queryKey: [...QUERY_KEY, countryId ?? null],
    queryFn: () => listDeliveryPlaces({ countryId }),
    enabled,
  });
}

export function useCreateDeliveryPlaceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      /** @type {{ values: import('../types/index.js').DeliveryPlaceFormValues }} */ {
        values,
      },
    ) => createDeliveryPlace(values),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      }
    },
  });
}
