'use client';

import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Divider } from '@astryxdesign/core/Divider';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { pixel, proportional, Table } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import {
  CircleCheck,
  CircleMinus,
  CirclePlus,
  Download,
  FilePen,
  FilePlus,
  FileText,
  Pencil,
  Printer,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

/**
 * Maritime theme — "Phụ lục (Annex)" tab body (`MaritimeTabNav` id `annex`):
 * 3 value-summary cards (original / increase / decrease) above a table of
 * contract annexes, built from the Figma frame `Container` (node 44:4355)
 * read via the Figma MCP bridge. Sizes follow the other Maritime panels'
 * desktop scale (14px body, 15px+ numerics) rather than Figma's 10-12px.
 *
 * All content is data: `summary` and `annexes` default to the mockup's own
 * values and are overridable props.
 * @param {{
 *   summary?: AnnexSummary[],
 *   annexes?: Annex[],
 *   currency?: string,
 *   hasNoteColumn?: boolean,
 *   onExport?: () => void,
 *   onCreate?: () => void,
 *   onEdit?: (id: string) => void,
 *   onPrint?: (id: string) => void,
 * }} props
 */
export function MaritimeAnnexListPanel({
  summary = DEFAULT_SUMMARY,
  annexes = DEFAULT_ANNEXES,
  currency = 'USD',
  hasNoteColumn = true,
  onExport,
  onCreate,
  onEdit,
  onPrint,
}) {
  /** @type {import('@astryxdesign/core/Table').TableColumn<Annex>[]} */
  const columns = [
    {
      key: 'code',
      header: 'MÃ PL',
      width: proportional(1.5),
      renderCell: (row) => (
        <Cell>
          <Text type="code" weight="bold" color="accent">
            {row.code}
          </Text>
        </Cell>
      ),
    },
    {
      key: 'number',
      header: 'SỐ PHỤ LỤC',
      width: proportional(2),
      renderCell: (row) => (
        <Cell>
          <Text type="code" weight="semibold">
            {row.number}
          </Text>
        </Cell>
      ),
    },
    {
      key: 'kind',
      header: 'PHÂN LOẠI',
      width: proportional(2.2),
      renderCell: (row) => (
        <Cell>
          <Pill
            tone={row.kind.tone}
            icon={KIND_ICONS[row.kind.icon]}
            label={row.kind.label}
          />
        </Cell>
      ),
    },
    {
      key: 'content',
      header: 'NỘI DUNG TÓM TẮT',
      width: proportional(3),
      renderCell: (row) => (
        <Cell>
          <Text>
            <Text as="span" weight="semibold">
              {row.title}
            </Text>
            {row.detail ? ` ${row.detail}` : ''}
          </Text>
        </Cell>
      ),
    },
    {
      key: 'value',
      header: 'GIÁ TRỊ ĐIỀU CHỈNH',
      width: proportional(1.6),
      align: 'end',
      renderCell: (row) => (
        <Cell isEnd>
          <Text
            type="code"
            weight="semibold"
            color={row.delta > 0 ? 'maritime-teal' : 'maritime-subtle'}
          >
            {`${formatDelta(row.delta)} ${currency}`}
          </Text>
        </Cell>
      ),
    },
    {
      key: 'date',
      header: 'NGÀY KÝ',
      width: proportional(1.2),
      renderCell: (row) => (
        <Cell>
          <Text type="code" color="maritime-muted">
            {row.signedAt}
          </Text>
        </Cell>
      ),
    },
    {
      key: 'signatures',
      header: 'TÌNH TRẠNG CHỮ KÝ',
      width: proportional(2),
      renderCell: (row) => (
        <VStack gap={1} hAlign="start" xstyle={styles.signCell}>
          {row.signatures.map((sig) => {
            const label = typeof sig === 'string' ? sig : sig.label;
            const isSigned = typeof sig === 'string' ? true : sig.isSigned;
            return (
              <Pill
                key={label}
                tone={isSigned ? 'success' : 'neutral'}
                icon={isSigned ? CircleCheck : CircleMinus}
                label={label}
              />
            );
          })}
        </VStack>
      ),
    },
    {
      key: 'actions',
      header: 'THAO TÁC',
      width: pixel(112),
      renderCell: (row) => (
        <Cell>
          <HStack gap={0.5} vAlign="center" wrap="nowrap">
            <IconButton
              label={`Sửa ${row.code}`}
              tooltip="Sửa"
              icon={<Icon icon={Pencil} size="sm" />}
              variant="ghost"
              size="md"
              onClick={() => onEdit?.(row.id)}
            />
            {onPrint ? (
              <IconButton
                label={`In ${row.code}`}
                tooltip="In"
                icon={<Icon icon={Printer} size="sm" />}
                variant="ghost"
                size="md"
                onClick={() => onPrint(row.id)}
              />
            ) : null}
          </HStack>
        </Cell>
      ),
    },
  ];

  const tableColumns = hasNoteColumn
    ? [...columns.slice(0, -1), NOTE_COLUMN, columns[columns.length - 1]]
    : columns;

  return (
    <VStack gap={4} hAlign="stretch">
      <Grid
        columns={{ minWidth: 280, max: 3, repeat: 'fill' }}
        gap={4}
        xstyle={styles.summaryGrid}
      >
        {summary.map((s) => (
          <Card
            key={s.label}
            padding={4}
            elevation="low"
            xstyle={[styles.borderCard, styles.summaryCard]}
          >
            <VStack gap={3} hAlign="stretch">
              <HStack hAlign="between" vAlign="center" wrap="nowrap" gap={3}>
                <Text
                  type="label"
                  weight="bold"
                  color="maritime-muted"
                  xstyle={styles.tracking}
                >
                  {s.label}
                </Text>
                <HStack
                  as="span"
                  hAlign="center"
                  vAlign="center"
                  xstyle={[styles.iconBox, iconTones[s.tone]]}
                >
                  <Icon
                    icon={SUMMARY_ICONS[s.icon]}
                    size="md"
                    color="inherit"
                  />
                </HStack>
              </HStack>
              <HStack
                gap={2}
                vAlign={/** @type {any} */ ('baseline')}
                wrap="nowrap"
              >
                <Text
                  type="code"
                  size="3xl"
                  weight="bold"
                  color={
                    s.tone === 'success'
                      ? 'maritime-teal'
                      : s.tone === 'muted'
                        ? 'maritime-subtle'
                        : undefined
                  }
                  xstyle={styles.statValue}
                >
                  {s.value}
                </Text>
                <Text weight="semibold" color="maritime-muted">
                  {currency}
                </Text>
              </HStack>
              <Divider />
              <HStack gap={1.5} vAlign="center" wrap="nowrap">
                <Icon
                  icon={s.noteIcon}
                  size="xsm"
                  color={
                    /** @type {any} */ (
                      s.tone === 'success' ? 'maritime-teal' : 'maritime-subtle'
                    )
                  }
                />
                <Text
                  color={
                    s.tone === 'success' ? 'maritime-teal' : 'maritime-subtle'
                  }
                >
                  {s.note}
                </Text>
              </HStack>
            </VStack>
          </Card>
        ))}
      </Grid>

      <Card padding={0} elevation="low" xstyle={styles.tableCard}>
        <HStack
          hAlign="between"
          vAlign="center"
          wrap="wrap"
          gap={3}
          xstyle={styles.header}
        >
          <VStack gap={0.5}>
            <Text as="h2" size="xl" weight="bold">
              Danh sách
            </Text>
          </VStack>
          <HStack gap={2} vAlign="center" wrap="nowrap">
            {onExport ? (
              <Button
                label="Xuất báo cáo phụ lục"
                size="md"
                variant="secondary"
                icon={<Icon icon={Download} size="xsm" />}
                onClick={onExport}
              />
            ) : null}
            <Button
              label="Thêm phụ lục mới"
              size="md"
              variant="primary"
              icon={<Icon icon={FilePlus} size="xsm" />}
              onClick={onCreate}
            />
          </HStack>
        </HStack>
        <Table
          columns={tableColumns}
          data={annexes}
          idKey="id"
          dividers="rows"
          density="spacious"
        />
      </Card>
    </VStack>
  );
}

/** @type {import('@astryxdesign/core/Table').TableColumn<Annex>} */
const NOTE_COLUMN = {
  key: 'note',
  header: 'GHI CHÚ / ĐÍNH KÈM',
  width: proportional(2.2),
  renderCell: (row) => (
    <Cell>
      <Text color="maritime-subtle">{row.note}</Text>
    </Cell>
  ),
};

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

/** @param {{ tone: 'blue' | 'success' | 'neutral', icon: import('react').ComponentType, label: string }} props */
function Pill({ tone, icon, label }) {
  return (
    <HStack
      as="span"
      vAlign="center"
      gap={1}
      wrap="nowrap"
      xstyle={[styles.pill, pillTones[tone]]}
    >
      <Icon icon={icon} size="xsm" color="inherit" />
      <span {...stylex.props(styles.pillLabel)}>{label}</span>
    </HStack>
  );
}

/** @param {number} n */
function formatDelta(n) {
  const abs = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2 });
  return `${n > 0 ? '+' : n < 0 ? '-' : ''}${abs}`;
}

