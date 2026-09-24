'use client';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Link } from '@astryxdesign/core/Link';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { Selector } from '@astryxdesign/core/Selector';
import { StackItem } from '@astryxdesign/core/Stack';
import { pixel, proportional } from '@astryxdesign/core/Table';
import { Tab, TabList } from '@astryxdesign/core/TabList';
import { Heading, Text } from '@astryxdesign/core/Text';
import { colorVars, spacingVars } from '@astryxdesign/core/theme/tokens.stylex';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { Banknote, Eye, List, Pencil, Plus, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import {
  AdvanceTable,
  AdvanceTableErrorBanner,
} from '@/shared/components/advance-table.jsx';
import { MetaCountBadge } from '@/shared/components/custom/meta/count-badge.jsx';
import { MetaStatusBadge } from '@/shared/components/custom/meta/status-badge.jsx';
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
  labelForContractStatus,
} from '../config/contract-status.js';
import { labelForContractType } from '../config/contract-types.js';
import {
  COLUMN_OPTIONS,
  DEFAULT_COLUMN_KEYS,
  DEFAULT_PAGE_SIZE,
  FILTER_FIELD_DEFS,
  FINANCIAL_COLUMN_KEYS,
  PAGE_SIZE_OPTIONS,
  SEARCH_FIELD_DEFS,
  skeletonRows,
  VIEW_PRESETS,
} from '../config/contracts-table.js';
import { CURRENCY_CODES, formatMoney } from '../config/currencies.js';
import { useContractBanksQuery } from '../hooks/use-contract-banks-query.js';
import { useContractPrivateInfosListQuery } from '../hooks/use-contract-private-infos-list-query.js';
import {
  useContractListTabCounts,
  useContractsQuery,
} from '../hooks/use-contracts-query.js';
import { useCountriesQuery } from '../hooks/use-countries-query.js';
import { useCustomersQuery } from '../hooks/use-customers-query.js';
import { ContractFormDialog } from './contract-form-dialog.jsx';
import { CustomerDetailDialog } from './customer-detail-dialog.jsx';
import { RecordActionsMenu } from './record-actions-menu.jsx';

/**
 * "XNK" logistics cost = cost price per container × container count (the
 * BOQ's own `logisticsTotal` is the quoted/sale side of the same product).
 * @param {import('../types/index.js').ContractPrivateInfoListItem | undefined} info
 */
function costTotalOf(info) {
  if (info?.costPricePerContainer == null || info.containerCount == null) {
    return null;
  }
  return info.costPricePerContainer * info.containerCount;
}

/**
 * Meta mockup status pills: đang thực hiện = cobalt (pulsing dot), hoàn
 * thành = green, hủy = red, everything else neutral grey.
 * @param {string} status
 * @returns {'accent' | 'success' | 'error' | 'neutral'}
 */
function statusTone(status) {
  if (status === 'InProgress') return 'accent';
  if (status === 'Completed') return 'success';
  if (status === 'Cancelled') return 'error';
  return 'neutral';
}

/**
 * Count pill tone per status tab — the selected tab's pill is always the
 * translucent white one sitting on the filled cobalt tab.
 * @param {string} status
 * @param {string} activeStatus
 * @returns {'accent' | 'success' | 'neutral' | 'on-accent'}
 */
function tabCountTone(status, activeStatus) {
  if (status === activeStatus) return 'on-accent';
  if (status === 'InProgress') return 'accent';
  if (status === 'Completed') return 'success';
  return 'neutral';
}

const STATUS_TABS = /** @type {const} */ ([
  { value: 'all', label: 'Tất cả' },
  { value: 'InProgress', label: 'Đang thực hiện' },
  { value: 'Completed', label: 'Hoàn thành' },
  { value: 'Draft', label: 'Bản nháp' },
  { value: 'Cancelled', label: 'Đã hủy' },
]);

