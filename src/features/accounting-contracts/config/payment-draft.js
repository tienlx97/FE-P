/**
 * @param {number} taxRatePercent The contract's rate — a payment's default.
 * @returns {import('../types/index.js').AccountingSubInstallmentFormValues}
 */
export function emptySubInstallment(taxRatePercent) {
  return {
    kind: 'Percent',
    percent: undefined,
    valueBeforeTax: undefined,
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

/** @param {import('../types/index.js').AccountingSubInstallment} sub
 * @returns {import('../types/index.js').AccountingSubInstallmentFormValues} */
export function paymentValues(sub) {
  return {
    kind: sub.kind,
    percent: sub.percent ?? undefined,
    valueBeforeTax: sub.kind === 'Quantity' ? sub.valueBeforeTax : undefined,
    taxRatePercent: sub.taxRatePercent,
    actualPaidAmount: sub.actualPaidAmount ?? undefined,
    condition: sub.condition ?? '',
    paymentDate: sub.paymentDate ?? '',
    status: sub.status,
    note: sub.note ?? '',
  };
}
