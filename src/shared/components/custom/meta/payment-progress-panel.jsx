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
  Banknote,
  Check,
  CircleCheck,
  CirclePlus,
  ClipboardClock,
  Clock,
  Download,
  Eye,
  Hourglass,
  Landmark,
  ReceiptText,
} from 'lucide-react';

import { MetaPill } from './pill.jsx';

/**
 * @typedef {{
 *   id: string,
 *   code: string,
 *   amount: string,
 *   method: 'advance' | 'lc',
 *   condition: string,
 *   date: string,
 *   status: 'paid' | 'pending' | 'upcoming',
 *   statusLabel: string,
 *   note: string,
 * }} MetaPaymentRow
 *
 * @typedef {{
 *   contractPercent: number,
 *   annexPercent: number,
 *   contractLabel: string,
 *   annexLabel?: string,
 *   annexCount: number,
 * }} MetaSettlementBreakdown
 */

const STATUS_TONES = /** @type {const} */ ({
  paid: 'success',
  pending: 'accent',
  upcoming: 'muted',
});

// Code / amount colors per row status — Figma: paid amounts emerald, the
// one being reconciled cobalt, not-yet-due rows greyed out.
const CODE_COLOR = {
  paid: 'accent',
  pending: 'accent',
  upcoming: 'meta-subtle',
};
const AMOUNT_COLOR = {
  paid: 'meta-success',
  pending: 'accent',
  upcoming: 'meta-subtle',
};

/**
 * "Meta" contract-detail "Tiến độ thanh toán" tab — Figma node 94:1936:
 * three KPI cards (Tổng giá trị hợp đồng / Đã thu / Còn thu, each with a
 * progress line and a footnote) above a "Tiến độ thanh toán chi tiết"
 * table card (header with "+ Thêm đợt thanh toán", one row per payment,
 * "Tổng đã thu" footer). `isLoading` swaps
 * figures and rows for `Skeleton`s. Composed from Astryx `Card` / `Grid` /
 * `Table` / `Button` / `IconButton` / `Skeleton` + `MetaPill` (golden
 * rule #15).
 *
 * @param {{
 *   unit: string,
 *   amountHeader: string,
 *   totalValue: string,
 *   settlementBreakdown: MetaSettlementBreakdown,
 *   paidValue: string,
 *   paidPercent: number,
 *   remainingValue: string,
 *   payments: MetaPaymentRow[],
 *   paidTotalValue: string,
 *   onAddPayment?: () => void,
 *   onViewPayment?: (id: string) => void,
 *   onDownloadPayment?: (id: string) => void,
 *   isLoading?: boolean,
 * }} props
 */
