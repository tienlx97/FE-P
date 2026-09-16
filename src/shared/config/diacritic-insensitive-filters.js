/**
 * Strips Vietnamese diacritics and lowercases, so search matches
 * regardless of whether the user types with or without dấu — a common
 * complaint (2026-09-14) since Astryx's own `applyFilters`
 * (`usePowerSearchConfig.js`) only lowercases, never normalizes. NFD
 * decomposition strips combining marks (á, à, ả, ã, ạ, ...); `đ`/`Đ`
 * aren't decomposable that way (they're distinct base letters, not a
 * letter+diacritic), so they need an explicit replace.
 * @param {string} value
 */
export function normalizeForSearch(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd');
}

/**
 * Wraps PowerSearch's `applyFilters` (from `usePowerSearchConfig`) with
 * diacritic-insensitive matching for string filters. Astryx's own
 * `matchesFilter` does a plain `s.toLowerCase().includes(t.toLowerCase())`
 * with no normalization, so it never matched "khach hang" typed without
 * dấu against "Khách hàng" data. Runs the real filter against a
 * same-shape clone with every string field (and every string filter
 * value) normalized, then maps matches back to the original row objects
 * by array position — a plain diacritic-preserving clone would come back
 * from `.filter()` by reference, so position-mapping (not re-deriving
 * fields) is what keeps the returned rows byte-identical to the input.
 *
 * Only fields targeted by a *string*-type filter get normalized on the
 * row clone — an enum/entity/number/date filter's value is left exact
 * (not normalized), so normalizing every string field unconditionally
 * made an enum "is" filter (e.g. a customer-name field) compare its
 * exact-case value against a lowercased, diacritic-stripped row field and
 * never match (caught 2026-09-16, via a client-only advanced-search enum
 * field — see `diacritic-insensitive-filters.test.js` for the regression
 * case).
 * @template {Record<string, unknown>} T
 * @param {(filters: readonly unknown[], rows: T[]) => T[]} applyFiltersFn
 * @param {readonly unknown[]} filters
 * @param {T[]} rows
 * @returns {T[]}
 */
export function applyFiltersDiacriticInsensitive(applyFiltersFn, filters, rows) {
  if (filters.length === 0) return [...rows];
  const stringFilterFields = new Set(
    filters
      .filter(
        (filter) => /** @type {any} */ (filter)?.value?.type === 'string',
      )
      .map((filter) => /** @type {any} */ (filter).field),
  );
  const normalizedFilters = filters.map((filter) => {
    const value = /** @type {any} */ (filter)?.value;
    return value?.type === 'string' && typeof value.value === 'string'
      ? {
          .../** @type {any} */ (filter),
          value: { ...value, value: normalizeForSearch(value.value) },
        }
      : filter;
  });
  const normalizedRows = rows.map((row, index) => {
    const normalized = /** @type {any} */ ({ __rowIndex: index });
    for (const [key, value] of Object.entries(row)) {
      normalized[key] =
        stringFilterFields.has(key) && typeof value === 'string'
          ? normalizeForSearch(value)
          : value;
    }
    return normalized;
  });
  const matched = applyFiltersFn(
    /** @type {any} */ (normalizedFilters),
    normalizedRows,
  );
  return matched.map((row) => rows[/** @type {any} */ (row).__rowIndex]);
}
