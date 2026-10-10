/**
 * @param {number} taxRatePercent The contract's rate — a payment's default.
 * @returns {import('../types/index.js').AccountingSubInstallmentFormValues}
 */
export function emptySubInstallment(taxRatePercent) {
  return {
    kind: 'Percent',
    percent: undefined,
    percentBasis: 'BeforeTax',
    valueBeforeTax: undefined,
    valueAfterTax: undefined,
    taxRatePercent,
    actualPaidAmount: undefined,
    condition: '',
    paymentDate: '',
    status: 'Planned',
    note: '',
  };
}

/**
 * A new stage starts with exactly one full-value payment.
 * @param {number} taxRatePercent The contract's rate.
 */
export function initialPaymentStage(taxRatePercent) {
  return {
    note: '',
    subInstallments: [
      /** @type {import('../types/index.js').AccountingSubInstallmentFormValues} */ ({
        ...emptySubInstallment(taxRatePercent),
        percent: 100,
      }),
    ],
  };
}

/**
 * The fields one edit changes: switching the kind drops the typed values,
 * which mean something else for the other kind.
 * @template {keyof import('../types/index.js').AccountingSubInstallmentFormValues} K
 * @param {import('../types/index.js').AccountingSubInstallmentFormValues} sub
 * @param {K} field
 * @param {import('../types/index.js').AccountingSubInstallmentFormValues[K]} value
 * @returns {Partial<import('../types/index.js').AccountingSubInstallmentFormValues>}
 */
export function paymentFieldPatch(sub, field, value) {
  if (field === 'kind' && value !== sub.kind) {
    return {
      kind: /** @type {any} */ (value),
      valueBeforeTax: undefined,
      valueAfterTax: undefined,
    };
  }
  return { [field]: value };
}

/** @param {import('../types/index.js').AccountingSubInstallment} sub
 * @returns {import('../types/index.js').AccountingSubInstallmentFormValues} */
export function paymentValues(sub) {
  return {
    kind: sub.kind,
    percent: sub.percent ?? undefined,
    percentBasis: sub.percentBasis ?? 'BeforeTax',
    valueBeforeTax:
      sub.kind === 'Quantity' || sub.isValueBeforeTaxManual
        ? sub.valueBeforeTax
        : undefined,
    valueAfterTax: sub.isValueAfterTaxManual ? sub.valueAfterTax : undefined,
    taxRatePercent: sub.taxRatePercent,
    actualPaidAmount: sub.actualPaidAmount ?? undefined,
    condition: sub.condition ?? '',
    paymentDate: sub.paymentDate ?? '',
    status: sub.status,
    note: sub.note ?? '',
  };
}
