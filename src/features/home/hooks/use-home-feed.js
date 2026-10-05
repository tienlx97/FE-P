'use client';
import { useQuery } from '@tanstack/react-query';

import { getHomeFeed } from '../api/feed.js';

export function useHomeFeed() {
  return useQuery({
    queryKey: ['home', 'public-feed'],
    queryFn: getHomeFeed,
    staleTime: 120_000,
    refetchInterval: 15 * 60_000,
    retry: 1,
  });
}
