/**
 * The "Bảng tổng hợp" view of a contract's payments — the layout of the
 * Excel export: one row per đợt, its lần ("2.1", "2.2") underneath when it
 * has several; "Còn lại" runs previous + số tiền − đã thanh toán per đợt.
 */

/** @typedef {import('../types/index.js').AccountingContractDetail} Detail */

/**
 * @typedef {Object} PaymentRow
 * @property {string} id
 * @property {'stage' | 'sub'} kind
 * @property {string} stageId The đợt the row belongs to (its own id on a đợt row).
 * @property {string} code "Đợt 2" or "2.1"
 * @property {string} content
 * @property {number | null} percent Whole percent; a đợt shows the sum of its lần when all are percent.
 * @property {number} amount Value after tax.
 * @property {string | null} date Only on a lần, or a đợt with a single lần.
 * @property {number} paid
 * @property {number | null} remaining Running "còn lại"; đợt rows only.
 * @property {string} note
 * @property {boolean} isParent A đợt with several lần (summary row).
 */

/**
 * One row per đợt; a đợt with a single lần is that lần (its condition, date
 * and note), one with several is a summary row with its lần underneath.
 * @param {Detail} detail
 * @returns {{ rows: PaymentRow[], totalAmount: number, totalPaid: number, stageCount: number }}
 */
export function paymentTableRows(detail) {
  const stages = detail.installments
    .slice()
    .sort((a, b) => a.number - b.number);
  /** @type {PaymentRow[]} */
  const rows = [];
  let remaining = 0;
  let totalAmount = 0;
  let totalPaid = 0;
  for (const stage of stages) {
    const subs = stage.subInstallments;
    const single = subs.length === 1 ? subs[0] : null;
    const isParent = subs.length > 1;
    const amount = subs.reduce((sum, sub) => sum + sub.valueAfterTax, 0);
    const paid = subs.reduce(
      (sum, sub) => sum + (sub.actualPaidAmount ?? 0),
      0,
    );
    totalAmount += amount;
    totalPaid += paid;
    remaining += amount - paid;
    const percents = subs.map((sub) =>
      sub.kind === 'Percent' ? sub.percent : null,
    );
    rows.push({
      id: stage.id,
      stageId: stage.id,
      kind: 'stage',
      code: `Đợt ${stage.number}`,
      content: (single ? (single.condition ?? stage.note) : stage.note) ?? '',
      percent:
        percents.length > 0 && percents.every((p) => p !== null)
          ? percents.reduce((sum, p) => sum + Number(p), 0)
          : null,
      amount,
      date: single?.paymentDate ?? null,
      paid,
      remaining,
      note: (single ? single.note : null) ?? '',
      isParent,
    });
    if (!isParent) continue;
    for (const sub of subs) {
      rows.push({
        id: sub.id,
        stageId: stage.id,
        kind: 'sub',
        code: sub.code,
        content: sub.condition ?? '',
        percent: sub.kind === 'Percent' ? sub.percent : null,
        amount: sub.valueAfterTax,
        date: sub.paymentDate,
        paid: sub.actualPaidAmount ?? 0,
        remaining: null,
        note: sub.note ?? '',
        isParent: false,
      });
    }
  }
  return { rows, totalAmount, totalPaid, stageCount: stages.length };
}
