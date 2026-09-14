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
 * }} ShipmentListRow
 */
import { Button } from '@astryxdesign/core/Button';
import { DialogHeader } from '@astryxdesign/core/Dialog';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Layout, LayoutContent, LayoutFooter } from '@astryxdesign/core/Layout';
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
import { withTotalsRowCells } from '@/shared/config/totals-row.js';
import { upsertEqualsFilterCondition } from '@/shared/config/upsert-filter-condition.js';

import { searchAllShipments } from '../api/shipments.js';
import { formatMoney } from '../config/currencies.js';
import {
  isContractEligibleForShipment,
  reasonContractIneligibleForShipment,
} from '../config/shipment-contract-eligibility.js';
import { labelForShipmentQuantityUnit } from '../config/shipment-quantity-units.js';
import {
  labelForShipmentStatus,
  shipmentStatusOptions,
} from '../config/shipment-status.js';
import { labelForShipmentType } from '../config/shipment-types.js';
import {
  COLUMN_OPTIONS,
  DEFAULT_COLUMN_KEYS,
  DEFAULT_PAGE_SIZE,
  FILTER_FIELD_DEFS,
  PAGE_SIZE_OPTIONS,
  SEARCH_FIELD_DEFS,
  skeletonRows,
} from '../config/shipments-table.js';
import { useContractsQuery } from '../hooks/use-contracts-query.js';
import { useShipmentsListQuery } from '../hooks/use-shipments-list-query.js';
import { useSuppliersQuery } from '../hooks/use-suppliers-query.js';
import { RecordActionsMenu } from './record-actions-menu.jsx';
import { ShipmentFormDialog } from './shipment-form-dialog.jsx';

/** @param {string | null | undefined} value */
function orDash(value) {
  return value == null || value === '' ? '—' : value;
}

/**
 * @typedef {{
 *   id: string,
 *   __isTotalsRow: true,
 *   currency: string,
 *   invoiceValue: number,
 *   isMultiCurrency: boolean,
 * }} ShipmentTotalsRow
 */

/**
 * "Tổng cộng" label for the synthetic totals row(s) — passed to
 * `AdvanceTable`'s `totalsRowLabel` prop, same pattern as
 * `contracts-list.jsx`'s `totalsRowLabel`.
 * @param {ShipmentTotalsRow} row
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
 * `AdvanceTable`'s `totalsRows` prop — same pattern as
 * `contracts-list.jsx`'s `TOTALS_ROW_CELL_RENDERERS`.
 * @type {Record<string, (row: ShipmentTotalsRow) => import('react').ReactNode>}
 */
const TOTALS_ROW_CELL_RENDERERS = {
  invoiceValue: (row) => (
    <Text weight="semibold" hasTabularNumbers>
      {formatMoney(row.invoiceValue, row.currency)}
    </Text>
  ),
};