/** @param {string | number | null | undefined} value */
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
 *   containerCount?: number | null,
 *   logisticsSale?: number | null,
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
  containerCount: (row) =>
    row.containerCount == null ? null : (
      <Text weight="bold" color="accent" hasTabularNumbers>
        {row.containerCount}
      </Text>
    ),
  logisticsSale: (row) =>
    row.logisticsSale == null ? null : (
      <Text color="primary" weight="bold" hasTabularNumbers>
        {formatMoney(row.logisticsSale)} đ
      </Text>
    ),
  contractValue: (row) => (
    <Text weight="bold" hasTabularNumbers>
      {formatMoney(row.contractValue, row.currency)}
    </Text>
  ),
  settlementValue: (row) => (
    <Text weight="bold" hasTabularNumbers>
      {formatMoney(row.settlementValue, row.currency)}
    </Text>
  ),
  paidValue: (row) => (
    <Text weight="bold" color="accent" hasTabularNumbers>
      {formatMoney(row.paidValue, row.currency)}
    </Text>
  ),
  unpaidValue: (row) => (
    <HStack as="span" hAlign="end" xstyle={styles.unpaidText}>
      <Text weight="bold" color="inherit" hasTabularNumbers>
        {formatMoney(row.unpaidValue, row.currency)}
      </Text>
    </HStack>
  ),
  exportedValue: (row) => (
    <Text weight="bold" hasTabularNumbers>
      {formatMoney(row.exportedValue, row.currency)}
    </Text>
  ),
  exportedValueVnd: (row) => (
    <Text weight="bold" color="secondary" hasTabularNumbers>
      {formatMoney(row.exportedValueVnd)} đ
    </Text>
  ),
  unexportedValue: (row) => (
    <Text weight="bold" hasTabularNumbers>
      {formatMoney(row.unexportedValue, row.currency)}
    </Text>
  ),
};

const LOGISTICS_GROUP_KEY = 'logistics-cost-group';
const LOGISTICS_GROUP_COLUMN_KEYS = ['logisticsSale', 'logisticsCost'];

const SETTLEMENT_GROUP_KEY = 'settlement-value-group';
const SETTLEMENT_GROUP_COLUMN_KEYS = [
  'contractValue',
  'settlementValue',
  'exportedValue',
  'exportedValueVnd',
];

const PAYMENT_GROUP_KEY = 'payment-status-group';
const PAYMENT_GROUP_COLUMN_KEYS = ['paidValue', 'unpaidValue'];

const CONTRACT_HEADER_GROUPS = [
  {
    id: LOGISTICS_GROUP_KEY,
    label: 'CHI PHÍ LOGISTICS',
    columnKeys: LOGISTICS_GROUP_COLUMN_KEYS,
  },
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
  // Record codes render as bold accent links (Meta mockup: cobalt
  // `font-bold`, the page's `MetaThemeProvider` accent).
  contractNumberLink: {
    color: colorVars['--color-text-accent'],
    fontWeight: 'bold',
  },
  nowrap: {
    whiteSpace: 'nowrap',
  },
  totalsCaption: {
    letterSpacing: '0.05em',
  },
  // Track height (4px) comes from the Meta theme's `progress-bar-track`
  // override; only the length is set here.
  paidBar: {
    flexShrink: 0,
    width: 96,
  },
  // Fixed-width, right-aligned % label ("29.5%" is the widest) so every
  // row's bar starts at the same x regardless of the percent text.
  paidPercentSlot: {
    minWidth: spacingVars['--spacing-8'],
  },
  paidPercent: {
    color: colorVars['--color-text-secondary'],
  },
  paidPercentDone: {
    color: colorVars['--color-success'],
  },
  // Figma THANH TOÁN leaf headers: green "đã", red "chưa".
  paidHeader: {
    color: colorVars['--color-success'],
  },
  unpaidHeader: {
    color: colorVars['--color-error'],
  },
  unpaidText: {
    color: colorVars['--color-error'],
  },
});

/**
 * Amount over a thin bar showing what share of the settlement is paid —
 * the "Giá trị & Dòng tiền" paid cell; the bar turns green once fully paid.
 * @param {{ paid: number, settlement: number, currency: string, isFramed?: boolean }} props
 */
