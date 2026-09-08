const MAX_DECIMAL_DIGITS = 8;

/**
 * Formats a non-negative numeric draft while it is being edited. Integer
 * groups run from the right in standard thousands groups: 1234 -> 1,234 and
 * 12345 -> 12,345.
 * @param {string} rawValue
 */
export function formatNumberInput(rawValue) {
  const withoutGrouping = rawValue.replaceAll(',', '');
  const decimalIndex = withoutGrouping.indexOf('.');
  const hasDecimal = decimalIndex !== -1;
  const integerSource = hasDecimal
    ? withoutGrouping.slice(0, decimalIndex)
    : withoutGrouping;
  const decimalSource = hasDecimal
    ? withoutGrouping.slice(decimalIndex + 1)
    : '';
  const integerDigits = integerSource.replaceAll(/\D/g, '');
  const decimalDigits = decimalSource
    .replaceAll(/\D/g, '')
    .slice(0, MAX_DECIMAL_DIGITS);

  if (!integerDigits && !hasDecimal) return '';

  const normalizedInteger = integerDigits || '0';
  const groupedInteger = normalizedInteger.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ',',
  );

  return hasDecimal ? `${groupedInteger}.${decimalDigits}` : groupedInteger;
}

/** @param {string} displayValue */
export function parseNumberInput(displayValue) {
  const normalized = formatNumberInput(displayValue).replaceAll(',', '');
  if (!normalized) return undefined;

  const value = Number(normalized);
  return Number.isFinite(value) ? value : undefined;
}

/** @param {number | undefined} value */
export function numberValueToInput(value) {
  return Number.isFinite(value) ? formatNumberInput(String(value)) : '';
}
