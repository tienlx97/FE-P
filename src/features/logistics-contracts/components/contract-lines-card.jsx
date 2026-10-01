'use client';

import { pixel, proportional } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import * as stylex from '@stylexjs/stylex';
import { Package } from 'lucide-react';

import { MetaShipmentSection } from '@/shared/components/custom/meta/index.js';
import { TanStackDataTable } from '@/shared/components/tanstack-data-table.jsx';

import { formatMoney, formatQuantity } from '../config/currencies.js';

const styles = stylex.create({
  overshipped: { color: colorVars['--color-error'] },
});

/**
 * "Danh mục hàng hóa" on the contract overview: every goods line with the
 * quantity its shipments carry and what is left (GET contract by id fills
 * `shippedQuantity` / `remainingQuantity`; remaining goes negative on
 * overshipment).
 * @param {{ contract: import('../types/index.js').Contract }} props
 */
export function ContractLinesCard({ contract }) {
  const lines = contract.lines ?? [];

  /** @type {import('@/shared/components/advance-table.jsx').AdvanceTableColumn<import('../types/index.js').ContractLine>[]} */
  const columns = [
    {
      key: 'description',
      header: 'Hàng hóa',
      width: proportional(3),
      renderCell: (line) => <Text weight="semibold">{line.description}</Text>,
    },
    {
      key: 'hsCode',
      header: 'HS code',
      width: pixel(128),
      renderCell: (line) => line.hsCode ?? '—',
    },
    {
      key: 'quantity',
      header: 'Số lượng',
      width: pixel(128),
      align: 'end',
      renderCell: (line) => `${formatQuantity(line.quantity)} ${line.unit}`,
    },
    {
      key: 'amount',
      header: 'Thành tiền',
      width: pixel(160),
      align: 'end',
      renderCell: (line) => formatMoney(line.amount, contract.currency),
    },
    {
      key: 'shippedQuantity',
      header: 'Đã xuất',
      width: pixel(120),
      align: 'end',
      renderCell: (line) => formatQuantity(line.shippedQuantity),
    },
    {
      key: 'remainingQuantity',
      header: 'Còn lại',
      width: pixel(120),
      align: 'end',
      renderCell: (line) => (
        <Text
          weight="semibold"
          xstyle={(line.remainingQuantity ?? 0) < 0 && styles.overshipped}
        >
          {formatQuantity(line.remainingQuantity)}
        </Text>
      ),
    },
  ];

  return (
    <MetaShipmentSection
      icon={Package}
      title="Danh mục hàng hóa"
      subtitle={
        lines.length > 0
          ? `Tổng thành tiền ${formatMoney(contract.linesTotal ?? 0, contract.currency)}`
          : undefined
      }
    >
      <TanStackDataTable
        data={lines}
        columns={columns}
        idKey="id"
        density="compact"
        dividers="rows"
        ariaLabel="Danh mục hàng hóa của hợp đồng"
        emptyState={
          <Text color="secondary">Hợp đồng chưa có danh mục hàng hóa.</Text>
        }
      />
    </MetaShipmentSection>
  );
}