/** @typedef {{ label: string, value: string, note: string, tone: 'neutral' | 'success' | 'muted', icon: 'file' | 'up' | 'down', noteIcon: import('react').ComponentType }} AnnexSummary */
/**
 * @typedef {{
 *   id: string,
 *   code: string,
 *   number: string,
 *   kind: { label: string, tone: 'blue' | 'success' | 'neutral', icon: 'increase' | 'decrease' | 'change' },
 *   title: string,
 *   detail?: string,
 *   delta: number,
 *   signedAt: string,
 *   signatures: Array<string | { label: string, isSigned: boolean }>,
 *   note?: string,
 * }} Annex
 */

const SUMMARY_ICONS = { file: FileText, up: TrendingUp, down: TrendingDown };
const KIND_ICONS = {
  increase: TrendingUp,
  decrease: TrendingDown,
  change: RefreshCw,
};

/** @type {AnnexSummary[]} */
const DEFAULT_SUMMARY = [
  {
    label: 'GIÁ TRỊ HỢP ĐỒNG GỐC',
    value: '$450,000.00',
    note: 'Giá trị hợp đồng ban đầu (HĐ gốc)',
    tone: 'neutral',
    icon: 'file',
    noteIcon: FilePen,
  },
  {
    label: 'PHÁT SINH TĂNG',
    value: '+$35,000.00',
    note: 'Tổng giá trị phụ lục tăng (01 phụ lục)',
    tone: 'success',
    icon: 'up',
    noteIcon: CirclePlus,
  },
  {
    label: 'PHÁT SINH GIẢM',
    value: '$0.00',
    note: 'Tổng giá trị phụ lục giảm (Không có)',
    tone: 'muted',
    icon: 'down',
    noteIcon: CircleMinus,
  },
];

