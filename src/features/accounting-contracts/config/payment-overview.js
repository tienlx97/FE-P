import { formatDisplayDate } from '@/shared/config/date-input-format.js';

import { formatVnd } from './money.js';

/** @param {import('../types/index.js').AccountingContractDetail} detail */
export function paymentOverview(detail) {
  const payments = detail.installments
    .slice()
    .sort((a, b) => a.number - b.number)
    .flatMap((stage) =>
      stage.subInstallments.slice().sort((a, b) => a.number - b.number),
    );
  const current = payments.find((payment) => payment.status !== 'Paid');
  const total = detail.contract.settlementValue;
  const paidPercent =
    total > 0
      ? Math.min(100, Math.max(0, (detail.contract.paidValue / total) * 100))
      : 0;
  const currentPercent =
    total > 0 && current
      ? Math.min(100 - paidPercent, Math.max(0, (current.amount / total) * 100))
      : 0;
  return {
    paidPercent,
    currentPercent,
    installments: payments.map((payment) => ({
      id: payment.id,
      label: `Lần ${payment.code}`,
      amount: `${formatVnd(payment.amount)} VND`,
      dueDate: payment.paymentDate
        ? formatDisplayDate(payment.paymentDate)
        : undefined,
      term:
        payment.condition ??
        (payment.kind === 'Percent'
          ? `${payment.percent}% giá trị sau thuế`
          : 'Theo số tiền'),
      status: /** @type {'paid' | 'active' | 'upcoming'} */ (
        payment.status === 'Paid'
          ? 'paid'
          : payment === current
            ? 'active'
            : 'upcoming'
      ),
    })),
  };
}
