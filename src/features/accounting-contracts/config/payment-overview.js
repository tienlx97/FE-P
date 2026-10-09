import { formatDisplayDate } from '@/shared/config/date-input-format.js';

import { formatVnd } from './money.js';

/** @param {import('../types/index.js').AccountingContractDetail} detail */
export function paymentOverview(detail) {
  const stages = detail.installments
    .slice()
    .sort((a, b) => a.number - b.number);
  const current = stages.find((stage) =>
    stage.subInstallments.some((p) => p.status !== 'Paid'),
  );
  const total = detail.contract.settlementValue;
  const paidPercent =
    total > 0
      ? Math.min(100, Math.max(0, (detail.contract.paidValue / total) * 100))
      : 0;
  const currentRemaining = current
    ? Math.max(0, current.amount - current.paidAmount)
    : 0;
  return {
    paidPercent,
    currentPercent:
      total > 0
        ? Math.min(100 - paidPercent, (currentRemaining / total) * 100)
        : 0,
    installments: stages.map((stage) => {
      const plannedDates = stage.subInstallments
        .filter((p) => p.status !== 'Paid' && p.paymentDate)
        .map((p) => p.paymentDate)
        .sort();
      const date = plannedDates[0];
      const isPaid =
        stage.subInstallments.length > 0 &&
        stage.subInstallments.every((p) => p.status === 'Paid');
      return {
        id: stage.id,
        label: `Đợt ${stage.number}`,
        amount: `${formatVnd(stage.amount)} VND`,
        dueDate: date ? formatDisplayDate(date) : undefined,
        term: `${stage.subInstallments.length} lần · Đã thanh toán ${formatVnd(stage.paidAmount)} VND`,
        status: /** @type {'paid' | 'active' | 'upcoming'} */ (
          isPaid ? 'paid' : stage === current ? 'active' : 'upcoming'
        ),
      };
    }),
  };
}
