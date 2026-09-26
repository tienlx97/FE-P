'use client';

import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Grid } from '@astryxdesign/core/Grid';
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
import {
  BadgeCheck,
  Container,
  Download,
  Lock,
  Pencil,
  Plus,
  Scale,
  Trash2,
  Upload,
} from 'lucide-react';

import { MetaCountBadge } from './count-badge.jsx';
import { MetaPill } from './pill.jsx';

/**
 * @typedef {{ value: string, note?: string }} MetaVgmMetric
 * @typedef {{
 *   id: string,
 *   no: string,
 *   carrier: string,
 *   packingDate: string,
 *   typeLabel: string,
 *   containerNumber: string,
 *   sealNumber: string,
 *   maxGross: string,
 *   tare: string,
 *   grossWeight: string,
 *   vgm: string,
 *   isVgmDeclared?: boolean,
 * }} MetaVgmRow
 * @typedef {{
 *   label: string,
 *   containers: string,
 *   types: string,
 *   containerNumbers: string,
 *   seals: string,
 *   maxGross: string,
 *   tare: string,
 *   grossWeight: string,
 *   vgm: string,
 * }} MetaVgmTotals
 */

/** `[key, header, align]` — Figma 120:9267 header row. */
const COLUMNS = /** @type {const} */ ([
  ['no', 'STT', 'center'],
  ['carrier', 'Nhà vận chuyển', 'start'],
  ['packingDate', 'Ngày đóng', 'start'],
  ['typeLabel', 'Loại cont', 'center'],
  ['containerNumber', 'Số container', 'start'],
  ['sealNumber', 'Số seal', 'start'],
  ['maxGross', 'Max gross (kg)', 'end'],
  ['tare', 'Tare (kg)', 'end'],
  ['grossWeight', 'G.W (kg)', 'end'],
  ['vgm', 'VGM (kg)', 'end'],
  ['actions', 'Thao tác', 'center'],
]);

/**
 * "Meta" shipment-detail "VGM" tab — Figma node 120:9075: one full-width
 * card with an accent-bar title + count and the Excel / "Thêm VGM"
 * actions, a banner of 3 metric tiles (containers, total VGM weight,
 * declaration rate), then a dense edge-to-edge table (one row per
 * container) with a tinted totals footer. Values arrive formatted; the
 * feature owns data and dialogs. Composed from Astryx `Card` / `Grid` /
 * `Table` / `Button` / `IconButton` / `Skeleton` + `MetaPill` /
 * `MetaCountBadge` (golden rule #15).
 *
 * @param {{
 *   count: number,
 *   containers: MetaVgmMetric,
 *   weight: MetaVgmMetric,
 *   declared: MetaVgmMetric,
 *   rows: MetaVgmRow[],
 *   totals: MetaVgmTotals | null,
 *   isLoading?: boolean,
 *   isReadOnly?: boolean,
 *   onExport?: () => void,
 *   onImport?: () => void,
 *   onCreate?: () => void,
 *   onEdit?: (id: string) => void,
 *   onDelete?: (id: string) => void,
 * }} props
 */
