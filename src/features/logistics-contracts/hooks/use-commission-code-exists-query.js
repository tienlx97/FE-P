'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { checkCommissionCodeExists } from '../api/commissions.js';

const QUERY_KEY = ['logistics-contracts', 'commission-code-exists'];
const DEBOUNCE_MS = 400;

/**
 * Debounces `code` and checks it against the backend as the user types, for
 * the Commission form's real-time duplicate warning — same idiom as
 * `useContractNumberExistsQuery`. `isChecking` covers both "waiting for the
 * debounce" and "request in flight" — the caller shouldn't show a stale
 * result while either is true.
 * @param {{ code: string, excludeCommissionId?: string | null }} params
 */
export function useCommissionCodeExistsQuery({ code, excludeCommissionId }) {
  const trimmed = code.trim();
  const [debounced, setDebounced] = useState(trimmed);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(trimmed), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [trimmed]);

  const query = useQuery({
    queryKey: [...QUERY_KEY, debounced, excludeCommissionId ?? null],
    queryFn: () =>
      checkCommissionCodeExists({ code: debounced, excludeCommissionId }),
    enabled: debounced.length > 0,
    staleTime: 10_000,
  });

  return {
    result: debounced.length > 0 ? query.data : undefined,
    isChecking:
      trimmed.length > 0 && (debounced !== trimmed || query.isFetching),
  };
}
