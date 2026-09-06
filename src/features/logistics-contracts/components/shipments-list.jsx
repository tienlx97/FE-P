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
import { pixel, proportional } from '@astryxdesign/core/Table';
import { Heading } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
  AdvanceTable,
  AdvanceTableErrorBanner,
} from '@/shared/components/advance-table.jsx';
import { CommonDialog } from '@/shared/components/common-dialog.jsx';

import { formatMoney } from '../config/currencies.js';
import { labelForShipmentQuantityUnit } from '../config/shipment-quantity-units.js';
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
import { useCustomersQuery } from '../hooks/use-customers-query.js';
import { useShipmentsListQuery } from '../hooks/use-shipments-list-query.js';
import { RecordActionsMenu } from './record-actions-menu.jsx';
import { ShipmentFormDialog } from './shipment-form-dialog.jsx';

/** @param {string | null | undefined} value */
function orDash(value) {
  return value == null || value === '' ? '—' : value;
}

export function ShipmentsList() {
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pageIndex, setPageIndex] = useState(1);
  const [filterConditions, setFilterConditions] = useState(
    /** @type {import('@/shared/components/advanced-filter-builder.jsx').AdvancedFilterCondition[]} */ ([]),
  );
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

  const customersQuery = useCustomersQuery();
  const customersById = useMemo(
    () =>
      new Map(
        (customersQuery.data?.success ? customersQuery.data.customers : []).map(
          (customer) => [customer.id, customer],
        ),
      ),
    [customersQuery.data],
  );

  const searchableShipments = shipments.map((shipment) => {
    const contract = contractsById.get(shipment.contractId);
    return {
      ...shipment,
      contractNumber: contract?.contractNumber ?? '',
      projectName: contract?.projectName ?? '',
      supplierName:
        customersById.get(shipment.supplierCustomerId)?.companyName ?? '',
    };
  });

  /** @type {import('@astryxdesign/core/Table').TableColumn<ShipmentListRow>[]} */
  const columns = [
    {
      key: 'shipmentCode',
      header: 'Mã',
      width: pixel(160),
      filter: 'shipmentCode',
      renderCell: (row) => row.shipmentCode,
    },
    {
      key: 'contractNumber',
      header: 'Số hợp đồng',
      width: pixel(160),
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
    },
    {
      key: 'quantity',
      header: 'Số lượng',
      width: pixel(110),
      renderCell: (row) =>
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
          onView={() =>
            setShipmentDialog({
              mode: 'view',
              contractId: row.contractId,
              contract: contractsById.get(row.contractId),
              shipment: row,
            })
          }
          onEdit={() =>
            setShipmentDialog({
              mode: 'edit',
              contractId: row.contractId,
              contract: contractsById.get(row.contractId),
              shipment: row,
            })
          }
        />
      ),
    },
  ];

  const totalShipments = listResult?.success ? listResult.totalCount : 0;
  const totalPages = Math.max(
    1,
    listResult?.success ? listResult.totalPages : 1,
  );

  function handleContinuePickingContract() {
    if (!pickedContractId) return;
    setIsPickingContract(false);
    setShipmentDialog({
      contractId: pickedContractId,
      contract: contractsById.get(pickedContractId),
    });
    setPickedContractId(null);
  }

  const selectedShipment =
    shipments.find((row) => row.id === shipmentDialog?.shipment?.id) ??
    shipmentDialog?.shipment;

  return (
    <VStack gap={4} hAlign="stretch">
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
        tableColumns={columns}
        data={searchableShipments}
        idKey="id"
        isLoading={shipmentsQuery.isLoading}
        skeletonRows={skeletonRows}
        fixedEndColumnKeys={['actions']}
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
          onSuccess={() => setShipmentDialog(null)}
        />
      ) : null}
    </VStack>
  );
}
