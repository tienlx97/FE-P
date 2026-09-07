'use client';

import { useQuery } from '@tanstack/react-query';

import { listBackups } from '../api/backups.js';

export const BACKUPS_QUERY_KEY = ['admin-backups', 'backups'];

export function useBackupsQuery() {
  return useQuery({
    queryKey: BACKUPS_QUERY_KEY,
    queryFn: listBackups,
  });
}
