'use client';
import { Badge } from '@astryxdesign/core/Badge';
import { Link } from '@astryxdesign/core/Link';
import { StackItem } from '@astryxdesign/core/Stack';
import { pixel, proportional } from '@astryxdesign/core/Table';
import { Heading, Text } from '@astryxdesign/core/Text';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import {
  AdvanceTable,
  AdvanceTableErrorBanner,
} from '@/shared/components/advance-table.jsx';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';
import { generateRowKey } from '@/shared/config/generate-row-key.js';
import { withTotalsRowCells } from '@/shared/config/totals-row.js';
import { upsertContainsFilterCondition } from '@/shared/config/upsert-filter-condition.js';

import { searchContracts } from '../api/contracts.js';
import {
  badgeVariantForContractStatus,
  labelForContractStatus,
} from '../config/contract-status.js';
import { labelForContractType } from '../config/contract-types.js';
import {
  COLUMN_OPTIONS,
  DEFAULT_COLUMN_KEYS,
  DEFAULT_PAGE_SIZE,
  FILTER_FIELD_DEFS,
  PAGE_SIZE_OPTIONS,
  SEARCH_FIELD_DEFS,
  skeletonRows,
  VIEW_PRESETS,
} from '../config/contracts-table.js';
import { formatMoney } from '../config/currencies.js';
import { useContractBanksQuery } from '../hooks/use-contract-banks-query.js';
import { useContractsQuery } from '../hooks/use-contracts-query.js';
import { useCountriesQuery } from '../hooks/use-countries-query.js';
import { useCustomersQuery } from '../hooks/use-customers-query.js';
import { ContractFormDialog } from './contract-form-dialog.jsx';
import { CustomerDetailDialog } from './customer-detail-dialog.jsx';
import { RecordActionsMenu } from './record-actions-menu.jsx';

/** @param {string | null | undefined} value */
function orDash(value) {
  return value == null || value === '' ? '—' : value;
}

/** @param {import('../types/index.js').PaymentTerm[]} terms */
function formatPaymentTerms(terms) {
  if (terms.length === 0) {
    return '—';
  }
  if (terms.length === 1) {
    return `${terms[0].paymentRatioPercent}% ${terms[0].paymentCondition}`;
  }
  return `${terms.length} đợt`;
}

/**
 * @typedef {{
 *   id: string,
 *   __isTotalsRow: true,
 *   currency: string,
 *   contractValue: number,
 *   settlementValue: number,
 *   paidValue: number,
 *   unpaidValue: number,
 *   exportedValue: number,
 *   exportedValueVnd: number,
 *   unexportedValue: number,
 *   isMultiCurrency: boolean,
 * }} ContractTotalsRow
 */

/**
 * "Tổng cộng" label for the synthetic totals row(s) — passed to
 * `AdvanceTable`'s `totalsRowLabel` prop, which renders it in whichever
 * column is actually leftmost once view presets and column visibility are
 * applied (not a hardcoded column here).
 * @param {ContractTotalsRow} row
 */
function totalsRowLabel(row) {
  return (
    <Text weight="semibold">
      {row.isMultiCurrency ? `Tổng cộng (${row.currency})` : 'Tổng cộng'}
    </Text>
  );
}

/**
 * Cell renderers used only for the synthetic totals row(s) appended via
 * `AdvanceTable`'s `totalsRows` prop — keyed by column `key`.
 * @type {Record<string, (row: ContractTotalsRow) => import('react').ReactNode>}
 */
