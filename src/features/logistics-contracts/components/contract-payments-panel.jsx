'use client';
import { useMemo, useState } from 'react';

import { MetaPaymentProgressPanel } from '@/shared/components/custom/meta/index.js';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';

import { formatMoney } from '../config/currencies.js';
import { labelForPaymentType } from '../config/payment-schedule-types.js';
import { useContractAnnexesQuery } from '../hooks/use-contract-annexes-query.js';
import { usePaymentSchedulesQuery } from '../hooks/use-payment-schedules-query.js';
import { PaymentScheduleFormDialog } from './payment-schedule-form-dialog.jsx';

// No backend `status` field exists on `PaymentSchedule` — derived from
// `paymentDate` vs. today, the same "đã thu / chưa đến hạn" split the
// previous "Thanh toán" tab (`ContractExpandedDetails`) used.
/** @param {string} paymentDate ISO date (YYYY-MM-DD) */
function isPaymentSchedulePaid(paymentDate) {
  return new Date(paymentDate).getTime() <= Date.now();
}

/**
 * "Tiến độ thanh toán" tab body: `MetaPaymentProgressPanel` (Meta theme,
 * Figma node 94:1936) fed with the contract's real `PaymentSchedule`s /
 * annexes, plus the create/edit dialog it opens.
 * "Đã thu" counts only schedules dated today or earlier (same rule as the
 * old tab's totals); the overview tab's progress card counts every recorded
 * schedule.
 * @param {{ contract: import('../types/index.js').Contract }} props
 */
export function ContractPaymentsPanel({ contract }) {
  const [dialog, setDialog] = useState(
    /** @type {{ schedule: import('../types/index.js').PaymentSchedule | null } | null} */ (
      null
    ),
  );

  const schedulesQuery = usePaymentSchedulesQuery(contract.id);
  const schedules = useMemo(
    () =>
      (schedulesQuery.data?.success ? schedulesQuery.data.schedules : [])
        .slice()
        .sort((a, b) => a.paymentNumber - b.paymentNumber),
    [schedulesQuery.data],
  );

  const annexesQuery = useContractAnnexesQuery(contract.id);
  const annexes = annexesQuery.data?.success ? annexesQuery.data.annexes : [];
  const annexesTotal = annexes.reduce((total, annex) => {
    if (annex.type === 'AmountIncrease') return total + annex.amount;
    if (annex.type === 'AmountDecrease') return total - annex.amount;
    return total;
  }, 0);
  const settlementValue = (contract.contractValue ?? 0) + annexesTotal;

  // Settlement bar: original contract value + net annex adjustment. A net
  // deduction is drawn as the part of the original value that was removed.
  const contractValue = contract.contractValue ?? 0;
  const barTotal = annexesTotal >= 0 ? settlementValue : contractValue;
  const toPercent = (/** @type {number} */ value) =>
    barTotal > 0 ? Math.min(100, (value / barTotal) * 100) : 0;
  const settlementBreakdown = {
    contractPercent: toPercent(
      annexesTotal >= 0 ? contractValue : settlementValue,
    ),
    annexPercent: toPercent(Math.abs(annexesTotal)),
    contractLabel: formatMoney(contractValue, contract.currency),
    annexLabel:
      annexes.length > 0
        ? `${annexesTotal >= 0 ? '+' : '-'}${formatMoney(Math.abs(annexesTotal), contract.currency)}`
        : undefined,
    annexCount: annexes.length,
  };

  const paidSchedules = schedules.filter((schedule) =>
    isPaymentSchedulePaid(schedule.paymentDate),
  );
  const paidValue = paidSchedules.reduce(
    (total, schedule) => total + schedule.amount,
    0,
  );
  const remainingValue = Math.max(0, settlementValue - paidValue);
  const paidPercent =
    settlementValue > 0
      ? Math.min(100, Math.round((paidValue / settlementValue) * 100))
      : 0;

  const rows = schedules.map((schedule) => {
    const isPaid = isPaymentSchedulePaid(schedule.paymentDate);
    return {
      id: schedule.id,
      code: schedule.paymentCode,
      amount: formatMoney(schedule.amount),
      method: /** @type {'advance' | 'lc'} */ (
        schedule.type === 'LC' ? 'lc' : 'advance'
      ),
      condition: labelForPaymentType(schedule.type),
      date: formatDisplayDate(schedule.paymentDate),
      status: /** @type {'paid' | 'upcoming'} */ (isPaid ? 'paid' : 'upcoming'),
      statusLabel: isPaid ? 'Đã thu' : 'Chưa đến hạn',
      note: schedule.note || '—',
    };
  });

  return (
    <>
      <MetaPaymentProgressPanel
        unit={contract.currency}
        amountHeader={`Số tiền (${contract.currency})`}
        totalValue={formatMoney(settlementValue)}
        settlementBreakdown={settlementBreakdown}
        paidValue={formatMoney(paidValue)}
        paidPercent={paidPercent}
        remainingValue={formatMoney(remainingValue)}
        payments={rows}
        isLoading={schedulesQuery.isLoading || annexesQuery.isLoading}
        paidTotalValue={formatMoney(paidValue, contract.currency)}
        onAddPayment={() => setDialog({ schedule: null })}
        onViewPayment={(id) =>
          setDialog({
            schedule: schedules.find((schedule) => schedule.id === id) ?? null,
          })
        }
      />

      {dialog ? (
        <PaymentScheduleFormDialog
          key={dialog.schedule?.id ?? 'create'}
          isOpen
          onOpenChange={(isOpen) => {
            if (!isOpen) setDialog(null);
          }}
          contractId={contract.id}
          schedule={dialog.schedule}
          onSuccess={() => setDialog(null)}
        />
      ) : null}
    </>
  );
}
