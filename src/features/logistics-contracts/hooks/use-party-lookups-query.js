'use client';

import { useQuery } from '@tanstack/react-query';

import { listPartyLookups } from '../api/party-lookups.js';

/** @param {'customer' | 'supplier'} kind */
export function usePartyLookupsQuery(kind) {
  const groupRoute = kind === 'customer' ? 'customer-groups' : 'supplier-groups';
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
