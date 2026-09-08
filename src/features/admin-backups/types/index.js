/**
 * @typedef {object} BackupFile
 * @property {string} fileName
 * @property {number} sizeBytes
 * @property {string} createdAtUtc
 */

export {};

/**
 * @typedef {{lastSuccessUtc: string | null, lastAttemptUtc: string | null, status: 'healthy' | 'stale' | 'unknown' | 'error'}} OperationStatus
 * @typedef {{local: OperationStatus, smb: OperationStatus, restore: OperationStatus}} OperationsStatus
 */
