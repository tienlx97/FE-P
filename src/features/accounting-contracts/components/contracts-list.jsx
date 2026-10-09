'use client';

import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Link } from '@astryxdesign/core/Link';
import { StackItem } from '@astryxdesign/core/Stack';
import { pixel, proportional } from '@astryxdesign/core/Table';
import { Heading, Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Banknote, List, Plus } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import {
  AdvanceTable,
  AdvanceTableErrorBanner,
} from '@/shared/components/advance-table.jsx';
import {
  MetaCellText,
  MetaPill,
  MetaRowActions,
  MetaStatusBadge,
} from '@/shared/components/custom/meta/index.js';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';

import { searchContracts } from '../api/contracts.js';
import {
  buildContractsWorkbook,
  contractsWorkbookFileName,
} from '../config/contracts-workbook.js';
import { formatVnd } from '../config/money.js';
import { useContractsSearchQuery } from '../hooks/use-contracts.js';
import { ContractFormDialog } from './contract-form-dialog.jsx';

/** @typedef {import('../types/index.js').AccountingContractSummary} Summary */

const TOTALS_ID = '__totals__';

/** @satisfies {ReadonlyArray<import('@astryxdesign/core/PowerSearch').FieldDefinition>} */
const SEARCH_FIELD_DEFS = [
  { key: 'contractNumber', type: 'string', label: 'Số hợp đồng' },
  { key: 'projectCode', type: 'string', label: 'Mã công trình' },
  { key: 'projectName', type: 'string', label: 'Tên dự án' },
  { key: 'customerName', type: 'string', label: 'Khách hàng' },
];

/** @type {Array<{ key: 'valueBeforeTax' | 'valueAfterTax' | 'settlementValue' | 'invoicedValue' | 'remainingToInvoice' | 'paidValue' | 'unpaidValue', label: string, tone?: 'success' | 'danger' }>} */
const MONEY_COLUMNS = [
  { key: 'valueBeforeTax', label: 'Trước thuế' },
  { key: 'valueAfterTax', label: 'Sau thuế' },
  { key: 'settlementValue', label: 'Quyết toán' },
  { key: 'paidValue', label: 'Đã thanh toán', tone: 'success' },
  { key: 'unpaidValue', label: 'Chưa thanh toán', tone: 'danger' },
  { key: 'invoicedValue', label: 'Đã xuất HĐ' },
  { key: 'remainingToInvoice', label: 'Còn phải xuất HĐ' },
];

const HEADER_GROUPS = [
  { id: 'codes', label: 'MÃ', columnKeys: ['contractNumber', 'projectCode'] },
  { id: 'dates', label: 'NGÀY', columnKeys: ['paymentDueDate', 'overdueDays'] },
  {
    id: 'value',
    label: 'GIÁ TRỊ',
    columnKeys: [
      'valueBeforeTax',
      'taxRatePercent',
      'valueAfterTax',
      'settlementValue',
    ],
  },
  {
    id: 'payment',
    label: 'THANH TOÁN',
    columnKeys: ['paidValue', 'unpaidValue'],
  },
  {
    id: 'invoice',
    label: 'HOÁ ĐƠN',
    columnKeys: ['invoicedValue', 'remainingToInvoice'],
  },
];

const COLUMN_OPTIONS = [
  { key: 'signedDate', label: 'Ngày ký' },
  { key: 'contractNumber', label: 'Số hợp đồng', isAlwaysVisible: true },
  { key: 'projectCode', label: 'Mã công trình' },
  { key: 'customerName', label: 'Khách hàng' },
  { key: 'projectName', label: 'Dự án' },
  { key: 'sourceName', label: 'Nguồn' },
  { key: 'taxRatePercent', label: 'Thuế' },
  ...MONEY_COLUMNS,
  { key: 'paymentDueDate', label: 'Tới hạn' },
  { key: 'overdueDays', label: 'Quá hạn' },
  { key: 'actions', label: 'Thao tác', isAlwaysVisible: true },
];

const BASIC_COLUMN_KEYS = [
  'contractNumber',
  'projectCode',
  'signedDate',
  'customerName',
  'projectName',
  'sourceName',
  'settlementValue',
  'paymentDueDate',
  'overdueDays',
  'actions',
];

const FINANCIAL_COLUMN_KEYS = [
  'contractNumber',
  'projectCode',
  'signedDate',
  'customerName',
  'valueBeforeTax',
  'taxRatePercent',
  ...MONEY_COLUMNS.filter((column) => column.key !== 'valueBeforeTax').map(
    (column) => column.key,
  ),
  'paymentDueDate',
  'overdueDays',
  'actions',
];

const VIEW_PRESETS = [
  {
    key: 'basic',
    label: 'Cơ bản',
    columnKeys: BASIC_COLUMN_KEYS,
    icon: <Icon icon={List} size="sm" />,
  },
  {
    key: 'financial',
    label: 'Giá trị & Thanh toán',
    columnKeys: FINANCIAL_COLUMN_KEYS,
    icon: <Icon icon={Banknote} size="sm" />,
  },
];

