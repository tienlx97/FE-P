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
import { Link } from '@astryxdesign/core/Link';
import { Selector } from '@astryxdesign/core/Selector';
import { StackItem } from '@astryxdesign/core/Stack';
import { pixel } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import {
  AdvanceTable,
  AdvanceTableErrorBanner,
} from '@/shared/components/advance-table.jsx';
import { CommonDialog } from '@/shared/components/common-dialog.jsx';
import {
  MetaCellText,
  MetaListTitle,
  MetaRowActions,
  MetaTotalsLabel,
} from '@/shared/components/custom/meta/list-parts.jsx';
import { MetaPill } from '@/shared/components/custom/meta/pill.jsx';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';
import { withTotalsRowCells } from '@/shared/config/totals-row.js';
import { useAppToast } from '@/shared/hooks/use-app-toast.js';

import { searchCommissions } from '../api/commissions.js';
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
import { useCommissionQuery } from '../hooks/use-commission-query.js';
import { useCommissionsQuery } from '../hooks/use-commissions-query.js';
import {
  useContractQuery,
  useContractsQuery,
} from '../hooks/use-contracts-query.js';
import { useSuppliersQuery } from '../hooks/use-suppliers-query.js';
import { CommissionFormDrawer } from './commission-form-drawer.jsx';

/** @param {string | null | undefined} value */
function orDash(value) {
  return value == null || value === '' ? '—' : value;
}

// Matches BE-kt-xnk's `CommissionSortFields` allow-list — every field there
// already has a same-named column in this table.
const SORTABLE_COLUMN_KEYS = [
  'code',
  'contractNumber',
  'partyCustomerName',
  'value',
  'signedDate',
];

/**
 * @typedef {{
 *   id: string,
 *   __isTotalsRow: true,
 *   currency: string,
 *   value: number,
 *   isMultiCurrency: boolean,
 * }} CommissionTotalsRow
 */

/**
 * "Tổng cộng" label for the synthetic totals row(s) — passed to
 * `AdvanceTable`'s `totalsRowLabel` prop, same pattern as
 * `contracts-list.jsx`'s `totalsRowLabel`.
 * @param {CommissionTotalsRow} row
 */
function totalsRowLabel(row) {
  return (
    <MetaTotalsLabel
      caption={
        row.isMultiCurrency ? `Tổng cộng (${row.currency})` : 'Tổng cộng'
      }
    />
  );
}

/**
 * "Đã ký" / "Chưa ký" as a Meta status pill (status → pill, not text).
 * @param {boolean} isSigned
 */
function signedPill(isSigned) {
  return (
    <MetaPill
      label={isSigned ? 'Đã ký' : 'Chưa ký'}
      tone={isSigned ? 'success' : 'neutral'}
      hasDot
    />
  );
}

/**
 * Cell renderers used only for the synthetic totals row(s) appended via
 * `AdvanceTable`'s `totalsRows` prop — same pattern as
 * `contracts-list.jsx`'s `TOTALS_ROW_CELL_RENDERERS`.
 * @type {Record<string, (row: CommissionTotalsRow) => import('react').ReactNode>}
 */
const TOTALS_ROW_CELL_RENDERERS = {
  value: (row) => (
    <Text weight="semibold" hasTabularNumbers>
      {formatMoney(row.value, row.currency)}
    </Text>
  ),
};

