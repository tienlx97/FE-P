'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { uploadBackup } from '../api/backups.js';
import { BACKUPS_QUERY_KEY } from './use-backups-query.js';

export function useUploadBackupMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadBackup,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: BACKUPS_QUERY_KEY });
      }
    },
  });
}
