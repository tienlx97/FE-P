'use client';
import { useState } from 'react';

import { MetaCommissionPanel } from '@/shared/components/custom/meta/index.js';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';

import { formatMoney } from '../config/currencies.js';
import { useCommissionQuery } from '../hooks/use-commission-query.js';
import { useContractAnnexesQuery } from '../hooks/use-contract-annexes-query.js';
import { useCustomersQuery } from '../hooks/use-customers-query.js';
import { CommissionFormDialog } from './commission-form-dialog.jsx';
import { CommissionFormDrawer } from './commission-form-drawer.jsx';
import { CommissionPaymentQuickAddDialog } from './commission-payment-quick-add-dialog.jsx';

// Fields the design calls for always render; a missing value shows this
// placeholder.
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
  const customersQuery = useCustomersQuery();
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

  // Create / edit use the Meta drawer (Figma 104:5399); the read-only
  // "Xem" keeps the dialog.
  const formDialog =
    dialog?.kind === 'form' && dialog.mode === 'edit' ? (
      <CommissionFormDrawer
        key={commission?.id ?? 'create'}
        contract={contract}
        commission={commission}
        onClose={() => setDialog(null)}
      />
    ) : dialog?.kind === 'form' ? (
      <CommissionFormDialog
        key={`${commission?.id ?? 'create'}-${dialog.mode}`}
        isOpen
        initialMode={dialog.mode}
        onOpenChange={(isOpen) => {
          if (!isOpen) setDialog(null);
        }}
        contractId={contract.id}
        contractNumber={contract.contractNumber}
        projectName={contract.projectName}
        currency={currency}
        commission={commission}
        closeLabel="Quay lại Contract"
        onSuccess={() => setDialog(null)}
      />
    ) : null;

  if (!commission) {
    // No commission yet: the full design with placeholders, so the layout is
    // already there and fills in once one is created.
    const emptyRows =
      /** @type {Array<[string, string, ('code' | 'accent')?]>} */ ([
        ['Người đại diện:', BLANK],
        ['Chức vụ:', BLANK],
        ['Mã số thuế:', BLANK, 'accent'],
        ['Địa chỉ / Trụ sở:', BLANK],
        ['Ngày ký:', BLANK],
      ]);
    return (
      <>
        <MetaCommissionPanel
          currency={currency}
          isLoading={commissionQuery.isLoading}
          summary={[
            {
              label: 'TỔNG HOA HỒNG',
              value: BLANK,
              note: 'Chưa có Commission',
              tone: 'neutral',
            },
            {
              label: 'ĐÃ CHI TRẢ',
              value: BLANK,
              note: 'Đã chi ___ đợt',
              tone: 'success',
            },
            {
              label: 'CÒN PHẢI CHI',
              value: BLANK,
              note: 'Còn ___ đợt',
              tone: 'accent',
            },
          ]}
          broker={{
            label: 'BÊN NHẬN HOA HỒNG (MÔI GIỚI)',
            signedLabel: 'Chưa ký',
            isSigned: false,
            code: BLANK,
            name: BLANK,
            rows: emptyRows,
          }}
          bank={{
            title: 'NGÂN HÀNG THỤ HƯỞNG',
            shortName: BLANK,
            fullName: BLANK,
            account: BLANK,
            swift: BLANK,
            rows: [
              ['Chủ tài khoản:', BLANK],
              ['Chi nhánh:', BLANK],
              ['Tỉnh / Thành phố:', BLANK],
            ],
          }}
          payments={[]}
          totals={{
            label: 'TỔNG CỘNG',
            usd: `${BLANK} ${currency}`,
            summary: '',
          }}
          footnote=""
          confirmedTotal={`${BLANK} ${currency}`}
          hasReceiptDownload={false}
          createLabel="+ Tạo Commission"
          onCreate={() => setDialog({ kind: 'form', mode: 'edit' })}
        />
        {formDialog}
      </>
    );
  }

  const recipient = (
    customersQuery.data?.success ? customersQuery.data.customers : []
  ).find((customer) => customer.id === commission.partyCustomerId);
  const bankAccount = recipient?.bankAccounts?.[0];

  const total = commission.value;
  const rowCount = Math.max(
    commission.paymentTerms.length,
    commission.paymentHistory.length,
  );
  const pct = (/** @type {number} */ value) =>
    total > 0 ? Math.round((value / total) * 1000) / 10 : 0;

  const rows = Array.from({ length: rowCount }, (_, index) => {
    const term = commission.paymentTerms[index];
    const payment = commission.paymentHistory[index];
    const amount =
      payment?.amount ?? (term ? (term.paymentRatioPercent / 100) * total : 0);
    const date = payment ? formatDisplayDate(payment.paymentDate) : BLANK;
    return {
      id: payment?.id ?? term?.id ?? String(index),
      no: String(index + 1).padStart(2, '0'),
      usd: formatMoney(amount),
      method: shortCondition(term?.paymentCondition),
      date,
      status: payment ? `Đã chi ${date}` : 'Chưa thanh toán',
      paid: Boolean(payment),
    };
  });

  const paidValue = commission.paymentHistory.reduce(
    (sum, payment) => sum + payment.amount,
    0,
  );
  const paidCount = commission.paymentHistory.length;
  const remainingValue = Math.max(0, total - paidValue);
  const remainingCount = Math.max(0, rowCount - paidCount);
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
      <MetaCommissionPanel
        currency={currency}
        isLoading={customersQuery.isLoading || annexesQuery.isLoading}
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
          fullName: orBlank(bankAccount?.bankName),
          account: orBlank(bankAccount?.accountNumber),
          swift: BLANK,
          rows: bankRows,
          note: '',
        }}
        payments={rows}
        totals={{
          label: `TỔNG CỘNG (${rowCount} ĐỢT)`,
          usd: `${formatMoney(total)} ${currency}`,
          summary: `Đã thanh toán: ${formatMoney(paidValue)} (${pct(paidValue)}%) • Còn lại: ${formatMoney(remainingValue)} (${pct(remainingValue)}%)`,
          vnd: '',
        }}
        footnote=""
        confirmedTotal={`${formatMoney(paidValue)} ${currency}`}
        hasReceiptDownload={false}
        onCreate={() => setDialog({ kind: 'payment' })}
        onView={() => setDialog({ kind: 'form', mode: 'view' })}
        onAction={() => setDialog({ kind: 'form', mode: 'edit' })}
      />

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
