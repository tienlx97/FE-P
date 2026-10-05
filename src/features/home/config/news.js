/** @typedef {'default'|'red'|'orange'|'yellow'|'green'|'teal'|'cyan'|'blue'|'purple'|'pink'|'gray'} TokenColor */

/** Category colour per publisher so a scanning eye can group stories by source. */
const PUBLISHER_COLORS = /** @type {Record<string, TokenColor>} */ ({
  VnExpress: 'purple',
  'Tuổi Trẻ': 'blue',
  'Thanh Niên': 'teal',
  'Dân trí': 'green',
  VietnamPlus: 'orange',
  'Nhân Dân': 'pink',
});

/** @param {string} source @returns {TokenColor} */
export function publisherColor(source) {
  return PUBLISHER_COLORS[source] ?? 'gray';
}

/** Publishers in feed order, for the filter control. @param {{source:string}[]} articles */
export function publishers(articles) {
  return [...new Set(articles.map((article) => article.source))];
}

/**
 * "Vừa xong" / "12 phút trước" / "3 giờ trước" within a day, else the date.
 * @param {string|null} value @param {number} now epoch ms
 */
export function relativeTime(value, now) {
  const time = value ? new Date(value).getTime() : NaN;
  if (!Number.isFinite(time)) return 'Chưa có thời gian đăng';
  const minutes = Math.floor((now - time) / 60_000);
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)} giờ trước`;
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(time));
}
