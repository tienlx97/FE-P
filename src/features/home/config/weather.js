/** @param {number} code */
export function weatherLabel(code) {
  if (code === 0) return 'Trời quang';
  if ([1, 2, 3].includes(code)) return 'Có mây';
  if ([45, 48].includes(code)) return 'Sương mù';
  if ([51, 53, 55, 56, 57].includes(code)) return 'Mưa phùn';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Có mưa';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Có tuyết';
  if ([95, 96, 99].includes(code)) return 'Mưa dông';
  return 'Chưa rõ trạng thái';
}
/** @param {string|null} value */
export function newsTime(value) {
  const date = value ? new Date(value) : null;
  return date && Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date)
    : 'Chưa có thời gian đăng';
}
/** WHO UV index bands. @param {number|null|undefined} value */
export function uvLabel(value) {
  if (value == null || !Number.isFinite(value)) return null;
  if (value < 3) return 'Thấp';
  if (value < 6) return 'Trung bình';
  if (value < 8) return 'Cao';
  if (value < 11) return 'Rất cao';
  return 'Cực cao';
}
/** Open-Meteo local hour ("2026-10-05T14:00") → "14h". @param {string} time */
export function hourLabel(time) {
  return `${Number(time.slice(11, 13))}h`;
}
/** @param {number} probability */
export function isLikelyRain(probability) {
  return probability >= 50;
}
