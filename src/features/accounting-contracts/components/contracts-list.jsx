'use client';

import { Icon } from '@astryxdesign/core/Icon';
import { Link } from '@astryxdesign/core/Link';
import { StackItem } from '@astryxdesign/core/Stack';
import { pixel, proportional } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { Token } from '@astryxdesign/core/Token';
import { VStack } from '@astryxdesign/core/VStack';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  AdvanceTable,
  AdvanceTableErrorBanner,
} from '@/shared/components/advance-table.jsx';
import {
  MetaCellText,
  MetaListTitle,
} from '@/shared/components/custom/meta/list-parts.jsx';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';

import { formatVnd } from '../config/money.js';
import { useContractsSearchQuery } from '../hooks/use-contracts.js';
import { ContractFormDialog } from './contract-form-dialog.jsx';

/** @typedef {import('../types/index.js').AccountingContractSummary} Summary */

/** @satisfies {ReadonlyArray<import('@astryxdesign/core/PowerSearch').FieldDefinition>} */
const SEARCH_FIELD_DEFS = [
  { key: 'contractNumber', type: 'string', label: 'Số hợp đồng' },
  { key: 'projectCode', type: 'string', label: 'Mã công trình' },
  { key: 'projectName', type: 'string', label: 'Tên dự án' },
  { key: 'customerName', type: 'string', label: 'Khách hàng' },
];

/** @type {Array<{ key: keyof Summary & string, label: string }>} */
const MONEY_COLUMNS = [
  { key: 'valueBeforeTax', label: 'Trước thuế' },
  { key: 'valueAfterTax', label: 'Sau thuế' },
  { key: 'settlementValue', label: 'Quyết toán' },
  { key: 'invoicedValue', label: 'Đã xuất HĐ' },
  { key: 'remainingToInvoice', label: 'Còn phải xuất HĐ' },
  { key: 'paidValue', label: 'Đã thanh toán' },
  { key: 'unpaidValue', label: 'Chưa thanh toán' },
];

const COLUMN_OPTIONS = [
  { key: 'contractNumber', label: 'Số hợp đồng', isAlwaysVisible: true },
  { key: 'signedDate', label: 'Ngày ký' },
  { key: 'projectCode', label: 'Mã công trình' },
  { key: 'projectName', label: 'Tên dự án' },
  { key: 'customerName', label: 'Khách hàng' },
  { key: 'sourceName', label: 'Nguồn' },
  { key: 'taxRatePercent', label: 'Thuế' },
  ...MONEY_COLUMNS,
  { key: 'paymentDueDate', label: 'Tới hạn' },
  { key: 'overdueDays', label: 'Quá hạn' },
];

const SORTABLE = [
  'contractNumber',
  'signedDate',
  'projectCode',
  'projectName',
  'valueBeforeTax',
  'paymentDueDate',
];

