'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createBackup } from '../api/backups.js';
import { BACKUPS_QUERY_KEY } from './use-backups-query.js';

export function useCreateBackupMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBackup,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: BACKUPS_QUERY_KEY });
      }
    },
  });
}
