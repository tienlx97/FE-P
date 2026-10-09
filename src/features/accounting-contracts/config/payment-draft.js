/** @returns {import('../types/index.js').AccountingSubInstallmentFormValues} */
export function emptySubInstallment() {
  return {
    kind: 'Percent',
    percent: undefined,
    amount: undefined,
    condition: '',
    paymentDate: '',
    status: 'Planned',
    note: '',
  };
}

/** A new stage starts with exactly one full-value payment. */
export function initialPaymentStage() {
  return {
    note: '',
    subInstallments: [
      /** @type {import('../types/index.js').AccountingSubInstallmentFormValues} */ ({
        ...emptySubInstallment(),
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
    amount: sub.kind === 'Quantity' ? sub.amount : undefined,
    condition: sub.condition ?? '',
    paymentDate: sub.paymentDate ?? '',
    status: sub.status,
    note: sub.note ?? '',
  };
}
