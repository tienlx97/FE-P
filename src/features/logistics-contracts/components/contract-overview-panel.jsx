'use client';
import { VStack } from '@astryxdesign/core/VStack';
import {
  Bell,
  CircleCheck,
  ClipboardClock,
  Clock,
  FileCheck2,
  RefreshCw,
  Truck,
} from 'lucide-react';
import { useMemo } from 'react';

import {
  MetaContractInfoGrid,
  MetaOverviewSummaryCard,
} from '@/shared/components/custom/meta/index.js';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';

import { labelForContractAnnexType } from '../config/contract-annex-types.js';
import { formatMoney } from '../config/currencies.js';
import { labelForPaymentType } from '../config/payment-schedule-types.js';
import { useCommissionQuery } from '../hooks/use-commission-query.js';
import { useContractAnnexesQuery } from '../hooks/use-contract-annexes-query.js';
import { useContractBanksQuery } from '../hooks/use-contract-banks-query.js';
import { useCountriesQuery } from '../hooks/use-countries-query.js';
import { useCustomersQuery } from '../hooks/use-customers-query.js';
import { usePaymentSchedulesQuery } from '../hooks/use-payment-schedules-query.js';
import { useShipmentsQuery } from '../hooks/use-shipments-query.js';

/** @param {string | null | undefined} value */
function orDash(value) {
  return value == null || value === '' ? '—' : value;
}

/** @param {number} value */
function roundTo2(value) {
  return Math.round(value * 100) / 100;
}

/**
 * @typedef {import('@/shared/components/custom/meta/overview-summary-card.jsx').MetaMetric} MetaMetric
 * @typedef {import('@/shared/components/custom/meta/overview-summary-card.jsx').MetaInstallment} MetaInstallment
 * @typedef {import('@/shared/components/custom/meta/contract-info-grid.jsx').MetaInfoRow} MetaInfoRow
 */

/**
 * "Tổng quan & Tiến độ" — the Contract detail page's first tab
 * (`openspec/changes/add-contract-detail-page/`), a read-only dashboard
 * built entirely from fields already on `Contract`/`PaymentSchedule`/
 * `ContractAnnex`/`Shipment`/`ContractBank` (per user's explicit choice,
 * 2026-09-17: only existing fields, no new BE work). Reuses the same query
 * hooks the other tabs fire, so no extra requests once they're visited.
 *
 * Layout = Figma node 89:1064 ("Meta" theme, 2026-09-23):
 * - `MetaOverviewSummaryCard`: 4 metric cards — Quyết toán (`contractValue`
 *   + annex adjustments, same computation as the list's "QUYẾT TOÁN"
 *   column) / Đã xuất (Σ shipment `invoiceValue`) / Đã xuất (VNĐ) (Σ
 *   `invoiceValue × declarationExchangeRate`) / Chưa xuất — then the
 *   payment-reconciliation bar and one chip per recorded payment.
 * - `MetaContractInfoGrid`: 1. đối tác / 2. vận chuyển & hàng hóa /
 *   3. ngân hàng, mốc thanh toán, phụ lục, hoa hồng.
 * @param {{ contract: import('../types/index.js').Contract, onViewAllAnnexes?: () => void, onViewPayments?: () => void, onViewCommission?: () => void, onCreateCommission?: () => void }} props
 */
