'use client';

import { Card } from '@astryxdesign/core/Card';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { pixel } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import * as stylex from '@stylexjs/stylex';
import { Anchor, Eye, Package, Pencil, Ship, Warehouse } from 'lucide-react';

import { MetaPill } from '@/shared/components/custom/meta/index.js';
import { TanStackDataTable } from '@/shared/components/tanstack-data-table.jsx';

const NUMBER = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
const MONEY = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

/** @type {Record<string, {label: string, icon: import('react').ComponentType<any>, tone: 'accent' | 'success'}>} */
const STATUS_PRESENTATION = {
  Shipping: { label: 'Đang trên biển (Shipping)', icon: Ship, tone: 'accent' },
  DeliveredToPort: { label: 'Đã cập cảng đích (DeliveredToPort)', icon: Anchor, tone: 'success' },
  AtYardAwaitingExport: { label: 'Chờ hạ bãi xuất khẩu (AtYardAwaitingExport)', icon: Warehouse, tone: 'accent' },
  Packing: { label: 'Đang đóng hàng', icon: Package, tone: 'accent' },
};

const styles = stylex.create({
  frame: { borderColor: 'var(--meta-surface-container-high)', overflow: 'hidden' },
  cell: { fontSize: 'var(--font-size-base)', whiteSpace: 'nowrap' },
  actionRow: { justifyContent: 'center' },
  headerCell: {
    backgroundColor: 'var(--meta-surface-container-low)',
    borderBlockEndColor: 'var(--meta-surface-container-high)',
    borderInlineEndWidth: 0,
    fontSize: 'var(--font-size-base)',
    paddingBlock: 'var(--spacing-4)',
  },
  headerContent: { fontSize: 'var(--font-size-base)' },
  bodyCell: { paddingBlock: 'var(--spacing-5)' },
  totalsRow: { backgroundColor: 'var(--meta-surface-container-low)' },
  totalsCell: { paddingBlock: 'var(--spacing-4)' },
});

