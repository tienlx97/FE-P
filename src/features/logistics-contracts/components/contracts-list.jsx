'use client';
/** @typedef {'profile' | 'annexes' | 'payments' | 'related' | 'fullView'} ExpandedTab */
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import {
  SegmentedControl,
  SegmentedControlItem,
} from '@astryxdesign/core/SegmentedControl';
import { StackItem } from '@astryxdesign/core/Stack';
import { pixel, proportional } from '@astryxdesign/core/Table';
import { Heading, Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { useMemo, useState } from 'react';

import {
  AdvanceTable,
  AdvanceTableErrorBanner,
} from '@/shared/components/advance-table.jsx';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';
import { generateRowKey } from '@/shared/config/generate-row-key.js';
import { withTotalsRowCells } from '@/shared/config/totals-row.js';
import {
  upsertContainsFilterCondition,
  upsertEqualsFilterCondition,
} from '@/shared/config/upsert-filter-condition.js';

import { searchContracts } from '../api/contracts.js';
import {
  badgeVariantForContractStatus,
  contractStatusOptions,
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
import { useShipmentCostCategoriesQuery } from '../hooks/use-shipment-cost-categories-query.js';
import { useSuppliersQuery } from '../hooks/use-suppliers-query.js';
import { CommissionAnnexFormDialog } from './commission-annex-form-dialog.jsx';
import { CommissionFormDialog } from './commission-form-dialog.jsx';
import { CommissionPaymentQuickAddDialog } from './commission-payment-quick-add-dialog.jsx';
import { ContractAnnexFormDialog } from './contract-annex-form-dialog.jsx';
import { ContractExpandedDetails } from './contract-expanded-details.jsx';
import { ContractFormDialog } from './contract-form-dialog.jsx';
import { ContractPrivateInfoDetailDialog } from './contract-private-info-detail-dialog.jsx';
import { PaymentScheduleFormDialog } from './payment-schedule-form-dialog.jsx';
import { RecordActionsMenu } from './record-actions-menu.jsx';
import { ShipmentFormDialog } from './shipment-form-dialog.jsx';
import { ShipmentVgmFormDialog } from './shipment-vgm-form-dialog.jsx';

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
};

const SETTLEMENT_GROUP_KEY = 'settlement-value-group';
const SETTLEMENT_GROUP_COLUMN_KEYS = [
  'contractValue',
  'settlementValue',
  'paidValue',
  'unpaidValue',
];

const CONTRACT_HEADER_GROUPS = [
  {
    id: SETTLEMENT_GROUP_KEY,
    label: 'GIÁ TRỊ',
    columnKeys: SETTLEMENT_GROUP_COLUMN_KEYS,
  },
];

const styles = stylex.create({
  statusFilter: { maxWidth: '100%', overflowX: 'auto' },
});

/** Contract workspace and related editors are siblings of the table so
 * Selector portals remain inside their dialog layers (ADR-0004). */
export function ContractsList() {
  // `sessionKey` identifies one open workspace session — assigned once per
  // open action (row Xem/Sửa, "Tạo hợp đồng") and never touched again for
  // that session, including across a successful create (`contract` moves
  // from `null` to the saved record in place). Unlike keying the dialog off
  // `contract?.id`, this stays stable through that null→id transition, so
  // saving a brand-new Contract doesn't force a remount either — the one
  // thing task 1.2 exists to remove ("bỏ remount chỉ để đổi mode").
  const [workspace, setWorkspace] = useState(
    /** @type {{ mode?: 'view' | 'edit', contract: import('../types/index.js').Contract | null, sessionKey: string } | null} */ (
      null
    ),
  );
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pageIndex, setPageIndex] = useState(1);
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
  // Quick-filter pills for "Trạng thái" — server-side (writes into the same
  // `filterConditions` the funnel dialog edits, unlike `AdvanceTable`'s own
  // `quickFilters` prop, which only filters the already-fetched page
  // client-side). "Tất cả" means no status condition at all, not a
  // specific value.
  const statusQuickFilterValue =
    filterConditions.find((condition) => condition.field === 'status')?.value ??
    'all';
  /** @param {string} nextValue */
  function handleStatusQuickFilterChange(nextValue) {
    setFilterConditions((current) =>
      upsertEqualsFilterCondition(
        current,
        'status',
        nextValue === 'all' ? null : nextValue,
      ),
    );
    setPageIndex(1);
  }

  // "Số hợp đồng" quick-search box — same server-side idea as the status
  // quick filter above, but `Contains` instead of `Equals` since it's free
  // text. Without this, `AdvanceTable`'s own quick search only filters
  // whatever page is already loaded (`data`), so searching for a contract
  // number outside the current page silently finds nothing.
  /** @param {string} value */
  function handleContractNumberSearchChange(value) {
    setFilterConditions((current) =>
      upsertContainsFilterCondition(current, 'contractNumber', value),
    );
    setPageIndex(1);
  }

  const [expandedTab, setExpandedTab] = useState(
    /** @type {ExpandedTab} */ ('profile'),
  );
  // "Commission"/"BOQ" (private info) no longer embed their editors inside
  // the Contract dialog (task 3.1) — "Liên quan" shows a summary card for
  // each and opens the same standalone dialog `commissions-list.jsx`/
  // `contract-private-infos-list.jsx` use, one at a time (ADR-0004: no
  // stacked fullscreen dialogs, this workspace's own `ContractFormDialog`
  // stays open underneath).
  const [relatedCommissionDialog, setRelatedCommissionDialog] = useState(
    /** @type {{ contractId: string, currency: string, commission: import('../types/index.js').Commission | null } | null} */ (
      null
    ),
  );
  const [relatedBoqDialog, setRelatedBoqDialog] = useState(
    /** @type {{ contractId: string, contractNumber: string } | null} */ (null),
  );
  const [shipmentDialog, setShipmentDialog] = useState(
    /** @type {{ contractId: string, contract: import('../types/index.js').Contract, shipment?: import('../types/index.js').Shipment } | null} */ (
      null
    ),
  );
  const [annexDialog, setAnnexDialog] = useState(
    /** @type {{ contractId: string, annex?: import('../types/index.js').ContractAnnex } | null} */ (
      null
    ),
  );
  const [paymentScheduleDialog, setPaymentScheduleDialog] = useState(
    /** @type {{ contractId: string, schedule?: import('../types/index.js').PaymentSchedule } | null} */ (
      null
    ),
  );
  const [commissionAnnexDialog, setCommissionAnnexDialog] = useState(
    /** @type {{ contractId: string, annex?: import('../types/index.js').CommissionAnnex } | null} */ (
      null
    ),
  );
  const [commissionPaymentDialog, setCommissionPaymentDialog] = useState(
    /** @type {{ contractId: string, currency: string, commission: import('../types/index.js').Commission } | null} */ (
      null
    ),
  );
  const [vgmDialog, setVgmDialog] = useState(
    /** @type {{ contractId: string, shipmentId: string, vgm?: import('../types/index.js').ShipmentVgm } | null} */ (
      null
    ),
  );

  const contractsQuery = useContractsQuery({
    page: pageIndex,
    pageSize,
    conditions: filterConditions,
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
  // Sum of contractValue/settlementValue/paidValue/unpaidValue across every
  // contract matching the current filters (not just this page — the
  // backend computes it pre-paging, see `searchContracts`'s doc comment),
  // grouped by currency since contracts can be denominated in more than
  // one. Rendered as a synthetic last row per currency (see
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

  // `Commission.partyCustomerId` now targets the Supplier catalog
  // (contract commission recipient is a Supplier post-split, see
  // `split-customers-suppliers-ui`) — resolved below via `suppliersById`.
  const customersQuery = useCustomersQuery();
  const suppliersQuery = useSuppliersQuery();
  const suppliersById = useMemo(
    () => new Map((suppliersQuery.data?.success ? suppliersQuery.data.suppliers : []).map((/** @type {import('../types/index.js').Supplier} */ supplier) => [supplier.id, supplier])),
    [suppliersQuery.data],
  );

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

  // `Shipment.costs[].costCategoryId` is a live FK into the
  // `ShipmentCostCategory` catalog — resolved client-side for
  // `ShipmentExpandedDetails`'s cost-lines table, same pattern as
  // `customersById` above.
  const costCategoriesQuery = useShipmentCostCategoriesQuery();
  const costCategoriesById = useMemo(
    () =>
      new Map(
        (costCategoriesQuery.data?.success
          ? costCategoriesQuery.data.costCategories
          : []
        ).map((costCategory) => [costCategory.id, costCategory]),
      ),
    [costCategoriesQuery.data],
  );

  /**
   * Shared by the "Số hợp đồng" cell (design.md section 4: "Mã bản ghi mở
   * Xem") and `RecordActionsMenu`'s own "Xem"/"Sửa" — one place deciding
   * what opening a Contract means, so the two entry points can never drift.
   * @param {import('../types/index.js').Contract} row
   * @param {'view' | 'edit'} mode
   */
  function openContract(row, mode) {
    setExpandedTab('profile');
    setWorkspace({ contract: row, sessionKey: generateRowKey(), mode });
  }

  /** @type {import('@/shared/components/advance-table.jsx').AdvanceTableColumn<import('../types/index.js').Contract & Record<string, unknown>>[]} */
  const columns = [
    {
      key: 'contractNumber',
      header: 'Số hợp đồng',
      width: pixel(180),
      filter: 'contractNumber',
      renderCell: (contract) => (
        <Button
          label={contract.contractNumber}
          variant="ghost"
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            openContract(contract, 'view');
          }}
        />
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
      renderCell: (contract) => contract.buyer.companyName,
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
      // No matching backend filter field — these three are computed
      // (contract value + annex adjustments, and the payment position off
      // it), not stored columns `ContractFilterFields` (BE-kt-xnk) knows
      // how to filter on.
      header: 'QUYẾT TOÁN',
      width: proportional(1, { minWidth: 180 }),
      align: 'end',
      renderCell: (contract) =>
        formatMoney(
          settlementsByContractId.get(contract.id)?.settlementValue,
          contract.currency,
        ),
      exportValue: (contract) =>
        settlementsByContractId.get(contract.id)?.settlementValue ?? '',
    },
    {
      key: 'paidValue',
      header: 'ĐÃ THANH TOÁN',
      width: proportional(1, { minWidth: 180 }),
      align: 'end',
      renderCell: (contract) =>
        formatMoney(
          settlementsByContractId.get(contract.id)?.paidValue,
          contract.currency,
        ),
      exportValue: (contract) =>
        settlementsByContractId.get(contract.id)?.paidValue ?? '',
    },
    {
      key: 'unpaidValue',
      header: 'CHƯA THANH TOÁN',
      width: proportional(1, { minWidth: 200 }),
      align: 'end',
      renderCell: (contract) =>
        formatMoney(
          settlementsByContractId.get(contract.id)?.unpaidValue,
          contract.currency,
        ),
      exportValue: (contract) =>
        settlementsByContractId.get(contract.id)?.unpaidValue ?? '',
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
  // rows (see `totalsRows` above). Most columns render blank for it; these
  // four render the pre-summed amount, and the leftmost column names the row.
  const columnsWithTotalsRow = withTotalsRowCells(
    columns,
    TOTALS_ROW_CELL_RENDERERS,
  );

  const searchableContracts = contracts.map((contract) => ({
    ...contract,
    buyerCompanyName: contract.buyer.companyName,
    countryName: countriesById.get(contract.countryId)?.name ?? '',
    bankNames: contract.bankIds
      .map((bankId) => banksById.get(bankId)?.bankName)
      .filter(Boolean)
      .join(', '),
  }));

  const contract = workspace?.contract;

  const totalContracts = listResult?.success ? listResult.totalCount : 0;
  const totalPages = Math.max(
    1,
    listResult?.success ? listResult.totalPages : 1,
  );

  const isLoadingContracts = contractsQuery.isLoading;

  return (
    <VStack gap={4} hAlign="stretch" height="100%">
      <HStack hAlign="between" vAlign="start" wrap="wrap" gap={3}>
        <VStack gap={1}>
          <Heading level={1}>Hợp đồng</Heading>
        </VStack>
        <HStack gap={2}>
          <Button
            label="Tạo hợp đồng"
            variant="primary"
            onClick={() => {
              setExpandedTab('profile');
              setWorkspace({ contract: null, sessionKey: generateRowKey() });
            }}
          />
        </HStack>
      </HStack>

      {listResult && !listResult.success ? (
        <AdvanceTableErrorBanner message={listResult.message} />
      ) : null}

      <SegmentedControl
        label="Lọc theo trạng thái"
        xstyle={styles.statusFilter}
        size="sm"
        value={statusQuickFilterValue}
        onChange={handleStatusQuickFilterChange}
      >
        <SegmentedControlItem value="all" label="Tất cả" />
        {contractStatusOptions.map((option) => (
          <SegmentedControlItem
            key={option.value}
            value={option.value}
            label={option.label}
          />
        ))}
      </SegmentedControl>

      <StackItem size="fill">
        <AdvanceTable
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
          dividers="grid"
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
          pagination={{
            pageIndex,
            pageSize,
            totalCount: totalContracts,
            totalPages,
            onPageIndexChange: setPageIndex,
            onPageSizeChange: setPageSize,
            pageSizeOptions: PAGE_SIZE_OPTIONS,
          }}
        />
      </StackItem>

      {workspace ? (
        <ContractFormDialog
          key={workspace.sessionKey}
          // Hidden (not unmounted — `CommonDialog`/`Dialog` keep children
          // mounted regardless of `isOpen`, see `ShipmentFormDialog`'s doc
          // comment) while a Shipment/Commission/BOQ opened from "Liên
          // quan" is showing, instead of stacking a second fullscreen
          // dialog (tasks 3.2/3.3). The short quick-add dialogs (annex/
          // payment/VGM) still stack on top — those stay "gọn" per
          // design.md section 3, not full workspaces of their own.
          isOpen={
            !shipmentDialog && !relatedCommissionDialog && !relatedBoqDialog
          }
          onOpenChange={(open) => {
            if (!open) setWorkspace(null);
          }}
          contract={workspace.contract}
          initialMode={workspace.mode}
          activeTab={expandedTab}
          onActiveTabChange={setExpandedTab}
          onSuccess={(saved) => {
            // Stays mounted (same `sessionKey`) — updates the Contract in
            // place instead of remounting the workspace just to fall back
            // to Xem; `ContractFormDialog` itself flips out of edit mode.
            setWorkspace((current) =>
              current ? { ...current, contract: saved } : current,
            );
          }}
        >
          {contract ? (
            <ContractExpandedDetails
              contract={contract}
              customersById={suppliersById}
              costCategoriesById={costCategoriesById}
              activeTab={expandedTab}
              onAddAnnex={() => setAnnexDialog({ contractId: contract.id })}
              onEditAnnex={(annex) =>
                setAnnexDialog({ contractId: contract.id, annex })
              }
              onAddPaymentSchedule={() =>
                setPaymentScheduleDialog({ contractId: contract.id })
              }
              onEditPaymentSchedule={(schedule) =>
                setPaymentScheduleDialog({ contractId: contract.id, schedule })
              }
              onAddShipment={() =>
                setShipmentDialog({ contractId: contract.id, contract })
              }
              onEditShipment={(shipment) =>
                setShipmentDialog({
                  contractId: contract.id,
                  contract,
                  shipment,
                })
              }
              onAddVgm={(payload) => setVgmDialog(payload)}
              onEditVgm={(payload) => setVgmDialog(payload)}
              onOpenCommission={(commission) =>
                setRelatedCommissionDialog({
                  contractId: contract.id,
                  currency: contract.currency,
                  commission,
                })
              }
              onOpenBoq={() =>
                setRelatedBoqDialog({
                  contractId: contract.id,
                  contractNumber: contract.contractNumber,
                })
              }
            />
          ) : null}
        </ContractFormDialog>
      ) : null}

      {relatedCommissionDialog ? (
        <CommissionFormDialog
          key={relatedCommissionDialog.commission?.id ?? 'create'}
          isOpen
          initialMode="view"
          onOpenChange={(isOpen) => {
            if (!isOpen) setRelatedCommissionDialog(null);
          }}
          contractId={relatedCommissionDialog.contractId}
          currency={relatedCommissionDialog.currency}
          commission={relatedCommissionDialog.commission}
          closeLabel="Quay lại Contract"
          onSuccess={(saved) =>
            setRelatedCommissionDialog((current) =>
              current ? { ...current, commission: saved } : current,
            )
          }
          onAddAnnex={() =>
            setCommissionAnnexDialog({
              contractId: relatedCommissionDialog.contractId,
            })
          }
          onEditAnnex={(annex) =>
            setCommissionAnnexDialog({
              contractId: relatedCommissionDialog.contractId,
              annex,
            })
          }
          onAddPayment={() =>
            relatedCommissionDialog.commission &&
            setCommissionPaymentDialog({
              contractId: relatedCommissionDialog.contractId,
              currency: relatedCommissionDialog.currency,
              commission: relatedCommissionDialog.commission,
            })
          }
        />
      ) : null}

      {relatedBoqDialog ? (
        <ContractPrivateInfoDetailDialog
          key={relatedBoqDialog.contractId}
          contractId={relatedBoqDialog.contractId}
          contractNumber={relatedBoqDialog.contractNumber}
          closeLabel="Quay lại Contract"
          onOpenChange={(isOpen) => {
            if (!isOpen) setRelatedBoqDialog(null);
          }}
        />
      ) : null}

      {/* Related editors stay outside tables (ADR-0004). */}

      {shipmentDialog ? (
        <ShipmentFormDialog
          key={shipmentDialog.shipment?.id ?? 'create'}
          isOpen
          onOpenChange={(isOpen) => {
            if (!isOpen) setShipmentDialog(null);
          }}
          contractId={shipmentDialog.contractId}
          contract={shipmentDialog.contract}
          shipment={shipmentDialog.shipment}
          closeLabel="Quay lại Contract"
          onSuccess={(saved) =>
            setShipmentDialog((current) =>
              current?.shipment ? { ...current, shipment: saved } : null,
            )
          }
        />
      ) : null}

      {annexDialog ? (
        <ContractAnnexFormDialog
          key={annexDialog.annex?.id ?? 'create'}
          isOpen
          onOpenChange={(isOpen) => {
            if (!isOpen) setAnnexDialog(null);
          }}
          contractId={annexDialog.contractId}
          annex={annexDialog.annex}
          onSuccess={() => setAnnexDialog(null)}
        />
      ) : null}

      {paymentScheduleDialog ? (
        <PaymentScheduleFormDialog
          key={paymentScheduleDialog.schedule?.id ?? 'create'}
          isOpen
          onOpenChange={(isOpen) => {
            if (!isOpen) setPaymentScheduleDialog(null);
          }}
          contractId={paymentScheduleDialog.contractId}
          schedule={paymentScheduleDialog.schedule}
          onSuccess={() => setPaymentScheduleDialog(null)}
        />
      ) : null}

      {commissionAnnexDialog ? (
        <CommissionAnnexFormDialog
          key={commissionAnnexDialog.annex?.id ?? 'create'}
          isOpen
          onOpenChange={(isOpen) => {
            if (!isOpen) setCommissionAnnexDialog(null);
          }}
          contractId={commissionAnnexDialog.contractId}
          annex={commissionAnnexDialog.annex}
          onSuccess={() => setCommissionAnnexDialog(null)}
        />
      ) : null}

      {commissionPaymentDialog ? (
        <CommissionPaymentQuickAddDialog
          isOpen
          onOpenChange={(isOpen) => {
            if (!isOpen) setCommissionPaymentDialog(null);
          }}
          contractId={commissionPaymentDialog.contractId}
          commission={commissionPaymentDialog.commission}
          currency={commissionPaymentDialog.currency}
          onSuccess={() => setCommissionPaymentDialog(null)}
        />
      ) : null}

      {vgmDialog ? (
        <ShipmentVgmFormDialog
          key={vgmDialog.vgm?.id ?? 'create'}
          isOpen
          onOpenChange={(isOpen) => {
            if (!isOpen) setVgmDialog(null);
          }}
          contractId={vgmDialog.contractId}
          shipmentId={vgmDialog.shipmentId}
          vgm={vgmDialog.vgm}
          onSuccess={() => setVgmDialog(null)}
        />
      ) : null}
    </VStack>
  );
}