export function ContractOverviewPanel({
  contract,
  onViewAllAnnexes,
  onViewPayments,
  onViewCommission,
  onCreateCommission,
}) {
  const paymentSchedulesQuery = usePaymentSchedulesQuery(contract.id);
  const paymentSchedules = useMemo(
    () =>
      (paymentSchedulesQuery.data?.success
        ? paymentSchedulesQuery.data.schedules
        : []
      )
        .slice()
        .sort((a, b) => a.paymentNumber - b.paymentNumber),
    [paymentSchedulesQuery.data],
  );
  const paidValue = paymentSchedules.reduce(
    (total, schedule) => total + schedule.amount,
    0,
  );

  const annexesQuery = useContractAnnexesQuery(contract.id);
  const annexes = annexesQuery.data?.success ? annexesQuery.data.annexes : [];
  // Same sign convention as `ContractExpandedDetails`'s `annexesTotal`:
  // `AmountIncrease` adds, `AmountDecrease` subtracts, `ValueChange` is
  // non-monetary (see `ContractAnnex.amount`'s doc comment) and never
  // affects the total.
  const annexesTotal = annexes.reduce((total, annex) => {
    if (annex.type === 'AmountIncrease') return total + annex.amount;
    if (annex.type === 'AmountDecrease') return total - annex.amount;
    return total;
  }, 0);
  const contractValue = contract.contractValue ?? 0;
  const settlementValue = contractValue + annexesTotal;

  const paidPercent =
    settlementValue > 0
      ? Math.min(100, Math.round((paidValue / settlementValue) * 100))
      : 0;

  const shipmentsQuery = useShipmentsQuery(contract.id);
  const shipments = shipmentsQuery.data?.success
    ? shipmentsQuery.data.shipments
    : [];
  // Sums each Shipment's `invoiceValue` regardless of its
  // `invoiceCurrency` — matches `contract.currency` in practice. Same rule as
  // the BE settlement (`exportedValue`) behind the Contract list.
  const exportedValue = shipments.reduce(
    (total, shipment) => total + shipment.invoiceValue,
    0,
  );
  const unexportedValue = Math.max(0, settlementValue - exportedValue);
  const exportedValueVnd = shipments.reduce(
    (total, shipment) =>
      total + shipment.invoiceValue * shipment.declarationExchangeRate,
    0,
  );
  const exportedPercent =
    settlementValue > 0 ? roundTo2((exportedValue / settlementValue) * 100) : 0;
  const unexportedPercent = roundTo2(Math.max(0, 100 - exportedPercent));
  const shipmentCountHint = `(${shipments.length} lô hàng)`;

  const banksQuery = useContractBanksQuery();
  const banks = useMemo(() => {
    const banksById = new Map(
      (banksQuery.data?.success ? banksQuery.data.banks : []).map((bank) => [
        bank.id,
        bank,
      ]),
    );
    return contract.bankIds
      .map((bankId) => banksById.get(bankId))
      .filter((bank) => bank != null);
  }, [banksQuery.data, contract.bankIds]);

  const countriesQuery = useCountriesQuery();
  const countryName = (
    countriesQuery.data?.success ? countriesQuery.data.countries : []
  ).find((country) => country.id === contract.countryId)?.name;

  // "Quyết toán" splits into the original value (accent) and the annexes'
  // net increase (emerald) — Figma "Gốc: $450k (92.8%) · +2 PL: $35k
  // (7.2%)". The shares sit in each note's tooltip so both notes fit one
  // line on a narrow card. A net decrease has no second segment.
  const originalPercent =
    settlementValue > 0 && annexesTotal > 0
      ? roundTo2((contractValue / settlementValue) * 100)
      : 100;

  /** @type {MetaMetric[]} */
  const metrics = [
    {
      id: 'settlement',
      label: 'QUYẾT TOÁN',
      icon: FileCheck2,
      value: formatMoney(settlementValue),
      unit: contract.currency,
      start: {
        dotTone: 'accent',
        label: `Gốc: ${formatMoney(contractValue)}`,
        tooltip:
          annexesTotal > 0
            ? `${originalPercent}% giá trị quyết toán`
            : undefined,
      },
      end:
        annexes.length > 0
          ? {
              dotTone: 'success',
              value: `${annexesTotal >= 0 ? '+' : '-'}${annexes.length} PL: ${formatMoney(Math.abs(annexesTotal))}`,
              tone: 'success',
              tooltip:
                annexesTotal > 0
                  ? `${roundTo2(100 - originalPercent)}% giá trị quyết toán`
                  : undefined,
            }
          : undefined,
      segments: [
        { percent: originalPercent, tone: 'accent' },
        { percent: 100 - originalPercent, tone: 'success' },
      ],
    },
    {
      id: 'exported',
      label: 'ĐÃ XUẤT',
      icon: Truck,
      iconTone: 'success',
      tone: 'success',
      value: formatMoney(exportedValue),
      unit: contract.currency,
      start: {
        icon: CircleCheck,
        label: 'Tiến độ:',
        value: `${exportedPercent}%`,
        tone: 'success',
      },
      end: { hint: shipmentCountHint },
      segments: [{ percent: Math.min(100, exportedPercent), tone: 'success' }],
    },
    {
      id: 'exported-vnd',
      label: 'ĐÃ XUẤT (VNĐ)',
      icon: RefreshCw,
      iconTone: 'neutral',
      value: formatMoney(exportedValueVnd),
      unit: 'VNĐ',
      end: { hint: shipmentCountHint },
      segments: [{ percent: Math.min(100, exportedPercent), tone: 'neutral' }],
    },
    {
      id: 'unexported',
      label: 'CHƯA XUẤT',
      hasLabelDot: true,
      icon: ClipboardClock,
      tone: 'accent',
      value: formatMoney(unexportedValue),
      unit: contract.currency,
      start: {
        icon: Clock,
        label: 'Còn lại:',
        value: `${unexportedPercent}%`,
        tone: 'accent',
      },
      segments: [{ percent: unexportedPercent, tone: 'accent' }],
    },
  ];

  // The installment strip follows what was actually collected, not the
  // agreed `paymentTerms` (those are listed in the "Mốc điều khoản" card):
  // recorded payments are "paid" chips, and if anything is still owed a
  // single next chip holds the whole remainder (settlement - paid) — with
  // nothing paid yet that is the full settlement as "Đợt 01".
  const remainingToCollect = Math.max(0, settlementValue - paidValue);
  const currentPercent =
    remainingToCollect > 0 && settlementValue > 0
      ? Math.min(
          100 - paidPercent,
          Math.round((remainingToCollect / settlementValue) * 100),
        )
      : 0;
  /** @type {MetaInstallment[]} */
  const installments = paymentSchedules.map((schedule, index) => ({
    id: schedule.id,
    label: `Đợt ${String(index + 1).padStart(2, '0')}`,
    amount: formatMoney(schedule.amount),
    dueDate: formatDisplayDate(schedule.paymentDate),
    term: labelForPaymentType(schedule.type),
    status: 'paid',
  }));
  if (remainingToCollect > 0) {
    installments.push({
      id: 'next-installment',
      label: `Đợt ${String(paymentSchedules.length + 1).padStart(2, '0')}`,
      amount: formatMoney(remainingToCollect),
      status: 'active',
    });
  }

  /** @param {import('../types/index.js').ExtraField[]} fields @returns {MetaInfoRow[]} */
  const extraRows = (fields) =>
    fields.map((field) => ({ label: `${field.key}:`, value: field.value }));

  /**
   * @param {import('../types/index.js').Buyer | import('../types/index.js').ContractSeller} party
   * @returns {MetaInfoRow[]}
   */
  const partyRows = (party) => [
    {
      label: 'Người đại diện:',
      value: orDash(party.representativeName),
      weight: 'semibold',
    },
    { label: 'Chức vụ:', value: orDash(party.representativeTitle) },
    { label: 'Địa chỉ:', value: orDash(party.address) },
    ...extraRows(party.extraFields ?? []),
  ];
  const parties = [
    {
      eyebrow: 'BÊN BÁN (SELLER)',
      name: contract.seller.companyName,
      rows: partyRows(contract.seller),
    },
    {
      eyebrow: 'BÊN MUA (BUYER)',
      tag: countryName
        ? {
            label: countryName.toUpperCase(),
            tone: /** @type {const} */ ('accent'),
          }
        : undefined,
      name: contract.buyer.companyName,
      rows: partyRows(contract.buyer),
    },
  ];
  /** @type {Array<[string, import('../types/index.js').ContractPartyContact | null, import('react').ComponentType]>} */
  const contactSources = [
    ['CONSIGNEE', contract.consignee, Truck],
    ['NOTIFY PARTY', contract.notifyParty, Bell],
  ];
  const contacts = contactSources.map(([label, contact, icon]) =>
    contact
      ? {
          icon,
          label,
          name: contact.name,
          lines: [
            ...(contact.address ? [contact.address] : []),
            ...contact.extraFields.map(
              (field) => `${field.key}: ${field.value}`,
            ),
          ],
        }
      : { icon, label, emptyMessage: 'Chưa có thông tin' },
  );

  /** @type {MetaInfoRow[]} */
  const transportRows = [
    {
      label: 'Nơi xếp hàng:',
      value: orDash(contract.placeOfLoading),
      weight: 'semibold',
    },
    {
      label: 'Cảng đến:',
      value: orDash(contract.placeOfDischarge),
      weight: 'semibold',
    },
    // DDP only: the seller delivers on to the buyer's site.
    ...(contract.incoterm === 'DDP'
      ? [
          {
            label: 'Nơi giao hàng:',
            value: orDash(contract.placeOfDelivery),
            weight: /** @type {const} */ ('semibold'),
          },
        ]
      : []),
    { label: 'Nước xuất khẩu:', value: orDash(countryName) },
    {
      label: 'Ngày báo giá:',
      value: formatDisplayDate(contract.quotationDate),
    },
    {
      label: 'Ngày ký:',
      value: formatDisplayDate(contract.createdDate),
      weight: 'semibold',
    },
    {
      label: 'Ngày hoàn thành:',
      value: contract.projectCompletionDate
        ? formatDisplayDate(contract.projectCompletionDate)
        : 'Chưa hoàn thành',
    },
  ];
  const transport = {
    trailing: `${exportedPercent}% Đã xuất`,
    incotermLabel: `${contract.incoterm} ${contract.incotermYear}`,
    rows: transportRows,
    signingTags: [
      {
        label: contract.sellerSigned ? 'Bên bán đã ký' : 'Bên bán chưa ký',
        tone: /** @type {'success' | 'neutral'} */ (
          contract.sellerSigned ? 'success' : 'neutral'
        ),
      },
      {
        label: contract.buyerSigned ? 'Bên mua đã ký' : 'Bên mua chưa ký',
        tone: /** @type {'success' | 'neutral'} */ (
          contract.buyerSigned ? 'success' : 'neutral'
        ),
      },
    ],
  };

  const totalWeightTons =
    shipments.reduce(
      (total, shipment) => total + shipment.declarationWeightKg,
      0,
    ) / 1000;
  const containerCount = shipments
    .filter((shipment) => shipment.quantityUnit === 'Cont')
    .reduce((total, shipment) => total + shipment.quantityAmount, 0);
  const packageCount = shipments
    .filter((shipment) => shipment.quantityUnit === 'Kien')
    .reduce((total, shipment) => total + shipment.quantityAmount, 0);
  const cargo = {
    subtitle: contract.category || undefined,
    weightValue: formatMoney(totalWeightTons),
    weightUnit: 'Tấn',
    packingValue:
      [
        containerCount > 0 ? `${containerCount} Cont` : null,
        packageCount > 0 ? `${packageCount} Kiện` : null,
      ]
        .filter(Boolean)
        .join(' · ') || '0',
    packingUnit: `(${shipments.length} lô)`,
  };

  // One inset per selected bank; optional fields (beneficiary, branch,
  // address, extra fields) only appear when they have a value.
  const bank =
    banks.length === 0
      ? null
      : {
          items: banks.map((item, index) => {
            /** @type {MetaInfoRow[]} */
            const rows = [
              { label: 'Ngân hàng:', value: item.bankName, weight: 'semibold' },
              ...(item.beneficiary
                ? [{ label: 'Người thụ hưởng:', value: item.beneficiary }]
                : []),
              ...(item.branchName
                ? [
                    {
                      label: 'Chi nhánh:',
                      value: item.branchName,
                      weight: /** @type {const} */ ('semibold'),
                    },
                  ]
                : []),
              {
                label: 'Số tài khoản:',
                value: orDash(item.bankAccountNumber),
                weight: 'bold',
              },
              ...(item.bankAddress
                ? [{ label: 'Địa chỉ:', value: item.bankAddress }]
                : []),
              {
                label: 'Mã SWIFT:',
                value: orDash(item.swiftCode),
                weight: 'bold',
                tone: 'accent',
              },
              ...extraRows(item.extraFields),
            ];
            return {
              title: banks.length > 1 ? `NGÂN HÀNG ${index + 1}` : undefined,
              rows,
            };
          }),
        };

  const paymentTermsView =
    contract.paymentTerms.length === 0
      ? null
      : {
          title: `${contract.paymentTerms.length} MỐC ĐIỀU KHOẢN THANH TOÁN HỢP ĐỒNG`,
          items: contract.paymentTerms.map((term, index) => ({
            label: `Đợt ${index + 1} (${term.paymentRatioPercent}%)`,
            amount: formatMoney(
              (term.paymentRatioPercent / 100) * settlementValue,
              contract.currency,
            ),
            note: term.paymentCondition,
            status: /** @type {'paid' | 'active'} */ (
              index < paymentSchedules.length ? 'paid' : 'active'
            ),
          })),
        };

  const annexesView = {
    countLabel:
      annexes.length > 0
        ? `${String(annexes.length).padStart(2, '0')} Phụ lục (${annexes
            .map((annex) => annex.annexCode)
            .join(', ')})`
        : 'Chưa có phụ lục',
    items: annexes.slice(0, 3).map((annex) => ({
      code: annex.annexCode,
      label: labelForContractAnnexType(annex.type),
      amount:
        annex.type === 'ValueChange'
          ? formatMoney(0, contract.currency)
          : `${annex.type === 'AmountIncrease' ? '+' : '-'}${formatMoney(annex.amount, contract.currency)}`,
      isPositive: annex.type === 'AmountIncrease',
    })),
  };

  const commissionQuery = useCommissionQuery(contract.id);
  const customersQuery = useCustomersQuery();
  const commissionRecord =
    commissionQuery.data?.success && commissionQuery.data.exists
      ? commissionQuery.data.commission
      : null;
  /** @type {import('react').ComponentProps<typeof MetaContractInfoGrid>['commission']} */
  let commissionView = null;
  if (commissionRecord) {
    const commissionPaid = commissionRecord.paymentHistory.reduce(
      (total, payment) => total + payment.amount,
      0,
    );
    const commissionPercent =
      settlementValue > 0
        ? roundTo2((commissionRecord.value / settlementValue) * 100)
        : 0;
    const recipient = (
      customersQuery.data?.success ? customersQuery.data.customers : []
    ).find((customer) => customer.id === commissionRecord.partyCustomerId);
    commissionView = {
      rateLabel: `Tỷ lệ hoa hồng (${commissionPercent}%):`,
      rateValue: formatMoney(commissionRecord.value, contract.currency),
      recipient: recipient?.companyName ?? '—',
      paidLabel: `Đã thanh toán ${formatMoney(commissionPaid)}`,
      remainingLabel: `Còn lại ${formatMoney(
        Math.max(0, commissionRecord.value - commissionPaid),
        contract.currency,
      )}`,
    };
  } else if (commissionQuery.data?.success) {
    commissionView = {
      isEmpty: true,
      message: 'Hợp đồng này chưa có Commission.',
      actionLabel: 'Tạo Commission',
      onAction: onCreateCommission,
    };
  }

  return (
    <VStack gap={5} hAlign="stretch">
      <MetaOverviewSummaryCard
        metrics={metrics}
        paidPercent={paidPercent}
        currentPercent={currentPercent}
        paidPercentLabel={`${paidPercent}% ĐÃ THU`}
        paidAmountValue={formatMoney(paidValue)}
        totalAmountValue={formatMoney(settlementValue, contract.currency)}
        onViewDetail={onViewPayments}
        installments={installments}
        isMetricsLoading={shipmentsQuery.isLoading || annexesQuery.isLoading}
        isPaymentsLoading={
          paymentSchedulesQuery.isLoading || annexesQuery.isLoading
        }
      />

      <MetaContractInfoGrid
        parties={parties}
        contacts={contacts}
        transport={transport}
        cargo={cargo}
        bank={bank}
        paymentTerms={paymentTermsView}
        annexes={annexesView}
        onViewAnnexes={onViewAllAnnexes}
        commission={commissionView}
        onViewCommission={onViewCommission}
        loading={{
          cargo: shipmentsQuery.isLoading,
          bank: banksQuery.isLoading,
          annexes: annexesQuery.isLoading,
          commission: commissionQuery.isLoading || customersQuery.isLoading,
        }}
      />
    </VStack>
  );
}