/** @param {{ shipments: any[], contractNumber: string, declarationCurrency: string, onEdit: (id: string) => void, onView?: (id: string) => void }} props */
export function ContractShipmentsTable({ shipments, contractNumber, declarationCurrency, onEdit, onView }) {
  const byUnit = new Map();
  for (const row of shipments) {
    const { quantityUnit, quantityAmount } = row.table;
    byUnit.set(quantityUnit, (byUnit.get(quantityUnit) ?? 0) + quantityAmount);
  }
  const total = {
    id: '__shipment_totals',
    __isTotalsRow: true,
    table: {
      declarationCount: shipments.filter((row) => row.table.hasDeclaration).length,
      quantity: [...byUnit].map(([unit, amount]) => `${NUMBER.format(amount)} ${unit}`).join(' + '),
      completedCount: shipments.filter((row) => row.table.status === 'Completed').length,
      declarationValue: shipments.reduce((sum, row) => sum + row.table.declarationValue, 0),
      declarationValueVnd: shipments.reduce((sum, row) => sum + row.table.declarationValueVnd, 0),
      logisticsCost: shipments.reduce((sum, row) => sum + row.table.logisticsCost, 0),
      vgmKg: shipments.reduce((sum, row) => sum + row.table.vgmKg, 0),
    },
  };
  /** @param {any} row */
  const isTotal = (row) => Boolean(row.__isTotalsRow);
  /** @param {import('react').ReactNode} content @param {boolean} [bold] */
  const cell = (content, bold = false) => (
    <Text as="span" size="base" weight={bold ? 'bold' : undefined} hasTabularNumbers xstyle={styles.cell}>
      {content}
    </Text>
  );
  /** @type {import('@/shared/components/advance-table.jsx').AdvanceTableColumn<any>[]} */
  const columns = [
    { key: 'declarationDate', header: 'NGÀY KHAI HẢI QUAN', width: pixel(196), renderCell: (row) => isTotal(row) ? <Text as="span" size="base" weight="bold" color="secondary">{row.table.declarationCount} TỜ KHAI</Text> : cell(row.table.declDate) },
    { key: 'code', header: 'MÃ LÔ HÀNG', width: pixel(186), renderCell: (row) => isTotal(row) ? cell(`Tổng ${shipments.length} lô`, true) : cell(row.code, true) },
    { key: 'contract', header: 'SỐ HỢP ĐỒNG', width: pixel(147), renderCell: (row) => cell(isTotal(row) ? `${shipments.length ? 1 : 0} Hợp đồng` : contractNumber, isTotal(row)) },
    { key: 'quantity', header: 'SỐ LƯỢNG', width: pixel(151), renderCell: (row) => isTotal(row) ? cell(row.table.quantity || '—', true) : <MetaPill label={row.table.quantity} tone="neutral" size="lg" /> },
    { key: 'status', header: 'TÌNH TRẠNG', width: pixel(345), renderCell: (row) => {
      if (isTotal(row)) {
        const percent = shipments.length ? Math.round(row.table.completedCount / shipments.length * 100) : 0;
        return <MetaPill label={`${percent}% Hoàn tất`} tone="success" size="lg" />;
      }
      const presentation = STATUS_PRESENTATION[row.table.status];
      return <MetaPill label={presentation?.label ?? row.status.label} icon={presentation?.icon} tone={presentation?.tone ?? (row.status.tone === 'success' ? 'success' : row.status.tone === 'neutral' ? 'neutral' : 'accent')} size="lg" />;
    } },
    { key: 'value', header: `GIÁ TRỊ TK (${declarationCurrency})`, width: pixel(148), align: 'end', renderCell: (row) => cell(`${declarationCurrency === 'USD' ? '$' : ''}${MONEY.format(row.table.declarationValue)}`, true) },
    { key: 'vnd', header: 'GIÁ TRỊ TK (VNĐ)', width: pixel(149), align: 'end', renderCell: (row) => cell(`${MONEY.format(row.table.declarationValueVnd)} đ`, isTotal(row)) },
    { key: 'cost', header: 'CHI PHÍ LOGISTICS', width: pixel(161), align: 'end', renderCell: (row) => <Text as="span" size="base" weight={isTotal(row) ? 'bold' : 'semibold'} color="accent" hasTabularNumbers xstyle={styles.cell}>{MONEY.format(row.table.logisticsCost)} VNĐ</Text> },
    { key: 'vgm', header: 'VGM', width: pixel(112), align: 'end', renderCell: (row) => cell(isTotal(row) ? row.table.vgmKg ? `${NUMBER.format(row.table.vgmKg / 1000)} Tấn` : '—' : row.table.vgm, isTotal(row)) },
    { key: 'actions', header: 'THAO TÁC', width: pixel(111), align: 'center', renderCell: (row) => isTotal(row) ? cell('—') : <HStack gap={0} xstyle={styles.actionRow}><IconButton label={`Xem ${row.code}`} icon={<Icon icon={Eye} size="sm" />} variant="ghost" size="sm" onClick={() => onView?.(row.id)} /><IconButton label={`Sửa ${row.code}`} icon={<Icon icon={Pencil} size="sm" />} variant="ghost" size="sm" onClick={() => onEdit(row.id)} /></HStack> },
  ];
  return (
    <Card padding={0} elevation="none" xstyle={styles.frame}>
      <TanStackDataTable data={shipments.length ? [...shipments, total] : []} columns={columns} idKey="id" density="balanced" dividers="rows" totalsPosition="bottom" ariaLabel="Danh sách lô hàng" headerCellXstyle={styles.headerCell} headerContentXstyle={styles.headerContent} bodyCellXstyle={styles.bodyCell} totalsRowXstyle={styles.totalsRow} totalsCellXstyle={styles.totalsCell} emptyState={<Text color="secondary">Chưa có lô hàng.</Text>} />
    </Card>
  );
}
