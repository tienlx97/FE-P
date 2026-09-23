'use client';

import { Card } from '@astryxdesign/core/Card';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Selector } from '@astryxdesign/core/Selector';
import { pixel, proportional, Table } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import * as stylex from '@stylexjs/stylex';
import {
  Anchor,
  CircleCheck,
  Eye,
  Package,
  Pencil,
  Search,
  Ship,
  Warehouse,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { TextInput } from '@/shared/components/text-input.jsx';

/**
 * Maritime theme — "Dạng Bảng" view of the Shipment tab: a quick-filter bar
 * (search, FCL/LCL toggle, status select, totals) above an Astryx `Table`,
 * built from the Figma frame `Background+Border` (node 42:3901). Rows come
 * from the same `shipments` array the card view renders.
 * @param {{
 *   shipments: any[],
 *   contractCode?: string,
 *   currency?: string,
 *   onView?: (id: string) => void,
 *   onEdit?: (id: string) => void,
 * }} props
 */
export function MaritimeShipmentTableView({
  shipments,
  contractCode = 'CT-2024/EXP-088',
  currency = 'USD',
  onView,
  onEdit,
}) {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('all');
  const [status, setStatus] = useState('all');

  const fcl = shipments.filter((s) => s.kind === 'fcl').length;
  const symbol = currency === 'USD' ? '$' : '';
  const statusOptions = useMemo(
    () => [
      { value: 'all', label: 'Tất cả trạng thái' },
      // One option per distinct status — lots commonly share a status, and
      // duplicate option values collide as React keys.
      ...[...new Set(shipments.map((s) => s.status.label))].map((label) => ({
        value: label,
        label,
      })),
    ],
    [shipments],
  );

  const rows = shipments.filter((s) => {
    const q = query.trim().toLowerCase();
    return (
      (kind === 'all' || s.kind === kind) &&
      (status === 'all' || s.status.label === status) &&
      (!q || `${s.code} ${s.status.label}`.toLowerCase().includes(q))
    );
  });
  const totalUsd = rows.reduce(
    (sum, s) => sum + Number(String(s.value.usd).replace(/,/g, '')),
    0,
  );

  const totals = {
    usd: totalUsd,
    vnd: rows.reduce((sum, s) => sum + toNumber(s.value.vnd), 0),
    cost: rows.reduce((sum, s) => sum + toNumber(s.costs.total), 0),
    vgm: rows.reduce((sum, s) => sum + parseFloat(s.table.vgm), 0),
    conts: rows.filter((s) => s.kind === 'fcl').length,
    pieces: rows
      .filter((s) => s.kind === 'lcl')
      .reduce((sum, s) => sum + parseInt(s.table.quantity, 10), 0),
  };
  const data = rows.length ? [...rows, { id: '__total', isTotal: true }] : rows;

  /** @type {import('@astryxdesign/core/Table').TableColumn<any>[]} */
  const columns = [
    {
      key: 'declDate',
      header: 'NGÀY KHAI HẢI QUAN',
      width: proportional(1.62),
      renderCell: (row) =>
        row.isTotal ? (
          <Cell>
            <Text color="maritime-subtle">{`${rows.length} Tờ khai`}</Text>
          </Cell>
        ) : (
          <Cell>
            <Text type="code" weight="bold">
              {row.table.declDate}
            </Text>
          </Cell>
        ),
    },
    {
      key: 'code',
      header: 'MÃ LÔ HÀNG',
      width: proportional(2.15),
      renderCell: (row) =>
        row.isTotal ? (
          <Cell>
            <Text weight="bold">{`Tổng ${rows.length} lô`}</Text>
          </Cell>
        ) : (
          <Cell>
            <Text type="code" weight="bold">
              {row.code}
            </Text>
          </Cell>
        ),
    },
    {
      key: 'contract',
      header: 'SỐ HỢP ĐỒNG',
      width: proportional(1.59),
      renderCell: (row) => (
        <Cell>
          <Text type="code" weight="semibold" color="accent">
            {row.isTotal ? '1 Hợp đồng' : contractCode}
          </Text>
        </Cell>
      ),
    },
    {
      key: 'quantity',
      header: 'SỐ LƯỢNG',
      width: proportional(1.47),
      renderCell: (row) => (
        <Cell>
          <Text weight="bold">
            {row.isTotal
              ? [
                  totals.conts ? `${totals.conts} Cont` : '',
                  totals.pieces ? `${totals.pieces} Kiện` : '',
                ]
                  .filter(Boolean)
                  .join(' + ')
              : row.table.quantity}
          </Text>
        </Cell>
      ),
    },
    {
      key: 'status',
      header: 'TÌNH TRẠNG',
      width: proportional(2.9),
      renderCell: (row) =>
        row.isTotal ? (
          <Cell>
            <HStack gap={1} vAlign="center" wrap="nowrap">
              <Icon
                icon={CircleCheck}
                size="xsm"
                color={/** @type {any} */ ('maritime-teal')}
              />
              <Text weight="semibold" color="maritime-teal">
                100% Hoàn tất
              </Text>
            </HStack>
          </Cell>
        ) : (
          <Cell>
            <StatusPill status={row.status} />
          </Cell>
        ),
    },
    {
      key: 'usd',
      header: `GIÁ TRỊ TK (${currency})`,
      width: proportional(1.47),
      align: 'end',
      renderCell: (row) => (
        <Cell isEnd>
          {row.isTotal ? (
            <Text type="code" weight="bold" size="xl" color="accent">
              {`${symbol}${totals.usd.toLocaleString('en-US')}`}
            </Text>
          ) : (
            <Text type="code" weight="bold">
              {`${symbol}${row.value.usd}`}
            </Text>
          )}
        </Cell>
      ),
    },
    {
      key: 'vnd',
      header: 'GIÁ TRỊ TK (VNĐ)',
      width: proportional(1.59),
      align: 'end',
      renderCell: (row) => (
        <Cell isEnd>
          <Text type="code" weight="semibold" color="accent">
            {`${row.isTotal ? totals.vnd.toLocaleString('en-US') : row.value.vnd} đ`}
          </Text>
        </Cell>
      ),
    },
    {
      key: 'cost',
      header: 'CHI PHÍ LOGISTICS',
      width: proportional(1.59),
      align: 'end',
      renderCell: (row) => (
        <Cell isEnd>
          <Text
            type="code"
            weight="bold"
            color={row.isTotal ? 'accent' : undefined}
          >
            {`${row.isTotal ? totals.cost.toLocaleString('en-US') : row.costs.total} VNĐ`}
          </Text>
        </Cell>
      ),
    },
    {
      key: 'vgm',
      header: 'KHỐI LƯỢNG',
      width: proportional(1.13),
      align: 'end',
      renderCell: (row) => (
        <Cell isEnd>
          <Text type="code" weight="semibold">
            {row.isTotal ? `${totals.vgm.toFixed(1)} Tấn` : row.table.vgm}
          </Text>
        </Cell>
      ),
    },
    {
      key: 'actions',
      header: 'THAO TÁC',
      width: pixel(120),
      renderCell: (row) =>
        row.isTotal ? null : (
          <HStack gap={1} vAlign="center" wrap="nowrap">
            <IconButton
              label={`Xem ${row.code}`}
              tooltip="Xem"
              icon={<Icon icon={Eye} size="sm" />}
              variant="ghost"
              size="sm"
              onClick={() => onView?.(row.id)}
            />
            <IconButton
              label={`Sửa ${row.code}`}
              tooltip="Sửa"
              icon={<Icon icon={Pencil} size="sm" />}
              variant="ghost"
              size="sm"
              onClick={() => onEdit?.(row.id)}
            />
          </HStack>
        ),
    },
  ];

  const kindFilters = [
    { id: 'all', label: `Tất cả (${shipments.length})` },
    { id: 'fcl', label: `FCL (${fcl})` },
    { id: 'lcl', label: `LCL (${shipments.length - fcl})` },
  ];

  return (
    <Card padding={0} elevation="low" xstyle={styles.card}>
      <HStack
        hAlign="between"
        vAlign="center"
        wrap="wrap"
        gap={4}
        xstyle={styles.filterBar}
      >
        <HStack gap={4} vAlign="center" wrap="wrap">
          <TextInput
            label="Tìm lô hàng"
            isLabelHidden
            size="md"
            value={query}
            onChange={(value) => setQuery(value)}
            placeholder="Lọc mã lô, số B/L, tàu, cảng..."
            startIcon={Search}
            xstyle={styles.search}
          />
          <HStack gap={2} vAlign="center" wrap="nowrap">
            {kindFilters.map((f) => (
              <FilterButton
                key={f.id}
                label={f.label}
                isActive={kind === f.id}
                onClick={() => setKind(f.id)}
              />
            ))}
          </HStack>
          <HStack gap={1.5} vAlign="center" wrap="nowrap">
            <Text color="maritime-subtle">Trạng thái:</Text>
            <Selector
              label="Trạng thái"
              isLabelHidden
              size="md"
              width={280}
              value={status}
              options={statusOptions}
              onChange={(value) => setStatus(value ?? 'all')}
            />
          </HStack>
        </HStack>
        <HStack gap={2} vAlign="center" wrap="nowrap">
          <Text color="maritime-subtle">
            {`Hiển thị ${rows.length} / ${shipments.length} lô hàng`}
          </Text>
          <Text color="maritime-muted">•</Text>
          <Text type="code" weight="semibold" color="accent">
            {`Tổng tờ khai: ${symbol}${totalUsd.toLocaleString('en-US')} ${currency}`}
          </Text>
        </HStack>
      </HStack>
      <Table
        columns={columns}
        data={/** @type {any} */ (data)}
        idKey="id"
        dividers="rows"
        density="spacious"
      />
    </Card>
  );
}

const STATUS_ICONS = {
  ship: Ship,
  anchor: Anchor,
  yard: Warehouse,
  pack: Package,
};

/** @param {string} value */
function toNumber(value) {
  return Number(String(value).replace(/[^\d.]/g, '')) || 0;
}

/** Adds the Figma row height (58px) around a table cell's content. */
/** @param {{ children: import('react').ReactNode, isEnd?: boolean }} props */
function Cell({ children, isEnd }) {
  return (
    <HStack
      vAlign="center"
      hAlign={isEnd ? 'end' : 'start'}
      wrap="nowrap"
      xstyle={styles.cell}
    >
      {children}
    </HStack>
  );
}

/** @param {{ status: { label: string, icon?: keyof typeof STATUS_ICONS, tone: string } }} props */
function StatusPill({ status }) {
  return (
    <HStack
      as="span"
      vAlign="center"
      gap={1}
      wrap="nowrap"
      xstyle={[
        styles.pill,
        /** @type {any} */ (pillTones)[status.tone] ?? pillTones.blue,
      ]}
    >
      {status.icon ? (
        <Icon icon={STATUS_ICONS[status.icon]} size="xsm" color="inherit" />
      ) : null}
      <span {...stylex.props(styles.pillLabel)}>{status.label}</span>
    </HStack>
  );
}

/** @param {{ label: string, isActive: boolean, onClick: () => void }} props */
function FilterButton({ label, isActive, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      {...stylex.props(styles.filterBtn, isActive && styles.filterBtnActive)}
    >
      {label}
    </button>
  );
}

const styles = stylex.create({
  card: { borderColor: 'var(--color-border)', overflow: 'hidden' },
  filterBar: {
    backgroundColor: 'var(--color-background-muted)',
    borderBottomColor: 'var(--color-border)',
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
    padding: 'var(--spacing-4)',
  },
  search: { width: '320px' },
  cell: { minHeight: '58px', width: '100%' },
  pill: {
    borderRadius: 'var(--radius-inner)',
    borderStyle: 'solid',
    borderWidth: '1px',
    paddingBlock: '2px',
    paddingInline: 'var(--spacing-2)',
  },
  pillLabel: {
    color: 'inherit',
    fontSize: '14px',
    fontWeight: 700,
    lineHeight: '20px',
  },
  filterBtn: {
    backgroundColor: 'var(--color-background-card)',
    borderColor: 'var(--color-border)',
    borderRadius: 'var(--radius-inner)',
    borderStyle: 'solid',
    borderWidth: '1px',
    color: 'var(--maritime-badge-neutral-text)',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: 500,
    paddingBlock: 'var(--spacing-1-5)',
    paddingInline: 'var(--spacing-4)',
  },
  filterBtnActive: {
    backgroundColor: 'var(--color-accent)',
    borderColor: 'var(--color-accent)',
    color: 'white',
    fontWeight: 600,
  },
});

const pillTones = stylex.create({
  blue: {
    backgroundColor: 'var(--maritime-chip-bg)',
    borderColor: 'var(--maritime-badge-info-border)',
    color: 'var(--maritime-chip-text)',
  },
  success: {
    backgroundColor: 'var(--maritime-badge-success-bg)',
    borderColor: 'var(--maritime-badge-success-border)',
    color: 'var(--maritime-badge-success-text)',
  },
  warning: {
    backgroundColor: 'var(--maritime-badge-warning-bg)',
    borderColor: 'var(--maritime-badge-warning-border)',
    color: 'var(--maritime-badge-warning-text)',
  },
});