/** @type {Annex[]} */
const DEFAULT_ANNEXES = [
  {
    id: 'an-01',
    code: 'AN-01',
    number: 'CT-2024/EXP-088/AN-01',
    kind: {
      label: 'Tăng giá trị (AmountIncrease)',
      tone: 'success',
      icon: 'increase',
    },
    title: 'Bổ sung 25 tấn phụ kiện thép gá lắp',
    detail: 'cho dự án Eco Smart City',
    delta: 35000,
    signedAt: '05/04/2024',
    signatures: ['Bên bán (Đã ký CA)', 'Bên mua (Đã ký DocuSign)'],
    note: 'Kèm bản scan hợp đồng và nghiệm thu kỹ thuật',
  },
  {
    id: 'an-02',
    code: 'AN-02',
    number: 'CT-2024/EXP-088/AN-02',
    kind: {
      label: 'Thay đổi thông tin (ValueChange)',
      tone: 'blue',
      icon: 'change',
    },
    title: 'Gia hạn lịch tàu chuyển hàng (Schedule Adjustment / ETD)',
    detail: 'do hãng tàu kẹt bãi Cát Lái',
    delta: 0,
    signedAt: '22/04/2024',
    signatures: ['Bên bán (Đã ký)', 'Bên mua (Đã ký)'],
    note: 'Điều chỉnh ngày giao chót đến 30/11/2024',
  },
];

const styles = stylex.create({
  tracking: { letterSpacing: '0.05em' },
  statValue: { letterSpacing: '-0.025em', lineHeight: 1.1 },
  borderCard: { borderColor: 'var(--color-border)' },
  summaryGrid: {
    gridTemplateColumns: 'repeat(3, minmax(0, 480px))',
    justifyContent: 'start',
  },
  summaryCard: { overflow: 'hidden' },
  tableCard: { borderColor: 'var(--color-border)', overflow: 'hidden' },
  header: {
    borderBottomColor: 'var(--color-border)',
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
    padding: 'var(--spacing-4)',
  },
  cell: { minHeight: '76px', width: '100%' },
  signCell: { paddingBlock: 'var(--spacing-2)' },
  iconBox: {
    borderRadius: 'var(--radius-inner)',
    height: '40px',
    width: '40px',
  },
  pill: {
    borderRadius: 'var(--radius-inner)',
    borderStyle: 'solid',
    borderWidth: '1px',
    flexShrink: 0,
    paddingBlock: '2px',
    paddingInline: 'var(--spacing-2)',
  },
  pillLabel: {
    color: 'inherit',
    fontSize: '14px',
    fontWeight: 600,
    lineHeight: '22px',
  },
});

const iconTones = stylex.create({
  neutral: {
    backgroundColor: 'var(--maritime-chip-bg)',
    color: 'var(--maritime-chip-text)',
  },
  success: {
    backgroundColor: 'var(--maritime-badge-success-bg)',
    color: 'var(--maritime-badge-success-text)',
  },
  muted: {
    backgroundColor: 'var(--maritime-badge-info-bg)',
    color: 'var(--maritime-badge-info-text)',
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
  neutral: {
    backgroundColor: 'var(--maritime-badge-neutral-bg)',
    borderColor: 'var(--maritime-badge-neutral-border)',
    color: 'var(--maritime-badge-neutral-text)',
  },
});
