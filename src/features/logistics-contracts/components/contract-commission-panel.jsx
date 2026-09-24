'use client';
import { VStack } from '@astryxdesign/core/VStack';
import { useState } from 'react';

import {
  MetaCommissionEmptyState,
  MetaCommissionPanel,
} from '@/shared/components/custom/meta/index.js';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';

import { allocateCommissionPayments } from '../config/commission-payment-allocation.js';
import { formatMoney } from '../config/currencies.js';
import { useCommissionQuery } from '../hooks/use-commission-query.js';
import { useContractAnnexesQuery } from '../hooks/use-contract-annexes-query.js';
import { useSuppliersQuery } from '../hooks/use-suppliers-query.js';
import { CommissionAnnexesSection } from './commission-annexes-section.jsx';
import { CommissionFormDrawer } from './commission-form-drawer.jsx';
import { CommissionPaymentQuickAddDialog } from './commission-payment-quick-add-dialog.jsx';

// A missing broker / bank value shows this placeholder.
const BLANK = '___';

/** @param {string | null | undefined} value */
const orBlank = (value) =>
  value == null || ['', '-', '—'].includes(value.trim()) ? BLANK : value;

/**
 * `paymentCondition` is free text and can be a whole sentence; the tracking
 * table has room for one short line.
 * @param {string | undefined} value
 */
function shortCondition(value) {
  const text = orBlank(value);
  return text.length > 60 ? `${text.slice(0, 60)}…` : text;
}

/**
 * "Hoa hồng" tab body: `MetaCommissionPanel` (Meta theme, Figma node
 * 102:4272) fed with the contract's real
 * `Commission` (at most one per contract), its recipient `Customer`
 * (representative, tax code, address, first bank account) and its payment
 * terms/history, plus the dialogs it opens. The agreed `paymentTerms` and the
 * recorded `paymentHistory` are paired by position, the convention the rest of
 * the app uses. Commission annexes are not part of this design and stay in the
 * "Liên quan" tab.
 * @param {{ contract: import('../types/index.js').Contract }} props
 */
