/**
 * `DateInput`'s `format` prop, applied wherever a date field renders in
 * this app. The component's built-in named formats are either ISO
 * (`system_date`, e.g. "2026-03-21") or locale-based with spelled-out
 * month names (`date`/`date_long`) — neither matches the dd/mm/yyyy
 * convention this app's users expect, so every DateInput uses this
 * function instead.
 * @param {import('@astryxdesign/core/Calendar').ISODateString} iso
 * @returns {string}
 */
export function formatDateInputValue(iso) {
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}