export function MetaVgmPanel({
  count,
  containers,
  weight,
  declared,
  rows,
  totals,
  isLoading = false,
  isReadOnly = false,
  onExport,
  onImport,
  onCreate,
  onEdit,
  onDelete,
}) {
  return (
    <Card padding={6} xstyle={styles.card}>
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
              Container &amp; VGM
            </Heading>
            <MetaCountBadge value={count} />
          </HStack>
          <HStack gap={2} vAlign="center" wrap="wrap">
            {onExport ? (
              <Button
                label="Xuất Excel"
                variant="secondary"
                isDisabled={isLoading || rows.length === 0}
                icon={<Icon icon={Download} size="sm" />}
                onClick={onExport}
              />
            ) : null}
            {onImport ? (
              <Button
                label="Nhập từ Excel"
                variant="secondary"
                isDisabled={isReadOnly}
                icon={<Icon icon={Upload} size="sm" />}
                onClick={onImport}
              />
            ) : null}
            {onCreate ? (
              <Button
                label="Thêm container"
                variant="primary"
                isDisabled={isReadOnly}
                icon={<Icon icon={Plus} size="sm" />}
                onClick={onCreate}
              />
            ) : null}
          </HStack>
        </HStack>

        <Grid
          columns={{ minWidth: 260, max: 3 }}
          gap={4}
          xstyle={styles.banner}
        >
          <MetricTile
            icon={Container}
            tone="accent"
            label="Tổng số container"
            metric={containers}
            isLoading={isLoading}
          />
          <MetricTile
            icon={Scale}
            tone="indigo"
            label="Tổng tải trọng VGM"
            metric={weight}
            valueTone="accent"
            isLoading={isLoading}
          />
          <MetricTile
            icon={BadgeCheck}
            tone="success"
            label="Tỷ lệ khai báo"
            metric={declared}
            valueTone="success"
            isLoading={isLoading}
          />
        </Grid>

        {isLoading ? (
          [0, 1, 2].map((index) => (
            <HStack
              key={index}
              gap={6}
              vAlign="center"
              xstyle={styles.skeletonRow}
            >
              <Skeleton width="20%" height="var(--spacing-4)" index={index} />
              <Skeleton width="15%" height="var(--spacing-4)" index={index} />
              <Skeleton width="15%" height="var(--spacing-4)" index={index} />
              <Skeleton width="30%" height="var(--spacing-4)" index={index} />
            </HStack>
          ))
        ) : rows.length === 0 ? (
          <HStack hAlign="center" xstyle={styles.emptyRow}>
            <Text color="secondary">Chưa có container nào.</Text>
          </HStack>
        ) : (
          <>
            {/* Last child of the card: Astryx `Table` bleeds to its side
                and bottom edges itself (don't wrap it, or it bleeds up). */}
            <Table density="compact" dividers="rows" xstyle={styles.table}>
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
                        weight="bold"
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
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell xstyle={[styles.cell, alignStyles.center]}>
                      <Text color="secondary" hasTabularNumbers>
                        {row.no}
                      </Text>
                    </TableCell>
                    <TableCell xstyle={[styles.cell, styles.wrapCell]}>
                      <Text weight="semibold">{row.carrier}</Text>
                    </TableCell>
                    <TableCell xstyle={styles.cell}>
                      <Text type="code" color="secondary">
                        {row.packingDate}
                      </Text>
                    </TableCell>
                    <TableCell xstyle={[styles.cell, alignStyles.center]}>
                      <MetaPill label={row.typeLabel} tone="accent" size="sm" />
                    </TableCell>
                    <TableCell xstyle={styles.cell}>
                      <Text type="code" weight="bold">
                        {row.containerNumber}
                      </Text>
                    </TableCell>
                    <TableCell xstyle={styles.cell}>
                      <HStack gap={1} vAlign="center" wrap="nowrap">
                        <Icon
                          icon={Lock}
                          size="xsm"
                          color={/** @type {any} */ ('meta-subtle')}
                        />
                        <Text type="code" color="secondary">
                          {row.sealNumber}
                        </Text>
                      </HStack>
                    </TableCell>
                    {[row.maxGross, row.tare, row.grossWeight].map(
                      (value, index) => (
                        <TableCell
                          key={index}
                          xstyle={[styles.cell, alignStyles.end]}
                        >
                          <Text type="code" hasTabularNumbers>
                            {value}
                          </Text>
                        </TableCell>
                      ),
                    )}
                    <TableCell xstyle={[styles.cell, alignStyles.end]}>
                      {row.isVgmDeclared === false ? (
                        <MetaPill label="Chưa khai VGM" tone="warning" size="sm" />
                      ) : (
                        <Text
                          type="code"
                          weight="bold"
                          color="accent"
                          hasTabularNumbers
                        >
                          {row.vgm}
                        </Text>
                      )}
                    </TableCell>
                    <TableCell xstyle={[styles.cell, alignStyles.center]}>
                      <HStack
                        gap={1}
                        vAlign="center"
                        hAlign="center"
                        wrap="nowrap"
                      >
                        <IconButton
                          isDisabled={isReadOnly}
                          label={`Sửa container ${row.containerNumber}`}
                          tooltip="Sửa"
                          icon={<Icon icon={Pencil} size="sm" />}
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit?.(row.id)}
                        />
                        <IconButton
                          isDisabled={isReadOnly}
                          label={`Xoá container ${row.containerNumber}`}
                          tooltip="Xoá"
                          icon={<Icon icon={Trash2} size="sm" />}
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete?.(row.id)}
                        />
                      </HStack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              {totals ? (
                <TableFooter>
                  <TableRow xstyle={[styles.totalsRow]}>
                    <TableCell xstyle={styles.cell} />
                    <TableCell xstyle={styles.cell}>
                      <Text size="sm" weight="bold" xstyle={styles.caps}>
                        {totals.label}
                      </Text>
                    </TableCell>
                    <TableCell xstyle={styles.cell}>
                      <Text size="sm" color="secondary">
                        {totals.containers}
                      </Text>
                    </TableCell>
                    <TableCell xstyle={[styles.cell, alignStyles.center]}>
                      <Text
                        size="sm"
                        type="code"
                        weight="bold"
                        color="secondary"
                      >
                        {totals.types}
                      </Text>
                    </TableCell>
                    <TableCell xstyle={styles.cell}>
                      <Text size="sm" color="secondary">
                        {totals.containerNumbers}
                      </Text>
                    </TableCell>
                    <TableCell xstyle={styles.cell}>
                      <Text size="sm" color="secondary">
                        {totals.seals}
                      </Text>
                    </TableCell>
                    {[totals.maxGross, totals.tare, totals.grossWeight].map(
                      (value, index) => (
                        <TableCell
                          key={index}
                          xstyle={[styles.cell, alignStyles.end]}
                        >
                          <Text
                            size="sm"
                            type="code"
                            weight="bold"
                            hasTabularNumbers
                          >
                            {value}
                          </Text>
                        </TableCell>
                      ),
                    )}
                    <TableCell xstyle={[styles.cell, alignStyles.end]}>
                      <Text
                        type="code"
                        weight="bold"
                        color="accent"
                        hasTabularNumbers
                      >
                        {totals.vgm}
                      </Text>
                    </TableCell>
                    <TableCell xstyle={styles.cell} />
                  </TableRow>
                </TableFooter>
              ) : null}
            </Table>
          </>
        )}
      </VStack>
    </Card>
  );
}

