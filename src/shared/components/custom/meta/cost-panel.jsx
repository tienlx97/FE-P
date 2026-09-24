'use client';

import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import {
  Table,
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
import { Info, Pencil, Plus, Trash2 } from 'lucide-react';
import { Fragment } from 'react';

import { MetaCountBadge } from './count-badge.jsx';
import { MetaPill } from './pill.jsx';

/**
 * @typedef {{
 *   id: string,
 *   no: string,
 *   groupName: string,
 *   name: string,
 *   amount: string,
 *   nature: 'Standard' | 'Abnormal',
 *   note: string | null,
 *   provider: string | null,
 *   invoiceNumber: string | null,
 * }} MetaCostRow
 * @typedef {{
 *   id: string,
 *   label: string,
 *   subtotal: string,
 *   rows: MetaCostRow[],
 * }} MetaCostGroup
 * @typedef {{
 *   lines: string,
 *   amount: string,
 *   abnormal: string,
 *   providers: string,
 *   invoices: string,
 * }} MetaCostTotals
 */

/** `[key, header, align]` — Figma 124:9687 header row. */
const COLUMNS = /** @type {const} */ ([
  ['no', 'STT', 'center'],
  ['group', 'Nhóm chi phí', 'start'],
  ['name', 'Tên khoản chi phí', 'start'],
  ['amount', 'Số tiền (VNĐ)', 'end'],
  ['nature', 'Cost Nature', 'start'],
  ['note', 'Ghi chú', 'start'],
  ['provider', 'Nhà cung cấp', 'start'],
  ['invoice', 'Số hoá đơn', 'start'],
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
 *   total: string,
 *   groups: MetaCostGroup[],
 *   totals: MetaCostTotals | null,
 *   shipmentCode: string,
 *   isLoading?: boolean,
 *   isReadOnly?: boolean,
 *   onCreate?: () => void,
 *   onCreateInGroup?: (groupId: string) => void,
 *   onEdit?: (id: string) => void,
 *   onDelete?: (id: string) => void,
 * }} props
 */
export function MetaCostPanel({
  count,
  abnormalTotal,
  total,
  groups,
  totals,
  shipmentCode,
  isLoading = false,
  isReadOnly = false,
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
          <Table density="compact" dividers="grid" xstyle={styles.table}>
            <TableHeader>
              <TableRow isHeaderRow>
                {COLUMNS.map(([key, header, align]) => (
                  <TableHeaderCell
                    key={key}
                    scope="col"
                    xstyle={[
                      styles.headCell,
                      alignStyles[align],
                      columnWidths[key],
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
                    <TableCell xstyle={styles.cell} />
                    <TableCell xstyle={styles.cell}>
                      <HStack
                        gap={2}
                        vAlign="center"
                        hAlign="between"
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
                    <TableCell xstyle={[styles.cell, alignStyles.end]}>
                      <Text
                        size="sm"
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
                    <TableCell xstyle={styles.cell} />
                  </TableRow>
                  {group.rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell xstyle={[styles.cell, alignStyles.center]}>
                        <Text
                          size="sm"
                          type="code"
                          color="secondary"
                          hasTabularNumbers
                        >
                          {row.no}
                        </Text>
                      </TableCell>
                      <TableCell xstyle={styles.cell}>
                        <Text size="sm" color="secondary">
                          {row.groupName}
                        </Text>
                      </TableCell>
                      <TableCell xstyle={styles.cell}>
                        <Text size="sm" weight="medium">
                          {row.name}
                        </Text>
                      </TableCell>
                      <TableCell xstyle={[styles.cell, alignStyles.end]}>
                        <Text size="sm" hasTabularNumbers>
                          {row.amount}
                        </Text>
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
                        <OptionalText value={row.note} />
                      </TableCell>
                      <TableCell xstyle={styles.cell}>
                        <OptionalText value={row.provider} />
                      </TableCell>
                      <TableCell xstyle={styles.cell}>
                        <OptionalText value={row.invoiceNumber} isCode />
                      </TableCell>
                      <TableCell
                        xstyle={[
                          styles.cell,
                          styles.nowrap,
                          alignStyles.center,
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
                  <TableCell xstyle={styles.footCell} />
                  <TableCell xstyle={styles.footCell}>
                    <Text size="sm" weight="bold" xstyle={styles.caps}>
                      Σ Tổng cộng chi phí
                    </Text>
                  </TableCell>
                  <TableCell xstyle={styles.footCell}>
                    <Text size="sm" color="secondary">
                      {totals.lines}
                    </Text>
                  </TableCell>
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
                  <TableCell xstyle={styles.footCell} />
                  <TableCell xstyle={styles.footCell}>
                    <Text size="sm" color="secondary">
                      {totals.providers}
                    </Text>
                  </TableCell>
                  <TableCell xstyle={styles.footCell}>
                    <Text size="sm" type="code" weight="bold" color="secondary">
                      {totals.invoices}
                    </Text>
                  </TableCell>
                  <TableCell xstyle={styles.footCell} />
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
    <Text size="sm" type={isCode ? 'code' : undefined}>
      {value}
    </Text>
  ) : (
    <Text size="sm" color={/** @type {any} */ ('meta-subtle')}>
      —
    </Text>
  );
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
  // Auto layout: the Figma column shares (`columnWidths`) spread spare
  // width, content still wins; the wrapper scrolls on narrow screens.
  table: {
    tableLayout: 'auto',
  },
  headCell: {
    backgroundColor: 'var(--meta-row-hover)',
    maxWidth: 'none',
    paddingBlock: 'var(--spacing-3)',
    paddingInline: 'var(--spacing-3)',
    whiteSpace: 'nowrap',
  },
  // Figma 124:9687 headers are sentence case; the theme's `<th>` caps
  // win over the cell's xstyle, so the label resets them itself.
  headLabel: {
    letterSpacing: 'normal',
    textTransform: 'none',
  },
  cell: {
    maxWidth: 'none',
    paddingBlock: 'var(--spacing-2)',
    paddingInline: 'var(--spacing-3)',
  },
  footCell: {
    maxWidth: 'none',
    paddingBlock: 'var(--spacing-4)',
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

/** Column shares measured from the Figma 124:9687 header row (sum 100%). */
const columnWidths = stylex.create({
  no: { width: '3%' },
  group: { width: '20%' },
  name: { width: '12%' },
  amount: { width: '10%' },
  nature: { width: '9%' },
  note: { width: '14%' },
  provider: { width: '16%' },
  invoice: { width: '10%' },
  actions: { width: '6%' },
});
