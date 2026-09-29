/**
 * "/live" — carrier API status, laid out like a status page
 * (status.anthropic.com): an overall banner, then per carrier its vessel
 * schedule and tracking integration with the current state, uptime and
 * one bar per day.
 */

/** Refresh of the page while open (the BE probes every 15 minutes). */
export const STATUS_REFRESH_MS = 60_000;

export const INTEGRATION_LABELS = /** @type {const} */ ({
  Schedule: 'Lịch tàu',
  Tracking: 'Tracking',
});

/**
 * Label and StatusDot variant of an integration's current state.
 * @param {import('../types/index.js').CarrierStatusComponent} component
 * @returns {{ label: string, variant: 'success' | 'warning' | 'error' | 'neutral' }}
 */
export function componentState(component) {
  if (!component.isImplemented) return { label: 'Chưa kết nối', variant: 'neutral' };
  if (!component.isWatched) return { label: 'Chưa cấu hình kiểm tra', variant: 'neutral' };
  switch (component.latest?.outcome) {
    case 'Up':
      return { label: 'Hoạt động', variant: 'success' };
    case 'Degraded':
      return { label: 'Chậm / không có dữ liệu', variant: 'warning' };
    case 'Down':
      return { label: 'Lỗi', variant: 'error' };
    default:
      return { label: 'Chưa kiểm tra', variant: 'neutral' };
  }
}

/**
 * The banner at the top of the page.
 * @param {import('../types/index.js').CarrierStatus['overall']} overall
 * @returns {{ status: 'success' | 'warning' | 'error' | 'info', title: string }}
 */
export function overallBanner(overall) {
  switch (overall) {
    case 'Up':
      return { status: 'success', title: 'Tất cả API hãng tàu đang hoạt động bình thường' };
    case 'Degraded':
      return { status: 'warning', title: 'Một số API hãng tàu đang chậm hoặc không trả dữ liệu' };
    case 'Down':
      return { status: 'error', title: 'Có API hãng tàu đang lỗi' };
    default:
      return { status: 'info', title: 'Chưa có lượt kiểm tra nào — bấm "Kiểm tra ngay"' };
  }
}

/**
 * A day bar's tooltip: `29/09/2026 · 56 lần kiểm tra · 2 lỗi`.
 * @param {import('../types/index.js').CarrierStatusDay} day
 */
export function dayTooltip(day) {
  const date = `${day.date.slice(8, 10)}/${day.date.slice(5, 7)}/${day.date.slice(0, 4)}`;
  if (day.checks === 0) return `${date} · Không có dữ liệu`;
  const problems = [
    day.down > 0 ? `${day.down} lỗi` : null,
    day.degraded > 0 ? `${day.degraded} chậm / rỗng` : null,
  ].filter(Boolean);
  return [date, `${day.checks} lần kiểm tra`, problems.length > 0 ? problems.join(', ') : 'không có sự cố'].join(' · ');
}

/**
 * `99.31% uptime`, `—` without probes.
 * @param {number | null} percent
 */
export function formatUptime(percent) {
  return percent === null ? '—' : `${Number(percent.toFixed(2))}% uptime`;
}

/**
 * `7,2 giây` / `850 ms`.
 * @param {number} ms
 */
export function formatLatency(ms) {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1).replace('.', ',')} giây` : `${ms} ms`;
}

/**
 * Carriers with at least one connected integration (shown as cards), and
 * the names of those with none (listed in one line).
 * @param {import('../types/index.js').CarrierStatusCarrier[]} carriers
 */
export function splitCarriers(carriers) {
  const connected = carriers.filter((entry) => entry.components.some((component) => component.isImplemented));
  const notConnected = carriers
    .filter((entry) => !entry.components.some((component) => component.isImplemented))
    .map((entry) => entry.carrier.name);
  return { connected, notConnected };
}

/**
 * `HH:mm dd/MM/yyyy` in Việt Nam time (a value without offset is UTC).
 * @param {string | null} utc
 */
export function formatCheckedAt(utc) {
  if (!utc) return '—';
  const hasOffset = /(?:Z|[+-]\d{2}:?\d{2})$/.test(utc);
  const local = new Date(Date.parse(hasOffset ? utc : `${utc}Z`) + 7 * 3_600_000).toISOString();
  return `${local.slice(11, 16)} ${local.slice(8, 10)}/${local.slice(5, 7)}/${local.slice(0, 4)}`;
}
