'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { checkContractNumberExists } from '../api/contracts.js';

const QUERY_KEY = ['logistics-contracts', 'contract-number-exists'];
const DEBOUNCE_MS = 400;

/**
 * Debounces `contractNumber` and checks it against the backend as the user
 * types, for the Contract form's real-time duplicate warning. `isChecking`
 * covers both "waiting for the debounce" and "request in flight" — the
 * caller shouldn't show a stale result while either is true.
 * Numbers are unique per company (BE-P) — `companyId` scopes the check.
 * @param {{ contractNumber: string, excludeContractId?: string | null, companyId?: string | null }} params
 */
export function useContractNumberExistsQuery({
  contractNumber,
  excludeContractId,
  companyId,
}) {
  const trimmed = contractNumber.trim();
  const [debounced, setDebounced] = useState(trimmed);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(trimmed), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [trimmed]);

  const query = useQuery({
    queryKey: [
      ...QUERY_KEY,
      debounced,
      excludeContractId ?? null,
      companyId ?? null,
    ],
    queryFn: () =>
      checkContractNumberExists({
        contractNumber: debounced,
        excludeContractId,
        companyId,
      }),
    enabled: debounced.length > 0,
    staleTime: 10_000,
  });

  return {
    result: debounced.length > 0 ? query.data : undefined,
    isChecking:
      trimmed.length > 0 && (debounced !== trimmed || query.isFetching),
  };
}
