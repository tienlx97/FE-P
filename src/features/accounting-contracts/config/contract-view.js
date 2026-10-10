import { formatVnd } from './money.js';

/**
 * Share of `part` in `total` as a whole percent, 0–100.
 * @param {number} part
 * @param {number} total
 */
export function percentOf(part, total) {
  if (!(total > 0)) return 0;
  return Math.min(100, Math.max(0, Math.round((part / total) * 100)));
}

/**
 * Header status of a contract: overdue first, then fully paid, else in progress.
 * @param {import('../types/index.js').AccountingContractSummary} contract
 * @returns {{ label: string, tone: 'accent' | 'success' | 'danger' }}
 */
export function contractStatus(contract) {
  if (contract.overdueDays)
    return { label: `QUÁ HẠN ${contract.overdueDays} NGÀY`, tone: 'danger' };
  if (contract.unpaidValue <= 0 && contract.settlementValue > 0)
    return { label: 'ĐÃ THANH TOÁN ĐỦ', tone: 'success' };
  return { label: 'ĐANG THỰC HIỆN', tone: 'accent' };
}

/**
 * Sums of the appendices by direction (Phát sinh tăng / giảm), after tax —
 * what the settlement value adds / subtracts.
 * @param {import('../types/index.js').AccountingAppendix[]} appendices
 */
export function appendixTotals(appendices) {
  let increase = 0;
  let decrease = 0;
  for (const appendix of appendices) {
    if (appendix.type === 'Increase') increase += appendix.valueAfterTax;
    if (appendix.type === 'Decrease') decrease += appendix.valueAfterTax;
  }
  return { increase, decrease };
}

/**
 * KPI cards (`MetaMetricsCard`) of the contract page, keyed by id so each
 * tab picks the ones it shows.
 * @param {import('../types/index.js').AccountingContractDetail} detail
 * @param {{ settlement: import('react').ComponentType, invoice: import('react').ComponentType, paid: import('react').ComponentType, unpaid: import('react').ComponentType, base: import('react').ComponentType, up: import('react').ComponentType, down: import('react').ComponentType }} icons
 */
export function contractMetrics(detail, icons) {
  const c = detail.contract;
  const { increase, decrease } = appendixTotals(detail.appendices);
  const basePercent = percentOf(c.valueAfterTax, c.settlementValue);
  const invoicedPercent = percentOf(c.invoicedValue, c.settlementValue);
  const paidPercent = percentOf(c.paidValue, c.settlementValue);
  const stageCount = detail.installments.length;
  const paidCount = detail.installments.filter(
    (stage) =>
      stage.subInstallments.length > 0 &&
      stage.subInstallments.every((sub) => sub.status === 'Paid'),
  ).length;

  return {
    settlement: {
      id: 'settlement',
      label: 'GIÁ TRỊ QUYẾT TOÁN',
      icon: icons.settlement,
      value: formatVnd(c.settlementValue),
      unit: 'VND',
      start: {
        dotTone: /** @type {const} */ ('accent'),
        label: `Sau thuế: ${formatVnd(c.valueAfterTax)}`,
      },
      end:
        increase || decrease
          ? {
              dotTone: /** @type {const} */ ('success'),
              value: `PL: ${increase - decrease >= 0 ? '+' : '−'}${formatVnd(Math.abs(increase - decrease))}`,
              tone: /** @type {const} */ ('success'),
            }
          : { hint: `Thuế ${c.taxRatePercent}%` },
      segments: [
        { percent: basePercent, tone: /** @type {const} */ ('accent') },
        { percent: 100 - basePercent, tone: /** @type {const} */ ('success') },
      ],
    },
    invoiced: {
      id: 'invoiced',
      label: 'ĐÃ XUẤT HOÁ ĐƠN',
      icon: icons.invoice,
      value: formatVnd(c.invoicedValue),
      unit: 'VND',
      start: {
        label: 'Tiến độ:',
        value: `${invoicedPercent}%`,
        tone: /** @type {const} */ ('accent'),
      },
      end: { hint: `(${detail.invoices.length} hoá đơn)` },
      segments: [
        { percent: invoicedPercent, tone: /** @type {const} */ ('accent') },
      ],
    },
    remainingToInvoice: {
      id: 'remainingToInvoice',
      label: 'CÒN PHẢI XUẤT HOÁ ĐƠN',
      hasLabelDot: true,
      icon: icons.invoice,
      tone: /** @type {const} */ ('accent'),
      value: formatVnd(c.remainingToInvoice),
      unit: 'VND',
      start: {
        label: 'Còn lại:',
        value: `${100 - invoicedPercent}%`,
        tone: /** @type {const} */ ('accent'),
      },
      segments: [
        {
          percent: 100 - invoicedPercent,
          tone: /** @type {const} */ ('accent'),
        },
      ],
    },
    paid: {
      id: 'paid',
      label: 'ĐÃ THANH TOÁN',
      icon: icons.paid,
      iconTone: /** @type {const} */ ('success'),
      tone: /** @type {const} */ ('success'),
      value: formatVnd(c.paidValue),
      unit: 'VND',
      start: {
        label: 'Tiến độ:',
        value: `${paidPercent}%`,
        tone: /** @type {const} */ ('success'),
      },
      end: { hint: `(${paidCount}/${stageCount} đợt)` },
      segments: [
        { percent: paidPercent, tone: /** @type {const} */ ('success') },
      ],
    },
    unpaid: {
      id: 'unpaid',
      label: 'CHƯA THANH TOÁN',
      hasLabelDot: true,
      icon: icons.unpaid,
      tone: /** @type {const} */ ('accent'),
      value: formatVnd(c.unpaidValue),
      unit: 'VND',
      start: {
        label: 'Còn lại:',
        value: `${100 - paidPercent}%`,
        tone: /** @type {const} */ ('accent'),
      },
      end: c.overdueDays
        ? { hint: `Quá hạn ${c.overdueDays} ngày` }
        : undefined,
      segments: [
        { percent: 100 - paidPercent, tone: /** @type {const} */ ('accent') },
      ],
    },
    base: {
      id: 'base',
      label: 'GIÁ TRỊ HĐ (SAU THUẾ)',
      icon: icons.base,
      value: formatVnd(c.valueAfterTax),
      unit: 'VND',
      start: { label: `Trước thuế: ${formatVnd(c.valueBeforeTax)}` },
      end: { hint: `Thuế ${c.taxRatePercent}%` },
      segments: [{ percent: 100, tone: /** @type {const} */ ('accent') }],
    },
    increase: {
      id: 'increase',
      label: 'PHÁT SINH TĂNG',
      icon: icons.up,
      iconTone: /** @type {const} */ ('success'),
      tone: /** @type {const} */ ('success'),
      value: formatVnd(increase),
      unit: 'VND',
      start: {
        hint: `${detail.appendices.filter((a) => a.type === 'Increase').length} phụ lục`,
      },
      segments: [
        {
          percent: percentOf(increase, c.settlementValue),
          tone: /** @type {const} */ ('success'),
        },
      ],
    },
    decrease: {
      id: 'decrease',
      label: 'PHÁT SINH GIẢM',
      icon: icons.down,
      iconTone: /** @type {const} */ ('neutral'),
      value: formatVnd(decrease),
      unit: 'VND',
      start: {
        hint: `${detail.appendices.filter((a) => a.type === 'Decrease').length} phụ lục`,
      },
      segments: [
        {
          percent: percentOf(decrease, c.valueAfterTax),
          tone: /** @type {const} */ ('neutral'),
        },
      ],
    },
  };
}
