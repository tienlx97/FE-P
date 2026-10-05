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
