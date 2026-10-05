/** @typedef {'default'|'red'|'orange'|'yellow'|'green'|'teal'|'cyan'|'blue'|'purple'|'pink'|'gray'} TokenColor */
/** @typedef {{value:string, label:string, color:TokenColor}} Topic */

/** News tabs; values match BE-P article `topic`. The first entry shows every topic. */
export const NEWS_TOPICS = /** @type {Topic[]} */ ([
  { value: 'all', label: 'Mới nhất', color: 'default' },
  { value: 'thoi-su', label: 'Thời sự', color: 'blue' },
  { value: 'the-gioi', label: 'Thế giới', color: 'purple' },
  { value: 'kinh-doanh', label: 'Kinh doanh', color: 'orange' },
  { value: 'cong-nghe', label: 'Công nghệ', color: 'cyan' },
  { value: 'the-thao', label: 'Thể thao', color: 'green' },
  { value: 'giai-tri', label: 'Giải trí', color: 'pink' },
  { value: 'suc-khoe', label: 'Sức khỏe', color: 'teal' },
]);

/** Logistics groups: Vietnamese specialist/filtered press, then international by mode. */
export const LOGISTICS_TOPICS = /** @type {Topic[]} */ ([
  { value: 'all', label: 'Tất cả', color: 'default' },
  { value: 'vn', label: 'Việt Nam', color: 'orange' },
  { value: 'maritime', label: 'Hàng hải & cảng', color: 'blue' },
  { value: 'air', label: 'Hàng không', color: 'purple' },
  { value: 'supply-chain', label: 'Chuỗi cung ứng', color: 'teal' },
]);

/** @param {Topic[]} topics @param {string|null|undefined} value */
export function findTopic(topics, value) {
  return topics.find((topic) => topic.value === value) ?? null;
}

/** @template {{topic?:string|null}} T @param {T[]} articles @param {string} value */
export function articlesInTopic(articles, value) {
  return value === 'all'
    ? articles
    : articles.filter((article) => article.topic === value);
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
