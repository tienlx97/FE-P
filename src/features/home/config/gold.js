/** Format API VND/lượng as millions, retaining the source's 1,000 VND precision.
 * @param {number} value */
export function goldMillions(value) {
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  }).format(value / 1_000_000);
}
