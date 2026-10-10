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
 * Live preview of a payment's values, as the backend computes them: before
 * tax = % of the contract value before tax, or the entered amount; after tax
 * = that at the payment's own rate.
 * @param {import('../types/index.js').PaymentKind} kind
 * @param {number | undefined} percent
 * @param {number | undefined} enteredValueBeforeTax
 * @param {number | undefined} taxRatePercent
 * @param {number} contractValueBeforeTax
 */
export function subInstallmentValues(
  kind,
  percent,
  enteredValueBeforeTax,
  taxRatePercent,
  contractValueBeforeTax,
) {
  const beforeTax =
    kind === 'Percent'
      ? roundMoney((contractValueBeforeTax * (percent ?? 0)) / 100)
      : (enteredValueBeforeTax ?? 0);
  return {
    beforeTax,
    afterTax: /** @type {number} */ (valueAfterTax(beforeTax, taxRatePercent)),
  };
}
