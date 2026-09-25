/**
 * Matches "Việt Nam" by name — the fallback of `findVietnamCountry`, which
 * prefers the ISO code (`code === 'VN'`, BE-kt-xnk `port-catalog-unlocode`)
 * but still finds an uncoded, user-created row.
 * Normalizes away case, surrounding whitespace, and diacritics so "Việt
 * Nam", "viet nam", "VIỆT NAM" all match; confirmed against the actual
 * seeded catalog (`Việt Nam`) via the running app on 2026-09-01.
 * @param {string} name
 * @returns {boolean}
 */
export function isVietnamCountryName(name) {
  const normalized = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // combining diacritical marks
    .trim()
    .toLowerCase();
  return normalized === 'viet nam' || normalized === 'vietnam';
}

/**
 * @param {import('../types/index.js').Country[]} countries
 * @returns {import('../types/index.js').Country | undefined}
 */
export function findVietnamCountry(countries) {
  return (
    countries.find((country) => country.code === 'VN') ??
    countries.find((country) => isVietnamCountryName(country.name))
  );
}
