'use client';

import { Button } from '@astryxdesign/core/Button';
import { DialogHeader } from '@astryxdesign/core/Dialog';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Layout, LayoutContent, LayoutFooter } from '@astryxdesign/core/Layout';
import { Link } from '@astryxdesign/core/Link';
import { Selector } from '@astryxdesign/core/Selector';
import { StackItem } from '@astryxdesign/core/Stack';
import { pixel, proportional } from '@astryxdesign/core/Table';
import { Heading, Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
  AdvanceTable,
  AdvanceTableErrorBanner,
} from '@/shared/components/advance-table.jsx';
import { CommonDialog } from '@/shared/components/common-dialog.jsx';
import { recordLinkStyles } from '@/shared/components/record-link-style.js';
import { withTotalsRowCells } from '@/shared/config/totals-row.js';
import { useSessionPermissions } from '@/shared/hooks/use-session-permissions.js';

import { searchContractPrivateInfos } from '../api/contract-private-info.js';
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
import { useContractsQuery } from '../hooks/use-contracts-query.js';
import { ContractPrivateInfoDetailDialog } from './contract-private-info-detail-dialog.jsx';
import { RecordActionsMenu } from './record-actions-menu.jsx';

const LOGISTICS_SECRET_PERMISSION = 'logistics:secret';

// BOQ's search reuses BE-kt-xnk's Contract search/sort (a BOQ row is 1:1
// with its Contract) — restricted to the two BE-sortable Contract fields
// this table actually has a column for.
const SORTABLE_COLUMN_KEYS = ['contractNumber', 'projectName'];

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
 * "Tổng cộng" label for the synthetic totals row — passed to
 * `AdvanceTable`'s `totalsRowLabel` prop, same pattern as
 * `contracts-list.jsx`'s `totalsRowLabel`.
 */
function totalsRowLabel() {
  return <Text weight="semibold">Tổng cộng</Text>;
}

/**
 * Cell renderers used only for the synthetic totals row appended via
 * `AdvanceTable`'s `totalsRows` prop — same pattern as
 * `contracts-list.jsx`'s `TOTALS_ROW_CELL_RENDERERS`. Unlike the other
 * lists, no currency grouping — these three are always VNĐ, so there's
 * exactly one totals row, not one per currency.
 * `costPricePerContainer`/`quotedPricePerContainer` (per-unit prices) are
 * deliberately not summed — summing a unit price across different
 * contracts isn't a meaningful total.
 * @type {Record<string, (row: PrivateInfoTotalsRow) => import('react').ReactNode>}
 */
const TOTALS_ROW_CELL_RENDERERS = {
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
  const [detailDialog, setDetailDialog] = useState(
    /** @type {{ row: Pick<import('../types/index.js').ContractPrivateInfoListItem, 'contractId' | 'contractNumber'>, initialEditing: boolean } | null} */ (
      null
    ),
  );
  const [isPickingContract, setIsPickingContract] = useState(false);
  const [pickedContractId, setPickedContractId] = useState(
    /** @type {string | null} */ (null),
  );

  const privateInfosQuery = useContractPrivateInfosListQuery({
    page: pageIndex,
    pageSize,
    conditions: filterConditions,
    sort,
    // Skipped entirely for a caller who can't see the tab either — a 403
    // here would just be a confusing error banner on page load.
    enabled: hasLogisticsSecret,
  });
  const listResult = privateInfosQuery.data;
  const items = listResult?.success ? listResult.items : [];

  // Backs the "Thêm" contract picker below — every contract can have BOQ
  // info added/edited (a BOQ row *is* a Contract enriched with nullable
  // private-info fields, see `ContractPrivateInfoListItem`'s doc comment;
  // there's no separate "doesn't have one yet" state to filter out, unlike
  // Commission's own contract picker in `commissions-list.jsx`). `pageSize:
  // 100` is that same list's own effective ceiling convention.
  const contractsQuery = useContractsQuery({ page: 1, pageSize: 100 });
  const contracts = useMemo(
    () => (contractsQuery.data?.success ? contractsQuery.data.contracts : []),
    [contractsQuery.data],
  );
  const contractsById = useMemo(
    () => new Map(contracts.map((contract) => [contract.id, contract])),
    [contracts],
  );

  function handleContinuePickingContract() {
    if (!pickedContractId) return;
    const contract = contractsById.get(pickedContractId);
    setIsPickingContract(false);
    setPickedContractId(null);
    setDetailDialog({
      row: {
        contractId: pickedContractId,
        contractNumber: contract?.contractNumber ?? '',
      },
      initialEditing: true,
    });
  }

  // "Xuất toàn bộ dữ liệu" in AdvanceTable's export dropdown.
  async function fetchAllPrivateInfos() {
    const result = await searchContractPrivateInfos({
      page: 1,
      pageSize: listResult?.success
        ? Math.max(1, listResult.totalCount)
        : pageSize,
      conditions: filterConditions,
    });
    return result.success ? result.items : [];
  }

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

  /** @type {import('@/shared/components/advance-table.jsx').AdvanceTableColumn<import('../types/index.js').ContractPrivateInfoListItem>[]} */
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
        <Link
          xstyle={recordLinkStyles.link}
          onClick={(event) => {
            event.stopPropagation();
            setDetailDialog({ row, initialEditing: false });
          }}
        >
          {row.contractNumber}
        </Link>
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

  const columnsWithTotalsRow = withTotalsRowCells(
    columns,
    TOTALS_ROW_CELL_RENDERERS,
  );

  const totalItems = listResult?.success ? listResult.totalCount : 0;
  const totalPages = Math.max(
    1,
    listResult?.success ? listResult.totalPages : 1,
  );

  if (!hasLogisticsSecret) {
    return (
      <VStack gap={4} hAlign="stretch">
        <Heading level={1}>BOQ</Heading>
        <Text color="secondary">
          Bạn không có quyền xem BOQ (cần quyền logistics:secret, cấp riêng cho
          từng người).
        </Text>
      </VStack>
    );
  }

  return (
    <VStack gap={4} hAlign="stretch" height="100%">
      {listResult && !listResult.success ? (
        <AdvanceTableErrorBanner message={listResult.message} />
      ) : null}

      <StackItem size="fill">
        <AdvanceTable
          title={<Heading level={1}>BOQ</Heading>}
          primaryAction={{
            label: 'Thêm',
            icon: <Icon icon={Plus} />,
            onClick: () => setIsPickingContract(true),
          }}
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
          totalsRowLabel={totalsRowLabel}
          idKey="contractId"
          isLoading={privateInfosQuery.isLoading}
          skeletonRows={skeletonRows}
          fixedEndColumnKeys={['actions']}
          fetchAllRows={fetchAllPrivateInfos}
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
                  placeholder="Chọn hợp đồng cần nhập BOQ"
                  value={pickedContractId}
                  onChange={setPickedContractId}
                  options={contracts.map((contract) => ({
                    value: contract.id,
                    label: `${contract.contractNumber} · ${contract.projectName}`,
                  }))}
                  width="100%"
                />
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
                    isDisabled={!pickedContractId}
                    onClick={handleContinuePickingContract}
                  />
                </HStack>
              </LayoutFooter>
            }
          />
        </CommonDialog>
      ) : null}

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
