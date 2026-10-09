'use client';

import { HStack } from '@astryxdesign/core/HStack';
import { Link } from '@astryxdesign/core/Link';
import { Spinner } from '@astryxdesign/core/Spinner';
import { pixel, proportional } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';

import { recordLinkStyles } from '@/shared/components/record-link-style.js';
import { Table } from '@/shared/components/table.jsx';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';

import { formatVnd } from '../config/money.js';
import { useCustomerAccountingContractsQuery } from '../hooks/use-contracts.js';

/** @typedef {import('../types/index.js').AccountingContractSummary} Summary */

/**
 * A customer's Kế toán contracts (số hợp đồng, ngày ký, giá trị quyết toán,
 * đã thanh toán, đã xuất hoá đơn), for the customer detail page's "Hợp
 * đồng" tab. A user without the accounting permission sees the backend's
 * refusal as text.
 * @param {{ customerId: string }} props
 */
export function CustomerAccountingContracts({ customerId }) {
  const query = useCustomerAccountingContractsQuery(customerId);
  const contracts = query.data?.success ? query.data.data.items : [];

  /** @type {import('@astryxdesign/core/Table').TableColumn<Summary & Record<string, unknown>>[]} */
  const columns = [
    {
      key: 'contractNumber',
      header: 'Số hợp đồng',
      width: proportional(1.2, { minWidth: 180 }),
      renderCell: (contract) => (
        <Link
          href={`/accounting/contract/${contract.id}`}
          xstyle={recordLinkStyles.link}
        >
          {contract.contractNumber}
        </Link>
      ),
    },
    {
      key: 'signedDate',
      header: 'Ngày ký',
      width: pixel(130),
      renderCell: (contract) => formatDisplayDate(contract.signedDate),
    },
    {
      key: 'settlementValue',
      header: 'Giá trị quyết toán',
      width: pixel(190),
      align: 'end',
      renderCell: (contract) => (
        <Text weight="bold" hasTabularNumbers>
          {formatVnd(contract.settlementValue)} VND
        </Text>
      ),
    },
    {
      key: 'paidValue',
      header: 'Đã thanh toán',
      width: pixel(190),
      align: 'end',
      renderCell: (contract) => (
        <Text
          color={/** @type {any} */ ('meta-success')}
          weight="bold"
          hasTabularNumbers
        >
          {formatVnd(contract.paidValue)} VND
        </Text>
      ),
    },
    {
      key: 'invoicedValue',
      header: 'Đã xuất hoá đơn',
      width: pixel(190),
      align: 'end',
      renderCell: (contract) => (
        <Text hasTabularNumbers>{formatVnd(contract.invoicedValue)} VND</Text>
      ),
    },
  ];

  return (
    <VStack gap={3} hAlign="stretch">
      <Text weight="semibold">Hợp đồng Kế toán</Text>
      {query.isLoading ? (
        <HStack hAlign="center" paddingBlock={4}>
          <Spinner label="Đang tải hợp đồng Kế toán" />
        </HStack>
      ) : query.data && !query.data.success ? (
        <Text color="secondary">{query.data.message}</Text>
      ) : (
        // The Astryx table bleeds 24px past itself (negative margins); the
        // padding gives that back so it neither covers the title above nor
        // is covered by the next list below.
        <VStack hAlign="stretch" paddingBlock={6}>
          <Table
            data={contracts}
            columns={columns}
            idKey="id"
            density="compact"
            dividers="rows"
            emptyState={
              <Text color="secondary">
                Khách hàng này chưa có hợp đồng Kế toán nào.
              </Text>
            }
          />
        </VStack>
      )}
    </VStack>
  );
}