const TOTALS_ROW_CELL_RENDERERS = {
  contractValue: (row) => (
    <Text weight="semibold" hasTabularNumbers>
      {formatMoney(row.contractValue, row.currency)}
    </Text>
  ),
  settlementValue: (row) => (
    <Text weight="semibold" hasTabularNumbers>
      {formatMoney(row.settlementValue, row.currency)}
    </Text>
  ),
  paidValue: (row) => (
    <Text weight="semibold" hasTabularNumbers>
      {formatMoney(row.paidValue, row.currency)}
    </Text>
  ),
  unpaidValue: (row) => (
    <Text weight="semibold" hasTabularNumbers>
      {formatMoney(row.unpaidValue, row.currency)}
    </Text>
  ),
  exportedValue: (row) => (
    <Text weight="semibold" hasTabularNumbers>
      {formatMoney(row.exportedValue, row.currency)}
    </Text>
  ),
  exportedValueVnd: (row) => (
    <Text weight="semibold" hasTabularNumbers>
      {formatMoney(row.exportedValueVnd)} đ
    </Text>
  ),
  unexportedValue: (row) => (
    <Text weight="semibold" hasTabularNumbers>
      {formatMoney(row.unexportedValue, row.currency)}
    </Text>
  ),
};

const SETTLEMENT_GROUP_KEY = 'settlement-value-group';
const SETTLEMENT_GROUP_COLUMN_KEYS = [
  'contractValue',
  'settlementValue',
  'exportedValue',
  'exportedValueVnd',
  'unexportedValue',
];

const PAYMENT_GROUP_KEY = 'payment-status-group';
const PAYMENT_GROUP_COLUMN_KEYS = ['paidValue', 'unpaidValue'];

const CONTRACT_HEADER_GROUPS = [
  {
    id: SETTLEMENT_GROUP_KEY,
    label: 'GIÁ TRỊ',
    columnKeys: SETTLEMENT_GROUP_COLUMN_KEYS,
  },
  {
    id: PAYMENT_GROUP_KEY,
    label: 'THANH TOÁN',
    columnKeys: PAYMENT_GROUP_COLUMN_KEYS,
  },
];

// Matches BE-kt-xnk's `ContractSortFields` allow-list, restricted to keys
// this table actually has a column for (`sellerCompanyName` is BE-sortable
// but has no column here).
const SORTABLE_COLUMN_KEYS = [
  'contractNumber',
  'projectName',
  'buyer',
  'contractValue',
  'createdDate',
  'quotationDate',
  'projectCompletionDate',
  'status',
];

const styles = stylex.create({
  // Vivid blue link style requested for "Số hợp đồng" (matches a
  // reference report where record codes render as blue link text) —
  // `Link`'s own `color` prop only offers the theme's accent color (this
  // app's brand green). `--color-text-blue` is tuned as a muted/darker
  // body-text blue for contrast, not the vivid hyperlink shade the
  // reference calls for, so `--color-icon-blue` (the same vivid blue as
  // the un-themed base accent) is applied via `xstyle` instead.
  contractNumberLink: {
    color: colorVars['--color-icon-blue'],
    fontWeight: 'bold',
  },
});

/**
 * Viewing/editing an existing Contract now happens on its own page
 * (`/logistics/contract/[id]`, `openspec/changes/add-contract-detail-page/`)
 * — this list only ever opens `ContractFormDialog` for the "Tạo hợp đồng"
 * (create) flow, `contract == null`. The Buyer-link `CustomerDetailDialog`
 * is a sibling of the table so its Selector portals stay inside their own
 * dialog layer (ADR-0004).
 */
