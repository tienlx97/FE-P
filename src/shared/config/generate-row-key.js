/**
 * Local, non-persisted row identifier — React list `key` / row-tracking
 * token for editable-grid state (payment terms, extra fields, cost lines...).
 * Never sent to the backend, so it doesn't need to be a real UUID — only
 * unique within the array it's added to.
 *
 * `crypto.randomUUID()` requires a secure context (HTTPS or `localhost`);
 * it's `undefined` on a plain-HTTP LAN deployment (see
 * `docker-compose.lan.yml`), which crashed every form using it. Fall back
 * to a non-crypto token there.
 * @returns {string}
 */
export function generateRowKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
