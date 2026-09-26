/**
 * One option of the POL / POD place pickers (contract and shipment forms).
 * `placeOfLoading` / `placeOfDischarge` are plain strings on the wire, so
 * the Selectors key options by the text they save (`name`), not an id.
 * @typedef {{ id: string, name: string, label: string }} PlaceOption
 */

/**
 * A port saves its long name when it has one ("Cảng Cát Lái, TP. Hồ Chí
 * Minh"), else its short name; the option shows "Short name (UN/LOCODE)".
 * @param {import('../types/index.js').Port} port
 * @returns {PlaceOption}
 */
export function portOption(port) {
  return {
    id: port.id,
    name: port.fullName || port.name,
    label: port.code
      ? `${port.name} (${port.code})`
      : `${port.name} (Nhà máy / Kho)`,
  };
}

/**
 * Collapses options that would save the same text (first wins) — two
 * catalog rows can share a name, which would otherwise surface as a "two
 * children with the same key" React warning in the Selector's option list.
 * @param {PlaceOption[]} options
 * @returns {PlaceOption[]}
 */
export function dedupePlacesByName(options) {
  const seen = new Set();
  return options.filter((option) => {
    if (seen.has(option.name)) return false;
    seen.add(option.name);
    return true;
  });
}

/**
 * Keeps a saved free-text value selectable when it is no longer (or never
 * was) in the catalog, so the Selector doesn't render it blank.
 * @param {{value: string, label: string}[]} options
 * @param {string} value
 */
export function withSavedOption(options, value) {
  return value && !options.some((option) => option.value === value)
    ? [...options, { value, label: value }]
    : options;
}
