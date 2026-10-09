const VND = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

/**
 * VND amount as "108,000,000" (2 decimals only when present).
 * @param {number | null | undefined} value
 */
export function formatVnd(value) {
  return value == null ? '—' : VND.format(value);
}

/** @param {number} value Money columns are decimal(18,2), half away from zero. */
export function roundMoney(value) {
  return (
    (Math.sign(value) * Math.round(Math.abs(value) * 100 + Number.EPSILON)) /
    100
  );
}

/**
 * Live preview of the backend's "Giá trị hợp đồng (sau thuế)".
 * @param {number | undefined} valueBeforeTax
 * @param {number | undefined} taxRatePercent
 */
export function valueAfterTax(valueBeforeTax, taxRatePercent) {
  if (valueBeforeTax == null) return undefined;
  return roundMoney(valueBeforeTax * (1 + (taxRatePercent ?? 0) / 100));
}

/**
 * Live preview of a sub-instalment's amount: % of the value after tax, or the entered amount.
 * @param {import('../types/index.js').PaymentKind} kind
 * @param {number | undefined} percent
 * @param {number | undefined} amount
 * @param {number} contractValueAfterTax
 */
export function subInstallmentAmount(
  kind,
  percent,
  amount,
  contractValueAfterTax,
) {
  if (kind === 'Percent')
    return roundMoney((contractValueAfterTax * (percent ?? 0)) / 100);
  return amount ?? 0;
}
