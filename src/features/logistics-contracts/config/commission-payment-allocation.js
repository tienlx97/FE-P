/**
 * A commission's payments are not linked to its payment terms (the API
 * stores them as two independent lists), so the "Đợt chi hoa hồng" table
 * allocates them: payments, oldest first, fill term 1's planned amount,
 * then term 2's, and so on. A term is `paid` once fully covered, `partial`
 * when part of it is, `unpaid` otherwise; `lastPaymentDate` is the date of
 * the last payment that went into it. Money paid beyond every term's plan
 * is returned as `overpaid`.
 */

/** @typedef {'paid' | 'partial' | 'unpaid'} CommissionTermState */

/**
 * @typedef {{
 *   planned: number,
 *   paid: number,
 *   state: CommissionTermState,
 *   lastPaymentDate: string | null,
 * }} CommissionTermAllocation
 */

// Cent-level tolerance, so 33.33% × 3 of a total still reads as fully paid.
const EPSILON = 0.005;

/**
 * @param {{ paymentRatioPercent: number }[]} terms
 * @param {{ amount: number, paymentDate: string }[]} payments
 * @param {number} total commission value
 * @returns {{ terms: CommissionTermAllocation[], overpaid: number }}
 */
export function allocateCommissionPayments(terms, payments, total) {
  const queue = [...payments]
    .sort((a, b) => (a.paymentDate ?? '').localeCompare(b.paymentDate ?? ''))
    .map((payment) => ({ ...payment, remaining: payment.amount }));
  let cursor = 0;

  const allocations = terms.map((term) => {
    const planned = (term.paymentRatioPercent / 100) * total;
    let paid = 0;
    /** @type {string | null} */
    let lastPaymentDate = null;

    while (cursor < queue.length && planned - paid > EPSILON) {
      const payment = queue[cursor];
      const take = Math.min(payment.remaining, planned - paid);
      paid += take;
      payment.remaining -= take;
      lastPaymentDate = payment.paymentDate;
      if (payment.remaining <= EPSILON) cursor += 1;
    }

    /** @type {CommissionTermState} */
    const state =
      paid <= EPSILON
        ? 'unpaid'
        : planned - paid <= EPSILON
          ? 'paid'
          : 'partial';
    return { planned, paid, state, lastPaymentDate };
  });

  const overpaid = queue
    .slice(cursor)
    .reduce((sum, payment) => sum + payment.remaining, 0);

  return { terms: allocations, overpaid: overpaid > EPSILON ? overpaid : 0 };
}