/**
 * One banner tile ("Background+Border", Figma 120:9236): tinted icon
 * square, uppercase label, bold mono value + muted note.
 * @param {{
 *   icon: import('react').ComponentType,
 *   tone: 'accent' | 'indigo' | 'success',
 *   label: string,
 *   metric: MetaVgmMetric,
 *   valueTone?: 'primary' | 'accent' | 'success',
 *   isLoading: boolean,
 * }} props
 */
function MetricTile({
  icon,
  tone,
  label,
  metric,
  valueTone = 'primary',
  isLoading,
}) {
  return (
    <HStack gap={3} vAlign="center" wrap="nowrap" xstyle={styles.tile}>
      <HStack
        hAlign="center"
        vAlign="center"
        xstyle={[styles.tileIcon, tileTones[tone]]}
      >
        <Icon icon={icon} size="md" color="inherit" />
      </HStack>
      <VStack gap={0.5} hAlign="start" xstyle={styles.shrink}>
        <Text
          size="sm"
          weight="bold"
          color="secondary"
          maxLines={1}
          xstyle={styles.caps}
        >
          {label}
        </Text>
        {isLoading ? (
          <Skeleton width="8rem" height="var(--spacing-4)" />
        ) : (
          <Text size="sm" color="secondary">
            <Text
              as="span"
              type="code"
              weight="bold"
              color={/** @type {any} */ (VALUE_COLOR[valueTone])}
              hasTabularNumbers
            >
              {metric.value}
            </Text>
            {metric.note ? ` ${metric.note}` : null}
          </Text>
        )}
      </VStack>
    </HStack>
  );
}

const VALUE_COLOR = /** @type {const} */ ({
  primary: 'primary',
  accent: 'accent',
  success: 'meta-success',
});

