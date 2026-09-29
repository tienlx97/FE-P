/**
 * @typedef {object} BackupFile
 * @property {string} fileName
 * @property {number} sizeBytes
 * @property {string} createdAtUtc
 */

export {};

/**
 * `GET /backups/restore-status` (readable without signing in): the latest
 * restore of the API process. `message` = fixed text when `Failed`.
 * @typedef {object} RestoreStatus
 * @property {'None' | 'Running' | 'Succeeded' | 'Failed'} state
 * @property {string | null} restoreId
 * @property {string | null} startedAtUtc
 * @property {string | null} finishedAtUtc
 * @property {string | null} message
 */

/**
 * @typedef {{lastSuccessUtc: string | null, lastAttemptUtc: string | null, status: 'healthy' | 'stale' | 'unknown' | 'error'}} OperationStatus
 * @typedef {{local: OperationStatus, smb: OperationStatus, restore: OperationStatus}} OperationsStatus
 */
