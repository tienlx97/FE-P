'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createPartyGroup, listPartyLookups, partyGroupRoute } from '../api/party-lookups.js';

/** @param {'customer' | 'supplier'} kind */
export function usePartyLookupsQuery(kind) {
  const groupRoute = partyGroupRoute(kind);
  const groups = useQuery({
    queryKey: ['logistics-contracts', groupRoute],
    queryFn: () => listPartyLookups(groupRoute, 'nhóm đối tác'),
  });
  const paymentTerms = useQuery({
    queryKey: ['logistics-contracts', 'payment-terms'],
    queryFn: () => listPartyLookups('payment-terms', 'điều khoản thanh toán'),
  });
  return {
    groups: groups.data?.success ? groups.data.items : [],
    paymentTerms: paymentTerms.data?.success ? paymentTerms.data.items : [],
  };
}

/** @param {'customer' | 'supplier'} kind */
export function useCreatePartyGroupMutation(kind) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (/** @type {string} */ name) => createPartyGroup(kind, name),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['logistics-contracts', partyGroupRoute(kind)] });
      }
    },
  });
}