/** Contract list of the Kế toán area — paged on the server, values derived by the backend. */
export function AccountingContractsList() {
  const router = useRouter();
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [sort, setSort] = useState(
    /** @type {{ field: string, direction: 'Ascending' | 'Descending' } | null} */ (
      null
    ),
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const searchQuery = useContractsSearchQuery({
    page: pageIndex + 1,
    pageSize,
    sort,
  });
  const result = searchQuery.data;
  const page = result?.success ? result.data : null;
  const contracts = page?.items ?? [];

  /** @type {import('@astryxdesign/core/Table').TableColumn<Summary & Record<string, unknown>>[]} */
  const columns = [
    {
      key: 'contractNumber',
      header: 'Số hợp đồng',
      width: pixel(150),
      filter: 'contractNumber',
      renderCell: (contract) => (
        <Link href={`/accounting/contract/${contract.id}`}>
          <Text weight="semibold">{contract.contractNumber}</Text>
        </Link>
      ),
    },
    {
      key: 'signedDate',
      header: 'Ngày ký',
      width: pixel(110),
      renderCell: (contract) => formatDisplayDate(contract.signedDate),
    },
    {
      key: 'projectCode',
      header: 'Mã công trình',
      width: pixel(130),
      filter: 'projectCode',
      renderCell: (contract) => contract.projectCode,
    },
    {
      key: 'projectName',
      header: 'Tên dự án',
      width: proportional(2),
      filter: 'projectName',
      renderCell: (contract) => contract.projectName,
    },
    {
      key: 'customerName',
      header: 'Khách hàng',
      width: proportional(1.5),
      filter: 'customerName',
      renderCell: (contract) => <MetaCellText value={contract.customerName} />,
    },
    {
      key: 'sourceName',
      header: 'Nguồn',
      width: pixel(130),
      renderCell: (contract) => <MetaCellText value={contract.sourceName} />,
    },
    {
      key: 'taxRatePercent',
      header: 'Thuế',
      width: pixel(70),
      align: 'end',
      renderCell: (contract) => `${contract.taxRatePercent}%`,
    },
    ...MONEY_COLUMNS.map((column) => ({
      key: column.key,
      header: column.label,
      width: pixel(140),
      align: /** @type {const} */ ('end'),
      renderCell: (/** @type {Summary} */ contract) =>
        formatVnd(/** @type {number} */ (contract[column.key])),
    })),
    {
      key: 'paymentDueDate',
      header: 'Tới hạn',
      width: pixel(110),
      renderCell: (contract) =>
        contract.paymentDueDate
          ? formatDisplayDate(contract.paymentDueDate)
          : '—',
    },
    {
      key: 'overdueDays',
      header: 'Quá hạn',
      width: pixel(100),
      align: 'end',
      renderCell: (contract) =>
        contract.overdueDays ? (
          <Token size="sm" color="red" label={`${contract.overdueDays} ngày`} />
        ) : (
          '—'
        ),
    },
  ];

  return (
    <VStack gap={4} hAlign="stretch" height="100%">
      {result && !result.success ? (
        <AdvanceTableErrorBanner message={result.message} />
      ) : null}

      <StackItem size="fill">
        <AdvanceTable
          title={
            <MetaListTitle
              title="Hợp đồng Kế toán"
              count={page?.totalCount}
              unit="hợp đồng"
            />
          }
          isFramed
          isStriped
          primaryAction={{
            label: 'Thêm hợp đồng',
            icon: <Icon icon={Plus} size="sm" />,
            onClick: () => setIsCreateOpen(true),
          }}
          toolbarLabel="Thao tác danh sách hợp đồng"
          searchFieldDefs={SEARCH_FIELD_DEFS}
          entityLabel="Hợp đồng Kế toán"
          exportTitle="Danh sách hợp đồng Kế toán"
          contentSearchFieldKey="contractNumber"
          searchPlaceholder="Tìm trong trang theo số hợp đồng..."
          columnOptions={COLUMN_OPTIONS}
          tableColumns={columns}
          data={contracts}
          idKey="id"
          isLoading={searchQuery.isLoading}
          onRefresh={() => searchQuery.refetch()}
          isRefreshing={searchQuery.isFetching}
          defaultStickyEnd="none"
          pagination={{
            pageIndex,
            pageSize,
            totalCount: page?.totalCount ?? 0,
            totalPages: page?.totalPages ?? 0,
            onPageIndexChange: setPageIndex,
            onPageSizeChange: (size) => {
              setPageSize(size);
              setPageIndex(0);
            },
          }}
          sort={sort}
          onSortChange={(field, direction) =>
            setSort(field ? { field, direction } : null)
          }
          sortableColumnKeys={SORTABLE}
        />
      </StackItem>

      <ContractFormDialog
        isOpen={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        contract={null}
        onSaved={(detail) =>
          router.push(`/accounting/contract/${detail.contract.id}`)
        }
      />
    </VStack>
  );
}
