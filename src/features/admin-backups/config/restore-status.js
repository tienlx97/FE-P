/** How often the restore drawer asks how its restore is going. */
export const RESTORE_POLL_INTERVAL_MS = 3000;

/**
 * Where the restore `restoreId` stands, from the latest `restore-status`:
 * `running` also while the status still shows an older restore (or none),
 * `succeeded` / `failed` once this one has finished.
 * @param {import('../types/index.js').RestoreStatus | null | undefined} status
 * @param {string} restoreId
 * @returns {'running' | 'succeeded' | 'failed'}
 */
export function restoreOutcome(status, restoreId) {
  if (!status || status.restoreId !== restoreId) return 'running';
  if (status.state === 'Succeeded') return 'succeeded';
  if (status.state === 'Failed') return 'failed';
  return 'running';
}