export function ShipmentsList() {
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pageIndex, setPageIndex] = useState(1);
  const [filterConditions, setFilterConditions] = useState(
    /** @type {import('@/shared/components/advanced-filter-builder.jsx').AdvancedFilterCondition[]} */ ([]),
  );
  // Server-side quick filter for "Tình trạng" — writes into the same
  // `filterConditions` the funnel dialog edits (unlike `AdvanceTable`'s own
  // `quickFilters` prop, client-side-only). `null` clears the pill back to
  // "no filter" rather than a specific status.
  const statusQuickFilterValue =
    filterConditions.find((condition) => condition.field === 'status')?.value ??
    null;
  /** @param {string | null} nextValue */
  function handleStatusQuickFilterChange(nextValue) {
    setFilterConditions((current) =>
      upsertEqualsFilterCondition(current, 'status', nextValue),
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
  const shipmentsQuery = useShipmentsListQuery({
    page: pageIndex,
    pageSize,
    conditions: filterConditions,
  });
  const listResult = shipmentsQuery.data;
  const shipments = listResult?.success ? listResult.shipments : [];

  // Sum of invoiceValue across every shipment matching the current filters
  // (not just this page — the backend computes it pre-paging, see
  // `searchAllShipments`'s doc comment), grouped by currency since
  // shipments can be invoiced in more than one. Rendered as a synthetic
  // last row per currency, same pattern as `contracts-list.jsx`.
  const totalsRows = useMemo(() => {
    if (!listResult?.success) return [];
    const totals = listResult.totals;
    return totals.map((total) => ({
      id: `totals-${total.currency}`,
      __isTotalsRow: true,
      currency: total.currency,
      invoiceValue: total.invoiceValue,
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

  const customersQuery = useSuppliersQuery();
  const customersById = useMemo(
    () =>
      new Map(
        (customersQuery.data?.success ? customersQuery.data.suppliers : []).map(
          (/** @type {import('../types/index.js').Supplier} */ customer) => [customer.id, customer],
        ),
      ),
    [customersQuery.data],
  );

  /** @param {import('../types/index.js').Shipment[]} rawShipments */
  function enrichShipments(rawShipments) {
    return rawShipments.map((shipment) => {
      const contract = contractsById.get(shipment.contractId);
      return {
        ...shipment,
        contractNumber: contract?.contractNumber ?? '',
        projectName: contract?.projectName ?? '',
        supplierName:
          customersById.get(shipment.supplierCustomerId)?.companyName ?? '',
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
    });
    return result.success ? enrichShipments(result.shipments) : [];
  }

  /**
   * Shared by the "Mã" cell (design.md section 4: "Mã bản ghi mở Xem") and
   * `RecordActionsMenu`'s own "Xem"/"Sửa" below.
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

  /** @type {import('@/shared/components/advance-table.jsx').AdvanceTableColumn<ShipmentListRow>[]} */
  const columns = [
    {
      key: 'shipmentCode',
      header: 'Mã',
      width: pixel(200),
      filter: 'shipmentCode',
      // "Mã bản ghi mở Xem" (design.md section 4) — same handler
      // `RecordActionsMenu`'s "Xem" below uses.
      renderCell: (row) => (
        <Button
          label={row.shipmentCode}
          variant="ghost"
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            openShipment(row, 'view');
          }}
        />
      ),
    },
    {
      key: 'contractNumber',
      header: 'Số hợp đồng',
      width: pixel(200),
      filter: 'contractNumber',
      renderCell: (row) => orDash(row.contractNumber),
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
      width: pixel(90),
      renderCell: (row) => labelForShipmentType(row.type),
      exportValue: (row) => labelForShipmentType(row.type),
    },
    {
      key: 'status',
      header: 'Tình trạng',
      width: pixel(150),
      filter: 'status',
      renderCell: (row) => labelForShipmentStatus(row.status),
      exportValue: (row) => labelForShipmentStatus(row.status),
    },
    {
      key: 'quantity',
      header: 'Số lượng',
      width: pixel(110),
      renderCell: (row) =>
        `${row.quantityAmount} ${labelForShipmentQuantityUnit(row.quantityUnit)}`,
      exportValue: (row) =>
        `${row.quantityAmount} ${labelForShipmentQuantityUnit(row.quantityUnit)}`,
    },
    {
      key: 'bookingNumber',
      header: 'Booking',
      width: pixel(140),
      filter: 'bookingNumber',
      renderCell: (row) => row.bookingNumber,
    },
    {
      key: 'supplier',
      header: 'Forwarder',
      width: proportional(1),
      renderCell: (row) => orDash(row.supplierName),
      exportValue: (row) => row.supplierName,
    },
    {
      key: 'invoiceValue',
      header: 'Giá trị invoice',
      width: pixel(200),
      renderCell: (row) => formatMoney(row.invoiceValue, row.invoiceCurrency),
    },
    {
      key: 'actions',
      header: 'Chức năng',
      width: pixel(140),
      align: 'end',
      renderCell: (row) => (
        <RecordActionsMenu
          onView={() => openShipment(row, 'view')}
          onEdit={() => openShipment(row, 'edit')}
        />
      ),
    },
  ];

  const columnsWithTotalsRow = withTotalsRowCells(
    columns,
    TOTALS_ROW_CELL_RENDERERS,
  );

  const totalShipments = listResult?.success ? listResult.totalCount : 0;
  const totalPages = Math.max(
    1,
    listResult?.success ? listResult.totalPages : 1,
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
    <VStack gap={4} hAlign="stretch" height="100%">
      <HStack hAlign="between" vAlign="center" wrap="wrap" gap={3}>
        <Heading level={1}>Shipment</Heading>
        <Button
          label="Thêm Shipment"
          variant="primary"
          icon={<Icon icon={Plus} />}
          onClick={() => setIsPickingContract(true)}
        />
      </HStack>

      {listResult && !listResult.success ? (
        <AdvanceTableErrorBanner message={listResult.message} />
      ) : null}

      <Selector
        label="Lọc theo tình trạng"
        placeholder="Tất cả tình trạng"
        size="sm"
        hasClear
        hasSearch
        options={shipmentStatusOptions}
        value={statusQuickFilterValue}
        onChange={handleStatusQuickFilterChange}
        width={280}
      />

      <StackItem size="fill">
        <AdvanceTable
          toolbarLabel="Thao tác danh sách Shipment"
          searchFieldDefs={SEARCH_FIELD_DEFS}
          entityLabel="Shipment"
          contentSearchFieldKey="shipmentCode"
          searchPlaceholder="Tìm mã, tên lô hàng, số hợp đồng..."
          filterFieldDefs={FILTER_FIELD_DEFS}
          advancedFilterConditions={filterConditions}
          onAdvancedFilterChange={setFilterConditions}
          columnOptions={COLUMN_OPTIONS}
          initialColumnKeys={DEFAULT_COLUMN_KEYS}
          defaultColumnKeys={DEFAULT_COLUMN_KEYS}
          tableColumns={columnsWithTotalsRow}
          data={searchableShipments}
          totalsRows={totalsRows}
          totalsRowLabel={totalsRowLabel}
          idKey="id"
          isLoading={shipmentsQuery.isLoading}
          skeletonRows={skeletonRows}
          fixedEndColumnKeys={['actions']}
          fetchAllRows={fetchAllShipments}
          onRefresh={() => shipmentsQuery.refetch()}
          isRefreshing={shipmentsQuery.isFetching}
          pagination={{
            pageIndex,
            pageSize,
            totalCount: totalShipments,
            totalPages,
            onPageIndexChange: setPageIndex,
            onPageSizeChange: setPageSize,
            pageSizeOptions: PAGE_SIZE_OPTIONS,
          }}
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
                      description: ineligibleReason ?? undefined,
                      disabled: ineligibleReason != null,
                    };
                  })}
                  width="100%"
                />
                <Text color="secondary">
                  Chỉ hợp đồng Chính thức, đã ký bởi cả hai bên và chưa huỷ mới
                  có thể tạo Shipment mới.
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
    </VStack>
  );
}
