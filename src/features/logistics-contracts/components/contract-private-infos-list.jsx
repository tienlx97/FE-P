'use client';

import { Button } from '@astryxdesign/core/Button';
import { pixel, proportional } from '@astryxdesign/core/Table';
import { Heading, Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { useMemo, useState } from 'react';

import {
  AdvanceTable,
  AdvanceTableErrorBanner,
} from '@/shared/components/advance-table.jsx';
import { useSessionPermissions } from '@/shared/hooks/use-session-permissions.js';

import {
  COLUMN_OPTIONS,
  DEFAULT_COLUMN_KEYS,
  DEFAULT_PAGE_SIZE,
  FILTER_FIELD_DEFS,
  PAGE_SIZE_OPTIONS,
  SEARCH_FIELD_DEFS,
  skeletonRows,
} from '../config/contract-private-infos-table.js';
import { useContractPrivateInfosListQuery } from '../hooks/use-contract-private-infos-list-query.js';
import { ContractPrivateInfoDetailDialog } from './contract-private-info-detail-dialog.jsx';
import { RecordActionsMenu } from './record-actions-menu.jsx';

const LOGISTICS_SECRET_PERMISSION = 'logistics:secret';

/** @param {number | null | undefined} value @param {string} [suffix] */
function orDashNumber(value, suffix = '') {
  if (value == null) return '—';
  return `${value.toLocaleString('en-US')}${suffix ? ` ${suffix}` : ''}`;
}

/**
 * @typedef {{
 *   contractId: string,
 *   __isTotalsRow: true,
 *   containerCount: number,
 *   logisticsTotal: number,
 *   profit: number,
 * }} PrivateInfoTotalsRow
 */

/**
 * Cell renderers used only for the synthetic totals row appended via
 * `AdvanceTable`'s `totalsRows` prop — same pattern as
 * `contracts-list.jsx`'s `TOTALS_ROW_CELL_RENDERERS`. `contractNumber`
 * doubles as the label cell since `COLUMN_OPTIONS` marks it
 * `isAlwaysVisible`. Unlike the other lists, no currency grouping — these
 * three are always VNĐ, so there's exactly one totals row, not one per
 * currency. `costPricePerContainer`/`quotedPricePerContainer` (per-unit
 * prices) are deliberately not summed — summing a unit price across
 * different contracts isn't a meaningful total.
 * @type {Record<string, (row: PrivateInfoTotalsRow) => import('react').ReactNode>}
 */
const TOTALS_ROW_CELL_RENDERERS = {
  contractNumber: () => <Text weight="semibold">Tổng cộng</Text>,
  containerCount: (row) => (
    <Text weight="semibold" hasTabularNumbers>
      {row.containerCount.toLocaleString('en-US')}
    </Text>
  ),
  logisticsTotal: (row) => (
    <Text weight="semibold" hasTabularNumbers>
      {row.logisticsTotal.toLocaleString('en-US')} VNĐ
    </Text>
  ),
  profit: (row) => (
    <Text weight="semibold" hasTabularNumbers>
      {row.profit.toLocaleString('en-US')} VNĐ
    </Text>
  ),
};

export function ContractPrivateInfosList() {
  const hasLogisticsSecret = useSessionPermissions().includes(
    LOGISTICS_SECRET_PERMISSION,
  );
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pageIndex, setPageIndex] = useState(1);
  const [filterConditions, setFilterConditions] = useState(
    /** @type {import('@/shared/components/advanced-filter-builder.jsx').AdvancedFilterCondition[]} */ ([]),
  );
  const [detailDialog, setDetailDialog] = useState(
    /** @type {{ row: import('../types/index.js').ContractPrivateInfoListItem, initialEditing: boolean } | null} */ (
      null
    ),
  );

  const privateInfosQuery = useContractPrivateInfosListQuery({
    page: pageIndex,
    pageSize,
    conditions: filterConditions,
    // Skipped entirely for a caller who can't see the tab either — a 403
    // here would just be a confusing error banner on page load.
    enabled: hasLogisticsSecret,
  });
  const listResult = privateInfosQuery.data;
  const items = listResult?.success ? listResult.items : [];

  // Sum of containerCount/logisticsTotal/profit across every contract
  // matching the current filters (not just this page — the backend
  // computes it pre-paging, see `searchContractPrivateInfos`'s doc
  // comment). Always VNĐ, so exactly one row (unlike the currency-grouped
  // totals on the other lists) — rendered as a synthetic last row, same
  // pattern as `contracts-list.jsx`.
  const totalsRows = useMemo(() => {
    if (!listResult?.success) return [];
    return [
      {
        contractId: 'totals',
        __isTotalsRow: true,
        containerCount: listResult.totals.containerCount,
        logisticsTotal: listResult.totals.logisticsTotal,
        profit: listResult.totals.profit,
      },
    ];
  }, [listResult]);

  /** @type {import('@astryxdesign/core/Table').TableColumn<import('../types/index.js').ContractPrivateInfoListItem>[]} */
  const columns = [
    {
      key: 'contractNumber',
      header: 'Số hợp đồng',
      width: pixel(160),
      filter: 'contractNumber',
      // "Mã bản ghi mở Xem" (design.md section 4) — same handler
      // `RecordActionsMenu`'s "Xem" below uses. BOQ rows are 1:1 with a
      // Contract, so its number is this row's own identifier.
      renderCell: (row) => (
        <Button
          label={row.contractNumber}
          variant="ghost"
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            setDetailDialog({ row, initialEditing: false });
          }}
        />
      ),
    },
    {
      key: 'projectName',
      header: 'Dự án',
      width: proportional(1.2),
      filter: 'projectName',
      renderCell: (row) => row.projectName,
    },
    {
      key: 'containerCount',
      header: 'Số cont',
      width: pixel(100),
      renderCell: (row) => orDashNumber(row.containerCount),
    },
    {
      key: 'costPricePerContainer',
      header: 'Giá vốn',
      width: pixel(160),
      renderCell: (row) => orDashNumber(row.costPricePerContainer, 'VNĐ'),
    },
    {
      key: 'quotedPricePerContainer',
      header: 'Giá báo khách',
      width: pixel(160),
      renderCell: (row) => orDashNumber(row.quotedPricePerContainer, 'VNĐ'),
    },
    {
      key: 'logisticsTotal',
      header: 'Tổng',
      width: pixel(160),
      renderCell: (row) => orDashNumber(row.logisticsTotal, 'VNĐ'),
    },
    {
      key: 'profit',
      header: 'Lợi nhuận',
      width: pixel(160),
      renderCell: (row) => orDashNumber(row.profit, 'VNĐ'),
    },
    {
      key: 'actions',
      header: 'Chức năng',
      width: pixel(140),
      align: 'end',
      renderCell: (row) => (
        <RecordActionsMenu
          onView={() => setDetailDialog({ row, initialEditing: false })}
          onEdit={() => setDetailDialog({ row, initialEditing: true })}
        />
      ),
    },
  ];

  // Every column's `renderCell` runs against the synthetic totals row too
  // — see `contracts-list.jsx`'s `columnsWithTotalsRow` for the reason
  // this wraps every column instead of hand-editing each `renderCell`.
  const columnsWithTotalsRow = columns.map((column) => {
    const totalsRenderCell = TOTALS_ROW_CELL_RENDERERS[column.key];
    return {
      ...column,
      // `containerCount`/`logisticsTotal`/`profit` are nullable on a real
      // row but never-null on the totals row, so a strict intersection
      // type (like `contracts-list.jsx`'s `columnsWithTotalsRow` uses)
      // doesn't typecheck here — `any` is the pragmatic escape, the actual
      // branching below is still guarded by `__isTotalsRow`.
      /** @param {any} row */
      renderCell: (row) =>
        row.__isTotalsRow
          ? (totalsRenderCell
              ? totalsRenderCell(/** @type {PrivateInfoTotalsRow} */ (row))
              : null)
          : column.renderCell?.(row),
    };
  });

  const totalItems = listResult?.success ? listResult.totalCount : 0;
  const totalPages = Math.max(1, listResult?.success ? listResult.totalPages : 1);

  if (!hasLogisticsSecret) {
    return (
      <VStack gap={4} hAlign="stretch">
        <Heading level={1}>BOQ</Heading>
        <Text color="secondary">
          Bạn không có quyền xem BOQ (cần quyền logistics:secret, cấp riêng
          cho từng người).
        </Text>
      </VStack>
    );
  }

  return (
    <VStack gap={4} hAlign="stretch">
      <Heading level={1}>BOQ</Heading>

      {listResult && !listResult.success ? (
        <AdvanceTableErrorBanner message={listResult.message} />
      ) : null}

      <AdvanceTable
        toolbarLabel="Thao tác danh sách BOQ"
        searchFieldDefs={SEARCH_FIELD_DEFS}
        entityLabel="BOQ"
        contentSearchFieldKey="contractNumber"
        searchPlaceholder="Tìm số hợp đồng, dự án..."
        filterFieldDefs={FILTER_FIELD_DEFS}
        advancedFilterConditions={filterConditions}
        onAdvancedFilterChange={setFilterConditions}
        columnOptions={COLUMN_OPTIONS}
        initialColumnKeys={DEFAULT_COLUMN_KEYS}
        defaultColumnKeys={DEFAULT_COLUMN_KEYS}
        tableColumns={columnsWithTotalsRow}
        data={items}
        totalsRows={totalsRows}
        idKey="contractId"
        isLoading={privateInfosQuery.isLoading}
        skeletonRows={skeletonRows}
        fixedEndColumnKeys={['actions']}
        onRefresh={() => privateInfosQuery.refetch()}
        isRefreshing={privateInfosQuery.isFetching}
        pagination={{
          pageIndex,
          pageSize,
          totalCount: totalItems,
          totalPages,
          onPageIndexChange: setPageIndex,
          onPageSizeChange: setPageSize,
          pageSizeOptions: PAGE_SIZE_OPTIONS,
        }}
      />

      {detailDialog ? (
        <ContractPrivateInfoDetailDialog
          key={detailDialog.row.contractId}
          contractId={detailDialog.row.contractId}
          contractNumber={detailDialog.row.contractNumber}
          initialEditing={detailDialog.initialEditing}
          onOpenChange={(isOpen) => {
            if (!isOpen) setDetailDialog(null);
          }}
        />
      ) : null}
    </VStack>
  );
}