export function ContractsList() {
  const router = useRouter();
  // Regenerated on every open so a previous create draft never bleeds
  // into the next one.
  const [createSessionKey, setCreateSessionKey] = useState(
    /** @type {string | null} */ (null),
  );
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pageIndex, setPageIndex] = useState(1);
  const [sort, setSort] = useState(
    /** @type {{ field: string, direction: 'Ascending' | 'Descending' } | null} */ (
      null
    ),
  );
  /** @param {string | null} field @param {'Ascending' | 'Descending'} direction */
  function handleSortChange(field, direction) {
    setSort(field ? { field, direction } : null);
    setPageIndex(1);
  }
  // Defaults to "Loại hợp đồng: Chính thức" per user request (2026-09-12) —
  // Draft contracts are working copies, not the operational default this
  // list should open on. Still just the ordinary advanced-filter condition
  // array, so the funnel dialog shows it as an active filter the user can
  // edit or remove like any other.
  const [filterConditions, setFilterConditions] = useState(
    /** @type {() => import('@/shared/components/advanced-filter-builder.jsx').AdvancedFilterCondition[]} */ (
      () => [
        {
          id: generateRowKey(),
          field: 'contractType',
          operator: 'Equals',
          value: 'Official',
          connector: 'And',
        },
      ]
    ),
  );
  // "Số hợp đồng" quick-search box — writes into the same server-side
  // `filterConditions` the funnel dialog edits (`Contains`, since it's
  // free text). Without this, `AdvanceTable`'s own quick search only
  // filters whatever page is already loaded (`data`), so searching for a
  // contract number outside the current page silently finds nothing.
  /** @param {string} value */
  function handleContractNumberSearchChange(value) {
    setFilterConditions((current) =>
      upsertContainsFilterCondition(current, 'contractNumber', value),
    );
    setPageIndex(1);
  }

  const [customerDetailDialog, setCustomerDetailDialog] = useState(
    /** @type {{ customerId: string } | null} */ (null),
  );

  const contractsQuery = useContractsQuery({
    page: pageIndex,
    pageSize,
    conditions: filterConditions,
    sort,
  });
  const listResult = contractsQuery.data;
  const contracts = useMemo(
    () => (listResult?.success ? listResult.contracts : []),
    [listResult],
  );
  // "Xuất toàn bộ dữ liệu" in AdvanceTable's export dropdown — one extra
  // unpaginated request scoped to the currently active filters, not the
  // synthetic totals rows (those are computed separately, see below).
  async function fetchAllContracts() {
    const result = await searchContracts({
      page: 1,
      pageSize: listResult?.success
        ? Math.max(1, listResult.totalCount)
        : pageSize,
      conditions: filterConditions,
    });
    return result.success ? result.contracts : [];
  }
  // Sum of contractValue/settlementValue/paidValue/unpaidValue/
  // exportedValue/exportedValueVnd/unexportedValue across every contract
  // matching the current filters (not just this page — the backend
  // computes it pre-paging, see `searchContracts`'s doc comment), grouped
  // by currency since contracts can be denominated in more than one.
  // Rendered as a synthetic last row per currency (see
  // `TOTALS_ROW_LABEL_COLUMN_KEY`/`isTotalsRow` below) rather than a
  // separate summary line, so each sum lines up under its own column.
  const totalsRows = useMemo(() => {
    if (!listResult?.success) return [];
    const totals = listResult.totals;
    return totals.map((total) => ({
      id: `totals-${total.currency}`,
      __isTotalsRow: true,
      currency: total.currency,
      contractValue: total.contractValue,
      settlementValue: total.settlementValue,
      paidValue: total.paidValue,
      unpaidValue: total.unpaidValue,
      exportedValue: total.exportedValue,
      exportedValueVnd: total.exportedValueVnd,
      unexportedValue: total.unexportedValue,
      isMultiCurrency: totals.length > 1,
    }));
  }, [listResult]);
  // Per-contract "Quyết toán / Đã thanh toán / Chưa thanh toán" — one entry
  // per row on this page only (unlike `totalsRows` above), keyed by
  // contractId so `renderCell` below can look a row's up in O(1).
  const settlementsByContractId = useMemo(
    () =>
      new Map(
        (listResult?.success ? listResult.settlements : []).map(
          (settlement) => [settlement.contractId, settlement],
        ),
      ),
    [listResult],
  );

  const banksQuery = useContractBanksQuery();
  const banksById = useMemo(
    () =>
      new Map(
        (banksQuery.data?.success ? banksQuery.data.banks : []).map((bank) => [
          bank.id,
          bank,
        ]),
      ),
    [banksQuery.data],
  );

  // `ContractResponse` only carries `countryId`, no denormalized country
  // name (confirmed in `docs/api/Contracts.md`, BE-kt-xnk), so the display
  // name has to be resolved client-side from the Country catalog.
  const countriesQuery = useCountriesQuery();
  const countriesById = useMemo(
    () =>
      new Map(
        (countriesQuery.data?.success ? countriesQuery.data.countries : []).map(
          (country) => [country.id, country],
        ),
      ),
    [countriesQuery.data],
  );

  const customersQuery = useCustomersQuery();

  // "Khách hàng" search/filter is matched against the denormalized
  // `buyerCompanyName` string (see `searchableContracts` below), so the
  // combobox's options are just the distinct customer names — picking one
  // writes an exact-match `buyerCompanyName` clause instead of a freetext
  // substring search.
  const customerNameOptions = useMemo(() => {
    const names = new Set(
      (customersQuery.data?.success ? customersQuery.data.customers : []).map(
        (customer) => customer.companyName,
      ),
    );
    return [...names]
      .sort((a, b) => a.localeCompare(b, 'vi'))
      .map((name) => ({ value: name, label: name }));
  }, [customersQuery.data]);
  const searchFieldDefsWithCustomers = useMemo(
    () =>
      SEARCH_FIELD_DEFS.map((field) =>
        field.key === 'buyerCompanyName'
          ? { ...field, enumValues: customerNameOptions }
          : field,
      ),
    [customerNameOptions],
  );
  const filterFieldDefsWithCustomers = useMemo(
    () =>
      FILTER_FIELD_DEFS.map((field) =>
        field.key === 'buyerCompanyName'
          ? { ...field, options: customerNameOptions }
          : field,
      ),
    [customerNameOptions],
  );

  /**
   * Shared by the "Số hợp đồng" cell (design.md section 4: "Mã bản ghi mở
   * Xem") and `RecordActionsMenu`'s own "Xem"/"Sửa" — one place deciding
   * what opening a Contract means, so the two entry points can never drift.
   * Navigates to the Contract detail page (`/logistics/contract/[id]`)
   * instead of opening a dialog — "Sửa" jumps straight into edit mode via
   * `?mode=edit`.
   * @param {import('../types/index.js').Contract} row
   * @param {'view' | 'edit'} mode
   */
  function openContract(row, mode) {
    router.push(
      `/logistics/contract/${row.id}${mode === 'edit' ? '?mode=edit' : ''}`,
    );
  }

  /** @type {import('@/shared/components/advance-table.jsx').AdvanceTableColumn<import('../types/index.js').Contract & Record<string, unknown>>[]} */
  const columns = [
    {
      key: 'contractNumber',
      header: 'Số hợp đồng',
      width: pixel(180),
      filter: 'contractNumber',
      renderCell: (contract) => (
        <Link
          xstyle={styles.contractNumberLink}
          onClick={(event) => {
            event.stopPropagation();
            openContract(contract, 'view');
          }}
        >
          {contract.contractNumber}
        </Link>
      ),
    },
    {
      key: 'contractType',
      header: 'Loại hợp đồng',
      width: pixel(130),
      filter: 'contractType',
      renderCell: (contract) => labelForContractType(contract.contractType),
      exportValue: (contract) => labelForContractType(contract.contractType),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      width: pixel(140),
      filter: 'status',
      renderCell: (contract) => (
        <Badge
          label={labelForContractStatus(contract.status)}
          variant={badgeVariantForContractStatus(contract.status)}
        />
      ),
      exportValue: (contract) => labelForContractStatus(contract.status),
    },
    {
      key: 'projectName',
      header: 'Dự án',
      width: proportional(1),
      filter: 'projectName',
      renderCell: (contract) => contract.projectName,
    },
    {
      key: 'buyer',
      header: 'Khách hàng',
      width: proportional(1),
      filter: 'buyerCompanyName',
      // Only linkable when the Buyer is actually catalog-linked
      // (sourceCustomerId) — an inline, one-off Buyer has no customer
      // record to open.
      renderCell: (contract) => {
        const customerId = contract.buyer.sourceCustomerId;
        return customerId ? (
          <Link
            xstyle={styles.contractNumberLink}
            onClick={(event) => {
              event.stopPropagation();
              setCustomerDetailDialog({ customerId });
            }}
          >
            {contract.buyer.companyName}
          </Link>
        ) : (
          contract.buyer.companyName
        );
      },
      exportValue: (contract) => contract.buyer.companyName,
    },
    {
      key: 'contractValue',
      // First of the four settlement-group columns (see
      // `SETTLEMENT_GROUP_COLUMN_KEYS`) — the contract's own value, next to
      // its quyết toán / đã thanh toán / chưa thanh toán position.
      header: 'HỢP ĐỒNG',
      width: proportional(1, { minWidth: 180 }),
      align: 'end',
      filter: 'contractValue',
      renderCell: (contract) =>
        formatMoney(contract.contractValue, contract.currency),
    },
    {
      key: 'settlementValue',
      // No matching backend filter field — these are all computed (contract
      // value + annex adjustments, the shipment declaration sums, and the
      // payment position off them), not stored columns `ContractFilterFields`
      // (BE-kt-xnk) knows how to filter on.
      header: 'QUYẾT TOÁN',
      width: proportional(1, { minWidth: 180 }),
      align: 'end',
      filter: 'settlementValue',
      renderCell: (contract) =>
        formatMoney(Number(contract.settlementValue), contract.currency),
      exportValue: (contract) => Number(contract.settlementValue),
    },
    {
      key: 'exportedValue',
      // Sum of every Shipment's `declarationValue` ("Giá trị tờ khai")
      // recorded against this contract (BE `ContractSettlement.ExportedValue`).
      header: 'ĐÃ XUẤT',
      width: proportional(1, { minWidth: 180 }),
      align: 'end',
      filter: 'exportedValue',
      renderCell: (contract) =>
        formatMoney(Number(contract.exportedValue), contract.currency),
      exportValue: (contract) => Number(contract.exportedValue),
    },
    {
      key: 'exportedValueVnd',
      // Always VNĐ (`declarationValue * declarationExchangeRate` summed
      // across the contract's Shipments) — no `contract.currency` suffix,
      // same "đ" convention `logisticsCost` uses on the Shipment list.
      header: 'ĐÃ XUẤT (VNĐ)',
      width: proportional(1, { minWidth: 180 }),
      align: 'end',
      filter: 'exportedValueVnd',
      renderCell: (contract) =>
        `${formatMoney(Number(contract.exportedValueVnd))} đ`,
      exportValue: (contract) => Number(contract.exportedValueVnd),
    },
    {
      key: 'unexportedValue',
      // `settlementValue - exportedValue` (BE `ContractSettlement.UnexportedValue`).
      header: 'CHƯA XUẤT',
      width: proportional(1, { minWidth: 180 }),
      align: 'end',
      filter: 'unexportedValue',
      renderCell: (contract) =>
        formatMoney(Number(contract.unexportedValue), contract.currency),
      exportValue: (contract) => Number(contract.unexportedValue),
    },
    {
      key: 'paidValue',
      header: 'ĐÃ THANH TOÁN',
      width: proportional(1, { minWidth: 180 }),
      align: 'end',
      filter: 'paidValue',
      renderCell: (contract) =>
        formatMoney(Number(contract.paidValue), contract.currency),
      exportValue: (contract) => Number(contract.paidValue),
    },
    {
      key: 'unpaidValue',
      header: 'CHƯA THANH TOÁN',
      width: proportional(1, { minWidth: 200 }),
      align: 'end',
      filter: 'unpaidValue',
      renderCell: (contract) =>
        formatMoney(Number(contract.unpaidValue), contract.currency),
      exportValue: (contract) => Number(contract.unpaidValue),
    },
    {
      key: 'incoterm',
      header: 'Incoterm',
      // Wider than the header text alone needs — the filter plugin appends
      // an icon after it, and header cells always truncate (never wrap).
      width: pixel(140),
      filter: 'incoterm',
      renderCell: (contract) => `${contract.incoterm} ${contract.incotermYear}`,
      exportValue: (contract) =>
        `${contract.incoterm} ${contract.incotermYear}`,
    },
    {
      key: 'createdDate',
      header: 'Ngày ký',
      width: pixel(150),
      filter: 'createdDate',
      renderCell: (contract) => formatDisplayDate(contract.createdDate),
    },
    {
      key: 'quotationDate',
      header: 'Ngày báo giá',
      // Header cells always truncate (never wrap), so a column whose header
      // is longer than its data needs its own pixel floor rather than
      // proportional() — the 120px proportional minimum fits "2026-08-27"
      // fine but clips the label itself.
      width: pixel(150),
      renderCell: (contract) => formatDisplayDate(contract.quotationDate),
    },
    {
      key: 'projectCompletionDate',
      header: 'Ngày hoàn thành dự án',
      width: pixel(180),
      // `null` while the project isn't finished yet (only fillable once
      // `status` is "Đã hoàn thành" — see `contract-general-fields.jsx`).
      renderCell: (contract) =>
        formatDisplayDate(contract.projectCompletionDate),
    },
    {
      key: 'category',
      header: 'Hạng mục',
      width: pixel(130),
      renderCell: (contract) => orDash(contract.category),
    },
    {
      key: 'countryName',
      header: 'Nước xuất khẩu',
      width: pixel(160),
      filter: 'countryName',
      renderCell: (contract) =>
        orDash(countriesById.get(contract.countryId)?.name),
    },
    {
      key: 'placeOfLoading',
      header: 'Nơi xếp hàng',
      width: pixel(150),
      renderCell: (contract) => orDash(contract.placeOfLoading),
    },
    {
      key: 'placeOfDischarge',
      header: 'Nơi dỡ hàng',
      width: pixel(140),
      filter: 'placeOfDischarge',
      renderCell: (contract) => orDash(contract.placeOfDischarge),
    },
    {
      // Was already a `COLUMN_OPTIONS` entry with no matching column here —
      // toggling "Ghi chú" on in the picker silently did nothing. Discovered
      // while adding the three fields above (2026-09-16); same class of bug.
      key: 'note',
      header: 'Ghi chú',
      width: pixel(200),
      filter: 'note',
      renderCell: (contract) => orDash(contract.note),
    },
    {
      key: 'paymentTerms',
      header: 'Đợt thanh toán',
      width: pixel(160),
      renderCell: (contract) => formatPaymentTerms(contract.paymentTerms),
      exportValue: (contract) =>
        contract.paymentTerms
          .map(
            (term) => `${term.paymentRatioPercent}% ${term.paymentCondition}`,
          )
          .join('; '),
    },
    {
      key: 'bankIds',
      header: 'Ngân hàng thụ hưởng',
      width: pixel(200),
      renderCell: (contract) =>
        contract.bankIds.length === 0
          ? '—'
          : `${contract.bankIds.length} ngân hàng`,
      exportValue: (contract) =>
        contract.bankIds
          .map((bankId) => banksById.get(bankId)?.bankName)
          .filter(Boolean)
          .join('; '),
    },
    {
      key: 'sellerSigned',
      header: 'Bên bán đã ký',
      width: pixel(130),
      renderCell: (contract) => (contract.sellerSigned ? 'Đã ký' : 'Chưa ký'),
      exportValue: (contract) => (contract.sellerSigned ? 'Đã ký' : 'Chưa ký'),
    },
    {
      key: 'buyerSigned',
      header: 'Bên mua đã ký',
      width: pixel(130),
      renderCell: (contract) => (contract.buyerSigned ? 'Đã ký' : 'Chưa ký'),
      exportValue: (contract) => (contract.buyerSigned ? 'Đã ký' : 'Chưa ký'),
    },
    {
      key: 'actions',
      header: 'Chức năng',
      width: pixel(140),
      align: 'end',
      renderCell: (row) => (
        <RecordActionsMenu
          onView={() => openContract(row, 'view')}
          onEdit={() => openContract(row, 'edit')}
        />
      ),
    },
  ];

  // Every column's `renderCell` runs against the synthetic totals row(s)
  // too — `Table` has no footer concept in data-driven mode, so
  // `advance-table.jsx`'s `totalsRows` prop just appends them as ordinary
  // rows (see `totalsRows` above). Most columns render blank for it; the
  // seven `TOTALS_ROW_CELL_RENDERERS` keys render the pre-summed amount,
  // and the leftmost column names the row.
  const columnsWithTotalsRow = withTotalsRowCells(
    columns,
    TOTALS_ROW_CELL_RENDERERS,
  );

  const searchableContracts = contracts.map((contract) => ({
    ...contract,
    settlementValue:
      settlementsByContractId.get(contract.id)?.settlementValue ?? 0,
    paidValue: settlementsByContractId.get(contract.id)?.paidValue ?? 0,
    unpaidValue: settlementsByContractId.get(contract.id)?.unpaidValue ?? 0,
    exportedValue: settlementsByContractId.get(contract.id)?.exportedValue ?? 0,
    exportedValueVnd:
      settlementsByContractId.get(contract.id)?.exportedValueVnd ?? 0,
    unexportedValue:
      settlementsByContractId.get(contract.id)?.unexportedValue ?? 0,
    buyerCompanyName: contract.buyer.companyName,
    countryName: countriesById.get(contract.countryId)?.name ?? '',
    bankNames: contract.bankIds
      .map((bankId) => banksById.get(bankId)?.bankName)
      .filter(Boolean)
      .join(', '),
  }));

  const totalContracts = listResult?.success ? listResult.totalCount : 0;
  const totalPages = Math.max(
    1,
    listResult?.success ? listResult.totalPages : 1,
  );

  const isLoadingContracts = contractsQuery.isLoading;

  return (
    <VStack gap={4} hAlign="stretch" height="100%">
      {listResult && !listResult.success ? (
        <AdvanceTableErrorBanner message={listResult.message} />
      ) : null}

      <StackItem size="fill">
        <AdvanceTable
          title={<Heading level={1}>Hợp đồng</Heading>}
          headerGroups={CONTRACT_HEADER_GROUPS}
          toolbarLabel="Thao tác danh sách hợp đồng"
          searchFieldDefs={searchFieldDefsWithCustomers}
          entityLabel="Hợp đồng"
          contentSearchFieldKey="contractNumber"
          onContentSearchChange={handleContractNumberSearchChange}
          searchPlaceholder="Tìm số HĐ, dự án..."
          filterFieldDefs={filterFieldDefsWithCustomers}
          advancedFilterConditions={filterConditions}
          onAdvancedFilterChange={setFilterConditions}
          columnOptions={COLUMN_OPTIONS}
          initialColumnKeys={DEFAULT_COLUMN_KEYS}
          defaultColumnKeys={DEFAULT_COLUMN_KEYS}
          viewPresets={VIEW_PRESETS}
          fixedEndColumnKeys={['actions']}
          tableColumns={columnsWithTotalsRow}
          data={searchableContracts}
          totalsRows={totalsRows}
          totalsRowLabel={totalsRowLabel}
          idKey="id"
          isLoading={isLoadingContracts}
          skeletonRows={skeletonRows}
          fetchAllRows={fetchAllContracts}
          onRefresh={() => contractsQuery.refetch()}
          isRefreshing={contractsQuery.isFetching}
          primaryAction={{
            label: 'Tạo hợp đồng',
            onClick: () => setCreateSessionKey(generateRowKey()),
          }}
          pagination={{
            pageIndex,
            pageSize,
            totalCount: totalContracts,
            totalPages,
            onPageIndexChange: setPageIndex,
            onPageSizeChange: setPageSize,
            pageSizeOptions: PAGE_SIZE_OPTIONS,
          }}
          sort={sort}
          onSortChange={handleSortChange}
          sortableColumnKeys={SORTABLE_COLUMN_KEYS}
        />
      </StackItem>

      {createSessionKey ? (
        <ContractFormDialog
          key={createSessionKey}
          isOpen
          onOpenChange={(open) => {
            if (!open) setCreateSessionKey(null);
          }}
          contract={null}
          activeTab="profile"
          onActiveTabChange={() => {}}
          onSuccess={(saved) => {
            setCreateSessionKey(null);
            router.push(`/logistics/contract/${saved.id}`);
          }}
        />
      ) : null}

      {customerDetailDialog ? (
        <CustomerDetailDialog
          key={customerDetailDialog.customerId}
          customerId={customerDetailDialog.customerId}
          onOpenChange={(isOpen) => {
            if (!isOpen) setCustomerDetailDialog(null);
          }}
        />
      ) : null}
    </VStack>
  );
}
