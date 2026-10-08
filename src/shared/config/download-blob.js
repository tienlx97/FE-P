/**
 * Saves `blob` as `fileName` through a temporary link. The object URL is
 * revoked a minute later, not right after `click()`: revoking in the same
 * task makes Chrome cancel the download before it reads the blob (seen with
 * the "Chụp bảng" PNG, 2026-10-08).
 * @param {Blob} blob
 * @param {string} fileName - with extension
 */
export function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