const SORTABLE = [
  'contractNumber',
  'signedDate',
  'projectCode',
  'projectName',
  'valueBeforeTax',
  'paymentDueDate',
];

/** @param {Partial<Summary>} row */
function isTotals(row) {
  return /** @type {any} */ (row).__isTotalsRow === true;
}

/**
 * Σ row of the visible page: every money column summed.
 * @param {Summary[]} rows
 * @returns {Partial<Summary>[]}
 */
function totalsOf(rows) {
  if (rows.length === 0) return [];
  /** @type {Partial<Summary>} */
  const totals = /** @type {Partial<Summary>} */ ({
    id: TOTALS_ID,
    __isTotalsRow: true,
  });
  for (const column of MONEY_COLUMNS) {
    totals[column.key] = rows.reduce(
      (sum, row) => sum + (row[column.key] ?? 0),
      0,
    );
  }
  return [totals];
}

/**
 * Contract list of the Kế toán area, with the Logistics contract list's
 * chrome: heading + count badge, "Cơ bản" / "Giá trị & Thanh toán" column
 * presets, Σ row, pinned Ngày ký + Số hợp đồng and a pinned "Thao tác"
 * column (Xem / Sửa). Paged and sorted on the server; every value is the
 * backend's.
 */
export function AccountingContractsList() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialView =
    searchParams.get('tab') === 'financial' ? 'financial' : 'basic';
  const initialColumns =
    initialView === 'financial' ? FINANCIAL_COLUMN_KEYS : BASIC_COLUMN_KEYS;
  /** @param {string} key */
  function changeView(key) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', key);
    router.replace(`${pathname}?${params}`, { scroll: false });
  }
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(100);
  const [sort, setSort] = useState(
    /** @type {{ field: string, direction: 'Ascending' | 'Descending' } | null} */ (
      null
    ),
  );
  const [form, setForm] = useState(
    /** @type {{ isOpen: boolean, contract: Summary | null }} */ ({
      isOpen: false,
      contract: null,
    }),
  );

  /** Every contract, page by page, in the list's current sort (the backend caps a page). */
  async function fetchAllContracts() {
    /** @type {Summary[]} */
    const all = [];
    for (let page = 1, totalPages = 1; page <= totalPages; page += 1) {
      const result = await searchContracts({ page, pageSize: 500, sort });
      if (!result.success) throw new Error(result.message);
      all.push(...result.data.items);
      totalPages = result.data.totalPages;
    }
    return /** @type {(Summary & Record<string, unknown>)[]} */ (all);
  }

  const searchQuery = useContractsSearchQuery({
    page: pageIndex + 1,
    pageSize,
    sort,
  });
  const result = searchQuery.data;
  const page = result?.success ? result.data : null;
  const contracts = page?.items ?? [];

  /** @type {import('@/shared/components/advance-table.jsx').AdvanceTableColumn<Summary & Record<string, unknown>>[]} */
  const columns = [
    {
      key: 'signedDate',
      header: 'Ngày ký',
      width: pixel(150),
      renderCell: (c) =>
        isTotals(c) ? null : (
          <Text hasTabularNumbers>{formatDisplayDate(c.signedDate)}</Text>
        ),
    },
    {
      key: 'contractNumber',
      header: 'Hợp đồng',
      width: pixel(210),
      filter: 'contractNumber',
      renderCell: (c) =>
        isTotals(c) ? null : (
          <Link href={`/accounting/contract/${c.id}`}>
            <Text weight="bold" color="accent">
              {c.contractNumber}
            </Text>
          </Link>
        ),
    },
    {
      key: 'projectCode',
      header: 'Công trình',
      width: pixel(200),
      filter: 'projectCode',
      renderCell: (c) =>
        isTotals(c) ? null : <Text weight="semibold">{c.projectCode}</Text>,
    },
    {
      key: 'customerName',
      header: 'Khách hàng',
      width: proportional(1.6, { minWidth: 240 }),
      filter: 'customerName',
      renderCell: (c) =>
        isTotals(c) ? null : <MetaCellText value={c.customerName} />,
    },
    {
      key: 'projectName',
      header: 'Dự án',
      width: proportional(1.6, { minWidth: 240 }),
      filter: 'projectName',
      renderCell: (c) => (isTotals(c) ? null : c.projectName),
    },
    {
      key: 'sourceName',
      header: 'Nguồn',
      width: pixel(200),
      renderCell: (c) =>
        isTotals(c) ? null : <MetaCellText value={c.sourceName} />,
    },
    ...MONEY_COLUMNS.flatMap((column) => [
      ...(column.key === 'valueAfterTax'
        ? [
            {
              key: 'taxRatePercent',
              header: 'Thuế',
              width: pixel(80),
              align: /** @type {const} */ ('end'),
              renderCell: (/** @type {Summary} */ c) =>
                isTotals(c) ? null : `${c.taxRatePercent}%`,
            },
          ]
        : []),
      {
        key: column.key,
        header: column.tone ? (
          <Text
            color={
              column.tone === 'success'
                ? /** @type {any} */ ('meta-success')
                : /** @type {any} */ ('meta-danger')
            }
          >
            {column.label}
          </Text>
        ) : column.key === 'settlementValue' && initialView === 'basic' ? (
          'Giá trị Quyết toán'
        ) : (
          column.label
        ),
        width: proportional(1, { minWidth: 210 }),
        align: /** @type {const} */ ('end'),
        exportValue: (/** @type {Summary} */ c) => c[column.key],
        renderCell: (/** @type {Summary} */ c) => (
          <Text
            hasTabularNumbers
            weight={
              isTotals(c) || column.key === 'settlementValue'
                ? 'bold'
                : undefined
            }
            color={
              column.tone === 'success'
                ? /** @type {any} */ ('meta-success')
                : column.tone === 'danger'
                  ? /** @type {any} */ ('meta-danger')
                  : undefined
            }
          >
            {formatVnd(c[column.key])}
          </Text>
        ),
      },
    ]),
    {
      key: 'paymentDueDate',
      header: 'Tới hạn',
      width: pixel(150),
      renderCell: (c) =>
        isTotals(c) ? null : (
          <Text hasTabularNumbers>
            {c.paymentDueDate ? formatDisplayDate(c.paymentDueDate) : '—'}
          </Text>
        ),
    },
    {
      key: 'overdueDays',
      header: 'Quá hạn',
      width: pixel(150),
      renderCell: (c) =>
        isTotals(c) ? null : c.overdueDays ? (
          <MetaPill label={`${c.overdueDays} ngày`} tone="danger" hasDot />
        ) : (
          <Text color="secondary">—</Text>
        ),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      width: pixel(96),
      align: 'end',
      renderCell: (c) =>
        isTotals(c) ? null : (
          <MetaRowActions
            recordLabel={c.contractNumber}
            onView={() => router.push(`/accounting/contract/${c.id}`)}
            onEdit={() => setForm({ isOpen: true, contract: c })}
          />
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
            <HStack gap={2} vAlign="center" wrap="wrap">
              <Heading level={1}>Danh sách hợp đồng</Heading>
              <MetaStatusBadge
                label={`${page?.totalCount ?? 0} hợp đồng`}
                tone="accent"
                hasBorder
              />
            </HStack>
          }
          viewPresets={VIEW_PRESETS}
          viewPresetsInHeader
          initialViewPresetKey={initialView}
          onViewPresetChange={changeView}
          initialColumnKeys={initialColumns}
          defaultColumnKeys={BASIC_COLUMN_KEYS}
          isFramed
          isStriped
          dividers="rows"
          primaryAction={{
            label: 'Tạo hợp đồng mới',
            icon: <Icon icon={Plus} size="sm" />,
            onClick: () => setForm({ isOpen: true, contract: null }),
          }}
          toolbarLabel="Thao tác danh sách hợp đồng"
          searchFieldDefs={SEARCH_FIELD_DEFS}
          entityLabel="Hợp đồng Kế toán"
          exportTitle="Danh sách hợp đồng Kế toán"
          exportWorkbook={(ExcelJS, input) =>
            buildContractsWorkbook(ExcelJS, {
              ...input,
              rows: /** @type {Summary[]} */ (input.rows),
            })
          }
          exportFileName={contractsWorkbookFileName}
          fetchAllRows={fetchAllContracts}
          itemLabel="hợp đồng"
          contentSearchFieldKey="contractNumber"
          searchPlaceholder="Tìm nhanh theo số hợp đồng, mã công trình, khách hàng..."
          columnOptions={COLUMN_OPTIONS}
          headerGroups={
            initialView === 'financial'
              ? HEADER_GROUPS
              : HEADER_GROUPS.filter((group) => group.id === 'codes')
          }
          tableColumns={columns}
          data={contracts}
          idKey="id"
          totalsRows={(visibleRows) =>
            totalsOf(/** @type {Summary[]} */ (visibleRows))
          }
          totalsRowLabel={() => (
            <HStack gap={2} vAlign="center" wrap="nowrap">
              <Text size="lg" weight="bold" color="accent">
                Σ
              </Text>
              <Text weight="bold" color="accent">
                {contracts.length}
              </Text>
            </HStack>
          )}
          defaultStickyStart="two"
          fixedEndColumnKeys={['actions']}
          isLoading={searchQuery.isLoading}
          onRefresh={() => searchQuery.refetch()}
          isRefreshing={searchQuery.isFetching}
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
        isOpen={form.isOpen}
        onOpenChange={(isOpen) =>
          setForm((current) => ({ ...current, isOpen }))
        }
        contract={form.contract}
        onSaved={(detail) => {
          if (!form.contract)
            router.push(`/accounting/contract/${detail.contract.id}`);
        }}
      />
    </VStack>
  );
}
