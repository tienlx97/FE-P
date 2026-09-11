'use client';
/**
 * A `Commission` plus the fields resolved client-side for display —
 * see the comment above `contractsById` in `CommissionsList` for why
 * these aren't already on the API response.
 * @typedef {import('../types/index.js').Commission & {
 *   contractNumber: string,
 *   projectName: string,
 *   currency: string,
 *   partyCustomerName: string,
 * }} CommissionListRow
 */
import { Button } from '@astryxdesign/core/Button';
import { DialogHeader } from '@astryxdesign/core/Dialog';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Layout, LayoutContent, LayoutFooter } from '@astryxdesign/core/Layout';
import { Selector } from '@astryxdesign/core/Selector';
import { pixel } from '@astryxdesign/core/Table';
import { Heading } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
  AdvanceTable,
  AdvanceTableErrorBanner,
} from '@/shared/components/advance-table.jsx';
import { CommonDialog } from '@/shared/components/common-dialog.jsx';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';

import {
  COLUMN_OPTIONS,
  DEFAULT_COLUMN_KEYS,
  DEFAULT_PAGE_SIZE,
  FILTER_FIELD_DEFS,
  PAGE_SIZE_OPTIONS,
  SEARCH_FIELD_DEFS,
  skeletonRows,
} from '../config/commissions-table.js';
import { formatMoney } from '../config/currencies.js';
import { useCommissionsQuery } from '../hooks/use-commissions-query.js';
import { useContractsQuery } from '../hooks/use-contracts-query.js';
import { useCustomersQuery } from '../hooks/use-customers-query.js';
import { CommissionAnnexFormDialog } from './commission-annex-form-dialog.jsx';
import { CommissionFormDialog } from './commission-form-dialog.jsx';
import { CommissionPaymentQuickAddDialog } from './commission-payment-quick-add-dialog.jsx';
import { RecordActionsMenu } from './record-actions-menu.jsx';

/** @param {string | null | undefined} value */
function orDash(value) {
  return value == null || value === '' ? '—' : value;
}

