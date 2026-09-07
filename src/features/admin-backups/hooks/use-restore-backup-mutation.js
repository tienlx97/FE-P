'use client';

import { useMutation } from '@tanstack/react-query';

import { restoreBackup } from '../api/backups.js';

/**
 * No query invalidation on settle: a successful restore replaces the entire
 * database, which makes every cached query result across the app stale, not
 * just this feature's — the dialog reloads the page after a success instead
 * of trying to selectively invalidate.
 * @param {string} fileName
 */
export function useRestoreBackupMutation(fileName) {
  return useMutation({
    mutationFn: (/** @type {string} */ confirmDatabaseName) =>
      restoreBackup(fileName, confirmDatabaseName),
  });
}