const styles = stylex.create({
  card: {
    boxShadow: 'var(--meta-shadow-card)',
    overflow: 'hidden',
  },
  // Header, banner and table bleed edge to edge through the card's
  // `--container-padding-*` vars (same as `MetaCommissionPanel`).
  header: {
    borderBottomColor: 'var(--color-border)',
    borderBottomStyle: 'solid',
    borderBottomWidth: 'var(--border-width)',
    marginInline: 'calc(-1 * var(--container-padding-inline-start))',
    marginTop: 'calc(-1 * var(--container-padding-block-start))',
    paddingBlock: 'var(--spacing-6)',
    paddingInline: 'var(--container-padding-inline-start)',
  },
  titleBar: {
    backgroundColor: 'var(--color-accent)',
    borderRadius: 'var(--radius-full)',
    height: 'var(--spacing-6)',
    width: 'var(--spacing-1-5)',
  },
  banner: {
    backgroundColor: 'var(--meta-inset-bg)',
    borderBottomColor: 'var(--color-border)',
    borderBottomStyle: 'solid',
    borderBottomWidth: 'var(--border-width)',
    marginInline: 'calc(-1 * var(--container-padding-inline-start))',
    paddingBlock: 'var(--spacing-4)',
    paddingInline: 'var(--container-padding-inline-start)',
  },
  tile: {
    backgroundColor: 'var(--color-background-card)',
    borderColor: 'var(--color-border)',
    borderRadius: 'var(--radius-element)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    minWidth: 0,
    padding: 'var(--spacing-3)',
  },
  tileIcon: {
    borderRadius: 'var(--radius-element)',
    flexShrink: 0,
    height: 'var(--spacing-10)',
    width: 'var(--spacing-10)',
  },
  shrink: {
    minWidth: 0,
  },
  caps: {
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  },
  // Column headers stay on one line while there is room, but may wrap
  // before the table has to scroll (the caps labels set the min widths).
  headLabel: {
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  // Auto layout: the Figma column shares (`columnWidths`) spread spare
  // width evenly, but nowrap content still wins, so nothing clips and the
  // wrapper only scrolls when the card is truly narrower than the data.
  table: {
    tableLayout: 'auto',
  },
  // Astryx cells default to `max-width: 0` (truncation); lift it so the
  // auto table layout sizes columns to content.
  headCell: {
    backgroundColor: 'var(--meta-row-hover)',
    maxWidth: 'none',
    paddingBlock: 'var(--spacing-3)',
    paddingInline: 'var(--spacing-2)',
    whiteSpace: 'normal',
  },
  cell: {
    maxWidth: 'none',
    paddingBlock: 'var(--spacing-3)',
    paddingInline: 'var(--spacing-2)',
    whiteSpace: 'nowrap',
  },
  // Carrier names are the only free text: let them wrap before the
  // table has to scroll.
  wrapCell: {
    minWidth: 'calc(2 * var(--spacing-12))',
    whiteSpace: 'normal',
  },
  totalsRow: {
    backgroundColor: 'var(--meta-accent-tint)',
  },
  skeletonRow: {
    borderBottomColor: 'var(--color-border)',
    borderBottomStyle: 'solid',
    borderBottomWidth: 'var(--border-width)',
    paddingBlock: 'var(--spacing-5)',
  },
  emptyRow: {
    paddingBlock: 'var(--spacing-8)',
  },
});

const alignStyles = stylex.create({
  start: { textAlign: 'start' },
  center: { textAlign: 'center' },
  end: { textAlign: 'end' },
});

/** Column shares measured from the Figma 120:9267 header row (sum 100%). */
const columnWidths = stylex.create({
  no: { width: '4%' },
  carrier: { width: '15%' },
  packingDate: { width: '9%' },
  typeLabel: { width: '7%' },
  containerNumber: { width: '10%' },
  sealNumber: { width: '9%' },
  maxGross: { width: '11%' },
  tare: { width: '9%' },
  grossWeight: { width: '9%' },
  vgm: { width: '10%' },
  actions: { width: '7%' },
});

const tileTones = stylex.create({
  accent: {
    backgroundColor: 'var(--meta-blue-wash)',
    color: 'var(--color-accent)',
  },
  indigo: {
    backgroundColor: 'var(--meta-indigo-wash)',
    color: 'var(--meta-indigo)',
  },
  success: {
    backgroundColor: 'var(--meta-emerald-wash)',
    color: 'var(--meta-emerald-fill)',
  },
});
