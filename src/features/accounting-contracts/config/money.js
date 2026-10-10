const VND = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

/**
 * VND amount as "108,000,000" (2 decimals only when present).
 * @param {number | null | undefined} value
 */
export function formatVnd(value) {
  return value == null ? '—' : VND.format(value);
}

/**
 * "30% trước thuế" / "15% sau thuế"; "—" for a payment by amount.
 * @param {Pick<import('../types/index.js').AccountingSubInstallment, 'kind' | 'percent' | 'percentBasis'>} sub
 */
export function percentLabel(sub) {
  if (sub.kind !== 'Percent' || sub.percent == null) return '—';
  return `${sub.percent}% ${sub.percentBasis === 'AfterTax' ? 'sau thuế' : 'trước thuế'}`;
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
 * Live preview of a payment's values, as the backend computes them. Percent
 * of the value before tax: before = % × contract before tax, after = that at
 * the payment's rate. Percent of the value after tax: after = % × contract
 * after tax, before = that ÷ (1 + payment rate). Quantity: the entered amount
 * at the payment's rate.
 * @param {Pick<import('../types/index.js').AccountingSubInstallmentFormValues,
 *   'kind' | 'percent' | 'percentBasis' | 'valueBeforeTax' | 'taxRatePercent'>} payment
 * @param {{ valueBeforeTax: number, valueAfterTax: number }} contract
 */
export function subInstallmentValues(payment, contract) {
  const { kind, percent, percentBasis, taxRatePercent } = payment;
  if (kind === 'Percent' && percentBasis === 'AfterTax') {
    const afterTax = roundMoney(
      (contract.valueAfterTax * (percent ?? 0)) / 100,
    );
    return {
      beforeTax: roundMoney((afterTax * 100) / (100 + (taxRatePercent ?? 0))),
      afterTax,
    };
  }
  const beforeTax =
    kind === 'Percent'
      ? roundMoney((contract.valueBeforeTax * (percent ?? 0)) / 100)
      : (payment.valueBeforeTax ?? 0);
  return {
    beforeTax,
    afterTax: /** @type {number} */ (valueAfterTax(beforeTax, taxRatePercent)),
  };
}