function PaidCell({ paid, settlement, currency, isFramed }) {
  const percent =
    settlement > 0
      ? Math.min(100, Math.round((paid / settlement) * 1000) / 10)
      : 0;
  return (
    <VStack gap={1} hAlign="end">
      <Text
        weight="bold"
        color={isFramed && percent < 100 ? 'accent' : 'primary'}
        hasTabularNumbers
      >
        {formatMoney(paid, currency)}
      </Text>
      <HStack gap={2} vAlign="center">
        <ProgressBar
          label="Tỷ lệ đã thanh toán"
          isLabelHidden
          xstyle={styles.paidBar}
          value={percent}
          variant={percent >= 100 ? 'success' : 'accent'}
        />
        <HStack
          as="span"
          hAlign="end"
          xstyle={[
            styles.paidPercentSlot,
            percent >= 100 ? styles.paidPercentDone : styles.paidPercent,
          ]}
        >
          <Text
            type="supporting"
            size="sm"
            weight="bold"
            color="inherit"
            hasTabularNumbers
            xstyle={styles.nowrap}
          >
            {percent}%
          </Text>
        </HStack>
      </HStack>
    </VStack>
  );
}

const commercialYear = new Date().getFullYear();

/**
 * Viewing/editing an existing Contract now happens on its own page
 * (`/logistics/contract/[id]`, `openspec/changes/add-contract-detail-page/`)
 * — this list only ever opens `ContractFormDialog` for the "Tạo hợp đồng"
 * (create) flow, `contract == null`. The Buyer-link `CustomerDetailDialog`
 * is a sibling of the table so its Selector portals stay inside their own
 * dialog layer (ADR-0004).
 */
/**
 * `isFramed` switches to the Meta "Danh sách Hợp đồng" screen (Stitch
 * project 6957224641630765183): framed workspace card, pill status tabs
 * with counts, status pill with dot, bold value columns, blue paid / red
 * unpaid amounts, icon-only row actions. The theme itself comes from the
 * `MetaThemeProvider` the page wraps around this component. Opens on the
 * "Cơ bản" view preset, also after a reload (user request, 2026-09-24).
 * @param {{ initialViewPresetKey?: 'basic' | 'financial', isFramed?: boolean }} [props]
 */
