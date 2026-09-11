'use client';

import { pixel, proportional } from '@astryxdesign/core/Table';
import { Heading, Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { useState } from 'react';

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

  /** @type {import('@astryxdesign/core/Table').TableColumn<import('../types/index.js').ContractPrivateInfoListItem>[]} */
  const columns = [
    {
      key: 'contractNumber',
      header: 'Số hợp đồng',
      width: pixel(160),
      filter: 'contractNumber',
      renderCell: (row) => row.contractNumber,
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
        tableColumns={columns}
        data={items}
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
