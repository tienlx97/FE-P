/**
 * Common currencies for an import/export contract. Free-form on the
 * backend (any 3-letter uppercase ISO 4217 code), this is just a curated
 * Selector shortlist — not an exhaustive/enforced set.
 */
export const CURRENCY_CODES = ['USD', 'VND', 'EUR', 'CNY', 'JPY', 'GBP'];

export const currencyOptions = CURRENCY_CODES.map((code) => ({
  value: code,
  label: code,
}));

export const DEFAULT_CURRENCY = 'USD';

const MONEY_FORMATTER = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Formats a contract value the way the user asked for: thousands
 * separators + exactly 2 decimals + the currency code, e.g. "50,000.00 USD".
 * @param {number | null | undefined} value
 * @param {string} [currency]
 */
export function formatMoney(value, currency) {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return '';
  }

  const formatted = MONEY_FORMATTER.format(value);

  return currency ? `${formatted} ${currency}` : formatted;
}

const VND_AMOUNT_FORMATTER = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/**
 * VNĐ logistics cost amounts as in Figma 109:6632 ("85,200,000 đ"): no
 * forced ".00", real fractions kept.
 * @param {number | null | undefined} value
 */
export function formatVndAmount(value) {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return '';
  }

  return `${VND_AMOUNT_FORMATTER.format(value)} đ`;
}
