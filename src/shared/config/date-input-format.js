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

/**
 * Same dd/mm/yyyy convention as `formatDateInputValue`, for plain-text date
 * display (table cells, read-only text) outside of `DateInput` fields —
 * those render the raw ISO string today, which is inconsistent with every
 * `DateInput` in the app. Takes a plain `string` (not the branded
 * `ISODateString`) since API response typedefs type date fields as `string`.
 * @param {string | null | undefined} iso
 * @returns {string}
 */
export function formatDisplayDate(iso) {
  return iso
    ? formatDateInputValue(
        /** @type {import('@astryxdesign/core/Calendar').ISODateString} */ (
          iso
        ),
      )
    : '—';
}
