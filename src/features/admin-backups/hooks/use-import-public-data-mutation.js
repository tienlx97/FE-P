'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { importPublicData } from '../api/backups.js';

export function useImportPublicDataMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: importPublicData,
    onSuccess: (result) => {
      if (result.success) queryClient.invalidateQueries();
    },
  });
}
