'use client';
/**
 * A `Shipment` plus fields resolved client-side for display — same reason
 * as `CommissionListRow` in `commissions-list.jsx`: the
 * system-wide `GET /api/v1/shipments` response doesn't carry the parent
 * contract's number/project or the forwarder's name.
 * @typedef {import('../types/index.js').Shipment & {
 *   contractNumber: string,
 *   projectName: string,
 *   supplierName: string,
 *   incoterm: string,
 *   logisticsCost: number,
 *   costsByCode: Record<string, number>,
 * }} ShipmentListRow
 */
import { AlertDialog } from '@astryxdesign/core/AlertDialog';
import { Button } from '@astryxdesign/core/Button';
import { Carousel } from '@astryxdesign/core/Carousel';
import { DialogHeader } from '@astryxdesign/core/Dialog';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Layout, LayoutContent, LayoutFooter } from '@astryxdesign/core/Layout';
import { Link } from '@astryxdesign/core/Link';
import { Selector } from '@astryxdesign/core/Selector';
import { StackItem } from '@astryxdesign/core/Stack';
import { pixel, proportional } from '@astryxdesign/core/Table';
import { Tab, TabList } from '@astryxdesign/core/TabList';
import { Heading, Text } from '@astryxdesign/core/Text';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import {
  Banknote,
  CalendarDays,
  Coins,
  Eye,
  List,
  Pencil,
  Plus,
  ReceiptText,
  RotateCcw,
  Trash2,
  Truck,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import {
  AdvanceTable,
  AdvanceTableErrorBanner,
} from '@/shared/components/advance-table.jsx';
import { CommonDialog } from '@/shared/components/common-dialog.jsx';
import { MetaCountBadge } from '@/shared/components/custom/meta/count-badge.jsx';
import { MetaPill } from '@/shared/components/custom/meta/pill.jsx';
import { MetaStatusBadge } from '@/shared/components/custom/meta/status-badge.jsx';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';
import { numberValueToInput } from '@/shared/config/formatted-number-input.js';
import { generateRowKey } from '@/shared/config/generate-row-key.js';
import { withTotalsRowCells } from '@/shared/config/totals-row.js';
import {
  upsertContainsFilterCondition,
  upsertEqualsFilterCondition,
} from '@/shared/config/upsert-filter-condition.js';
import { useAppToast } from '@/shared/hooks/use-app-toast.js';

import { searchAllShipments } from '../api/shipments.js';
import { formatMoney, formatVndAmount } from '../config/currencies.js';
import {
  isContractEligibleForShipment,
  reasonContractIneligibleForShipment,
} from '../config/shipment-contract-eligibility.js';
import { labelForShipmentQuantityUnit } from '../config/shipment-quantity-units.js';
import {
  labelForShipmentStatus,
  metaToneForShipmentStatus,
  shipmentStatusOptions,
} from '../config/shipment-status.js';
import {
  labelForShipmentType,
  shipmentTypeOptions,
} from '../config/shipment-types.js';
import {
  COLUMN_OPTIONS,
  COST_GROUP_COLUMNS,
  DEFAULT_COLUMN_KEYS,
  DEFAULT_PAGE_SIZE,
  FILTER_FIELD_DEFS,
  PAGE_SIZE_OPTIONS,
  SEARCH_FIELD_DEFS,
  skeletonRows,
  VIEW_PRESETS,
} from '../config/shipments-table.js';
import { useContractsQuery } from '../hooks/use-contracts-query.js';
import { useShipmentCostCategoriesQuery } from '../hooks/use-shipment-cost-categories-query.js';
import { useShipmentsListQuery } from '../hooks/use-shipments-list-query.js';
import { useDeleteShipmentMutation } from '../hooks/use-shipments-query.js';
import { useSuppliersQuery } from '../hooks/use-suppliers-query.js';
import { ShipmentFormDialog } from './shipment-form-dialog.jsx';

/** @param {string | null | undefined} value */
function orDash(value) {
  return value == null || value === '' ? '—' : value;
}

/**
 * One row per currency seen in either `invoiceValue` or `declarationValue`
 * (see `searchAllShipments`'s doc comment) — a row missing one side has 0
 * there, not a gap. The flat figures (VNĐ totals, quantities, record counts)
 * are only set on the first row: repeating them on every currency row would
 * suggest they're per-currency too.
 * @typedef {{
 *   id: string,
 *   __isTotalsRow: true,
 *   currency: string,
 *   invoiceValue: number,
 *   declarationValue: number,
 *   declarationValueVnd?: number,
 *   logisticsCost?: number,
 *   quantity: string | null,
 *   vgmCount?: number,
 *   summary: import('../api/shipments.js').ShipmentListSummary | null,
 *   isMultiCurrency: boolean,
 * }} ShipmentTotalsRow
 */

function totalsDash() {
  return <Text color="meta-subtle">—</Text>;
}

/**
 * Cell renderers used only for the synthetic totals row(s) appended via
 * `AdvanceTable`'s `totalsRows` prop — same pattern as
 * `contracts-list.jsx`'s `TOTALS_ROW_CELL_RENDERERS`. Figma 108:5920:
 * record counts under the "Cơ bản" columns, "—" under the text-only ones.
 * @type {Record<string, (row: ShipmentTotalsRow) => import('react').ReactNode>}
 */
const TOTALS_ROW_CELL_RENDERERS = {
  type: (row) =>
    row.summary == null ? null : (
      <Text
        type="supporting"
        weight="semibold"
        hasTabularNumbers
        xstyle={styles.nowrap}
      >
        {`${row.summary.fclCount} FCL / ${row.summary.lclCount} LCL`}
      </Text>
    ),
  quantity: (row) =>
    row.quantity == null ? null : (
      <Text
        type="supporting"
        weight="bold"
        color="accent"
        hasTabularNumbers
        xstyle={styles.nowrap}
      >
        {row.quantity}
      </Text>
    ),
  status: (row) =>
    row.summary == null ? null : (
      <Text type="supporting" hasTabularNumbers xstyle={styles.nowrap}>
        {`${row.summary.completedCount} Đã hoàn thành`}
      </Text>
    ),
  bookingNumber: (row) => (row.summary == null ? null : totalsDash()),
  billOfLadingNumber: (row) => (row.summary == null ? null : totalsDash()),
  placeOfDischarge: (row) => (row.summary == null ? null : totalsDash()),
  customsDeclarationNumber: (row) =>
    row.summary == null ? null : (
      <Text color="meta-subtle" hasTabularNumbers xstyle={styles.nowrap}>
        {`${row.summary.customsDeclarationCount} Tờ khai`}
      </Text>
    ),
  coNumber: (row) =>
    row.summary == null ? null : (
      <Text
        color="meta-subtle"
        weight="bold"
        hasTabularNumbers
        xstyle={styles.nowrap}
      >
        {`${row.summary.coCount} Bộ C/O`}
      </Text>
    ),
  actions: (row) => (row.summary == null ? null : totalsDash()),
  invoiceValue: (row) => (
    <Text weight="semibold" hasTabularNumbers>
      {formatMoney(row.invoiceValue, row.currency)}
    </Text>
  ),
  // Figma 109:6632: "GIÁ TRỊ" totals in bold cobalt.
  declarationValue: (row) => (
    <Text weight="bold" color="accent" hasTabularNumbers xstyle={styles.nowrap}>
      {formatMoney(row.declarationValue, row.currency)}
    </Text>
  ),
  declarationValueVnd: (row) =>
    row.declarationValueVnd == null ? null : (
      <Text
        weight="bold"
        color="accent"
        hasTabularNumbers
        xstyle={styles.nowrap}
      >
        {formatMoney(row.declarationValueVnd)} đ
      </Text>
    ),
  // Figma 109:6632: per-LOG-group totals in bold amber.
  ...Object.fromEntries(
    COST_GROUP_COLUMNS.map((group) => [
      group.key,
      (/** @type {ShipmentTotalsRow} */ row) => {
        const total = row.summary?.costTotalsByCategory.find(
          (entry) => entry.code === group.code,
        );
        if (total == null) return null;
        if (!total.totalAmount) return totalsDash();
        return (
          <Text
            type="supporting"
            weight="bold"
            color="meta-amber"
            hasTabularNumbers
            xstyle={styles.nowrap}
          >
            {formatVndAmount(total.totalAmount)}
          </Text>
        );
      },
    ]),
  ),
  // Same full-filtered-set sum as the per-group totals, in the same amber.
  logisticsCost: (row) =>
    row.logisticsCost == null ? null : (
      <Text
        type="supporting"
        weight="bold"
        color="meta-amber"
        hasTabularNumbers
        xstyle={styles.nowrap}
      >
        {formatVndAmount(row.logisticsCost)}
      </Text>
    ),
  vgm: (row) =>
    row.vgmCount == null ? null : (
      <Text weight="semibold" hasTabularNumbers>
        {row.vgmCount}
      </Text>
    ),
};

// Matches BE-kt-xnk's `ShipmentSortFields` allow-list, restricted to keys
// this table actually has a column for (`etd`/`eta` are BE-sortable but
// have no column here).
const SORTABLE_COLUMN_KEYS = [
  'customsDeclarationDate',
  'contractNumber',
  'name',
  'bookingNumber',
  'supplier',
  'type',
  'status',
  'invoiceValue',
];

// Figma 108:5920 shows the list sorted by "Ngày khai HQ" newest first.
const DEFAULT_SORT = /** @type {const} */ ({
  field: 'customsDeclarationDate',
  direction: 'Descending',
});

// Figma 109:6632 two-row header: the declaration values under a cobalt
// "GIÁ TRỊ" band, the eight LOG groups under "CHI PHÍ LOGISTICS".
const HEADER_GROUPS = [
  {
    id: 'value-group',
    label: (
      <HStack as="span" gap={1} vAlign="center" wrap="nowrap">
        <Icon icon={Coins} size="xsm" color="inherit" />
        GIÁ TRỊ
      </HStack>
    ),
    columnKeys: ['declarationValue', 'declarationValueVnd'],
    tone: /** @type {const} */ ('accent'),
  },
  {
    id: 'logistics-cost-group',
    label: (
      <HStack as="span" gap={1} vAlign="center" wrap="nowrap">
        <Icon icon={ReceiptText} size="xsm" color="primary" />
        <Text as="span" type="inherit" color="primary">
          CHI PHÍ LOGISTICS
        </Text>
      </HStack>
    ),
    columnKeys: [
      'logisticsCost',
      ...COST_GROUP_COLUMNS.map((group) => group.key),
    ],
  },
];

const STATUS_TABS = [
  { value: 'all', label: 'Tất cả' },
  ...shipmentStatusOptions,
];

/**
 * Tab count tone (Figma 108:5920): the selected tab's count sits on the
 * filled cobalt pill; amber / emerald for the statuses that have a colour
 * there, neutral for the rest.
 * @param {string} status
 * @param {string} activeStatus
 * @returns {'success' | 'warning' | 'neutral' | 'on-accent'}
 */
function tabCountTone(status, activeStatus) {
  if (status === activeStatus) return 'on-accent';
  const tone = metaToneForShipmentStatus(status);
  return tone === 'success' || tone === 'warning' ? tone : 'neutral';
}

/**
 * "Ngày khai HQ" filter ranges → `customsDeclarationDate` `Between`.
 * @param {string} key
 * @param {Date} today
 * @returns {{ from: string, to: string } | null}
 */
function declarationDateRange(key, today) {
  /** @param {Date} date */
  const iso = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const year = today.getFullYear();
  const month = today.getMonth();
  if (key === 'thisMonth') {
    return {
      from: iso(new Date(year, month, 1)),
      to: iso(new Date(year, month + 1, 0)),
    };
  }
  if (key === 'lastMonth') {
    return {
      from: iso(new Date(year, month - 1, 1)),
      to: iso(new Date(year, month, 0)),
    };
  }
  if (key === 'last30Days') {
    return {
      from: iso(new Date(year, month, today.getDate() - 29)),
      to: iso(today),
    };
  }
  if (key === 'thisYear') {
    return { from: `${year}-01-01`, to: `${year}-12-31` };
  }
  return null;
}

const DECLARATION_DATE_OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'thisMonth', label: 'Tháng này' },
  { value: 'lastMonth', label: 'Tháng trước' },
  { value: 'last30Days', label: '30 ngày qua' },
  { value: 'thisYear', label: 'Năm nay' },
];

