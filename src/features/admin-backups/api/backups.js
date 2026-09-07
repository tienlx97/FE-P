import { apiRequest } from '@/shared/api/api-client.js';
import { API_PROXY_PREFIX } from '@/shared/config/api-config.js';

const GENERIC_LIST_ERROR = 'Không thể tải danh sách bản sao lưu';
const GENERIC_CREATE_ERROR = 'Không thể tạo bản sao lưu';
const GENERIC_RESTORE_ERROR = 'Không thể khôi phục bản sao lưu';

/**
 * Admin-only. All backups currently on the server, newest first.
 * @returns {Promise<{ success: true, backups: import('../types/index.js').BackupFile[] } | { success: false, message: string }>}
 */
export async function listBackups() {
  const result = await apiRequest('/api/v1/backups', {
    errorMessage: GENERIC_LIST_ERROR,
  });

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return { success: true, backups: result.data ?? [] };
}

/**
 * Admin-only. Takes a fresh backup right now — same `mysqldump` the nightly
 * cron and a manual restore both use (see BE-kt-xnk's README.LAN.md).
 * @returns {Promise<{ success: true, backup: import('../types/index.js').BackupFile } | { success: false, message: string }>}
 */
export async function createBackup() {
  const result = await apiRequest('/api/v1/backups', {
    method: 'POST',
    errorMessage: GENERIC_CREATE_ERROR,
  });

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return { success: true, backup: result.data };
}

/**
 * Admin-only. Overwrites the live database from `fileName` — destructive and
 * irreversible from inside the app. The backend requires `confirmDatabaseName`
 * to exactly match the live database's name as a confirmation step (see the
 * API's `Backups.md`).
 * @param {string} fileName
 * @param {string} confirmDatabaseName
 * @returns {Promise<{ success: true } | { success: false, message: string }>}
 */
export async function restoreBackup(fileName, confirmDatabaseName) {
  const result = await apiRequest(
    `/api/v1/backups/${encodeURIComponent(fileName)}/restore`,
    {
      method: 'POST',
      errorMessage: GENERIC_RESTORE_ERROR,
      body: { ConfirmDatabaseName: confirmDatabaseName },
    },
  );

  if (!result.success) {
    return { success: false, message: result.message };
  }

  return { success: true };
}

/**
 * A same-origin URL a plain `<a download>` can point at — the browser
 * carries the session cookie automatically, and the `/api/backend` proxy
 * attaches the bearer token server-side, so this needs no fetch/blob
 * handling of its own.
 * @param {string} fileName
 */
export function downloadBackupUrl(fileName) {
  return `${API_PROXY_PREFIX}/api/v1/backups/${encodeURIComponent(fileName)}/download`;
}