export function ContractsList({
  initialViewPresetKey = 'basic',
  isFramed = true,
} = {}) {
  const router = useRouter();
  // Regenerated on every open so a previous create draft never bleeds
  // into the next one.
  const [createSessionKey, setCreateSessionKey] = useState(
    /** @type {string | null} */ (null),
  );
  const [editingContract, setEditingContract] = useState(
    /** @type {import('../types/index.js').Contract | null} */ (null),
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
  const activeStatus = (() => {
    const contractType = filterConditions.find(
      (condition) =>
        condition.field === 'contractType' && condition.operator === 'Equals',
    )?.value;
    if (contractType === 'Draft') return 'Draft';
    return (
      filterConditions.find(
        (condition) =>
          condition.field === 'status' && condition.operator === 'Equals',
      )?.value ?? 'all'
    );
  })();
  const tabCounts = useContractListTabCounts(filterConditions);

  /**
   * Status navigation from the Stitch screen is intentionally backed by the
   * same server-side condition array as the advanced-search dialog. This
   * keeps status switching correct across every page and leaves the funnel
   * builder fully functional instead of layering on a page-local filter.
   * @param {string} status
   */
  function handleStatusChange(status) {
    setFilterConditions((current) => {
      const withoutStatus = current.filter(
        (condition) =>
          condition.field !== 'status' && condition.field !== 'contractType',
      );
      const contractTypeCondition = {
        id: generateRowKey(),
        field: 'contractType',
        operator: 'Equals',
        value: status === 'Draft' ? 'Draft' : 'Official',
        connector: /** @type {const} */ ('And'),
      };
      if (status === 'all' || status === 'Draft') {
        return [...withoutStatus, contractTypeCondition];
      }
      return [
        ...withoutStatus,
        contractTypeCondition,
        {
          id: generateRowKey(),
          field: 'status',
          operator: 'Equals',
          value: status,
          connector: /** @type {const} */ ('And'),
        },
      ];
    });
    setPageIndex(1);
  }
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

  // Figma filter band: "Loại HĐ" / "Tiền tệ" / "Thời gian" dropdowns. Like
  // the tabs and the funnel dialog they only edit `filterConditions`, so
  // everything stays server-side.
  const contractTypeFilter =
    filterConditions.find((condition) => condition.field === 'contractType')
      ?.value ?? 'all';
  const currencyFilter =
    filterConditions.find((condition) => condition.field === 'currency')
      ?.value ?? 'all';
  const createdYearFilter = (() => {
    const from = filterConditions.find(
      (condition) => condition.field === 'createdDate',
    )?.value;
    return from ? from.slice(0, 4) : 'all';
  })();
  /** @param {string | null} type */
  function handleContractTypeFilterChange(type) {
    setFilterConditions((current) => {
      const rest = current.filter(
        (condition) =>
          condition.field !== 'contractType' && condition.field !== 'status',
      );
      return type && type !== 'all'
        ? [
            ...rest,
            {
              id: generateRowKey(),
              field: 'contractType',
              operator: 'Equals',
              value: type,
              connector: /** @type {const} */ ('And'),
            },
          ]
        : rest;
    });
    setPageIndex(1);
  }
  /** @param {string | null} currency */
  function handleCurrencyFilterChange(currency) {
    setFilterConditions((current) =>
      upsertEqualsFilterCondition(
        current,
        'currency',
        currency === 'all' ? null : currency,
      ),
    );
    setPageIndex(1);
  }
  /** @param {string | null} year */
  function handleYearFilterChange(year) {
    setFilterConditions((current) => {
      const rest = current.filter(
        (condition) => condition.field !== 'createdDate',
      );
      return year && year !== 'all'
        ? [
            ...rest,
            {
              id: generateRowKey(),
              field: 'createdDate',
              operator: 'Between',
              value: `${year}-01-01`,
              valueTo: `${year}-12-31`,
              connector: /** @type {const} */ ('And'),
            },
          ]
        : rest;
    });
    setPageIndex(1);
  }
  function handleResetFilters() {
    setFilterConditions([
      {
        id: generateRowKey(),
        field: 'contractType',
        operator: 'Equals',
        value: 'Official',
        connector: 'And',
      },
    ]);
    setPageIndex(1);
  }
  const framedFilters = isFramed ? (
    <HStack gap={2} vAlign="center" wrap="nowrap">
      <Selector
        label="Loại hợp đồng"
        isLabelHidden
        size="lg"
        value={contractTypeFilter}
        options={[
          { value: 'all', label: 'Loại HĐ: Tất cả' },
          { value: 'Official', label: 'Loại HĐ: Chính thức' },
          { value: 'Draft', label: 'Loại HĐ: Bản nháp' },
        ]}
        onChange={handleContractTypeFilterChange}
      />
      <Selector
        label="Tiền tệ"
        isLabelHidden
        size="lg"
        value={currencyFilter}
        options={[
          { value: 'all', label: 'Tiền tệ: Tất cả' },
          ...CURRENCY_CODES.map((code) => ({
            value: code,
            label: `Tiền tệ: ${code}`,
          })),
        ]}
        onChange={handleCurrencyFilterChange}
      />
      <Selector
        label="Thời gian"
        isLabelHidden
        size="lg"
        value={createdYearFilter}
        options={[
          { value: 'all', label: 'Thời gian: Tất cả' },
          ...[0, 1, 2, 3].map((offset) => {
            const year = String(commercialYear - offset);
            return { value: year, label: `Thời gian: Năm ${year}` };
          }),
        ]}
        onChange={handleYearFilterChange}
      />
      <Button
        label="Đặt lại"
        icon={<Icon icon={RotateCcw} size="sm" />}
        variant="secondary"
        size="lg"
        onClick={handleResetFilters}
      />
    </HStack>
  ) : null;

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
  // "Chi phí logistics"/"Số cont" come from each contract's BOQ (private
  // info, `logistics:secret`) — a separate endpoint, so joined by contractId
  // over the same page/conditions/sort. A forbidden/failed call just leaves
  // those cells as "—"; the rest of the list is unaffected.
  const privateInfosQuery = useContractPrivateInfosListQuery({
    page: pageIndex,
    pageSize,
    conditions: filterConditions,
    sort,
  });
  const privateInfosByContractId = useMemo(
    () =>
      new Map(
        (privateInfosQuery.data?.success
          ? privateInfosQuery.data.items
          : []
        ).map((info) => [info.contractId, info]),
      ),
    [privateInfosQuery.data],
  );
  const privateTotals = privateInfosQuery.data?.success
    ? privateInfosQuery.data.totals
    : null;

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
      containerCount: total.containerCount,
      // BOQ totals are VNĐ-only, so they only make sense on a single row.
      logisticsSale:
        totals.length === 1 && privateTotals
          ? privateTotals.logisticsTotal
          : null,
      isMultiCurrency: totals.length > 1,
    }));
  }, [listResult, privateTotals]);
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
    if (mode === 'edit') {
      // "Sửa" opens the same edit drawer as the detail page, in place.
      setEditingContract(contracts.find((c) => c.id === row.id) ?? row);
      return;
    }
    router.push(`/logistics/contract/${row.id}`);
  }

  /** @param {import('react').ReactNode} content */
  function mutedIf(content) {
    return isFramed ? (
      <Text color="secondary" weight="medium">
        {content}
      </Text>
    ) : (
      content
    );
  }

  /** @param {import('react').ReactNode} content */
  function boldIf(content) {
    return isFramed ? <Text weight="bold">{content}</Text> : content;
  }

  // Money columns keep room for full amounts ("108,131,176,875.83 đ") —
  // the financial view scrolls horizontally instead of squeezing all 13
  // columns into one screen (user request, 2026-09-23; the first/second
  // columns and "Thao tác" stay pinned while scrolling).
  const moneyMinWidth = isFramed ? 180 : 210;

  /** @type {import('@/shared/components/advance-table.jsx').AdvanceTableColumn<import('../types/index.js').Contract & Record<string, unknown>>[]} */
  const columns = [
    {
      key: 'contractNumber',
      header: 'Số hợp đồng',
      width: pixel(140),
      filter: 'contractNumber',
      renderCell: (contract) => (
        <Link
          xstyle={styles.contractNumberLink}
          onClick={(event) => {
            event.stopPropagation();
            openContract(contract, 'view');
          }}
        >
          <Text as="span" weight="bold" color="inherit">
            {contract.contractNumber}
          </Text>
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
      width: pixel(isFramed ? 156 : 136),
      filter: 'status',
      renderCell: (contract) =>
        isFramed ? (
          <MetaStatusBadge
            label={labelForContractStatus(contract.status)}
            tone={statusTone(contract.status)}
            isPulsing={contract.status === 'InProgress'}
          />
        ) : (
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
      key: 'containerCount',
      header: 'SỐ CONT',
      width: pixel(90),
      align: 'center',
      renderCell: (contract) =>
        boldIf(settlementsByContractId.get(contract.id)?.containerCount ?? '—'),
      exportValue: (contract) =>
        settlementsByContractId.get(contract.id)?.containerCount ?? '',
    },
    {
      key: 'logisticsSale',
      header: 'SALE',
      width: proportional(1, { minWidth: moneyMinWidth }),
      align: 'end',
      renderCell: (contract) => {
        const total = privateInfosByContractId.get(contract.id)?.logisticsTotal;
        return total == null ? (
          '—'
        ) : (
          <Text color="primary" weight="medium">
            {formatMoney(total)} đ
          </Text>
        );
      },
      exportValue: (contract) =>
        privateInfosByContractId.get(contract.id)?.logisticsTotal ?? '',
    },
    {
      key: 'logisticsCost',
      header: 'XNK',
      width: proportional(1, { minWidth: moneyMinWidth }),
      align: 'end',
      renderCell: (contract) => {
        const cost = costTotalOf(privateInfosByContractId.get(contract.id));
        return cost == null ? (
          '—'
        ) : (
          <Text color="accent" weight="bold">
            {formatMoney(cost)} đ
          </Text>
        );
      },
      exportValue: (contract) =>
        costTotalOf(privateInfosByContractId.get(contract.id)) ?? '',
    },
    {
      key: 'contractValue',
      // First of the four settlement-group columns (see
      // `SETTLEMENT_GROUP_COLUMN_KEYS`) — the contract's own value, next to
      // its quyết toán / đã thanh toán / chưa thanh toán position.
      header: 'GIÁ TRỊ HĐ',
      width: proportional(1, { minWidth: moneyMinWidth }),
      align: 'end',
      filter: 'contractValue',
      renderCell: (contract) =>
        boldIf(formatMoney(contract.contractValue, contract.currency)),
    },
    {
      key: 'settlementValue',
      // No matching backend filter field — these are all computed (contract
      // value + annex adjustments, the shipment declaration sums, and the
      // payment position off them), not stored columns `ContractFilterFields`
      // (BE-kt-xnk) knows how to filter on.
      header: 'QUYẾT TOÁN',
      width: proportional(1, { minWidth: moneyMinWidth }),
      align: 'end',
      filter: 'settlementValue',
      renderCell: (contract) =>
        boldIf(
          formatMoney(Number(contract.settlementValue), contract.currency),
        ),
      exportValue: (contract) => Number(contract.settlementValue),
    },
    {
      key: 'exportedValue',
      // Sum of every Shipment's `declarationValue` ("Giá trị tờ khai")
      // recorded against this contract (BE `ContractSettlement.ExportedValue`).
      header: 'ĐÃ XUẤT',
      width: proportional(1, { minWidth: moneyMinWidth }),
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
      header: 'ĐÃ XUẤT VNĐ',
      width: proportional(1, { minWidth: isFramed ? 220 : 250 }),
      align: 'end',
      filter: 'exportedValueVnd',
      renderCell: (contract) =>
        mutedIf(`${formatMoney(Number(contract.exportedValueVnd))} đ`),
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
      header: (
        <HStack as="span" xstyle={styles.paidHeader}>
          ĐÃ THANH TOÁN
        </HStack>
      ),
      width: proportional(1, { minWidth: moneyMinWidth }),
      align: 'end',
      filter: 'paidValue',
      renderCell: (contract) => (
        <PaidCell
          paid={Number(contract.paidValue)}
          settlement={Number(contract.settlementValue)}
          currency={contract.currency}
          isFramed={isFramed}
        />
      ),
      exportValue: (contract) => Number(contract.paidValue),
    },
    {
      key: 'unpaidValue',
      header: (
        <HStack as="span" xstyle={styles.unpaidHeader}>
          CHƯA THANH TOÁN
        </HStack>
      ),
      width: proportional(1, { minWidth: moneyMinWidth }),
      align: 'end',
      filter: 'unpaidValue',
      renderCell: (contract) =>
        Number(contract.unpaidValue) === 0 ? (
          mutedIf(formatMoney(0, contract.currency))
        ) : (
          <HStack as="span" hAlign="end" xstyle={styles.unpaidText}>
            <Text weight="bold" color="inherit" hasTabularNumbers>
              {formatMoney(Number(contract.unpaidValue), contract.currency)}
            </Text>
          </HStack>
        ),
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
      width: pixel(isFramed ? 110 : 108),
      filter: 'createdDate',
      renderCell: (contract) =>
        mutedIf(formatDisplayDate(contract.createdDate)),
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
      header: 'Ngày hoàn thành',
      width: pixel(isFramed ? 150 : 142),
      // `null` while the project isn't finished yet (only fillable once
      // `status` is "Đã hoàn thành" — see `contract-general-fields.jsx`).
      renderCell: (contract) =>
        mutedIf(formatDisplayDate(contract.projectCompletionDate)),
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
      header: isFramed ? 'Thao tác' : 'Chức năng',
      // The Figma reference uses two icon-only actions in 92px. This app's
      // accessible actions menu keeps its visible "Chức năng" label, so it
      // needs a slightly wider floor to avoid clipping while preserving the
      // same compact end column.
      width: pixel(isFramed ? 96 : 120),
      align: 'end',
      renderCell: (row) =>
        isFramed ? (
          <HStack gap={1} vAlign="center" wrap="nowrap">
            <IconButton
              label={`Xem ${row.contractNumber}`}
              tooltip="Xem"
              icon={<Icon icon={Eye} size="sm" />}
              variant="ghost"
              size="sm"
              onClick={() => openContract(row, 'view')}
            />
            <IconButton
              label={`Sửa ${row.contractNumber}`}
              tooltip="Sửa"
              icon={<Icon icon={Pencil} size="sm" />}
              variant="ghost"
              size="sm"
              onClick={() => openContract(row, 'edit')}
            />
          </HStack>
        ) : (
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
          title={
            <VStack gap={1} hAlign="start">
              <HStack gap={2} vAlign="center" wrap="wrap">
                <Heading level={1}>Danh sách Hợp đồng</Heading>
                {isFramed ? (
                  <MetaStatusBadge
                    label={`${totalContracts} hợp đồng`}
                    tone="accent"
                    hasBorder
                  />
                ) : (
                  <Badge label={`${totalContracts} hợp đồng`} variant="blue" />
                )}
              </HStack>
            </VStack>
          }
          headerContent={
            <TabList
              role="tablist"
              size={isFramed ? 'md' : 'sm'}
              value={activeStatus}
              onChange={handleStatusChange}
            >
              {STATUS_TABS.map((tab) => (
                <Tab
                  key={tab.value}
                  value={tab.value}
                  label={tab.label}
                  panelId="contracts-table"
                  endContent={
                    isFramed ? (
                      <MetaCountBadge
                        value={tabCounts[tab.value]}
                        tone={tabCountTone(tab.value, activeStatus)}
                      />
                    ) : (
                      <Badge
                        label={tabCounts[tab.value]}
                        variant={tab.value === 'all' ? 'blue' : undefined}
                      />
                    )
                  }
                />
              ))}
            </TabList>
          }
          viewPresetsInHeader
          dividers={isFramed ? 'rows' : undefined}
          isFramed={isFramed}
          toolbarFilters={framedFilters}
          isStriped={isFramed}
          headerGroups={CONTRACT_HEADER_GROUPS}
          toolbarLabel="Thao tác danh sách hợp đồng"
          searchFieldDefs={searchFieldDefsWithCustomers}
          entityLabel="Danh sách hợp đồng"
          contentSearchFieldKey="contractNumber"
          onContentSearchChange={handleContractNumberSearchChange}
          searchPlaceholder="Tìm nhanh theo mã HĐ, tên dự án, khách hàng, số vận đơn B/L..."
          filterFieldDefs={filterFieldDefsWithCustomers}
          advancedFilterConditions={filterConditions}
          onAdvancedFilterChange={setFilterConditions}
          columnOptions={COLUMN_OPTIONS}
          initialColumnKeys={
            initialViewPresetKey === 'financial'
              ? FINANCIAL_COLUMN_KEYS
              : DEFAULT_COLUMN_KEYS
          }
          defaultColumnKeys={
            initialViewPresetKey === 'financial'
              ? FINANCIAL_COLUMN_KEYS
              : DEFAULT_COLUMN_KEYS
          }
          initialViewPresetKey={initialViewPresetKey}
          viewPresets={
            isFramed
              ? VIEW_PRESETS.map((preset) => ({
                  ...preset,
                  icon: (
                    <Icon
                      icon={preset.key === 'basic' ? List : Banknote}
                      size="sm"
                    />
                  ),
                }))
              : VIEW_PRESETS
          }
          itemLabel="hợp đồng"
          // Both view presets lead with `createdDate` (Ngày ký) then
          // `contractNumber` (Số hợp đồng) — pin them by default so they
          // stay visible while scrolling the wide financial columns
          // horizontally, same as `fixedEndColumnKeys` pins "Chức năng".
          defaultStickyStart="two"
          fixedEndColumnKeys={['actions']}
          tableColumns={columnsWithTotalsRow}
          data={searchableContracts}
          totalsRows={totalsRows}
          totalsRowLabel={
            isFramed
              ? (/** @type {ContractTotalsRow} */ row) => (
                  <HStack gap={2} vAlign="center" wrap="nowrap">
                    <Text size="lg" weight="bold" color="accent">
                      Σ
                    </Text>
                    <Text
                      weight="bold"
                      color="accent"
                      xstyle={[styles.nowrap, styles.totalsCaption]}
                    >
                      {`TỔNG CỘNG (${totalContracts} HỢP ĐỒNG${row.isMultiCurrency ? ` · ${row.currency}` : ''})`}
                    </Text>
                  </HStack>
                )
              : totalsRowLabel
          }
          idKey="id"
          isLoading={isLoadingContracts}
          skeletonRows={skeletonRows}
          fetchAllRows={fetchAllContracts}
          onRefresh={() => contractsQuery.refetch()}
          isRefreshing={contractsQuery.isFetching}
          primaryAction={{
            label: 'Tạo hợp đồng mới',
            icon: <Icon icon={Plus} size="sm" />,
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

      {editingContract ? (
        <ContractFormDialog
          key={editingContract.id}
          isOpen
          onOpenChange={(open) => {
            if (!open) setEditingContract(null);
          }}
          contract={editingContract}
          activeTab="profile"
          onActiveTabChange={() => {}}
          initialMode="edit"
          closeOnCancel
          onSuccess={() => {
            setEditingContract(null);
            contractsQuery.refetch();
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