export function MetaPaymentProgressPanel({
  unit,
  amountHeader,
  totalValue,
  settlementBreakdown,
  paidValue,
  paidPercent,
  remainingValue,
  payments,
  paidTotalValue,
  onAddPayment,
  onViewPayment,
  onDownloadPayment,
  isLoading = false,
}) {
  const remainingPercent = Math.max(0, 100 - paidPercent);

  /** @type {import('@astryxdesign/core/Table').TableColumn<MetaPaymentRow & Record<string, unknown>>[]} */
  const columns = [
    {
      key: 'code',
      header: 'Mã đợt',
      width: proportional(0.8),
      renderCell: (row) => (
        <Text
          type="inherit"
          weight="bold"
          color={/** @type {any} */ (CODE_COLOR[row.status])}
        >
          {row.code}
        </Text>
      ),
    },
    {
      key: 'amount',
      header: amountHeader,
      width: proportional(1.1),
      align: 'end',
      renderCell: (row) => (
        <Text
          type="inherit"
          weight="bold"
          color={/** @type {any} */ (AMOUNT_COLOR[row.status])}
          hasTabularNumbers
        >
          {row.amount}
        </Text>
      ),
    },
    {
      key: 'condition',
      header: 'Hình thức / Điều kiện',
      width: proportional(1.7),
      renderCell: (row) => (
        <HStack gap={2} vAlign="center" wrap="nowrap">
          <Icon
            icon={
              row.status === 'upcoming'
                ? CircleCheck
                : row.method === 'lc'
                  ? Landmark
                  : Banknote
            }
            size="sm"
            color={row.status === 'upcoming' ? 'secondary' : 'accent'}
          />
          <Text type="inherit" weight="semibold">
            {row.condition}
          </Text>
        </HStack>
      ),
    },
    {
      key: 'date',
      header: 'Ngày thanh toán',
      width: proportional(1.3),
      renderCell: (row) => (
        <Text type="inherit" color="secondary" hasTabularNumbers>
          {row.date}
        </Text>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      width: proportional(1.5),
      renderCell: (row) => (
        <MetaPill
          label={row.statusLabel}
          tone={STATUS_TONES[row.status]}
          hasDot
        />
      ),
    },
    {
      key: 'note',
      header: 'Ghi chú / Chứng từ',
      width: proportional(2.7),
      renderCell: (row) => (
        <Text type="inherit" color="secondary">
          {row.note}
        </Text>
      ),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      width: pixel(112),
      renderCell: (row) => (
        <HStack gap={1} vAlign="center" wrap="nowrap">
          <IconButton
            label={`Xem ${row.code}`}
            tooltip="Xem"
            icon={<Icon icon={Eye} size="sm" />}
            variant="ghost"
            size="sm"
            onClick={() => onViewPayment?.(row.id)}
          />
          {onDownloadPayment ? (
            <IconButton
              label={`Tải chứng từ ${row.code}`}
              tooltip="Tải chứng từ"
              icon={<Icon icon={Download} size="sm" />}
              variant="ghost"
              size="sm"
              onClick={() => onDownloadPayment(row.id)}
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
        xstyle={styles.kpiGrid}
      >
        <KpiCard
          label="TỔNG GIÁ TRỊ HỢP ĐỒNG"
          icon={Banknote}
          iconTone="accent"
          value={totalValue}
          unit={unit}
          progressLabel="Tiến độ hoàn tất"
          progressValue="100% Quyết toán"
          progressTone="accent"
          segments={[
            { percent: settlementBreakdown.contractPercent, tone: 'accent' },
            { percent: settlementBreakdown.annexPercent, tone: 'success' },
          ]}
          isLoading={isLoading}
          footer={
            <HStack gap={3} vAlign="center" wrap="wrap">
              <HStack gap={1.5} vAlign="center" wrap="nowrap">
                <HStack as="span" xstyle={[styles.dot, dotTones.accent]} />
                <Text color="secondary">
                  HĐ gốc:{' '}
                  <Text
                    as="span"
                    type="inherit"
                    weight="bold"
                    color="primary"
                    hasTabularNumbers
                  >
                    {settlementBreakdown.contractLabel}
                  </Text>
                </Text>
              </HStack>
              {settlementBreakdown.annexLabel ? (
                <HStack gap={1.5} vAlign="center" wrap="nowrap">
                  <HStack as="span" xstyle={[styles.dot, dotTones.success]} />
                  <Text color="secondary">
                    {`${settlementBreakdown.annexCount} Phụ lục: `}
                    <Text
                      as="span"
                      type="inherit"
                      weight="bold"
                      color={/** @type {any} */ ('meta-success')}
                      hasTabularNumbers
                    >
                      {settlementBreakdown.annexLabel}
                    </Text>
                  </Text>
                </HStack>
              ) : null}
            </HStack>
          }
        />

        <KpiCard
          label="ĐÃ THU"
          labelColor="meta-success-deep"
          dotTone="success"
          pill={{ label: `${paidPercent}%`, tone: 'success', icon: Check }}
          icon={CircleCheck}
          iconTone="success"
          value={paidValue}
          valueColor="meta-success"
          unit={unit}
          progressLabel="Tiến độ thực thu"
          progressValue={`${paidPercent}%`}
          progressTone="success"
          segments={[{ percent: paidPercent, tone: 'success' }]}
          isLoading={isLoading}
          footer={
            // Figma 94:1937 (updated): icon only, no footnote text.
            <Icon
              icon={Landmark}
              size="md"
              color={/** @type {any} */ ('meta-success')}
            />
          }
        />

        <KpiCard
          label="CÒN THU"
          dotTone="amber"
          pill={{
            label: `${remainingPercent}%`,
            tone: 'neutral',
            icon: Hourglass,
          }}
          icon={ClipboardClock}
          iconTone="neutral"
          value={remainingValue}
          unit={unit}
          progressLabel="Tỷ lệ chờ giải ngân"
          progressValue={`${remainingPercent}%`}
          progressTone="primary"
          segments={[{ percent: remainingPercent, tone: 'amber' }]}
          isLoading={isLoading}
          footer={<Icon icon={Clock} size="md" color="secondary" />}
        />
      </Grid>

      <Card padding={6} xstyle={styles.tableCard}>
        <VStack hAlign="stretch">
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
                xstyle={[styles.iconBubble, bubbleTones.accent]}
              >
                <Icon icon={ReceiptText} size="sm" color="inherit" />
              </HStack>
              <VStack gap={0}>
                <Heading level={3}>Tiến độ thanh toán chi tiết</Heading>
                <Text size="sm" color="secondary">
                  Quản lý các đợt giải ngân, đối soát UNC và hạn chứng từ thanh
                  toán
                </Text>
              </VStack>
            </HStack>
            {onAddPayment ? (
              <Button
                label="+ Thêm đợt thanh toán"
                variant="primary"
                icon={<Icon icon={CirclePlus} size="sm" />}
                onClick={onAddPayment}
              />
            ) : null}
          </HStack>

          {isLoading ? (
            <VStack gap={0} hAlign="stretch">
              {[0, 1, 2].map((index) => (
                <HStack
                  key={index}
                  gap={6}
                  vAlign="center"
                  xstyle={styles.skeletonRow}
                >
                  <Skeleton
                    width="8%"
                    height="var(--spacing-4)"
                    radius={2}
                    index={index}
                  />
                  <Skeleton
                    width="12%"
                    height="var(--spacing-4)"
                    radius={2}
                    index={index}
                  />
                  <Skeleton
                    width="16%"
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
                    width="10%"
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
                </HStack>
              ))}
            </VStack>
          ) : payments.length === 0 ? (
            <HStack hAlign="center" xstyle={styles.emptyRow}>
              <Text color="secondary">Chưa có đợt thanh toán nào.</Text>
            </HStack>
          ) : (
            <Table
              columns={columns}
              data={/** @type {any} */ (payments)}
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
              <Skeleton width="14rem" height="var(--spacing-4)" radius={2} />
            ) : (
              <Text weight="medium" color="secondary">
                Tổng số {payments.length} đợt thanh toán chính
              </Text>
            )}
            <HStack gap={2} vAlign="center" wrap="nowrap">
              <Text size="sm" weight="bold">
                TỔNG ĐÃ THU:
              </Text>
              {isLoading ? (
                <Skeleton width={120} height="var(--spacing-5)" radius={2} />
              ) : (
                <Text
                  weight="bold"
                  color={/** @type {any} */ ('meta-success')}
                  hasTabularNumbers
                >
                  {paidTotalValue}
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
 * @param {{
 *   label: string,
 *   labelColor?: string,
 *   dotTone?: 'success' | 'amber',
 *   pill?: { label: string, tone: 'success' | 'neutral', icon: import('react').ComponentType },
 *   icon: import('react').ComponentType,
 *   iconTone: 'accent' | 'success' | 'neutral',
 *   value: string,
 *   valueColor?: string,
 *   unit: string,
 *   progressLabel: string,
 *   progressValue: string,
 *   progressTone: 'accent' | 'success' | 'primary',
 *   segments: Array<{ percent: number, tone: 'accent' | 'success' | 'amber' }>,
 *   footer: import('react').ReactNode,
 *   isLoading: boolean,
 * }} props
 */
function KpiCard({
  label,
  labelColor = 'secondary',
  dotTone,
  pill,
  icon,
  iconTone,
  value,
  valueColor = 'primary',
  unit,
  progressLabel,
  progressValue,
  progressTone,
  segments,
  footer,
  isLoading,
}) {
  return (
    <Card padding={6} xstyle={styles.kpiCard}>
      <VStack gap={4} hAlign="stretch">
        <HStack hAlign="between" vAlign="center" gap={2} wrap="nowrap">
          <HStack gap={2} vAlign="center" wrap="nowrap">
            {dotTone ? (
              <HStack as="span" xstyle={[styles.dot, dotTones[dotTone]]} />
            ) : null}
            <Text
              weight="bold"
              color={/** @type {any} */ (labelColor)}
              xstyle={styles.caps}
            >
              {label}
            </Text>
            {pill && !isLoading ? (
              <MetaPill
                label={pill.label}
                tone={pill.tone}
                icon={pill.icon}
                hasBorder
              />
            ) : null}
          </HStack>
          <HStack
            as="span"
            hAlign="center"
            vAlign="center"
            xstyle={[
              styles.iconBubble,
              styles.kpiBubble,
              bubbleTones[iconTone],
            ]}
          >
            <Icon icon={icon} size="md" color="inherit" />
          </HStack>
        </HStack>

        {isLoading ? (
          <VStack gap={3} hAlign="stretch">
            <Skeleton width="55%" height="var(--spacing-8)" radius={2} />
            <Skeleton width="100%" height="var(--spacing-2)" radius="rounded" />
            <Skeleton width="70%" height="var(--spacing-4)" radius={2} />
          </VStack>
        ) : (
          <VStack gap={3} hAlign="stretch">
            <HStack gap={1.5} wrap="wrap" xstyle={styles.baseline}>
              <Text
                size="3xl"
                weight="bold"
                color={/** @type {any} */ (valueColor)}
                hasTabularNumbers
                xstyle={styles.value}
              >
                {value}
              </Text>
              <Text weight="bold" color={/** @type {any} */ ('meta-subtle')}>
                {unit}
              </Text>
            </HStack>

            <VStack gap={2} hAlign="stretch">
              <HStack hAlign="between" vAlign="center" gap={2}>
                <Text weight="medium" color="secondary">
                  {progressLabel}
                </Text>
                <Text
                  weight="bold"
                  color={
                    /** @type {any} */ (
                      progressTone === 'success' ? 'meta-success' : progressTone
                    )
                  }
                  hasTabularNumbers
                >
                  {progressValue}
                </Text>
              </HStack>
              <HStack gap={0.5} xstyle={styles.track}>
                {segments.map((segment, index) =>
                  segment.percent > 0 ? (
                    <HStack
                      key={`${segment.tone}-${index}`}
                      as="span"
                      xstyle={[
                        styles.segment,
                        segmentTones[segment.tone],
                        styles.width(segment.percent),
                      ]}
                    />
                  ) : null,
                )}
              </HStack>
            </VStack>

            <HStack xstyle={styles.kpiFooter}>{footer}</HStack>
          </VStack>
        )}
      </VStack>
    </Card>
  );
}

const styles = stylex.create({
  kpiGrid: {
    gridTemplateColumns: {
      default: null,
      '@media (max-width: 599px)': 'minmax(0, 1fr)',
    },
  },
  kpiCard: {
    boxShadow: 'var(--meta-shadow-card)',
    minWidth: 0,
  },
  caps: {
    letterSpacing: '0.05em',
  },
  dot: {
    borderRadius: 'var(--radius-full)',
    flexShrink: 0,
    height: 'var(--spacing-2)',
    width: 'var(--spacing-2)',
  },
  iconBubble: {
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
  // Same track as the overview tab's metric cards
  // (`overview-summary-card.jsx` `track` + `metricTrack`).
  track: {
    backgroundColor: 'var(--meta-hairline)',
    borderRadius: 'var(--radius-full)',
    height: 'var(--spacing-2)',
    overflow: 'hidden',
    padding: 'var(--spacing-0-5)',
    width: '100%',
  },
  segment: {
    borderRadius: 'var(--radius-full)',
    display: 'block',
    height: '100%',
  },
  width: (percent) => ({ width: `${percent}%` }),
  kpiFooter: {
    borderTopColor: 'var(--color-border)',
    borderTopStyle: 'solid',
    borderTopWidth: 'var(--border-width)',
    paddingTop: 'var(--spacing-2)',
  },
  tableCard: {
    boxShadow: 'var(--meta-shadow-card)',
    overflow: 'hidden',
  },
  // The card keeps its 24px padding so Astryx `Table` aligns its first /
  // last columns to it and bleeds its header band edge to edge; the
  // header and footer bands bleed the same way through the card's
  // `--container-padding-*` vars.
  tableHeader: {
    borderBottomColor: 'var(--color-border)',
    borderBottomStyle: 'solid',
    borderBottomWidth: 'var(--border-width)',
    marginInline: 'calc(-1 * var(--container-padding-inline-start))',
    marginTop: 'calc(-1 * var(--container-padding-block-start))',
    paddingBlock: 'var(--spacing-5)',
    paddingInline: 'var(--container-padding-inline-start)',
  },
  // Figma header band is the lavender `surface-container-low`, one step
  // darker than the list table's `--color-background-muted` band.
  table: {
    // eslint-disable-next-line @stylexjs/valid-styles
    '--color-background-muted': 'var(--meta-surface-container-low)',
    overflowX: 'auto',
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
});

const dotTones = stylex.create({
  accent: { backgroundColor: 'var(--color-accent)' },
  success: { backgroundColor: 'var(--meta-emerald-fill)' },
  amber: { backgroundColor: 'var(--meta-amber)' },
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
    color: 'var(--color-text-primary)',
  },
});

const segmentTones = stylex.create({
  accent: { backgroundColor: 'var(--color-accent)' },
  success: { backgroundColor: 'var(--meta-emerald-fill)' },
  amber: { backgroundColor: 'var(--meta-amber)' },
});
