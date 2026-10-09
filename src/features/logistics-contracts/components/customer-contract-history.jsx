'use client';

import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Link } from '@astryxdesign/core/Link';
import { Spinner } from '@astryxdesign/core/Spinner';
import { pixel, proportional } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Download } from 'lucide-react';

import { recordLinkStyles } from '@/shared/components/record-link-style.js';
import { Table } from '@/shared/components/table.jsx';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';

import { formatMoney } from '../config/currencies.js';
import { useCustomerContractsQuery } from '../hooks/use-contracts-query.js';

/** @param {string | null | undefined} value */
function orDash(value) {
  return value == null || value === '' ? '—' : value;
}

const CSV_BOM = String.fromCharCode(0xfeff);

/**
 * One line of the merged contract table, whichever area it came from.
 * @typedef {object} CustomerContractRow
 * @property {string} id
 * @property {string} href
 * @property {string} contractNumber
 * @property {string} signedDate
 * @property {number} settlementValue
 * @property {number} paidValue
 * @property {number} exportedValue
 * @property {string} currency
 */

/** @param {string} value */
function escapeCsvCell(value) {
  const needsQuoting = /[",\n\r]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuoting ? `"${escaped}"` : escaped;
}

/**
 * "Xuất file" for the contract table — same CSV-with-BOM approach as
 * `AdvanceTable`'s own export (see its doc comment), sized down to this
 * table's fixed columns since it has no column picker of its own.
 * @param {string} customerName
 * @param {CustomerContractRow[]} rows
 */
function exportContractHistoryCsv(customerName, rows) {
  const headerRow = [
    'Mã hợp đồng',
    'Ngày ký',
    'Giá trị quyết toán',
    'Giá trị đã thanh toán',
    'Giá trị đã xuất (hóa đơn)',
  ];
  const dataRows = rows.map((row) => [
    row.contractNumber,
    formatDisplayDate(row.signedDate),
    formatMoney(row.settlementValue, row.currency),
    formatMoney(row.paidValue, row.currency),
    formatMoney(row.exportedValue, row.currency),
  ]);
  const csv = [headerRow, ...dataRows]
    .map((cells) =>
      cells.map((value) => escapeCsvCell(String(value))).join(','),
    )
    .join('\r\n');
  const blob = new Blob([CSV_BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `hop-dong-${customerName}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * "Hợp đồng" — one table of a customer's contracts (mã hợp đồng, ngày ký,
 * giá trị quyết toán / đã thanh toán / đã xuất hoá đơn) + CSV export,
 * shared by `CustomerDetailDialog` (opened from a Contract's Buyer link),
 * `customers-list.jsx`'s inline row-expansion panel and the customer
 * detail page, so every surface shows the same data. The Logistics
 * contracts come from this feature; `extraRows` carries the Kế toán ones
 * (composed by the page — a feature may not import another) into the same
 * table. Each "Mã hợp đồng" links to its own detail page.
 * @param {{
 *   customerId: string,
 *   customerName: string,
 *   extraRows?: { rows: CustomerContractRow[], isLoading?: boolean, message?: string },
 * }} props
 */
export function CustomerContractHistory({
  customerId,
  customerName,
  extraRows,
}) {
  const contractsQuery = useCustomerContractsQuery(customerId);

  const contracts = contractsQuery.data?.success
    ? contractsQuery.data.contracts
    : [];
  // Per-contract settlement / paid / exported values come beside the page.
  const settlementByContractId = new Map(
    (contractsQuery.data?.success ? contractsQuery.data.settlements : []).map(
      (settlement) => [settlement.contractId, settlement],
    ),
  );
  /** @type {CustomerContractRow[]} */
  const logisticsRows = contracts.map((contract) => {
    const settlement = settlementByContractId.get(contract.id);
    return {
      id: `logistics-${contract.id}`,
      href: `/logistics/contract/${contract.id}`,
      contractNumber: contract.contractNumber,
      signedDate: contract.createdDate,
      settlementValue: settlement?.settlementValue ?? 0,
      paidValue: settlement?.paidValue ?? 0,
      exportedValue: settlement?.exportedValue ?? 0,
      currency: contract.currency,
    };
  });
  const rows = [...logisticsRows, ...(extraRows?.rows ?? [])];
  const isLoading = contractsQuery.isLoading || Boolean(extraRows?.isLoading);

  /** @type {import('@astryxdesign/core/Table').TableColumn<CustomerContractRow & Record<string, unknown>>[]} */
  const columns = [
    {
      key: 'contractNumber',
      header: 'Mã hợp đồng',
      width: proportional(1.2, { minWidth: 180 }),
      renderCell: (row) => (
        <Link href={row.href} xstyle={recordLinkStyles.link}>
          {row.contractNumber}
        </Link>
      ),
    },
    {
      key: 'signedDate',
      header: 'Ngày ký',
      width: pixel(130),
      renderCell: (row) => formatDisplayDate(row.signedDate),
    },
    {
      key: 'settlementValue',
      header: 'Giá trị quyết toán',
      width: pixel(190),
      align: 'end',
      renderCell: (row) => (
        <Text weight="bold" hasTabularNumbers>
          {formatMoney(row.settlementValue, row.currency)}
        </Text>
      ),
    },
    {
      key: 'paidValue',
      header: 'Giá trị đã thanh toán',
      width: pixel(190),
      align: 'end',
      renderCell: (row) => (
        <Text
          color={/** @type {any} */ ('meta-success')}
          weight="bold"
          hasTabularNumbers
        >
          {formatMoney(row.paidValue, row.currency)}
        </Text>
      ),
    },
    {
      key: 'exportedValue',
      header: 'Giá trị đã xuất (hóa đơn)',
      width: pixel(210),
      align: 'end',
      renderCell: (row) => (
        <Text hasTabularNumbers>
          {formatMoney(row.exportedValue, row.currency)}
        </Text>
      ),
    },
  ];

  return (
    <VStack gap={3} hAlign="stretch">
      <HStack hAlign="end" vAlign="center">
        <Button
          label="Xuất file"
          variant="secondary"
          size="sm"
          icon={<Icon icon={Download} size="sm" />}
          isDisabled={isLoading || rows.length === 0}
          onClick={() => exportContractHistoryCsv(customerName, rows)}
        />
      </HStack>

      {isLoading ? (
        <HStack hAlign="center" paddingBlock={4}>
          <Spinner label="Đang tải danh sách hợp đồng" />
        </HStack>
      ) : (
        // The Astryx table bleeds 24px past itself; the padding gives that
        // back so it does not cover the button above.
        <VStack hAlign="stretch" paddingBlock={6}>
          <Table
            data={rows}
            columns={columns}
            idKey="id"
            density="compact"
            dividers="rows"
            emptyState={
              <Text color="secondary">
                {extraRows?.message ?? 'Khách hàng này chưa có hợp đồng nào.'}
              </Text>
            }
          />
        </VStack>
      )}
    </VStack>
  );
}