/** Standalone list opens shared entity dialogs; related editors stay outside tables (ADR-0004). */
export function CommissionsList() {
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
  const router = useRouter();
  // Contract whose Commission "Sửa" is editing in the Meta drawer.
  const [editingContractId, setEditingContractId] = useState(
    /** @type {string | null} */ (null),
  );
  const [isPickingContract, setIsPickingContract] = useState(false);
  const [pickedContractId, setPickedContractId] = useState(
    /** @type {string | null} */ (null),
  );
  // The picked contract, once "Tiếp tục" opens the Meta create drawer.
  const [creatingForContract, setCreatingForContract] = useState(
    /** @type {import('../types/index.js').Contract | null} */ (null),
  );

  const commissionsQuery = useCommissionsQuery({
    page: pageIndex,
    pageSize,
    conditions: filterConditions,
    sort,
  });
  const listResult = commissionsQuery.data;
  const commissions = listResult?.success ? listResult.commissions : [];

  // Sum of value across every commission matching the current filters (not
  // just this page — the backend computes it pre-paging, see
  // `searchCommissions`'s doc comment), grouped by the parent contract's
  // currency since commissions can belong to contracts in more than one.
  // Rendered as a synthetic last row per currency, same pattern as
  // `contracts-list.jsx`.
  const totalsRows = useMemo(() => {
    if (!listResult?.success) return [];
    const totals = listResult.totals;
    return totals.map((total) => ({
      id: `totals-${total.currency}`,
      __isTotalsRow: true,
      currency: total.currency,
      value: total.value,
      isMultiCurrency: totals.length > 1,
    }));
  }, [listResult]);

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

  const customersQuery = useSuppliersQuery();
  const customersById = useMemo(
    () =>
      new Map(
        (customersQuery.data?.success ? customersQuery.data.suppliers : []).map(
          (/** @type {import('../types/index.js').Supplier} */ customer) => [
            customer.id,
            customer,
          ],
        ),
      ),
    [customersQuery.data],
  );

  /** @param {import('../types/index.js').Commission[]} rawCommissions */
  function enrichCommissions(rawCommissions) {
    return rawCommissions.map((commission) => {
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
  }

  const searchableCommissions = enrichCommissions(commissions);

  // "Xuất toàn bộ dữ liệu" in AdvanceTable's export dropdown.
  async function fetchAllCommissions() {
    const result = await searchCommissions({
      page: 1,
      pageSize: listResult?.success
        ? Math.max(1, listResult.totalCount)
        : pageSize,
      conditions: filterConditions,
    });
    return result.success ? enrichCommissions(result.commissions) : [];
  }

  // "Xem" (the "Mã" link and the row's eye button) is the contract detail's
  // "Hoa hồng" tab — a Commission is 1:1 with its contract.
  /** @param {CommissionListRow} row */
  function commissionHref(row) {
    return `/logistics/contract/${row.contractId}?tab=commission`;
  }

  /** @type {import('@/shared/components/advance-table.jsx').AdvanceTableColumn<CommissionListRow>[]} */
  const columns = [
    {
      key: 'code',
      header: 'Mã',
      width: pixel(120),
      filter: 'code',
      renderCell: (row) => (
        <Link
          href={commissionHref(row)}
          weight="bold"
          color="accent"
          onClick={(event) => event.stopPropagation()}
        >
          {row.code}
        </Link>
      ),
    },
    {
      key: 'contractNumber',
      header: 'Số hợp đồng',
      width: pixel(140),
      filter: 'contractNumber',
      renderCell: (row) =>
        contractsById.has(row.contractId) ? (
          <Link
            href={`/logistics/contract/${row.contractId}`}
            weight="bold"
            color="accent"
            onClick={(event) => event.stopPropagation()}
          >
            {orDash(row.contractNumber)}
          </Link>
        ) : (
          orDash(row.contractNumber)
        ),
    },
    {
      key: 'projectName',
      header: 'Dự án',
      width: pixel(160),
      filter: 'projectName',
      renderCell: (row) => <MetaCellText value={row.projectName} />,
    },
    {
      key: 'partyCustomerName',
      header: 'Bên nhận hoa hồng',
      width: pixel(200),
      filter: 'partyCustomerName',
      renderCell: (row) => <MetaCellText value={row.partyCustomerName} />,
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
      renderCell: (row) => signedPill(row.sellerSigned),
      exportValue: (row) => (row.sellerSigned ? 'Đã ký' : 'Chưa ký'),
    },
    {
      key: 'partySigned',
      header: 'Bên nhận hoa hồng đã ký',
      width: pixel(170),
      renderCell: (row) => signedPill(row.partySigned),
      exportValue: (row) => (row.partySigned ? 'Đã ký' : 'Chưa ký'),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      width: pixel(104),
      align: 'center',
      renderCell: (row) => (
        <MetaRowActions
          recordLabel={row.code}
          onView={() => router.push(commissionHref(row))}
          onEdit={() => setEditingContractId(row.contractId)}
        />
      ),
    },
  ];

  const columnsWithTotalsRow = withTotalsRowCells(
    columns,
    TOTALS_ROW_CELL_RENDERERS,
  );

  const totalCommissions = listResult?.success ? listResult.totalCount : 0;
  const totalPages = Math.max(
    1,
    listResult?.success ? listResult.totalPages : 1,
  );

  function handleContinuePickingContract() {
    if (!pickedContractId) return;
    const contract = contractsById.get(pickedContractId);
    if (!contract) return;
    setIsPickingContract(false);
    setCreatingForContract(contract);
    setPickedContractId(null);
  }

  return (
    <VStack gap={4} hAlign="stretch" height="100%">
      {listResult && !listResult.success ? (
        <AdvanceTableErrorBanner message={listResult.message} />
      ) : null}

      <StackItem size="fill">
        <AdvanceTable
          title={
            <MetaListTitle
              title="Danh sách Commission"
              count={listResult?.success ? totalCommissions : undefined}
              unit="commission"
            />
          }
          isFramed
          isStriped
          dividers="rows"
          primaryAction={{
            label: 'Tạo Commission',
            icon: <Icon icon={Plus} size="sm" />,
            onClick: () => setIsPickingContract(true),
          }}
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
          tableColumns={columnsWithTotalsRow}
          data={searchableCommissions}
          totalsRows={totalsRows}
          totalsRowLabel={totalsRowLabel}
          idKey="id"
          isLoading={commissionsQuery.isLoading}
          skeletonRows={skeletonRows}
          fixedEndColumnKeys={['actions']}
          fetchAllRows={fetchAllCommissions}
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
          sort={sort}
          onSortChange={handleSortChange}
          sortableColumnKeys={SORTABLE_COLUMN_KEYS}
        />
      </StackItem>

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

      {/* Create in the Meta drawer, same as the contract detail's
          "Hoa hồng" tab (the drawer re-applies the Meta theme itself). */}
      {creatingForContract ? (
        <CommissionFormDrawer
          contract={creatingForContract}
          onClose={() => setCreatingForContract(null)}
        />
      ) : null}

      {editingContractId ? (
        <CommissionEditDrawer
          key={editingContractId}
          contractId={editingContractId}
          onClose={() => setEditingContractId(null)}
        />
      ) : null}
    </VStack>
  );
}

/**
 * "Sửa" → the contract detail's Meta Commission drawer. Loads the contract
 * (the drawer needs its value / currency / type) and its Commission by id,
 * so it works for rows whose contract isn't in the picker's first page; the
 * drawer opens once both arrive, a load failure toasts and closes.
 * @param {{ contractId: string, onClose: () => void }} props
 */
function CommissionEditDrawer({ contractId, onClose }) {
  const toast = useAppToast();
  const contractQuery = useContractQuery(contractId);
  const commissionQuery = useCommissionQuery(contractId);
  const contract = contractQuery.data?.success
    ? contractQuery.data.contract
    : null;
  const commission =
    commissionQuery.data?.success && commissionQuery.data.exists
      ? commissionQuery.data.commission
      : null;
  const failure =
    contractQuery.data && !contractQuery.data.success
      ? contractQuery.data.message
      : commissionQuery.data && !commissionQuery.data.success
        ? commissionQuery.data.message
        : null;

  useEffect(() => {
    if (!failure) return;
    toast({ body: failure, type: 'error' });
    onClose();
  }, [failure, onClose, toast]);

  return contract && commission ? (
    <CommissionFormDrawer
      contract={contract}
      commission={commission}
      onClose={onClose}
    />
  ) : null;
}
