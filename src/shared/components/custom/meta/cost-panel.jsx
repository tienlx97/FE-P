'use client';

import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Markdown } from '@astryxdesign/core/Markdown';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import {
  TableBody,
  TableCell,
  TableFooter,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from '@astryxdesign/core/Table';
import { Heading, Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { Download, Info, Pencil, Plus, Trash2 } from 'lucide-react';
import { Fragment } from 'react';

import { Table } from '@/shared/components/table.jsx';

import { MetaCountBadge } from './count-badge.jsx';
import { MetaInfoTip } from './info-tip.jsx';
import { MetaPill } from './pill.jsx';

/**
 * @typedef {{
 *   id: string,
 *   no: string,
 *   name: string,
 *   quantity: string,
 *   unitPrice: string,
 *   amount: string,
 *   nature: 'Standard' | 'Abnormal',
 *   note: string | null,
 *   provider: string | null,
 *   paidOnBehalf?: boolean,
 *   payee?: string | null,
 *   invoiceNumber: string | null,
 *   invoiceDate: string | null,
 * }} MetaCostRow
 * @typedef {{
 *   id: string,
 *   label: string,
 *   code?: string,
 *   nameVi?: string,
 *   nameEn?: string,
 *   subtotal: string,
 *   rows: MetaCostRow[],
 * }} MetaCostGroup
 * @typedef {{
 *   lines: string,
 *   amount: string,
 *   abnormal: string,
 *   providers: string,
 *   invoices: string,
 *   paidOnBehalf?: string,
 * }} MetaCostTotals
 */

/**
 * `[key, header, align]` — Figma 124:9687 header row, without "Nhóm chi
 * phí" (the group title row already names it) and with Nhà cung cấp /
 * Hoá đơn before Ghi chú (user, 2026-10-08), as in the Excel export.
 */
const COLUMNS = /** @type {const} */ ([
  ['no', 'STT', 'center'],
  ['name', 'Tên khoản chi phí', 'start'],
  ['quantity', 'Số lượng', 'end'],
  ['unitPrice', 'Đơn giá (VNĐ)', 'end'],
  ['amount', 'Thành tiền (VNĐ)', 'end'],
  ['nature', 'Cost Nature', 'start'],
  ['provider', 'Nhà cung cấp', 'start'],
  ['invoice', 'Hoá đơn', 'start'],
  ['note', 'Ghi chú', 'start'],
  ['actions', 'Thao tác', 'center'],
]);

/**
 * "Meta" shipment-detail "Chi phí logistics" tab — Figma node 124:9667:
 * one full-width card with an accent-bar title + count, "Thêm chi phí"
 * and the Abnormal / total summary; a full-grid table where each LOG-01 …
 * LOG-08 group row (tinted, with its subtotal and a "+" to add a line to
 * that group) is followed by its cost lines; a tinted "Σ Tổng cộng" footer
 * and a helper note. Values arrive formatted; the feature owns data and
 * dialogs. Composed from Astryx `Card` / `Table` / `Button` / `IconButton`
 * / `Skeleton` + `MetaPill` / `MetaCountBadge` (golden rule #15).
 *
 * @param {{
 *   count: number,
 *   abnormalTotal: string,
 *   paidOnBehalfTotal?: string | null,
 *   total: string,
 *   groups: MetaCostGroup[],
 *   totals: MetaCostTotals | null,
 *   shipmentCode: string,
 *   isLoading?: boolean,
 *   isReadOnly?: boolean,
 *   isExporting?: boolean,
 *   onExport?: () => void,
 *   onCreate?: () => void,
 *   onCreateInGroup?: (groupId: string) => void,
 *   onEdit?: (id: string) => void,
 *   onDelete?: (id: string) => void,
 * }} props
 */
export function MetaCostPanel({
  count,
  abnormalTotal,
  paidOnBehalfTotal = null,
  total,
  groups,
  totals,
  shipmentCode,
  isLoading = false,
  isReadOnly = false,
  isExporting = false,
  onExport,
  onCreate,
  onCreateInGroup,
  onEdit,
  onDelete,
}) {
  return (
    <Card padding={0} xstyle={styles.card}>
      <VStack gap={0} hAlign="stretch">
        <HStack
          hAlign="between"
          vAlign="center"
          gap={3}
          wrap="wrap"
          xstyle={styles.header}
        >
          <HStack gap={3} vAlign="center">
            <HStack as="span" xstyle={styles.titleBar} />
            <Heading level={3} accessibilityLevel={2}>
              Chi phí Logistics
            </Heading>
            <MetaCountBadge value={count} />
          </HStack>
          <HStack gap={4} vAlign="center" wrap="wrap">
            <HStack gap={3} vAlign="center" wrap="wrap">
              <Text size="sm" color="secondary">
                Trong đó Abnormal:{' '}
                <Text
                  as="span"
                  size="sm"
                  weight="semibold"
                  color="meta-amber"
                  hasTabularNumbers
                >
                  {abnormalTotal}
                </Text>
              </Text>
              {paidOnBehalfTotal ? (
                <>
                  <HStack as="span" xstyle={styles.divider} />
                  <Text size="sm" color="secondary">
                    NCC chi hộ:{' '}
                    <Text
                      as="span"
                      size="sm"
                      weight="semibold"
                      hasTabularNumbers
                    >
                      {paidOnBehalfTotal}
                    </Text>
                  </Text>
                </>
              ) : null}
              <HStack as="span" xstyle={styles.divider} />
              <Text size="sm" weight="semibold">
                Tổng chi phí:{' '}
                <Text
                  as="span"
                  size="sm"
                  weight="semibold"
                  color="accent"
                  hasTabularNumbers
                >
                  {total}
                </Text>
              </Text>
            </HStack>
            {onExport ? (
              <Button
                label="Xuất Excel"
                variant="secondary"
                isDisabled={isLoading || count === 0}
                isLoading={isExporting}
                icon={<Icon icon={Download} size="sm" />}
                onClick={onExport}
              />
            ) : null}
            {onCreate ? (
              <Button
                label="Thêm chi phí"
                variant="primary"
                isDisabled={isReadOnly || isLoading}
                icon={<Icon icon={Plus} size="sm" />}
                onClick={onCreate}
              />
            ) : null}
          </HStack>
        </HStack>

        {isLoading ? (
          [0, 1, 2, 3].map((index) => (
            <HStack
              key={index}
              gap={6}
              vAlign="center"
              xstyle={styles.skeletonRow}
            >
              <Skeleton width="20%" height="var(--spacing-4)" index={index} />
              <Skeleton width="15%" height="var(--spacing-4)" index={index} />
              <Skeleton width="10%" height="var(--spacing-4)" index={index} />
              <Skeleton width="30%" height="var(--spacing-4)" index={index} />
            </HStack>
          ))
        ) : (
          <Table
            density="compact"
            dividers="grid"
            xstyle={styles.table}
            scrollWrapper={CostTableScrollRegion}
          >
            <TableHeader xstyle={styles.stickyHeader}>
              <TableRow isHeaderRow>
                {COLUMNS.map(([key, header, align]) => (
                  <TableHeaderCell
                    key={key}
                    scope="col"
                    data-meta-cost-pinned={
                      key === 'no' ||
                      key === 'name' ||
                      key === 'actions'
                        ? ''
                        : undefined
                    }
                    xstyle={[
                      styles.headCell,
                      alignStyles[align],
                      columnWidths[key],
                      ...pinnedCell(key, 'header'),
                    ]}
                  >
                    <Text
                      size="sm"
                      weight="semibold"
                      color="secondary"
                      xstyle={styles.headLabel}
                    >
                      {header}
                    </Text>
                  </TableHeaderCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((group) => (
                <Fragment key={group.id}>
                  <TableRow xstyle={[styles.groupRow]}>
                    {/* The title spans STT and Tên khoản chi phí so the
                        group name has room (user, 2026-10-07). */}
                    <TableCell
                      colSpan={2}
                      xstyle={[
                        styles.cell,
                        styles.pinGroupTitle,
                        styles.pinGroupSurface,
                      ]}
                    >
                      <HStack
                        gap={2}
                        vAlign="center"
                        hAlign="start"
                        wrap="nowrap"
                      >
                        <Text
                          size="sm"
                          weight="bold"
                          color="accent"
                          xstyle={styles.groupLabel}
                        >
                          {group.label}
                        </Text>
                        {group.nameVi ? (
                          <MetaInfoTip
                            eyebrow={group.code}
                            title={group.nameVi}
                            description={group.nameEn}
                            label={`${group.label}: ${group.nameVi}`}
                          />
                        ) : null}
                        {onCreateInGroup ? (
                          <IconButton
                            isDisabled={isReadOnly}
                            label={`Thêm chi phí vào ${group.label}`}
                            tooltip="Thêm chi phí vào nhóm"
                            icon={<Icon icon={Plus} size="sm" />}
                            variant="ghost"
                            size="sm"
                            xstyle={styles.accentIcon}
                            onClick={() => onCreateInGroup(group.id)}
                          />
                        ) : null}
                      </HStack>
                    </TableCell>
                    <TableCell xstyle={styles.cell} />
                    <TableCell xstyle={styles.cell} />
                    <TableCell xstyle={[styles.cell, alignStyles.end]}>
                      <Text
                        weight="bold"
                        color={group.rows.length ? 'primary' : 'secondary'}
                        hasTabularNumbers
                      >
                        {group.subtotal}
                      </Text>
                    </TableCell>
                    <TableCell xstyle={styles.cell} />
                    <TableCell xstyle={styles.cell} />
                    <TableCell xstyle={styles.cell} />
                    <TableCell xstyle={styles.cell} />
                    <TableCell
                      xstyle={[styles.cell, ...pinnedCell('actions', 'group')]}
                    />
                  </TableRow>
                  {group.rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell
                        xstyle={[
                          styles.cell,
                          alignStyles.center,
                          ...pinnedCell('no'),
                        ]}
                      >
                        <Text type="code" color="secondary" hasTabularNumbers>
                          {row.no}
                        </Text>
                      </TableCell>
                      <TableCell xstyle={[styles.cell, ...pinnedCell('name')]}>
                        <Text weight="medium">{row.name}</Text>
                      </TableCell>
                      <TableCell xstyle={[styles.cell, alignStyles.end]}>
                        <Text hasTabularNumbers>{row.quantity}</Text>
                      </TableCell>
                      <TableCell xstyle={[styles.cell, alignStyles.end]}>
                        <Text hasTabularNumbers>{row.unitPrice}</Text>
                      </TableCell>
                      <TableCell xstyle={[styles.cell, alignStyles.end]}>
                        <Text hasTabularNumbers>{row.amount}</Text>
                      </TableCell>
                      <TableCell xstyle={styles.cell}>
                        <MetaPill
                          label={row.nature}
                          tone={
                            row.nature === 'Abnormal' ? 'warning' : 'neutral'
                          }
                          hasBorder
                          size="sm"
                        />
                      </TableCell>
                      <TableCell xstyle={styles.cell}>
                        {row.paidOnBehalf ? (
                          <VStack gap={0.5}>
                            <HStack gap={1} vAlign="center" wrap="wrap">
                              <OptionalText value={row.provider} />
                              <MetaPill
                                label="Chi hộ"
                                tone="indigo"
                                size="sm"
                              />
                            </HStack>
                            {row.payee ? (
                              <Text size="sm" color="secondary">
                                {`Thu bởi ${row.payee}`}
                              </Text>
                            ) : null}
                          </VStack>
                        ) : (
                          <OptionalText value={row.provider} />
                        )}
                      </TableCell>
                      <TableCell xstyle={styles.cell}>
                        {row.invoiceDate ? (
                          <VStack gap={0.5}>
                            <OptionalText value={row.invoiceNumber} isCode />
                            <Text size="sm" color="secondary">
                              {`Ngày ${row.invoiceDate}`}
                            </Text>
                          </VStack>
                        ) : (
                          <OptionalText value={row.invoiceNumber} isCode />
                        )}
                      </TableCell>
                      <TableCell xstyle={[styles.cell, styles.noteCell]}>
                        {row.note ? (
                          <Markdown density="compact" contentWidth="100%">
                            {row.note}
                          </Markdown>
                        ) : (
                          <OptionalText value={null} />
                        )}
                      </TableCell>
                      <TableCell
                        xstyle={[
                          styles.cell,
                          styles.nowrap,
                          alignStyles.center,
                          ...pinnedCell('actions'),
                        ]}
                      >
                        <HStack
                          gap={1}
                          vAlign="center"
                          hAlign="center"
                          wrap="nowrap"
                        >
                          {onEdit ? (
                            <IconButton
                              isDisabled={isReadOnly}
                              label={`Sửa chi phí ${row.name}`}
                              tooltip="Sửa"
                              icon={<Icon icon={Pencil} size="sm" />}
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(row.id)}
                            />
                          ) : null}
                          {onDelete ? (
                            <IconButton
                              isDisabled={isReadOnly}
                              label={`Xoá chi phí ${row.name}`}
                              tooltip="Xoá"
                              icon={<Icon icon={Trash2} size="sm" />}
                              variant="ghost"
                              size="sm"
                              onClick={() => onDelete(row.id)}
                            />
                          ) : null}
                        </HStack>
                      </TableCell>
                    </TableRow>
                  ))}
                </Fragment>
              ))}
            </TableBody>
            {totals ? (
              <TableFooter>
                <TableRow xstyle={[styles.totalsRow]}>
                  <TableCell
                    xstyle={[styles.footCell, ...pinnedCell('no', 'footer')]}
                  />
                  <TableCell
                    xstyle={[styles.footCell, ...pinnedCell('name', 'footer')]}
                  >
                    <VStack gap={0.5}>
                      <Text size="sm" weight="bold" xstyle={styles.caps}>
                        Σ Tổng cộng chi phí
                      </Text>
                      <Text size="sm" color="secondary">
                        {totals.lines}
                      </Text>
                    </VStack>
                  </TableCell>
                  <TableCell xstyle={styles.footCell} />
                  <TableCell xstyle={styles.footCell} />
                  <TableCell xstyle={[styles.footCell, alignStyles.end]}>
                    <Text weight="bold" color="accent" hasTabularNumbers>
                      {totals.amount}
                    </Text>
                  </TableCell>
                  <TableCell xstyle={styles.footCell}>
                    <Text
                      size="sm"
                      weight="medium"
                      color="meta-amber"
                      hasTabularNumbers
                    >
                      {totals.abnormal}
                    </Text>
                  </TableCell>
                  <TableCell xstyle={styles.footCell}>
                    <VStack gap={0.5}>
                      <Text size="sm" color="secondary">
                        {totals.providers}
                      </Text>
                      {totals.paidOnBehalf ? (
                        <Text size="sm" color="secondary" hasTabularNumbers>
                          {totals.paidOnBehalf}
                        </Text>
                      ) : null}
                    </VStack>
                  </TableCell>
                  <TableCell xstyle={styles.footCell}>
                    <Text size="sm" type="code" weight="bold" color="secondary">
                      {totals.invoices}
                    </Text>
                  </TableCell>
                  <TableCell xstyle={styles.footCell} />
                  <TableCell
                    xstyle={[
                      styles.footCell,
                      ...pinnedCell('actions', 'footer'),
                    ]}
                  />
                </TableRow>
              </TableFooter>
            ) : null}
          </Table>
        )}

        <HStack gap={2} vAlign="center" wrap="nowrap" xstyle={styles.note}>
          <Icon icon={Info} size="sm" color="accent" />
          <Text size="sm" color="secondary">
            Chi phí Logistics hạch toán trực tiếp vào giá thành phân bổ lô hàng{' '}
            <Text as="span" size="sm" type="code" weight="semibold">
              {shipmentCode}
            </Text>{' '}
            theo chuẩn VNĐ.
          </Text>
        </HStack>
      </VStack>
    </Card>
  );
}

/**
 * Optional cell value; a muted em dash when missing (Figma's grey dash).
 * @param {{ value: string | null, isCode?: boolean }} props
 */
function OptionalText({ value, isCode = false }) {
  return value ? (
    <Text type={isCode ? 'code' : undefined}>{value}</Text>
  ) : (
    <Text color={/** @type {any} */ ('meta-subtle')}>—</Text>
  );
}

/** @param {{children: import('react').ReactNode, htmlProps?: import('react').HTMLAttributes<HTMLDivElement> & {ref?: import('react').Ref<HTMLDivElement>}, xstyle?: import('@stylexjs/stylex').StyleXStyles[], beforeTable?: import('react').ReactNode, afterTable?: import('react').ReactNode}} props */
function CostTableScrollRegion({
  children,
  htmlProps,
  xstyle,
  beforeTable,
  afterTable,
}) {
  return (
    <VStack
      {...htmlProps}
      data-meta-cost-scroll
      role="group"
      aria-label="Bảng chi phí logistics, cuộn để xem thêm cột và dòng"
      tabIndex={0}
      xstyle={[styles.scrollRegion, ...(xstyle ?? [])]}
    >
      {beforeTable}
      {children}
      {afterTable}
    </VStack>
  );
}

/** @param {typeof COLUMNS[number][0]} key @param {'body' | 'header' | 'group' | 'footer'} [surface] */
function pinnedCell(key, surface = 'body') {
  const position =
    key === 'no'
      ? styles.pinNo
      : key === 'name'
        ? styles.pinName
        : key === 'actions'
          ? styles.pinActions
          : null;
  if (!position) return [];
  const background =
    surface === 'header'
      ? styles.pinHeader
      : surface === 'group'
        ? styles.pinGroupSurface
        : surface === 'footer'
          ? styles.pinFooter
          : styles.pinBody;
  return [position, background];
}

const styles = stylex.create({
  card: {
    boxShadow: 'var(--meta-shadow-card)',
    overflow: 'hidden',
  },
  // The card has no padding: header and note pad themselves, so the
  // grid runs edge to edge (Figma 124:9685).
  header: {
    borderBottomColor: 'var(--color-border)',
    borderBottomStyle: 'solid',
    borderBottomWidth: 'var(--border-width)',
    paddingBlock: 'var(--spacing-5)',
    paddingInline: 'var(--spacing-5)',
  },
  titleBar: {
    backgroundColor: 'var(--color-accent)',
    borderRadius: 'var(--radius-full)',
    height: 'var(--spacing-5)',
    width: 'var(--spacing-1)',
  },
  divider: {
    backgroundColor: 'var(--color-border)',
    height: 'var(--spacing-4)',
    width: 'var(--border-width)',
  },
  // A fixed width keeps sticky offsets aligned with their columns.
  table: {
    minWidth: 'calc(var(--spacing-10) * 44.5)',
    tableLayout: 'fixed',
  },
  scrollRegion: {
    maxHeight: '62vh',
    minWidth: 0,
    overflowX: 'auto',
    overflowY: 'auto',
    width: '100%',
  },
  stickyHeader: {
    position: 'sticky',
    top: 0,
    zIndex: 6,
  },
  pinNo: {
    left: 0,
    position: 'sticky',
  },
  pinName: {
    left: 'calc(var(--spacing-10) * 1.5)',
    position: {
      default: 'static',
      '@media (min-width: 900px)': 'sticky',
    },
  },
  // The group title cell covers the two pinned start columns; like
  // them, it only sticks from 900px so it never fills a phone screen.
  pinGroupTitle: {
    left: 0,
    position: {
      default: 'static',
      '@media (min-width: 900px)': 'sticky',
    },
  },
  pinActions: {
    position: 'sticky',
    right: 0,
  },
  pinHeader: {
    backgroundColor: 'var(--meta-row-hover)',
    zIndex: 5,
  },
  pinBody: {
    backgroundColor: 'var(--color-background-card)',
    zIndex: 2,
  },
  pinGroupSurface: {
    backgroundColor: 'var(--meta-surface-container-low)',
    zIndex: 2,
  },
  pinFooter: {
    backgroundColor: 'var(--meta-accent-tint-strong)',
    zIndex: 2,
  },
  // The note is Markdown from the rich text editor: wraps, and keeps a
  // readable width however many columns compete for the row.
  noteCell: {
    maxWidth: 'none',
    minWidth: 'calc(var(--spacing-12) * 5)',
    whiteSpace: 'normal',
  },
  headCell: {
    backgroundColor: 'var(--meta-row-hover)',
    maxWidth: 'none',
    paddingBlock: 'var(--table-compact-padding-block,var(--spacing-3))',
    paddingInline: 'var(--spacing-3)',
    position: 'sticky',
    top: 0,
    whiteSpace: 'nowrap',
    zIndex: 4,
  },
  // Figma 124:9687 headers are sentence case; the theme's `<th>` caps
  // win over the cell's xstyle, so the label resets them itself.
  headLabel: {
    letterSpacing: 'normal',
    textTransform: 'none',
  },
  cell: {
    maxWidth: 'none',
    paddingBlock: 'var(--table-compact-padding-block,var(--spacing-2))',
    paddingInline: 'var(--spacing-3)',
  },
  footCell: {
    maxWidth: 'none',
    paddingBlock: 'var(--table-compact-padding-block,var(--spacing-4))',
    paddingInline: 'var(--spacing-3)',
  },
  nowrap: {
    whiteSpace: 'nowrap',
  },
  groupRow: {
    backgroundColor: 'var(--meta-surface-container-low)',
  },
  groupLabel: {
    letterSpacing: '-0.02em',
  },
  accentIcon: {
    color: 'var(--color-accent)',
  },
  totalsRow: {
    backgroundColor: 'var(--meta-accent-tint-strong)',
  },
  caps: {
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  },
  note: {
    backgroundColor: 'var(--meta-inset-bg)',
    borderTopColor: 'var(--color-border)',
    borderTopStyle: 'solid',
    borderTopWidth: 'var(--border-width)',
    paddingBlock: 'var(--spacing-3)',
    paddingInline: 'var(--spacing-5)',
  },
  skeletonRow: {
    borderBottomColor: 'var(--color-border)',
    borderBottomStyle: 'solid',
    borderBottomWidth: 'var(--border-width)',
    paddingBlock: 'var(--spacing-5)',
  },
});

const alignStyles = stylex.create({
  start: { textAlign: 'start' },
  center: { textAlign: 'center' },
  end: { textAlign: 'end' },
});

/** Column widths use 40px spacing units; pinned offsets sum the first columns. */
const columnWidths = stylex.create({
  no: { width: 'calc(var(--spacing-10) * 1.5)' },
  name: { width: 'calc(var(--spacing-10) * 10)' },
  quantity: { width: 'calc(var(--spacing-10) * 2.5)' },
  unitPrice: { width: 'calc(var(--spacing-10) * 4)' },
  amount: { width: 'calc(var(--spacing-10) * 4)' },
  nature: { width: 'calc(var(--spacing-10) * 3.5)' },
  note: { width: 'calc(var(--spacing-10) * 7.5)' },
  provider: { width: 'calc(var(--spacing-10) * 4.5)' },
  invoice: { width: 'calc(var(--spacing-10) * 4.5)' },
  actions: { width: 'calc(var(--spacing-10) * 2.5)' },
});
