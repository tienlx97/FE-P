'use client';
import { VStack } from '@astryxdesign/core/VStack';
import {
  Bell,
  CheckCircle2,
  Clock,
  Container,
  FileCheck2,
  FileText,
  RefreshCw,
  Scale,
  Truck,
} from 'lucide-react';
import { useMemo } from 'react';

import {
  MaritimeContractFoundationGrid,
  MaritimePaymentSummaryCard,
} from '@/shared/components/custom/maritime/index.js';
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

/**
 * "Tổng quan & Tiến độ" — the Contract detail page's first tab
 * (`openspec/changes/add-contract-detail-page/`), a read-only dashboard
 * built entirely from fields already on `Contract`/`PaymentSchedule`/
 * `ContractAnnex`/`Shipment`/`ContractBank` (per user's explicit choice,
 * 2026-09-17: only existing fields, no new BE work for bank-guarantee/
 * e-signature/audit-log/sailing-progress — those don't exist in the data
 * model). Reuses the same query hooks `ContractExpandedDetails` already
 * fires for "Thanh toán"/"Phụ lục"/"Liên quan", so no extra requests beyond
 * what those tabs need anyway once visited.
 *
 * Layout (per 2 follow-up mockups, 2026-09-17):
 * - Top row, 4 KPI cards (Incoterm dropped per the 2nd mockup — its
 *   fields moved into "Điều kiện giao hàng" below): Giá trị quyết toán /
 *   Đã thanh toán / Còn lại / Xuất hàng (HQ). "Quyết toán"
 *   (`contractValue` + annex adjustments) is the same computation
 *   `contracts-list.jsx`'s own "QUYẾT TOÁN" column and
 *   `ContractExpandedDetails`'s `contractGrandTotal` use, so all 3
 *   surfaces never disagree on what a contract "is really worth" after
 *   amendments.
 * - Second row, 3 responsive cards: Đối tác (seller/buyer/consignee/
 *   notify party) / Ngân hàng & Đợt thanh toán (bank details + a
 *   paid-vs-pending payment timeline + a Phụ lục preview linking to that
 *   tab) / Điều kiện giao hàng (Incoterm, places, category, shipment mix).
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
  const settlementValue = (contract.contractValue ?? 0) + annexesTotal;

  const paidPercent =
    settlementValue > 0
      ? Math.min(100, Math.round((paidValue / settlementValue) * 100))
      : 0;

  const shipmentsQuery = useShipmentsQuery(contract.id);
  const shipments = shipmentsQuery.data?.success
    ? shipmentsQuery.data.shipments
    : [];
  const fclCount = shipments.filter(
    (shipment) => shipment.type === 'FCL',
  ).length;
  const lclCount = shipments.filter(
    (shipment) => shipment.type === 'LCL',
  ).length;
  // Approximation: sums each Shipment's own `declarationValue` regardless
  // of its `declarationCurrency` — matches `contract.currency` in
  // practice, same assumption the header's "Xuất" CSV export makes.
  const exportedValue = shipments.reduce(
    (total, shipment) => total + shipment.declarationValue,
    0,
  );
  const unexportedValue = Math.max(0, settlementValue - exportedValue);

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

  const exportedValueVnd = shipments.reduce(
    (total, shipment) => total + shipment.declarationValueVnd,
    0,
  );
  const exportedPercent =
    settlementValue > 0
      ? Math.round((exportedValue / settlementValue) * 10000) / 100
      : 0;
  const annexNote =
    annexes.length > 0
      ? `HĐ gốc + ${annexes.length} PL (${annexesTotal >= 0 ? '+' : '-'}${formatMoney(Math.abs(annexesTotal))})`
      : 'Chưa có phụ lục';
  const statCards = [
    {
      id: 'contract-value',
      label: 'HỢP ĐỒNG',
      value: formatMoney(contract.contractValue ?? 0),
      unit: contract.currency,
      note: 'HĐ gốc',
      tone: /** @type {const} */ ('default'),
      icon: FileText,
      noteIcon: FileText,
    },
    {
      id: 'settlement',
      label: 'QUYẾT TOÁN',
      value: formatMoney(settlementValue),
      unit: contract.currency,
      note: annexNote,
      tone: /** @type {const} */ ('default'),
      icon: FileCheck2,
      noteIcon: FileText,
    },
    {
      id: 'exported',
      label: 'ĐÃ XUẤT',
      value: formatMoney(exportedValue),
      unit: contract.currency,
      note: `${exportedPercent}% · ${fclCount} FCL · ${lclCount} LCL`,
      tone: /** @type {const} */ ('teal'),
      badgeTone: /** @type {const} */ ('teal'),
      icon: Truck,
      noteIcon: CheckCircle2,
    },
    {
      id: 'exported-vnd',
      label: 'ĐÃ XUẤT (VNĐ)',
      value: formatMoney(exportedValueVnd),
      unit: 'VNĐ',
      note: `${shipments.length} lô hàng`,
      tone: /** @type {const} */ ('default'),
      icon: RefreshCw,
      noteIcon: RefreshCw,
    },
    {
      id: 'unexported',
      label: 'CHƯA XUẤT',
      value: formatMoney(unexportedValue),
      unit: contract.currency,
      note: `${Math.max(0, Math.round((100 - exportedPercent) * 100) / 100)}%`,
      tone: /** @type {const} */ ('accent'),
      icon: FileText,
      noteIcon: Clock,
    },
  ];

  // The installment strip follows what was actually collected, not the
  // agreed `paymentTerms` (those are listed in the "Ngân hàng & Đợt thanh
  // toán" card): recorded payments are "paid" cards, and if anything is
  // still owed a single next card holds the whole remainder (settlement -
  // paid) — with nothing paid yet that is the full settlement as "Đợt 1".
  const remainingToCollect = Math.max(0, settlementValue - paidValue);
  const currentPercent =
    remainingToCollect > 0 && settlementValue > 0
      ? Math.min(
          100 - paidPercent,
          Math.round((remainingToCollect / settlementValue) * 100),
        )
      : 0;
  /** @type {Array<{ id: string, label: string, amount: string, unit: string, dueDate: string, term?: string, status: 'paid' | 'active' | 'upcoming' }>} */
  const installments = paymentSchedules.map((schedule, index) => ({
    id: schedule.id,
    label: `Đợt ${String(index + 1).padStart(2, '0')}`,
    amount: formatMoney(schedule.amount),
    unit: contract.currency,
    dueDate: formatDisplayDate(schedule.paymentDate),
    term: labelForPaymentType(schedule.type),
    status: 'paid',
  }));
  if (remainingToCollect > 0) {
    installments.push({
      id: 'next-installment',
      label: `Đợt ${String(paymentSchedules.length + 1).padStart(2, '0')}`,
      amount: formatMoney(remainingToCollect),
      unit: contract.currency,
      dueDate: '',
      status: 'active',
    });
  }

  /** @param {import('../types/index.js').Buyer | import('../types/index.js').ContractSeller} party */
  const partyRows = (party) => [
    ['Người đại diện:', orDash(party.representativeName), false, false, true],
    ['Chức vụ:', orDash(party.representativeTitle)],
    ['Địa chỉ:', orDash(party.address)],
  ];
  const parties = [
    {
      eyebrow: 'BÊN BÁN (SELLER)',
      name: contract.seller.companyName,
      rows: partyRows(contract.seller),
    },
    {
      eyebrow: 'BÊN MUA (BUYER)',
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
          rows: [
            ...(contact.address ? [['Địa chỉ:', contact.address]] : []),
            ...contact.extraFields.map((field) => [`${field.key}:`, field.value]),
          ],
        }
      : { icon, label, emptyMessage: 'Chưa có thông tin' },
  );

  const transport = {
    sectionTrailing: `${exportedPercent}% Đã xuất`,
    incotermLabel: `${contract.incoterm} ${contract.incotermYear}`,
    rows: [
      ['Nơi xếp hàng:', orDash(contract.placeOfLoading)],
      ['Nơi dỡ hàng:', orDash(contract.placeOfDischarge)],
      ['Nước xuất khẩu:', orDash(countryName)],
      ['Hạng mục:', orDash(contract.category)],
      ['Ngày báo giá:', formatDisplayDate(contract.quotationDate), true],
      ['Ngày ký:', formatDisplayDate(contract.createdDate), true],
      [
        'Ngày hoàn thành:',
        contract.projectCompletionDate
          ? formatDisplayDate(contract.projectCompletionDate)
          : 'Chưa hoàn thành',
        true,
      ],
    ],
    signingBadges: [
      {
        label: contract.sellerSigned ? 'Bên bán đã ký' : 'Bên bán chưa ký',
        tone: contract.sellerSigned ? 'success' : 'neutral',
      },
      {
        label: contract.buyerSigned ? 'Bên mua đã ký' : 'Bên mua chưa ký',
        tone: contract.buyerSigned ? 'success' : 'neutral',
      },
    ],
  };

  const totalWeightTons =
    shipments.reduce((total, shipment) => total + shipment.declarationWeightKg, 0) /
    1000;
  const containerCount = shipments
    .filter((shipment) => shipment.quantityUnit === 'Cont')
    .reduce((total, shipment) => total + shipment.quantityAmount, 0);
  const packageCount = shipments
    .filter((shipment) => shipment.quantityUnit === 'Kien')
    .reduce((total, shipment) => total + shipment.quantityAmount, 0);
  const cargoMetrics = [
          {
            icon: Scale,
            label: 'KHỐI LƯỢNG TỜ KHAI',
            value: formatMoney(totalWeightTons),
            unit: 'Tấn',
          },
          {
            icon: Container,
            label: 'SỐ LƯỢNG CONT / KIỆN',
            value: [
              containerCount > 0 ? `${containerCount} Cont` : null,
              packageCount > 0 ? `${packageCount} Kiện` : null,
            ]
              .filter(Boolean)
              .join(' · ') || '0',
            unit: `(${shipments.length} lô)`,
          },
  ];

  // One block per selected bank; optional fields (beneficiary, branch,
  // address, extra fields) only appear when they have a value.
  const bank =
    banks.length === 0
      ? null
      : {
          items: banks.map((item, index) => ({
            title: banks.length > 1 ? `NGÂN HÀNG ${index + 1}` : undefined,
            rows: [
              ['Ngân hàng:', item.bankName, false, false, true],
              ...(item.beneficiary
                ? [['Người thụ hưởng:', item.beneficiary]]
                : []),
              ['Số tài khoản:', orDash(item.bankAccountNumber), true],
              ...(item.branchName ? [['Chi nhánh:', item.branchName]] : []),
              ...(item.bankAddress ? [['Địa chỉ:', item.bankAddress]] : []),
              ['Mã SWIFT:', orDash(item.swiftCode), true, true],
              ...item.extraFields.map((field) => [`${field.key}:`, field.value]),
            ],
          })),
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
            status: index < paymentSchedules.length ? 'paid' : 'active',
          })),
        };

  const commissionQuery = useCommissionQuery(contract.id);
  const customersQuery = useCustomersQuery();
  const commissionRecord =
    commissionQuery.data?.success && commissionQuery.data.exists
      ? commissionQuery.data.commission
      : null;
  let commissionView = null;
  if (commissionRecord) {
    const commissionPaid = commissionRecord.paymentHistory.reduce(
      (total, payment) => total + payment.amount,
      0,
    );
    const commissionPercent =
      settlementValue > 0
        ? Math.round((commissionRecord.value / settlementValue) * 10000) / 100
        : 0;
    const isFullySigned =
      commissionRecord.sellerSigned && commissionRecord.partySigned;
    const recipient = (
      customersQuery.data?.success ? customersQuery.data.customers : []
    ).find((customer) => customer.id === commissionRecord.partyCustomerId);
    commissionView = {
      percentLabel: `${commissionPercent}%`,
      signedLabel: isFullySigned ? 'Đã ký 2 bên' : 'Chưa ký đủ',
      signedTone: isFullySigned ? 'success' : 'neutral',
      agreementCode: commissionRecord.code,
      recipient: recipient?.companyName ?? '—',
      rateValue: `${formatMoney(commissionRecord.value, contract.currency)} (${commissionPercent}%)`,
      paidAmount: formatMoney(commissionPaid),
      totalAmount: formatMoney(commissionRecord.value, contract.currency),
      paidPercent:
        commissionRecord.value > 0
          ? Math.min(100, Math.round((commissionPaid / commissionRecord.value) * 100))
          : 0,
      paidLabel: `Đã chi ${commissionRecord.paymentHistory.length} đợt`,
      remainingAmount: formatMoney(
        Math.max(0, commissionRecord.value - commissionPaid),
        contract.currency,
      ),
    };
  } else if (commissionQuery.data?.success) {
    commissionView = {
      isEmpty: true,
      message: 'Hợp đồng này chưa có Commission.',
      actionLabel: '+ Tạo Commission',
      onAction: onCreateCommission,
    };
  }

  const annexItems = annexes.slice(0, 3).map((annex) => ({
    code: annex.annexCode,
    label: labelForContractAnnexType(annex.type),
    amount:
      annex.type === 'ValueChange'
        ? formatMoney(0, contract.currency)
        : `${annex.type === 'AmountIncrease' ? '+' : '-'}${formatMoney(annex.amount, contract.currency)}`,
    isPositive: annex.type === 'AmountIncrease',
  }));

  return (
    <VStack gap={4} hAlign="stretch">
      <MaritimePaymentSummaryCard
        statCards={statCards}
        paidPercent={paidPercent}
        currentPercent={currentPercent}
        paidPercentLabel={`${paidPercent}% ĐÃ THU`}
        paidAmountValue={formatMoney(paidValue, contract.currency)}
        totalAmountValue={formatMoney(settlementValue, contract.currency)}
        onViewDetail={onViewPayments}
        installments={installments}
      />

      <MaritimeContractFoundationGrid
        parties={parties}
        contacts={contacts}
        transport={transport}
        cargoMetrics={cargoMetrics}
        bank={bank}
        paymentTerms={paymentTermsView}
        annexes={annexItems}
        onViewAnnexes={onViewAllAnnexes}
        onViewCommission={onViewCommission}
        commission={commissionView}
      />
    </VStack>
  );
}
