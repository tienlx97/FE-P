import { formatDisplayDate } from '@/shared/config/date-input-format.js';

import { formatVnd } from './money.js';
import { stagePaid } from './paid.js';

/**
 * A stage counts as paid once the actual amounts received cover its value.
 * @param {import('../types/index.js').AccountingInstallment} stage
 */
export function isStagePaid(stage) {
  return stage.subInstallments.length > 0 && stagePaid(stage) >= stage.amount;
}

/** @param {import('../types/index.js').AccountingContractDetail} detail */
export function paymentOverview(detail) {
  const stages = detail.installments
    .slice()
    .sort((a, b) => a.number - b.number);
  const current = stages.find((stage) => !isStagePaid(stage));
  const total = detail.contract.settlementValue;
  const paidPercent =
    total > 0
      ? Math.min(100, Math.max(0, (detail.contract.paidValue / total) * 100))
      : 0;
  const currentRemaining = current
    ? Math.max(0, current.amount - stagePaid(current))
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
      const isPaid = isStagePaid(stage);
      return {
        id: stage.id,
        label: `Đợt ${stage.number}`,
        amount: `${formatVnd(stage.amount)} VND`,
        dueDate: date ? formatDisplayDate(date) : undefined,
        term: `${stage.subInstallments.length} lần · Thực tế thanh toán ${formatVnd(stagePaid(stage))} VND`,
        status: /** @type {'paid' | 'active' | 'upcoming'} */ (
          isPaid ? 'paid' : stage === current ? 'active' : 'upcoming'
        ),
      };
    }),
  };
}