/**
 * Figma filter pill: muted "Loại hình:" caption, bold current value.
 * @param {string} caption
 */
function renderFilterValue(caption) {
  return function FilterValue(
    /** @type {{ label?: import('react').ReactNode }} */ option,
  ) {
    return (
      <HStack as="span" gap={1} vAlign="center" wrap="nowrap">
        <Text as="span" type="supporting" weight="medium">
          {caption}
        </Text>
        <Text as="span" type="supporting" weight="semibold" color="primary">
          {option.label}
        </Text>
      </HStack>
    );
  };
}

/**
 * Meta "Danh sách Shipment" (Figma 108:5920, "Chế độ bảng: Cơ bản"):
 * framed workspace card with pill status tabs and counts, filter band,
 * Σ totals row and icon-only row actions. The theme comes from the
 * `MetaThemeProvider` the page wraps around this component.
 */
export function ShipmentsList() {
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pageIndex, setPageIndex] = useState(1);
  const [filterConditions, setFilterConditions] = useState(
    /** @type {import('@/shared/components/advanced-filter-builder.jsx').AdvancedFilterCondition[]} */ ([]),
  );
  const [sort, setSort] = useState(
    /** @type {{ field: string, direction: 'Ascending' | 'Descending' } | null} */ (
      DEFAULT_SORT
    ),
  );
  /** @param {string | null} field @param {'Ascending' | 'Descending'} direction */
  function handleSortChange(field, direction) {
    setSort(field ? { field, direction } : null);
    setPageIndex(1);
  }

  // Status tabs, filter pills and the funnel dialog all edit the same
  // server-side `filterConditions` (same approach as `contracts-list.jsx`).
  const activeStatus =
    filterConditions.find(
      (condition) =>
        condition.field === 'status' && condition.operator === 'Equals',
    )?.value ?? 'all';
  /** @param {string} status */
  function handleStatusChange(status) {
    setFilterConditions((current) =>
      upsertEqualsFilterCondition(
        current,
        'status',
        status === 'all' ? null : status,
      ),
    );
    setPageIndex(1);
  }

  const typeFilter =
    filterConditions.find((condition) => condition.field === 'type')?.value ??
    'all';
  /** @param {string | null} type */
  function handleTypeFilterChange(type) {
    setFilterConditions((current) =>
      upsertEqualsFilterCondition(
        current,
        'type',
        type && type !== 'all' ? type : null,
      ),
    );
    setPageIndex(1);
  }

  const forwarderFilter =
    filterConditions.find((condition) => condition.field === 'supplierName')
      ?.value ?? 'all';
  /** @param {string | null} name */
  function handleForwarderFilterChange(name) {
    setFilterConditions((current) =>
      upsertEqualsFilterCondition(
        current,
        'supplierName',
        name && name !== 'all' ? name : null,
      ),
    );
    setPageIndex(1);
  }

  // The range key is kept alongside the condition it wrote; if the funnel
  // dialog removes that condition the pill falls back to "Tất cả".
  const [declarationDateKey, setDeclarationDateKey] = useState('all');
  const hasDeclarationDateCondition = filterConditions.some(
    (condition) => condition.field === 'customsDeclarationDate',
  );
  const declarationDateFilter = hasDeclarationDateCondition
    ? declarationDateKey
    : 'all';
  /** @param {string | null} key */
  function handleDeclarationDateFilterChange(key) {
    const range = declarationDateRange(key ?? 'all', new Date());
    setDeclarationDateKey(range ? (key ?? 'all') : 'all');
    setFilterConditions((current) => {
      const rest = current.filter(
        (condition) => condition.field !== 'customsDeclarationDate',
      );
      return range
        ? [
            ...rest,
            {
              id: generateRowKey(),
              field: 'customsDeclarationDate',
              operator: 'Between',
              value: range.from,
              valueTo: range.to,
              connector: /** @type {const} */ ('And'),
            },
          ]
        : rest;
    });
    setPageIndex(1);
  }

  function handleResetFilters() {
    setFilterConditions([]);
    setDeclarationDateKey('all');
    setPageIndex(1);
  }

  // "Mã" quick-search box — same server-side idea as `contracts-list.jsx`'s
  // `handleContractNumberSearchChange`. `shipmentCode` itself has no backend
  // search field (it's computed from the parent contract's number, not a
  // stored column — see `shipments-table.js`'s `FILTER_FIELD_DEFS` comment),
  // so this mirrors the box's `shipmentCode` text against `contractNumber`
  // instead. Without this, `AdvanceTable`'s own quick search only filters
  // whatever page is already loaded, so searching for text that matches a
  // shipment code outside the current page silently finds nothing.
  /** @param {string} value */
  function handleContentSearchChange(value) {
    setFilterConditions((current) =>
      upsertContainsFilterCondition(current, 'contractNumber', value),
    );
    setPageIndex(1);
  }
  // Dialogs are all rendered as siblings of `AdvanceTable` below, never
  // inside `renderExpanded` — `contracts-list.jsx`'s big comment above
  // `ContractsList` explains why: a `Selector`-bearing dialog opened from
  // inside a table row's expanded content portals its dropdown underneath
  // the dialog itself (clicks land on the trigger instead of the option).
  const [isPickingContract, setIsPickingContract] = useState(false);
  const [pickedContractId, setPickedContractId] = useState(
    /** @type {string | null} */ (null),
  );
  const [shipmentDialog, setShipmentDialog] = useState(
    /** @type {{ mode?: 'view' | 'edit', contractId: string, contract?: import('../types/index.js').Contract, shipment?: import('../types/index.js').Shipment } | null} */ (
      null
    ),
  );
  const [deletingShipment, setDeletingShipment] = useState(
    /** @type {ShipmentListRow | null} */ (null),
  );
  const toast = useAppToast();
  const deleteMutation = useDeleteShipmentMutation(
    deletingShipment?.contractId ?? '',
  );
  const shipmentsQuery = useShipmentsListQuery({
    page: pageIndex,
    pageSize,
    conditions: filterConditions,
    sort,
  });
  const listResult = shipmentsQuery.data;
  const shipments = listResult?.success ? listResult.shipments : [];
  const summary = listResult?.success ? listResult.summary : null;
  const totalShipments = listResult?.success ? listResult.totalCount : 0;

  // Tab counts come from the search's own `summary.statusCounts`, computed
  // server-side without the status condition (so "Tất cả" is their sum).
  const tabCounts = useMemo(() => {
    /** @type {Record<string, number | undefined>} */
    const counts = summary?.statusCounts ?? {};
    /** @type {Record<string, number>} */
    const byTab = { all: 0 };
    for (const option of shipmentStatusOptions) {
      byTab[option.value] = counts[option.value] ?? 0;
      byTab.all += byTab[option.value];
    }
    return byTab;
  }, [summary]);

  // Full-filtered-set totals (not just this page — the backend computes
  // them pre-paging, see `searchAllShipments`'s doc comment). Invoice and
  // declaration values share one row per currency; the flat figures appear
  // once, on the first row.
  const totalsRows = useMemo(() => {
    if (!listResult?.success) return [];
    const totals =
      listResult.totals.length > 0
        ? listResult.totals
        : [{ currency: '', invoiceValue: 0, declarationValue: 0 }];
    return totals.map((total, index) => ({
      id: `totals-${total.currency}`,
      __isTotalsRow: true,
      currency: total.currency,
      invoiceValue: total.invoiceValue,
      declarationValue: total.declarationValue,
      declarationValueVnd:
        index === 0 ? listResult.declarationValueVndTotal : undefined,
      logisticsCost: index === 0 ? listResult.logisticsCostTotal : undefined,
      quantity:
        index === 0
          ? listResult.quantityTotals
              .map(
                (quantityTotal) =>
                  `${numberValueToInput(quantityTotal.amount)} ${labelForShipmentQuantityUnit(quantityTotal.unit)}`,
              )
              .join(' / ') || null
          : null,
      vgmCount: index === 0 ? listResult.vgmCountTotal : undefined,
      summary: index === 0 ? listResult.summary : null,
      isMultiCurrency: totals.length > 1,
    }));
  }, [listResult]);

  // Neither field the table needs alongside a Shipment — the parent
  // contract's number/project, and the forwarder's company name — comes
  // back on `ShipmentResponse` itself, so both are resolved client-side
  // from the Contract/Customer catalogs, same pattern as
  // `contractsById`/`customersById` in `commissions-list.jsx`.
  // `pageSize: 100` is that same list's own effective ceiling — fine
  // while every contract fits on one page.
  const contractsQuery = useContractsQuery({ page: 1, pageSize: 100 });
  const contracts = useMemo(
    () => (contractsQuery.data?.success ? contractsQuery.data.contracts : []),
    [contractsQuery.data],
  );
  const contractsById = useMemo(
    () => new Map(contracts.map((contract) => [contract.id, contract])),
    [contracts],
  );

  // Row cost totals arrive keyed by category id; the LOG columns are keyed
  // by code.
  const costCategoriesQuery = useShipmentCostCategoriesQuery();
  const costCodeById = useMemo(
    () =>
      new Map(
        (costCategoriesQuery.data?.success
          ? costCategoriesQuery.data.costCategories
          : []
        ).map((category) => [category.id, category.code]),
      ),
    [costCategoriesQuery.data],
  );

  const customersQuery = useSuppliersQuery();
  const suppliers = useMemo(
    () =>
      /** @type {import('../types/index.js').Supplier[]} */ (
        customersQuery.data?.success ? customersQuery.data.suppliers : []
      ),
    [customersQuery.data],
  );
  const customersById = useMemo(
    () => new Map(suppliers.map((customer) => [customer.id, customer])),
    [suppliers],
  );
  const forwarderOptions = useMemo(() => {
    const names = [
      ...new Set(suppliers.map((supplier) => supplier.companyName)),
    ].sort((a, b) => a.localeCompare(b, 'vi'));
    return [
      { value: 'all', label: 'Tất cả' },
      ...names.map((name) => ({ value: name, label: name })),
    ];
  }, [suppliers]);

  /** @param {import('../types/index.js').Shipment[]} rawShipments */
  function enrichShipments(rawShipments) {
    return rawShipments.map((shipment) => {
      const contract = contractsById.get(shipment.contractId);
      return {
        ...shipment,
        contractNumber: contract?.contractNumber ?? '',
        projectName: contract?.projectName ?? '',
        // Incoterm is the parent contract's, e.g. "CIF 2020".
        incoterm: contract
          ? `${contract.incoterm} ${contract.incotermYear}`
          : '',
        supplierName:
          customersById.get(shipment.supplierCustomerId)?.companyName ?? '',
        logisticsCost: shipment.costTotalsByCategory.reduce(
          (sum, total) => sum + total.totalAmount,
          0,
        ),
        costsByCode: Object.fromEntries(
          shipment.costTotalsByCategory.map((total) => [
            costCodeById.get(total.costCategoryId) ?? total.costCategoryId,
            total.totalAmount,
          ]),
        ),
      };
    });
  }

  const searchableShipments = enrichShipments(shipments);

  // "Xuất toàn bộ dữ liệu" in AdvanceTable's export dropdown.
  async function fetchAllShipments() {
    const result = await searchAllShipments({
      page: 1,
      pageSize: listResult?.success
        ? Math.max(1, listResult.totalCount)
        : pageSize,
      conditions: filterConditions,
      sort,
    });
    return result.success ? enrichShipments(result.shipments) : [];
  }

  /**
   * Shared by the "Mã" cell (design.md section 4: "Mã bản ghi mở Xem") and
   * the row's own "Xem"/"Sửa" actions below.
   * @param {ShipmentListRow} row
   * @param {'view' | 'edit'} mode
   */
  function openShipment(row, mode) {
    setShipmentDialog({
      mode,
      contractId: row.contractId,
      contract: contractsById.get(row.contractId),
      shipment: row,
    });
  }

  async function handleConfirmDelete() {
    if (!deletingShipment) return;
    const shipment = deletingShipment;
    const result = await deleteMutation.mutateAsync(shipment.id);
    setDeletingShipment(null);

    if (result.success) {
      setShipmentDialog((current) =>
        current?.shipment?.id === shipment.id ? null : current,
      );
      if (shipments.length === 1 && pageIndex > 1) {
        setPageIndex((current) => current - 1);
      }
      toast({ body: `Đã xoá Shipment "${shipment.shipmentCode}".` });
    } else {
      toast({ body: result.message, type: 'error' });
    }
  }

  /** @param {import('react').ReactNode} content */
  function primaryText(content) {
    return (
      <Text weight="medium" xstyle={styles.nowrap}>
        {content}
      </Text>
    );
  }

  /** @type {import('@/shared/components/advance-table.jsx').AdvanceTableColumn<ShipmentListRow>[]} */
  const columns = [
    {
      key: 'customsDeclarationDate',
      header: 'Ngày khai HQ',
      width: pixel(150),
      filter: 'customsDeclarationDate',
      renderCell: (row) => (
        <Text color="secondary" hasTabularNumbers>
          {formatDisplayDate(row.customsDeclarationDate)}
        </Text>
      ),
      exportValue: (row) => formatDisplayDate(row.customsDeclarationDate),
    },
    {
      key: 'shipmentCode',
      header: 'Mã',
      width: pixel(170),
      filter: 'shipmentCode',
      // "Mã bản ghi mở Xem" (design.md section 4).
      renderCell: (row) => (
        <Link
          xstyle={styles.recordLink}
          onClick={(event) => {
            event.stopPropagation();
            openShipment(row, 'view');
          }}
        >
          {orDash(row.shipmentCode)}
        </Link>
      ),
    },
    {
      key: 'contractNumber',
      header: 'Số hợp đồng',
      width: pixel(150),
      filter: 'contractNumber',
      renderCell: (row) =>
        contractsById.has(row.contractId) ? (
          <Link
            href={`/logistics/contract/${row.contractId}`}
            xstyle={styles.recordLink}
            onClick={(event) => event.stopPropagation()}
          >
            {orDash(row.contractNumber)}
          </Link>
        ) : (
          orDash(row.contractNumber)
        ),
    },
    {
      key: 'incoterm',
      header: 'Incoterm',
      width: pixel(120),
      // No shipment search / sort field — it lives on the contract.
      renderCell: (row) => primaryText(orDash(row.incoterm)),
    },
    {
      key: 'projectName',
      header: 'Dự án',
      width: proportional(1.2),
      filter: 'projectName',
      renderCell: (row) => orDash(row.projectName),
    },
    {
      key: 'name',
      header: 'Tên lô hàng',
      width: proportional(1.2),
      filter: 'name',
      renderCell: (row) => row.name,
    },
    {
      key: 'type',
      header: 'Loại hình',
      width: pixel(140),
      align: 'center',
      filter: 'type',
      renderCell: (row) => (
        <MetaPill
          label={labelForShipmentType(row.type)}
          tone={row.type === 'LCL' ? 'indigo' : 'accent'}
          size="sm"
          hasBorder
        />
      ),
      exportValue: (row) => labelForShipmentType(row.type),
    },
    {
      key: 'quantity',
      header: 'Số lượng',
      width: pixel(170),
      align: 'center',
      filter: 'quantityAmount',
      renderCell: (row) =>
        primaryText(
          `${numberValueToInput(row.quantityAmount)} ${labelForShipmentQuantityUnit(row.quantityUnit)}`,
        ),
      exportValue: (row) =>
        `${row.quantityAmount} ${labelForShipmentQuantityUnit(row.quantityUnit)}`,
    },
    {
      key: 'status',
      header: 'Tình trạng',
      width: pixel(180),
      align: 'center',
      filter: 'status',
      renderCell: (row) => (
        <MetaPill
          label={labelForShipmentStatus(row.status)}
          tone={metaToneForShipmentStatus(row.status)}
          size="sm"
          hasDot
          hasBorder
        />
      ),
      exportValue: (row) => labelForShipmentStatus(row.status),
    },
    {
      key: 'bookingNumber',
      header: 'Booking',
      width: pixel(160),
      filter: 'bookingNumber',
      renderCell: (row) => primaryText(row.bookingNumber),
    },
    {
      key: 'billOfLadingNumber',
      header: 'B/L',
      width: pixel(160),
      renderCell: (row) => primaryText(orDash(row.billOfLadingNumber)),
    },
    {
      key: 'placeOfDischarge',
      header: 'Cảng đến',
      width: pixel(220),
      // Long addresses ("121 Nhóm 3, Wang Ta Khian, …") end in "…" with
      // the full text in Text's truncation tooltip.
      renderCell: (row) => (
        <Text weight="medium" maxLines={1}>
          {orDash(row.placeOfDischarge)}
        </Text>
      ),
    },
    {
      key: 'customsDeclarationNumber',
      header: 'Số tờ khai',
      width: pixel(160),
      filter: 'customsDeclarationNumber',
      renderCell: (row) =>
        row.customsDeclarationNumber ? (
          <Text type="code">{row.customsDeclarationNumber}</Text>
        ) : (
          '—'
        ),
    },
    {
      key: 'coNumber',
      header: 'Số C/O',
      width: proportional(1, { minWidth: 180 }),
      filter: 'coNumber',
      renderCell: (row) =>
        row.coNumber ? (
          <Text
            type="supporting"
            weight="medium"
            color="accent"
            xstyle={styles.nowrap}
          >
            {row.coNumber}
          </Text>
        ) : (
          '—'
        ),
    },
    {
      key: 'supplier',
      header: 'Forwarder',
      width: proportional(1),
      // No `filter` on this column (not part of the header-filter set), so
      // the BE-kt-xnk wire sort field (`supplierName`) needs stating
      // explicitly — it doesn't match this column's own `key`.
      sortField: 'supplierName',
      renderCell: (row) => orDash(row.supplierName),
      exportValue: (row) => row.supplierName,
    },
    {
      key: 'invoiceValue',
      header: 'Giá trị invoice',
      width: pixel(200),
      align: 'end',
      renderCell: (row) => formatMoney(row.invoiceValue, row.invoiceCurrency),
    },
    {
      key: 'declarationValue',
      header: (
        <Text as="span" type="inherit" color="accent">
          Giá trị tờ khai
        </Text>
      ),
      width: pixel(190),
      align: 'end',
      filter: 'declarationValue',
      renderCell: (row) =>
        primaryText(formatMoney(row.declarationValue, row.declarationCurrency)),
    },
    {
      key: 'declarationValueVnd',
      header: (
        <Text as="span" type="inherit" color="accent">
          Giá trị tờ khai (VNĐ)
        </Text>
      ),
      width: pixel(220),
      align: 'end',
      // No `filter` key — BE has no matching search field for this
      // computed value (declarationValue * declarationExchangeRate).
      renderCell: (row) => (
        <Text color="secondary" hasTabularNumbers xstyle={styles.nowrap}>
          {formatMoney(row.declarationValueVnd)} đ
        </Text>
      ),
      exportValue: (row) => row.declarationValueVnd,
    },
    {
      key: 'logisticsCost',
      // First column of "CHI PHÍ LOGISTICS" (user request, 2026-09-24): the
      // sum of every LOG group on the shipment. VND only.
      header: (
        <Text as="span" type="inherit" color="primary">
          Logistics
        </Text>
      ),
      width: pixel(190),
      align: 'end',
      filter: 'logisticsCost',
      renderCell: (row) =>
        row.logisticsCost ? (
          <Text weight="bold" hasTabularNumbers xstyle={styles.nowrap}>
            {formatVndAmount(row.logisticsCost)}
          </Text>
        ) : (
          <Text color="meta-subtle">—</Text>
        ),
      exportValue: (row) => row.logisticsCost,
    },
    // One column per LOG group; freight (LOG-04, usually the largest)
    // stands out in bold ink as in Figma 109:6632.
    ...COST_GROUP_COLUMNS.map(
      (group) =>
        /** @type {import('@/shared/components/advance-table.jsx').AdvanceTableColumn<ShipmentListRow>} */ ({
          key: group.key,
          header: (
            <Text as="span" type="inherit" color="primary">
              {group.header}
            </Text>
          ),
          width: pixel(group.code === 'LOG-07' ? 200 : 190),
          align: 'end',
          renderCell: (row) => {
            const amount = row.costsByCode?.[group.code];
            if (!amount) return <Text color="meta-subtle">—</Text>;
            return group.code === 'LOG-04' ? (
              <Text weight="semibold" hasTabularNumbers xstyle={styles.nowrap}>
                {formatVndAmount(amount)}
              </Text>
            ) : (
              <Text color="secondary" hasTabularNumbers xstyle={styles.nowrap}>
                {formatVndAmount(amount)}
              </Text>
            );
          },
          exportValue: (row) => row.costsByCode?.[group.code] ?? 0,
        }),
    ),
    {
      key: 'vgm',
      header: 'VGM',
      width: pixel(90),
      align: 'end',
      filter: 'vgmCount',
      renderCell: (row) => row.vgmCount,
    },
    {
      key: 'actions',
      header: 'Thao tác',
      width: pixel(128),
      align: 'center',
      renderCell: (row) => (
        <HStack gap={1} vAlign="center" hAlign="center" wrap="nowrap">
          <IconButton
            label={`Xem ${row.shipmentCode}`}
            tooltip="Xem"
            icon={<Icon icon={Eye} size="sm" />}
            variant="ghost"
            size="sm"
            onClick={() => openShipment(row, 'view')}
          />
          <IconButton
            label={`Sửa ${row.shipmentCode}`}
            tooltip="Sửa"
            icon={<Icon icon={Pencil} size="sm" />}
            variant="ghost"
            size="sm"
            onClick={() => openShipment(row, 'edit')}
          />
          <IconButton
            label={`Xoá ${row.shipmentCode}`}
            tooltip="Xoá"
            icon={<Icon icon={Trash2} size="sm" />}
            variant="ghost"
            size="sm"
            onClick={() => setDeletingShipment(row)}
          />
        </HStack>
      ),
    },
  ];

  const columnsWithTotalsRow = withTotalsRowCells(
    columns,
    TOTALS_ROW_CELL_RENDERERS,
  );

  const totalPages = Math.max(
    1,
    listResult?.success ? listResult.totalPages : 1,
  );

  const filterBand = (
    <HStack gap={2} vAlign="center" wrap="nowrap">
      <Selector
        label="Loại hình"
        isLabelHidden
        size="lg"
        value={typeFilter}
        options={[{ value: 'all', label: 'Tất cả' }, ...shipmentTypeOptions]}
        renderValue={renderFilterValue('Loại hình:')}
        onChange={handleTypeFilterChange}
      />
      <Selector
        label="Forwarder"
        isLabelHidden
        size="lg"
        hasSearch
        value={forwarderFilter}
        options={forwarderOptions}
        renderValue={renderFilterValue('Forwarder:')}
        onChange={handleForwarderFilterChange}
      />
      <Selector
        label="Ngày khai HQ"
        isLabelHidden
        size="lg"
        startIcon={CalendarDays}
        value={declarationDateFilter}
        options={DECLARATION_DATE_OPTIONS}
        renderValue={renderFilterValue('Ngày khai HQ:')}
        onChange={handleDeclarationDateFilterChange}
      />
      <Button
        label="Đặt lại"
        icon={<Icon icon={RotateCcw} size="sm" />}
        variant="ghost"
        size="lg"
        onClick={handleResetFilters}
      />
    </HStack>
  );

  function handleContinuePickingContract() {
    if (!pickedContractId || !canContinuePickingContract) return;
    setIsPickingContract(false);
    setShipmentDialog({
      contractId: pickedContractId,
      contract: contractsById.get(pickedContractId),
    });
    setPickedContractId(null);
  }

  const pickedContract = pickedContractId
    ? contractsById.get(pickedContractId)
    : undefined;
  const canContinuePickingContract =
    !!pickedContract && isContractEligibleForShipment(pickedContract);

  const selectedShipment =
    shipments.find((row) => row.id === shipmentDialog?.shipment?.id) ??
    shipmentDialog?.shipment;

  return (
    <VStack gap={4} hAlign="stretch" height="100%" xstyle={styles.root}>
      {listResult && !listResult.success ? (
        <AdvanceTableErrorBanner message={listResult.message} />
      ) : null}

      <StackItem size="fill">
        <AdvanceTable
          title={
            <HStack gap={2} vAlign="center" wrap="wrap">
              <Heading level={1}>Danh sách Shipment</Heading>
              <MetaStatusBadge
                label={`${totalShipments} lô hàng`}
                tone="accent"
                hasBorder
              />
            </HStack>
          }
          headerContent={
            // Nine status tabs outgrow the row beside "Chế độ bảng" on
            // narrower screens — the Carousel caps their width and swipes
            // them (edge fades + prev/next buttons) instead of wrapping.
            <Carousel
              aria-label="Tình trạng Shipment"
              gap={0}
              xstyle={styles.statusCarousel}
            >
              <TabList
                role="tablist"
                size="md"
                overflow="visible"
                value={activeStatus}
                onChange={handleStatusChange}
              >
                {STATUS_TABS.map((tab) => (
                  <Tab
                    key={tab.value}
                    value={tab.value}
                    label={tab.label}
                    panelId="shipments-table"
                    endContent={
                      <MetaCountBadge
                        value={tabCounts[tab.value] ?? 0}
                        tone={tabCountTone(tab.value, activeStatus)}
                      />
                    }
                  />
                ))}
              </TabList>
            </Carousel>
          }
          viewPresetsInHeader
          dividers="rows"
          headerGroups={HEADER_GROUPS}
          isFramed
          isStriped
          toolbarFilters={filterBand}
          toolbarLabel="Thao tác danh sách Shipment"
          searchFieldDefs={SEARCH_FIELD_DEFS}
          entityLabel="Shipment"
          contentSearchFieldKey="shipmentCode"
          onContentSearchChange={handleContentSearchChange}
          searchPlaceholder="Tìm mã, tên lô hàng, số hợp đồng, booking…"
          filterFieldDefs={FILTER_FIELD_DEFS}
          advancedFilterConditions={filterConditions}
          onAdvancedFilterChange={setFilterConditions}
          columnOptions={COLUMN_OPTIONS}
          initialColumnKeys={DEFAULT_COLUMN_KEYS}
          defaultColumnKeys={DEFAULT_COLUMN_KEYS}
          initialViewPresetKey="basic"
          viewPresets={VIEW_PRESETS.map((preset) => ({
            ...preset,
            icon: (
              <Icon
                icon={
                  preset.key === 'basic'
                    ? List
                    : preset.key === 'value'
                      ? Banknote
                      : Truck
                }
                size="sm"
              />
            ),
          }))}
          itemLabel="lô hàng"
          tableColumns={columnsWithTotalsRow}
          data={searchableShipments}
          totalsRows={totalsRows}
          totalsRowLabel={(/** @type {ShipmentTotalsRow} */ row) => (
            <HStack gap={2} vAlign="center" wrap="nowrap">
              <Text size="lg" weight="bold" color="accent">
                Σ
              </Text>
              <Text
                weight="bold"
                color="accent"
                xstyle={[styles.nowrap, styles.totalsCaption]}
              >
                {`TỔNG CỘNG (${totalShipments} LÔ HÀNG${row.isMultiCurrency ? ` · ${row.currency}` : ''})`}
              </Text>
            </HStack>
          )}
          idKey="id"
          isLoading={shipmentsQuery.isLoading}
          skeletonRows={skeletonRows}
          defaultStickyStart="two"
          fixedEndColumnKeys={['actions']}
          fetchAllRows={fetchAllShipments}
          onRefresh={() => shipmentsQuery.refetch()}
          isRefreshing={shipmentsQuery.isFetching}
          primaryAction={{
            label: 'Thêm Shipment',
            icon: <Icon icon={Plus} size="sm" />,
            onClick: () => setIsPickingContract(true),
          }}
          pagination={{
            pageIndex,
            pageSize,
            totalCount: totalShipments,
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

      {isPickingContract ? (
        <CommonDialog
          isOpen={isPickingContract}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setIsPickingContract(false);
              setPickedContractId(null);
            }
          }}
          width={480}
        >
          <Layout
            header={
              <DialogHeader
                title="Chọn hợp đồng"
                onOpenChange={() => setIsPickingContract(false)}
              />
            }
            content={
              <LayoutContent padding={6}>
                <Selector
                  label="Hợp đồng"
                  hasSearch
                  hasClear
                  placeholder="Chọn hợp đồng cần thêm Shipment"
                  value={pickedContractId}
                  onChange={setPickedContractId}
                  options={contracts.map((contract) => {
                    const ineligibleReason =
                      reasonContractIneligibleForShipment(contract);
                    return {
                      value: contract.id,
                      label: `${contract.contractNumber} · ${contract.projectName}`,
                      description: `${contract.incoterm} ${contract.incotermYear}${
                        ineligibleReason ? ` · ${ineligibleReason}` : ''
                      }`,
                      disabled: ineligibleReason != null,
                    };
                  })}
                  width="100%"
                />
                <Text color="secondary">
                  Chỉ hợp đồng Chính thức, đã ký bởi cả hai bên và đang ở trạng
                  thái Đang thực hiện mới có thể tạo Shipment mới.
                </Text>
              </LayoutContent>
            }
            footer={
              <LayoutFooter>
                <HStack hAlign="end" gap={2}>
                  <Button
                    label="Hủy"
                    variant="secondary"
                    onClick={() => {
                      setIsPickingContract(false);
                      setPickedContractId(null);
                    }}
                  />
                  <Button
                    label="Tiếp tục"
                    variant="primary"
                    isDisabled={!canContinuePickingContract}
                    onClick={handleContinuePickingContract}
                  />
                </HStack>
              </LayoutFooter>
            }
          />
        </CommonDialog>
      ) : null}

      {shipmentDialog ? (
        <ShipmentFormDialog
          key={shipmentDialog.shipment?.id ?? 'create'}
          isOpen
          onOpenChange={(isOpen) => {
            if (!isOpen) setShipmentDialog(null);
          }}
          contractId={shipmentDialog.contractId}
          contract={shipmentDialog.contract}
          initialMode={shipmentDialog.mode}
          shipment={selectedShipment}
          onSuccess={() =>
            setShipmentDialog((current) => (current?.shipment ? current : null))
          }
        />
      ) : null}

      <AlertDialog
        isOpen={deletingShipment != null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setDeletingShipment(null);
        }}
        title={`Xoá Shipment "${deletingShipment?.shipmentCode ?? ''}"?`}
        description="Toàn bộ chi phí Logistics và bản ghi VGM thuộc Shipment cũng sẽ bị xoá. Hành động này không thể hoàn tác."
        actionLabel="Xoá"
        isActionLoading={deleteMutation.isPending}
        onAction={handleConfirmDelete}
      />
    </VStack>
  );
}

const styles = stylex.create({
  // Below this the pinned header / tabs / filters / footer would leave the
  // rows no room; the page shell scrolls vertically instead.
  root: {
    minHeight: '36rem',
  },
  // Takes the space left of "Chế độ bảng" and no more.
  statusCarousel: {
    flexGrow: 1,
    minWidth: 0,
  },
  // Record codes render as semibold accent links (Figma 108:5920).
  recordLink: {
    color: colorVars['--color-text-accent'],
    fontWeight: 'var(--font-weight-semibold)',
    whiteSpace: 'nowrap',
  },
  nowrap: {
    whiteSpace: 'nowrap',
  },
  totalsCaption: {
    letterSpacing: '0.05em',
  },
});
