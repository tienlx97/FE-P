'use client';

import { useQuery } from '@tanstack/react-query';

import { listVietnamBanks } from '@/shared/api/vietnam-banks.js';

/** Vietnamese bank catalog — code tile, full name, domestic bank picker. */
export function useVietnamBanksQuery() {
  return useQuery({
    queryKey: ['shared', 'vietnam-banks'],
    queryFn: listVietnamBanks,
    staleTime: Infinity,
  });
}
