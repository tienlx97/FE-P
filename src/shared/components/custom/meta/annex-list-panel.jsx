'use client';

import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { pixel, proportional, Table } from '@astryxdesign/core/Table';
import { Heading, Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import {
  CircleCheck,
  CircleMinus,
  Download,
  FilePlus,
  FileStack,
  FileText,
  Pencil,
  Printer,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

import { MetaPill } from './pill.jsx';

/**
 * @typedef {{
 *   label: string,
 *   value: string,
 *   note: string,
 *   tone: 'neutral' | 'success' | 'muted',
 *   icon: 'file' | 'up' | 'down',
 *   noteIcon: import('react').ComponentType,
 * }} MetaAnnexSummary
 *
 * @typedef {{
 *   id: string,
 *   code: string,
 *   number: string,
 *   kind: { label: string, tone: 'success' | 'neutral' | 'blue', icon: 'increase' | 'decrease' | 'change' },
 *   title: string,
 *   delta: number,
 *   signedAt: string,
 *   signatures: Array<{ label: string, isSigned: boolean }>,
 * }} MetaAnnexRow
 */

const SUMMARY_ICONS = { file: FileText, up: TrendingUp, down: TrendingDown };
const KIND_ICONS = {
  increase: TrendingUp,
  decrease: TrendingDown,
  change: RefreshCw,
};
const KIND_TONES = /** @type {const} */ ({
  success: 'success',
  neutral: 'muted',
  blue: 'accent',
});
const SUMMARY_TONES = /** @type {const} */ ({
  neutral: { value: 'primary', note: 'secondary', bubble: 'accent' },
  success: { value: 'meta-success', note: 'meta-success', bubble: 'success' },
  muted: { value: 'meta-subtle', note: 'secondary', bubble: 'neutral' },
});

const MONEY = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** @param {number} value */
function formatDelta(value) {
  if (value === 0) return MONEY.format(0);
  return `${value > 0 ? '+' : '-'}${MONEY.format(Math.abs(value))}`;
}

/**
 * "Meta" contract-detail "Phụ lục (Annex)" tab (Figma node 44:4355) with the same
 * structure as the Meta payments tab (Figma 94:1936): 3 summary cards
 * (HĐ gốc / Phát sinh tăng / Phát sinh giảm) in a capped grid, then a
 * "Danh sách phụ lục" table card (code, type pill, summary,
 * adjustment, signed date, signature pills, actions) with a totals band.
 * `isLoading` swaps figures and
 * rows for `Skeleton`s. Composed from Astryx `Card` / `Grid` / `Table` /
 * `Button` / `IconButton` / `Skeleton` + `MetaPill` (golden rule #15).
 *
 * @param {{
 *   summary: MetaAnnexSummary[],
 *   annexes: MetaAnnexRow[],
 *   currency: string,
 *   onExport?: () => void,
 *   onCreate?: () => void,
 *   onEdit?: (id: string) => void,
 *   onPrint?: (id: string) => void,
 *   isLoading?: boolean,
 * }} props
 */
export function MetaAnnexListPanel({
  summary,
  annexes,
  currency,
  onExport,
  onCreate,
  onEdit,
  onPrint,
  isLoading = false,
}) {
  const netDelta = annexes.reduce((total, annex) => total + annex.delta, 0);

  /** @type {import('@astryxdesign/core/Table').TableColumn<MetaAnnexRow & Record<string, unknown>>[]} */
  const columns = [
    {
      key: 'code',
      header: 'Mã PL',
      width: proportional(1.4),
      renderCell: (row) => (
        <Text type="inherit" weight="bold" color="accent">
          {row.code}
        </Text>
      ),
    },
    {
      key: 'kind',
      header: 'Phân loại',
      width: proportional(1.6),
      renderCell: (row) => (
        <MetaPill
          label={row.kind.label}
          tone={KIND_TONES[row.kind.tone]}
          icon={KIND_ICONS[row.kind.icon]}
        />
      ),
    },
    {
      key: 'content',
      header: 'Nội dung',
      width: proportional(2.8),
      renderCell: (row) => (
        <Text type="inherit" weight="medium">
          {row.title}
        </Text>
      ),
    },
    {
      key: 'value',
      header: `Giá trị (${currency})`,
      width: proportional(1.5),
      align: 'end',
      renderCell: (row) => (
        <Text
          type="inherit"
          weight="bold"
          color={
            /** @type {any} */ (row.delta > 0 ? 'meta-success' : 'meta-subtle')
          }
          hasTabularNumbers
        >
          {formatDelta(row.delta)}
        </Text>
      ),
    },
    {
      key: 'date',
      header: 'Ngày ký',
      width: proportional(1.1),
      renderCell: (row) => (
        <Text type="inherit" color="secondary" hasTabularNumbers>
          {row.signedAt}
        </Text>
      ),
    },
    {
      key: 'signatures',
      header: 'Tình trạng chữ ký',
      width: proportional(1.7),
      renderCell: (row) => (
        <VStack gap={1} hAlign="start">
          {row.signatures.map((signature) => (
            <MetaPill
              key={signature.label}
              label={signature.label}
              tone={signature.isSigned ? 'success' : 'muted'}
              icon={signature.isSigned ? CircleCheck : CircleMinus}
            />
          ))}
        </VStack>
      ),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      width: pixel(120),
      renderCell: (row) => (
        <HStack gap={1} vAlign="center" wrap="nowrap">
          <IconButton
            label={`Sửa ${row.code}`}
            tooltip="Sửa"
            icon={<Icon icon={Pencil} size="sm" />}
            variant="ghost"
            size="sm"
            onClick={() => onEdit?.(row.id)}
          />
          {onPrint ? (
            <IconButton
              label={`In ${row.code}`}
              tooltip="In"
              icon={<Icon icon={Printer} size="sm" />}
              variant="ghost"
              size="sm"
              onClick={() => onPrint(row.id)}
            />
          ) : null}
        </HStack>
      ),
    },
  ];

  return (
    <VStack gap={5} hAlign="stretch">
      <Grid
        columns={{ minWidth: 320, max: 3 }}
        maxWidth="calc(3 * var(--meta-panel-card-max) + 2 * var(--spacing-5))"
        gap={5}
        xstyle={styles.responsiveGrid}
      >
        {summary.map((item) => (
          <SummaryCard
            key={item.label}
            {...item}
            unit={currency}
            isLoading={isLoading}
          />
        ))}
      </Grid>

      <Card padding={6} xstyle={styles.tableCard}>
        <VStack gap={0} hAlign="stretch">
          <HStack
            hAlign="between"
            vAlign="center"
            gap={4}
            wrap="wrap"
            xstyle={styles.tableHeader}
          >
            <HStack gap={3} vAlign="center" wrap="nowrap">
              <HStack
                as="span"
                hAlign="center"
                vAlign="center"
                xstyle={[styles.bubble, bubbleTones.accent]}
              >
                <Icon icon={FileStack} size="sm" color="inherit" />
              </HStack>
              <VStack gap={0}>
                <Heading level={3}>Danh sách phụ lục</Heading>
                <Text size="sm" color="secondary">
                  Các phụ lục điều chỉnh giá trị và điều khoản của hợp đồng
                </Text>
              </VStack>
            </HStack>
            <HStack gap={2} vAlign="center" wrap="wrap">
              {onExport ? (
                <Button
                  label="Xuất báo cáo phụ lục"
                  variant="secondary"
                  icon={<Icon icon={Download} size="sm" />}
                  onClick={onExport}
                />
              ) : null}
              {onCreate ? (
                <Button
                  label="+ Thêm phụ lục mới"
                  variant="primary"
                  icon={<Icon icon={FilePlus} size="sm" />}
                  onClick={onCreate}
                />
              ) : null}
            </HStack>
          </HStack>

          {isLoading ? (
            [0, 1, 2].map((index) => (
              <HStack
                key={index}
                gap={6}
                vAlign="center"
                xstyle={styles.skeletonRow}
              >
                <Skeleton
                  width="10%"
                  height="var(--spacing-4)"
                  radius={2}
                  index={index}
                />
                <Skeleton
                  width="12%"
                  height="var(--spacing-6)"
                  radius="rounded"
                  index={index}
                />
                <Skeleton
                  width="24%"
                  height="var(--spacing-4)"
                  radius={2}
                  index={index}
                />
                <Skeleton
                  width="10%"
                  height="var(--spacing-4)"
                  radius={2}
                  index={index}
                />
                <Skeleton
                  width="12%"
                  height="var(--spacing-6)"
                  radius="rounded"
                  index={index}
                />
              </HStack>
            ))
          ) : annexes.length === 0 ? (
            <HStack hAlign="center" xstyle={styles.emptyRow}>
              <Text color="secondary">Hợp đồng chưa có phụ lục nào.</Text>
            </HStack>
          ) : (
            <Table
              columns={columns}
              data={/** @type {any} */ (annexes)}
              idKey="id"
              dividers="rows"
              density="spacious"
              xstyle={styles.table}
            />
          )}

          <HStack
            hAlign="between"
            vAlign="center"
            gap={3}
            wrap="wrap"
            xstyle={styles.footer}
          >
            {isLoading ? (
              <Skeleton width="12rem" height="var(--spacing-4)" radius={2} />
            ) : (
              <Text weight="medium" color="secondary">
                Tổng số {annexes.length} phụ lục
              </Text>
            )}
            <HStack gap={2} vAlign="center" wrap="nowrap">
              <Text size="sm" weight="bold" xstyle={styles.caps}>
                TỔNG ĐIỀU CHỈNH:
              </Text>
              {isLoading ? (
                <Skeleton width="8rem" height="var(--spacing-5)" radius={2} />
              ) : (
                <Text
                  weight="bold"
                  color={
                    /** @type {any} */ (
                      netDelta > 0
                        ? 'meta-success'
                        : netDelta < 0
                          ? 'primary'
                          : 'meta-subtle'
                    )
                  }
                  hasTabularNumbers
                >
                  {formatDelta(netDelta)} {currency}
                </Text>
              )}
            </HStack>
          </HStack>
        </VStack>
      </Card>
    </VStack>
  );
}

/**
 * @param {MetaAnnexSummary & { unit: string, isLoading: boolean }} props
 */
function SummaryCard({
  label,
  value,
  note,
  tone,
  icon,
  noteIcon,
  unit,
  isLoading,
}) {
  const colors = SUMMARY_TONES[tone];
  return (
    <Card padding={6} xstyle={styles.card}>
      <VStack gap={4} hAlign="stretch">
        <HStack hAlign="between" vAlign="center" gap={2} wrap="nowrap">
          <Text weight="bold" color="secondary" xstyle={styles.caps}>
            {label}
          </Text>
          <HStack
            as="span"
            hAlign="center"
            vAlign="center"
            xstyle={[
              styles.bubble,
              styles.kpiBubble,
              bubbleTones[colors.bubble],
            ]}
          >
            <Icon icon={SUMMARY_ICONS[icon]} size="md" color="inherit" />
          </HStack>
        </HStack>
        {isLoading ? (
          <VStack gap={3} hAlign="stretch">
            <Skeleton width="55%" height="var(--spacing-8)" radius={2} />
            <Skeleton width="75%" height="var(--spacing-4)" radius={2} />
          </VStack>
        ) : (
          <VStack gap={3} hAlign="stretch">
            <HStack gap={1.5} wrap="wrap" xstyle={styles.baseline}>
              <Text
                size="3xl"
                weight="bold"
                color={/** @type {any} */ (colors.value)}
                hasTabularNumbers
                xstyle={styles.value}
              >
                {value}
              </Text>
              <Text weight="bold" color={/** @type {any} */ ('meta-subtle')}>
                {unit}
              </Text>
            </HStack>
            <HStack
              gap={1.5}
              vAlign="center"
              wrap="wrap"
              xstyle={styles.kpiFooter}
            >
              <Icon
                icon={noteIcon}
                size="sm"
                color={
                  /** @type {any} */ (
                    tone === 'success' ? 'meta-success' : 'secondary'
                  )
                }
              />
              <Text weight="medium" color={/** @type {any} */ (colors.note)}>
                {note}
              </Text>
            </HStack>
          </VStack>
        )}
      </VStack>
    </Card>
  );
}

const styles = stylex.create({
  responsiveGrid: {
    gridTemplateColumns: {
      // Keep Grid's own template: in production StyleX hashes this key to
      // the same one Grid uses, so `null` would drop Grid's columns.
      default: 'var(--x-gridTemplateColumns)',
      '@media (max-width: 599px)': 'minmax(0, 1fr)',
    },
  },
  card: {
    boxShadow: 'var(--meta-shadow-card)',
    minWidth: 0,
  },
  caps: {
    letterSpacing: '0.05em',
  },
  bubble: {
    borderRadius: 'var(--radius-full)',
    flexShrink: 0,
    height: 'var(--spacing-8)',
    width: 'var(--spacing-8)',
  },
  kpiBubble: {
    height: 'var(--spacing-9)',
    width: 'var(--spacing-9)',
  },
  baseline: {
    alignItems: 'baseline',
  },
  value: {
    lineHeight: 1,
  },
  kpiFooter: {
    borderTopColor: 'var(--color-border)',
    borderTopStyle: 'solid',
    borderTopWidth: 'var(--border-width)',
    paddingTop: 'var(--spacing-3)',
  },
  tableCard: {
    boxShadow: 'var(--meta-shadow-card)',
    overflow: 'hidden',
  },
  // Same edge treatment as the Meta payments / commission tables: the card
  // keeps its padding for the Astryx `Table` column inset, header/footer
  // bands bleed through the card's `--container-padding-*` vars.
  tableHeader: {
    borderBottomColor: 'var(--color-border)',
    borderBottomStyle: 'solid',
    borderBottomWidth: 'var(--border-width)',
    marginInline: 'calc(-1 * var(--container-padding-inline-start))',
    marginTop: 'calc(-1 * var(--container-padding-block-start))',
    paddingBlock: 'var(--spacing-5)',
    paddingInline: 'var(--container-padding-inline-start)',
  },
  table: {
    // eslint-disable-next-line @stylexjs/valid-styles
    '--color-background-muted': 'var(--meta-surface-container-low)',
    overflowX: 'auto',
  },
  footer: {
    backgroundColor: 'var(--meta-surface-container-low)',
    borderTopColor: 'var(--color-border)',
    borderTopStyle: 'solid',
    borderTopWidth: 'var(--border-width)',
    marginBottom: 'calc(-1 * var(--container-padding-block-end))',
    marginInline: 'calc(-1 * var(--container-padding-inline-start))',
    paddingBlock: 'var(--spacing-4)',
    paddingInline: 'var(--container-padding-inline-start)',
  },
  skeletonRow: {
    borderBottomColor: 'var(--color-border)',
    borderBottomStyle: 'solid',
    borderBottomWidth: 'var(--border-width)',
    paddingBlock: 'var(--spacing-6)',
  },
  emptyRow: {
    paddingBlock: 'var(--spacing-8)',
  },
});

const bubbleTones = stylex.create({
  accent: {
    backgroundColor: 'var(--meta-blue-wash)',
    color: 'var(--color-accent)',
  },
  success: {
    backgroundColor: 'var(--meta-emerald-wash)',
    color: 'var(--meta-emerald-fill)',
  },
  neutral: {
    backgroundColor: 'var(--meta-surface-container-low)',
    color: 'var(--color-text-secondary)',
  },
});
