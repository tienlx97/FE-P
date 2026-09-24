'use client';

import { formatDisplayDate } from '@/shared/config/date-input-format.js';

import { allocateCommissionPayments } from '../config/commission-payment-allocation.js';
import { formatMoney } from '../config/currencies.js';
import { useCommissionAnnexesQuery } from './use-commission-annexes-query.js';
import { useCommissionQuery } from './use-commission-query.js';
import { useContractAnnexesQuery } from './use-contract-annexes-query.js';
import { useSuppliersQuery } from './use-suppliers-query.js';

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
 * @param {{ type: string, amount: number }[]} annexes
 */
function annexAdjustment(annexes) {
  return annexes.reduce((sum, annex) => {
    if (annex.type === 'AmountIncrease') return sum + annex.amount;
    if (annex.type === 'AmountDecrease') return sum - annex.amount;
    return sum;
  }, 0);
}

/**
 * A contract's `Commission` (at most one) plus everything the Meta
 * commission cards show — shared by the contract Commission tab and the
 * commission detail page:
 * - `summary`: "Hoa hồng quyết toán" (value ± commission annexes,
 *   display-only like the overview's "Quyết toán" — annexes never change
 *   the stored value, `docs/api/Commissions.md`; % of the contract's own
 *   settlement), "Đã chi trả", "Còn phải chi".
 * - `broker` / `bank`: the recipient, picked from the Supplier catalog
 *   (`useCommissionForm`), and its first bank account.
 * - `rows` / `totals`: installments with payments allocated in date order
 *   (`allocateCommissionPayments` — payments aren't linked to terms);
 *   installments stay on the original value.
 * `view` is null while there is no commission.
 * @param {import('../types/index.js').Contract} contract
 */
export function useCommissionView(contract) {
  const commissionQuery = useCommissionQuery(contract.id);
  const suppliersQuery = useSuppliersQuery();
  const contractAnnexesQuery = useContractAnnexesQuery(contract.id);
  const commissionAnnexesQuery = useCommissionAnnexesQuery(contract.id);

  const commission =
    commissionQuery.data?.success && commissionQuery.data.exists
      ? commissionQuery.data.commission
      : null;
  const currency = contract.currency;
  const isLoading =
    suppliersQuery.isLoading ||
    contractAnnexesQuery.isLoading ||
    commissionAnnexesQuery.isLoading;

  if (!commission) {
    return { commissionQuery, commission, currency, isLoading, view: null };
  }

  const contractSettlement =
    (contract.contractValue ?? 0) +
    annexAdjustment(
      contractAnnexesQuery.data?.success
        ? contractAnnexesQuery.data.annexes
        : [],
    );
  const recipient = (
    suppliersQuery.data?.success ? suppliersQuery.data.suppliers : []
  ).find(
    (/** @type {import('../types/index.js').Supplier} */ supplier) =>
      supplier.id === commission.partyCustomerId,
  );
  const bankAccount = recipient?.bankAccounts?.[0];

  const total = commission.value;
  const commissionAnnexes = commissionAnnexesQuery.data?.success
    ? commissionAnnexesQuery.data.annexes
    : [];
  const adjustment = annexAdjustment(commissionAnnexes);
  const settledTotal = total + adjustment;
  const pct = (/** @type {number} */ value) =>
    settledTotal > 0 ? Math.round((value / settledTotal) * 1000) / 10 : 0;

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
      paidNote:
        state === 'paid'
          ? `Đã chi ${date}`
          : state === 'partial'
            ? `Đã chi ${formatMoney(paid)} (${Math.round((paid / planned) * 1000) / 10}%)`
            : undefined,
      method: shortCondition(term.paymentCondition),
      paid: state === 'paid',
    };
  });

  const paidValue = commission.paymentHistory.reduce(
    (sum, payment) => sum + payment.amount,
    0,
  );
  const paidCount = allocation.terms.filter(
    (term) => term.state === 'paid',
  ).length;
  const remainingValue = Math.max(0, settledTotal - paidValue);
  const bothSigned = commission.sellerSigned && commission.partySigned;
  const percentOfSettlement =
    contractSettlement > 0
      ? Math.round((settledTotal / contractSettlement) * 10000) / 100
      : 0;

  /** @type {import('@/shared/components/custom/meta/commission-panel.jsx').MetaCommissionSummary[]} */
  const summary = [
    {
      label: `HOA HỒNG QUYẾT TOÁN (${percentOfSettlement}%)`,
      value: formatMoney(settledTotal),
      note:
        commissionAnnexes.length > 0
          ? `Gốc ${formatMoney(total)} ${adjustment < 0 ? '−' : '+'} ${commissionAnnexes.length} PL ${formatMoney(Math.abs(adjustment))}`
          : `${rowCount} đợt thanh toán`,
      tone: 'neutral',
    },
    {
      label: 'ĐÃ CHI TRẢ',
      value: formatMoney(paidValue),
      note: `Đã chi ${paidCount}/${rowCount} đợt (${pct(paidValue)}%)`,
      tone: 'success',
    },
    {
      label: 'CÒN PHẢI CHI',
      value: formatMoney(remainingValue),
      note: `Còn ${rowCount - paidCount} đợt (${pct(remainingValue)}%)`,
      tone: 'accent',
    },
  ];

  /** @type {import('@/shared/components/custom/meta/commission-panel.jsx').MetaCommissionBroker} */
  const broker = {
    label: 'BÊN NHẬN HOA HỒNG (MÔI GIỚI)',
    signedLabel: bothSigned ? 'ĐÃ KÝ 2 BÊN' : 'CHƯA KÝ ĐỦ',
    isSigned: bothSigned,
    code: commission.code,
    name: orBlank(recipient?.companyName),
    rows: [
      ['Người đại diện:', orBlank(recipient?.representativeName)],
      ['Chức vụ:', orBlank(recipient?.representativeTitle)],
      ['Mã số thuế:', orBlank(recipient?.profile?.taxCode), 'accent'],
      ['Địa chỉ / Trụ sở:', orBlank(recipient?.address)],
      ['Ngày ký:', formatDisplayDate(commission.signedDate)],
    ],
  };

  /** @type {import('@/shared/components/custom/meta/commission-panel.jsx').MetaCommissionBank} */
  const bank = {
    title: 'NGÂN HÀNG THỤ HƯỞNG',
    status: '',
    shortName: orBlank(bankAccount?.bankName),
    fullName: '',
    account: orBlank(bankAccount?.accountNumber),
    // Supplier bank accounts carry no SWIFT code yet.
    swift: '',
    emptyMessage: bankAccount
      ? undefined
      : 'Bên nhận chưa có tài khoản ngân hàng trong danh mục Nhà cung cấp.',
    rows: [
      ['Chủ tài khoản:', orBlank(recipient?.companyName)],
      ['Chi nhánh:', orBlank(bankAccount?.branch)],
      ['Tỉnh / Thành phố:', orBlank(bankAccount?.province)],
    ],
    note: '',
  };

  const totals = {
    label: `TỔNG CỘNG (${rowCount} ĐỢT)`,
    usd: `${formatMoney(total)} ${currency}`,
    // Paid / remaining already sit in the KPI cards.
    summary:
      allocation.overpaid > 0
        ? `Chi vượt kế hoạch: ${formatMoney(allocation.overpaid)}`
        : '',
    vnd: '',
  };

  return {
    commissionQuery,
    commission,
    currency,
    isLoading,
    view: {
      summary,
      broker,
      bank,
      rows,
      totals,
      annexCount: commissionAnnexes.length,
      bothSigned,
    },
  };
}
