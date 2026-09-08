import { useQuery } from '@tanstack/react-query';

import { getOperationsStatus } from '../api/backups.js';

export function useOperationsStatusQuery() {
  return useQuery({
    queryKey: ['admin-backups', 'operations-status'],
    queryFn: getOperationsStatus,
    refetchInterval: 60000,
  });
}