export function ContractCommissionPanel({ contract }) {
  const [dialog, setDialog] = useState(
    /** @type {{ kind: 'form', mode: 'view' | 'edit' } | { kind: 'payment' } | null} */ (
      null
    ),
  );

  const commissionQuery = useCommissionQuery(contract.id);
  // The broker is picked from the Supplier catalog (`useCommissionForm`).
  const suppliersQuery = useSuppliersQuery();
  const annexesQuery = useContractAnnexesQuery(contract.id);

  const commission =
    commissionQuery.data?.success && commissionQuery.data.exists
      ? commissionQuery.data.commission
      : null;
  const currency = contract.currency;

  const annexes = annexesQuery.data?.success ? annexesQuery.data.annexes : [];
  const annexesTotal = annexes.reduce((total, annex) => {
    if (annex.type === 'AmountIncrease') return total + annex.amount;
    if (annex.type === 'AmountDecrease') return total - annex.amount;
    return total;
  }, 0);
  const settlementValue = (contract.contractValue ?? 0) + annexesTotal;

  // Create / view / edit all use the Meta drawer (Figma 104:5399); "Xem"
  // opens it read-only with "Chỉnh sửa" to switch in place.
  const formDialog =
    dialog?.kind === 'form' ? (
      <CommissionFormDrawer
        key={commission?.id ?? 'create'}
        contract={contract}
        commission={commission}
        initialMode={dialog.mode}
        onClose={() => setDialog(null)}
      />
    ) : null;

  if (!commission) {
    return (
      <>
        <MetaCommissionEmptyState
          isLoading={commissionQuery.isLoading}
          onCreate={() => setDialog({ kind: 'form', mode: 'edit' })}
        />
        {formDialog}
      </>
    );
  }

  const recipient = (
    suppliersQuery.data?.success ? suppliersQuery.data.suppliers : []
  ).find(
    (/** @type {import('../types/index.js').Supplier} */ supplier) =>
      supplier.id === commission.partyCustomerId,
  );
  const bankAccount = recipient?.bankAccounts?.[0];

  const total = commission.value;
  const pct = (/** @type {number} */ value) =>
    total > 0 ? Math.round((value / total) * 1000) / 10 : 0;

  // Payments are not linked to terms; allocate them in date order
  // (`allocateCommissionPayments`) so each planned installment shows how
  // much of it has been paid.
  const allocation = allocateCommissionPayments(
    commission.paymentTerms,
    commission.paymentHistory,
    total,
  );
  const rowCount = commission.paymentTerms.length;
  const rows = commission.paymentTerms.map((term, index) => {
    const { planned, paid, state, lastPaymentDate } = allocation.terms[index];
    const date = lastPaymentDate ? formatDisplayDate(lastPaymentDate) : '';
    return {
      id: term.id ?? String(index),
      no: String(index + 1).padStart(2, '0'),
      usd: formatMoney(planned),
      paidNote: state === 'partial' ? `Đã chi ${formatMoney(paid)}` : undefined,
      method: shortCondition(term.paymentCondition),
      date,
      status:
        state === 'paid'
          ? `Đã chi ${date}`
          : state === 'partial'
            ? `Chi một phần (${Math.round((paid / planned) * 1000) / 10}%)`
            : 'Chưa chi',
      paid: state === 'paid',
      state,
    };
  });

  const paidValue = commission.paymentHistory.reduce(
    (sum, payment) => sum + payment.amount,
    0,
  );
  const paidCount = allocation.terms.filter(
    (term) => term.state === 'paid',
  ).length;
  const remainingValue = Math.max(0, total - paidValue);
  const remainingCount = rowCount - paidCount;
  const bothSigned = commission.sellerSigned && commission.partySigned;
  const percentOfSettlement =
    settlementValue > 0
      ? Math.round((total / settlementValue) * 10000) / 100
      : 0;

  const summary = [
    {
      label: `TỔNG HOA HỒNG (${percentOfSettlement}%)`,
      value: formatMoney(total),
      note: `${rowCount} đợt thanh toán`,
      tone: /** @type {const} */ ('neutral'),
    },
    {
      label: 'ĐÃ CHI TRẢ',
      value: formatMoney(paidValue),
      note: `Đã chi ${paidCount}/${rowCount} đợt (${pct(paidValue)}%)`,
      tone: /** @type {const} */ ('success'),
    },
    {
      label: 'CÒN PHẢI CHI',
      value: formatMoney(remainingValue),
      note: `Còn ${remainingCount} đợt (${pct(remainingValue)}%)`,
      tone: /** @type {const} */ ('accent'),
    },
  ];

  /** @type {Array<[string, string, ('code' | 'accent')?]>} */
  const brokerRows = [
    ['Người đại diện:', orBlank(recipient?.representativeName)],
    ['Chức vụ:', orBlank(recipient?.representativeTitle)],
    ['Mã số thuế:', orBlank(recipient?.profile?.taxCode), 'accent'],
    ['Địa chỉ / Trụ sở:', orBlank(recipient?.address)],
    ['Ngày ký:', formatDisplayDate(commission.signedDate)],
  ];

  /** @type {Array<[string, string, ('code' | 'accent')?]>} */
  const bankRows = [
    ['Chủ tài khoản:', orBlank(recipient?.companyName)],
    ['Chi nhánh:', orBlank(bankAccount?.branch)],
    ['Tỉnh / Thành phố:', orBlank(bankAccount?.province)],
  ];

  return (
    <>
      <VStack gap={5} hAlign="stretch">
        <MetaCommissionPanel
          currency={currency}
          isLoading={suppliersQuery.isLoading || annexesQuery.isLoading}
          summary={summary}
          broker={{
            label: 'BÊN NHẬN HOA HỒNG (MÔI GIỚI)',
            signedLabel: bothSigned ? 'ĐÃ KÝ 2 BÊN' : 'CHƯA KÝ ĐỦ',
            isSigned: bothSigned,
            code: commission.code,
            name: orBlank(recipient?.companyName),
            rows: brokerRows,
          }}
          bank={{
            title: 'NGÂN HÀNG THỤ HƯỞNG',
            status: '',
            shortName: orBlank(bankAccount?.bankName),
            fullName: '',
            account: orBlank(bankAccount?.accountNumber),
            // Customer bank accounts carry no SWIFT code yet.
            swift: '',
            emptyMessage: bankAccount
              ? undefined
              : 'Bên nhận chưa có tài khoản ngân hàng trong danh mục Nhà cung cấp.',
            rows: bankRows,
            note: '',
          }}
          payments={rows}
          totals={{
            label: `TỔNG CỘNG (${rowCount} ĐỢT)`,
            usd: `${formatMoney(total)} ${currency}`,
            summary: [
              `Đã thanh toán: ${formatMoney(paidValue)} (${pct(paidValue)}%)`,
              `Còn lại: ${formatMoney(remainingValue)} (${pct(remainingValue)}%)`,
              allocation.overpaid > 0
                ? `Chi vượt kế hoạch: ${formatMoney(allocation.overpaid)}`
                : null,
            ]
              .filter(Boolean)
              .join(' • '),
            vnd: '',
          }}
          footnote=""
          confirmedTotal={`${formatMoney(paidValue)} ${currency}`}
          hasReceiptDownload={false}
          createLabel="Thêm lần chi"
          onCreate={() => setDialog({ kind: 'payment' })}
          onView={() => setDialog({ kind: 'form', mode: 'view' })}
          onAction={() => setDialog({ kind: 'form', mode: 'edit' })}
        />
        <CommissionAnnexesSection
          variant="card"
          contractId={contract.id}
          commissionValue={commission.value}
          currency={currency}
        />
      </VStack>

      {formDialog}

      {dialog?.kind === 'payment' ? (
        <CommissionPaymentQuickAddDialog
          isOpen
          onOpenChange={(isOpen) => {
            if (!isOpen) setDialog(null);
          }}
          contractId={contract.id}
          commission={commission}
          currency={currency}
          onSuccess={() => setDialog(null)}
        />
      ) : null}
    </>
  );
}