/** Standalone list opens shared entity dialogs; related editors stay outside tables (ADR-0004). */
export function CommissionsList() {
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pageIndex, setPageIndex] = useState(1);
  const [filterConditions, setFilterConditions] = useState(
    /** @type {import('@/shared/components/advanced-filter-builder.jsx').AdvancedFilterCondition[]} */ ([]),
  );
  const [dialogMode, setDialogMode] = useState(
    /** @type {'view' | 'edit'} */ ('view'),
  );
  const [editingCommissionRow, setEditingCommissionRow] = useState(
    /** @type {CommissionListRow | null} */ (null),
  );
  const [annexDialog, setAnnexDialog] = useState(
    /** @type {{ contractId: string, annex?: import('../types/index.js').CommissionAnnex } | null} */ (
      null
    ),
  );
  const [paymentDialog, setPaymentDialog] = useState(
    /** @type {CommissionListRow | null} */ (null),
  );
  const [isPickingContract, setIsPickingContract] = useState(false);
  const [pickedContractId, setPickedContractId] = useState(
    /** @type {string | null} */ (null),
  );
  const [creatingCommission, setCreatingCommission] = useState(
    /** @type {{ contractId: string, currency: string } | null} */ (null),
  );

  const commissionsQuery = useCommissionsQuery({
    page: pageIndex,
    pageSize,
    conditions: filterConditions,
  });
  const listResult = commissionsQuery.data;
  const commissions = listResult?.success ? listResult.commissions : [];

  // Every contract's `id` that already has a Commission (at most 1 per
  // contract, see `docs/api/Commissions.md`, BE-kt-xnk) — a separate,
  // unpaginated fetch from `commissionsQuery` above (whose `commissions`
  // is only the current page of the *displayed* table) so "Chọn hợp đồng"
  // below can exclude contracts that would just 409 on create. Same
  // `pageSize: 100` ceiling convention as `contractsQuery`.
  const allCommissionsQuery = useCommissionsQuery({ page: 1, pageSize: 100 });
  const contractIdsWithCommission = useMemo(
    () =>
      new Set(
        (allCommissionsQuery.data?.success
          ? allCommissionsQuery.data.commissions
          : []
        ).map((commission) => commission.contractId),
      ),
    [allCommissionsQuery.data],
  );

  // Neither field the table needs to display alongside a Commission
  // — the parent contract's number/project/currency, and the commission
  // recipient's name — comes back on `CommissionResponse` itself
  // (see `docs/api/Commissions.md`, BE-kt-xnk); both are resolved
  // client-side from the Contract/Customer catalogs, same pattern as
  // `banksById`/`countriesById` in `contracts-list.jsx`. `pageSize: 100` is
  // the contracts list's own effective ceiling — fine while every contract
  // fits on one page; a contract past the first 100 would show its number
  // as "—" here until this grows real cross-page resolution.
  const contractsQuery = useContractsQuery({ page: 1, pageSize: 100 });
  const contracts = useMemo(
    () => (contractsQuery.data?.success ? contractsQuery.data.contracts : []),
    [contractsQuery.data],
  );
  const contractsById = useMemo(
    () => new Map(contracts.map((contract) => [contract.id, contract])),
    [contracts],
  );
  const contractsWithoutCommission = useMemo(
    () =>
      contracts.filter(
        (contract) => !contractIdsWithCommission.has(contract.id),
      ),
    [contracts, contractIdsWithCommission],
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

  const searchableCommissions = commissions.map((commission) => {
    const contract = contractsById.get(commission.contractId);
    return {
      ...commission,
      contractNumber: contract?.contractNumber ?? '',
      projectName: contract?.projectName ?? '',
      currency: contract?.currency ?? '',
      partyCustomerName:
        customersById.get(commission.partyCustomerId)?.companyName ?? '',
    };
  });

  /**
   * Shared by the "Mã" cell (design.md section 4: "Mã bản ghi mở Xem") and
   * `RecordActionsMenu`'s own "Xem"/"Sửa" below.
   * @param {CommissionListRow} row
   * @param {'view' | 'edit'} mode
   */
  function openCommission(row, mode) {
    setDialogMode(mode);
    setEditingCommissionRow(row);
  }

  /** @type {import('@astryxdesign/core/Table').TableColumn<CommissionListRow>[]} */
  const columns = [
    {
      key: 'code',
      header: 'Mã',
      width: pixel(120),
      filter: 'code',
      renderCell: (row) => (
        <Button
          label={row.code}
          variant="ghost"
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            openCommission(row, 'view');
          }}
        />
      ),
    },
    {
      key: 'contractNumber',
      header: 'Số hợp đồng',
      width: pixel(140),
      filter: 'contractNumber',
      renderCell: (row) => orDash(row.contractNumber),
    },
    {
      key: 'projectName',
      header: 'Dự án',
      width: pixel(160),
      filter: 'projectName',
      renderCell: (row) => orDash(row.projectName),
    },
    {
      key: 'partyCustomerName',
      header: 'Bên nhận hoa hồng',
      width: pixel(200),
      filter: 'partyCustomerName',
      renderCell: (row) => orDash(row.partyCustomerName),
    },
    {
      key: 'value',
      header: 'Giá trị',
      width: pixel(140),
      align: 'end',
      renderCell: (row) => formatMoney(row.value, row.currency),
    },
    {
      key: 'signedDate',
      header: 'Ngày ký',
      width: pixel(120),
      renderCell: (row) => formatDisplayDate(row.signedDate),
    },
    {
      key: 'sellerSigned',
      header: 'Bên bán đã ký',
      width: pixel(130),
      renderCell: (row) => (row.sellerSigned ? 'Đã ký' : 'Chưa ký'),
    },
    {
      key: 'partySigned',
      header: 'Bên nhận hoa hồng đã ký',
      width: pixel(170),
      renderCell: (row) => (row.partySigned ? 'Đã ký' : 'Chưa ký'),
    },
    {
      key: 'actions',
      header: 'Chức năng',
      width: pixel(140),
      align: 'end',
      renderCell: (row) => (
        <RecordActionsMenu
          onView={() => openCommission(row, 'view')}
          onEdit={() => openCommission(row, 'edit')}
        />
      ),
    },
  ];

  const totalCommissions = listResult?.success ? listResult.totalCount : 0;
  const totalPages = Math.max(
    1,
    listResult?.success ? listResult.totalPages : 1,
  );

  function handleContinuePickingContract() {
    if (!pickedContractId) return;
    const contract = contractsById.get(pickedContractId);
    setIsPickingContract(false);
    setCreatingCommission({
      contractId: pickedContractId,
      currency: contract?.currency ?? '',
    });
    setPickedContractId(null);
  }

  const selectedCommission =
    searchableCommissions.find((row) => row.id === editingCommissionRow?.id) ??
    editingCommissionRow;

  return (
    <VStack gap={4} hAlign="stretch">
      <HStack hAlign="between" vAlign="center" wrap="wrap" gap={3}>
        <Heading level={1}>Commission</Heading>
        <Button
          label="Tạo Commission"
          variant="primary"
          icon={<Icon icon={Plus} />}
          onClick={() => setIsPickingContract(true)}
        />
      </HStack>

      {listResult && !listResult.success ? (
        <AdvanceTableErrorBanner message={listResult.message} />
      ) : null}

      <AdvanceTable
        toolbarLabel="Thao tác danh sách Commission"
        searchFieldDefs={SEARCH_FIELD_DEFS}
        entityLabel="Commission"
        contentSearchFieldKey="code"
        searchPlaceholder="Tìm mã, số hợp đồng..."
        filterFieldDefs={FILTER_FIELD_DEFS}
        advancedFilterConditions={filterConditions}
        onAdvancedFilterChange={setFilterConditions}
        columnOptions={COLUMN_OPTIONS}
        initialColumnKeys={DEFAULT_COLUMN_KEYS}
        defaultColumnKeys={DEFAULT_COLUMN_KEYS}
        tableColumns={columns}
        data={searchableCommissions}
        idKey="id"
        isLoading={commissionsQuery.isLoading}
        skeletonRows={skeletonRows}
        fixedEndColumnKeys={['actions']}
        onRefresh={() => commissionsQuery.refetch()}
        isRefreshing={commissionsQuery.isFetching}
        pagination={{
          pageIndex,
          pageSize,
          totalCount: totalCommissions,
          totalPages,
          onPageIndexChange: setPageIndex,
          onPageSizeChange: setPageSize,
          pageSizeOptions: PAGE_SIZE_OPTIONS,
        }}
      />

      {/* Keep record and related dialogs outside the table DOM (ADR-0004). */}

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
                  placeholder="Chọn hợp đồng cần tạo Commission"
                  value={pickedContractId}
                  onChange={setPickedContractId}
                  options={contractsWithoutCommission.map((contract) => ({
                    value: contract.id,
                    label: `${contract.contractNumber} · ${contract.projectName}`,
                  }))}
                  disabledMessage={
                    contractsWithoutCommission.length === 0
                      ? 'Mọi hợp đồng đều đã có Commission'
                      : undefined
                  }
                  isDisabled={contractsWithoutCommission.length === 0}
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

      {creatingCommission ? (
        <CommissionFormDialog
          isOpen
          onOpenChange={(isOpen) => {
            if (!isOpen) setCreatingCommission(null);
          }}
          contractId={creatingCommission.contractId}
          currency={creatingCommission.currency}
          onSuccess={() => setCreatingCommission(null)}
        />
      ) : null}

      {editingCommissionRow ? (
        <CommissionFormDialog
          key={editingCommissionRow.id}
          isOpen
          onOpenChange={(isOpen) => {
            if (!isOpen) setEditingCommissionRow(null);
          }}
          contractId={editingCommissionRow.contractId}
          currency={editingCommissionRow.currency}
          commission={selectedCommission}
          initialMode={dialogMode}
          onAddAnnex={() =>
            selectedCommission &&
            setAnnexDialog({ contractId: selectedCommission.contractId })
          }
          onEditAnnex={(annex) =>
            selectedCommission &&
            setAnnexDialog({
              contractId: selectedCommission.contractId,
              annex,
            })
          }
          onAddPayment={() =>
            selectedCommission && setPaymentDialog(selectedCommission)
          }
          // This dialog only ever edits an existing Commission (creation
          // uses `creatingCommission`/`CommissionFormDialog` without a
          // `commission` prop below) — `CommissionFormDialog` itself
          // returns to Xem in place on save, so nothing to close here.
          onSuccess={() => {}}
        />
      ) : null}

      {annexDialog ? (
        <CommissionAnnexFormDialog
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

      {paymentDialog ? (
        <CommissionPaymentQuickAddDialog
          isOpen
          onOpenChange={(isOpen) => {
            if (!isOpen) setPaymentDialog(null);
          }}
          contractId={paymentDialog.contractId}
          commission={paymentDialog}
          currency={paymentDialog.currency}
          onSuccess={() => setPaymentDialog(null)}
        />
      ) : null}
    </VStack>
  );
}
