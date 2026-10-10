/**
 * What counts as received: a payment's "Giá trị thực tế thanh toán" only once
 * its status is "Đã thanh toán"; a "Kế hoạch" payment counts for nothing.
 * @param {import('../types/index.js').AccountingSubInstallment} sub
 */
export function paidOf(sub) {
  return sub.status === 'Paid' ? (sub.actualPaidAmount ?? 0) : 0;
}

/** @param {import('../types/index.js').AccountingInstallment} stage */
export function stagePaid(stage) {
  return stage.subInstallments.reduce((sum, sub) => sum + paidOf(sub), 0);
}
