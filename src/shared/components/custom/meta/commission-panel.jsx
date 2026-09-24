'use client';

import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { EmptyState } from '@astryxdesign/core/EmptyState';
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
  CalendarDays,
  CircleCheck,
  CirclePlus,
  ClipboardClock,
  Clock,
  Download,
  Eye,
  HandCoins,
  Info,
  Landmark,
  Pencil,
  ShieldCheck,
} from 'lucide-react';

import { MetaPill } from './pill.jsx';

/**
 * @typedef {[string, string, ('code' | 'accent')?]} MetaKeyValue
 *   `[label, value, emphasis]` — `code`/`accent` render the value bold in
 *   cobalt (tax code, reference numbers).
 * @typedef {{ label: string, value: string, note: string, tone: 'neutral' | 'success' | 'accent' }} MetaCommissionSummary
 * @typedef {{ label: string, signedLabel: string, isSigned: boolean, code: string, name: string, rows: MetaKeyValue[] }} MetaCommissionBroker
 * @typedef {{ title: string, status?: string, shortName: string, fullName: string, account: string, swift: string, rows: MetaKeyValue[], note?: string, emptyMessage?: string }} MetaCommissionBank
 *   `emptyMessage` replaces the whole body (no account on file).
 * @typedef {{ id: string, no: string, usd: string, vnd?: string, paidNote?: string, method: string, paid: boolean }} MetaCommissionPayment
 *   `paidNote` ("Đã chi 20/09/2026", "Đã chi 1,000.00") sits under the
 *   amount — the table has no separate status column.
 */

const SUMMARY_ICONS = [Banknote, CircleCheck, ClipboardClock];

const SUMMARY_TONES = /** @type {const} */ ({
  neutral: {
    label: 'meta-subtle',
    value: 'primary',
    note: 'secondary',
    bubble: 'accent',
  },
  success: {
    label: 'meta-green',
    value: 'meta-green',
    note: 'meta-green',
    bubble: 'green',
  },
  accent: {
    label: 'accent',
    value: 'accent',
    note: 'secondary',
    bubble: 'accent',
  },
});

/**
 * "Meta" commission cards (Figma 102:4272), composed by the contract
 * Commission tab and the commission detail page: `MetaCommissionSummaryCards`
 * (3 KPI cards), `MetaCommissionParties` (broker card, plus the
 * beneficiary-bank card when `bank` is given) and `MetaCommissionTrackingCard`
 * ("Đợt chi hoa hồng": one row per installment and a totals band).
 * `isLoading` swaps figures and rows for `Skeleton`s. Composed from Astryx
 * `Card` / `Grid` / `Table` / `Button` / `IconButton` / `Skeleton` +
 * `MetaPill` (golden rule #15).
 *
 * @param {{
 *   currency: string,
 *   summary: MetaCommissionSummary[],
 *   isLoading?: boolean,
 * }} props
 */
export function MetaCommissionSummaryCards({
  currency,
  summary,
  isLoading = false,
}) {
  return (
    <Grid
      columns={{ minWidth: 300, max: 3 }}
      maxWidth="calc(3 * var(--meta-panel-card-max) + 2 * var(--spacing-4))"
      gap={4}
      xstyle={styles.responsiveGrid}
    >
      {summary.map((item, index) => (
        <SummaryCard
          key={item.label}
          {...item}
          icon={SUMMARY_ICONS[index] ?? Banknote}
          unit={currency}
          isLoading={isLoading}
        />
      ))}
    </Grid>
  );
}

/**
 * Broker card, with the beneficiary-bank card beside it when `bank` is
 * given (the broker alone spans the row).
 * @param {{
 *   broker: MetaCommissionBroker,
 *   bank?: MetaCommissionBank,
 *   isLoading?: boolean,
 * }} props
 */
export function MetaCommissionParties({ broker, bank, isLoading = false }) {
  return (
    <Grid
      columns={{ minWidth: 420, max: bank ? 2 : 1 }}
      gap={4}
      xstyle={[styles.responsiveGrid, styles.alignStart]}
    >
      <BrokerCard broker={broker} isLoading={isLoading} />
      {bank ? <BankCard bank={bank} isLoading={isLoading} /> : null}
    </Grid>
  );
}

/**
 * "Đợt chi hoa hồng" card.
 * @param {{
 *   currency: string,
 *   payments: MetaCommissionPayment[],
 *   totals: { label: string, usd: string, summary: string, vnd?: string },
 *   hasReceiptDownload?: boolean,
 *   createLabel?: string,
 *   tableTitle?: string,
 *   onExport?: () => void,
 *   onCreate?: () => void,
 *   onView?: (id: string) => void,
 *   onAction?: (id: string) => void,
 *   isLoading?: boolean,
 * }} props
 */
export function MetaCommissionTrackingCard({
  currency,
  payments,
  totals,
  hasReceiptDownload = true,
  createLabel = 'Thêm lần chi',
  tableTitle = 'Đợt chi hoa hồng',
  onExport,
  onCreate,
  onView,
  onAction,
  isLoading = false,
}) {
  /** @type {import('@astryxdesign/core/Table').TableColumn<MetaCommissionPayment & Record<string, unknown>>[]} */
  const columns = [
    {
      key: 'no',
      header: 'Đợt thanh toán',
      width: proportional(1.2),
      renderCell: (row) => (
        <HStack gap={3} vAlign="center" wrap="nowrap">
          <HStack
            as="span"
            hAlign="center"
            vAlign="center"
            xstyle={[
              styles.numberBubble,
              row.paid ? bubbleTones.green : bubbleTones.accent,
            ]}
          >
            <Text as="span" type="inherit" weight="bold" color="inherit">
              {row.no}
            </Text>
          </HStack>
          <Text type="inherit" weight="semibold">
            Đợt {row.no}
          </Text>
        </HStack>
      ),
    },
    {
      key: 'usd',
      header: `Số tiền hoa hồng (${currency})`,
      width: proportional(1.4),
      align: 'end',
      renderCell: (row) => (
        <VStack gap={0} hAlign="end">
          <Text
            type="inherit"
            weight="bold"
            color={/** @type {any} */ (row.paid ? 'meta-green' : 'accent')}
            hasTabularNumbers
          >
            {row.usd} {currency}
          </Text>
          {row.paidNote ? (
            <Text
              size="sm"
              color={/** @type {any} */ ('meta-subtle')}
              hasTabularNumbers
            >
              {row.paidNote}
            </Text>
          ) : null}
          {row.vnd ? (
            <Text
              size="sm"
              color={/** @type {any} */ ('meta-subtle')}
              hasTabularNumbers
            >
              ≈ {row.vnd} VNĐ
            </Text>
          ) : null}
        </VStack>
      ),
    },
    {
      key: 'method',
      header: 'Điều kiện thanh toán',
      width: proportional(1.9),
      renderCell: (row) => (
        <HStack gap={1.5} vAlign="center" wrap="nowrap">
          <Icon
            icon={CalendarDays}
            size="sm"
            color={row.paid ? 'secondary' : 'accent'}
          />
          <Text type="inherit" color="secondary" maxLines={1}>
            {row.method}
          </Text>
        </HStack>
      ),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      width: pixel(120),
      renderCell: (row) => (
        <HStack gap={1} vAlign="center" wrap="nowrap">
          <IconButton
            label={`Xem đợt ${row.no}`}
            tooltip="Xem"
            icon={<Icon icon={Eye} size="sm" />}
            variant="ghost"
            size="sm"
            onClick={() => onView?.(row.id)}
          />
          {row.paid && !hasReceiptDownload ? null : (
            <IconButton
              label={
                row.paid ? `Tải chứng từ đợt ${row.no}` : `Sửa đợt ${row.no}`
              }
              tooltip={row.paid ? 'Tải chứng từ' : 'Sửa'}
              icon={<Icon icon={row.paid ? Download : Pencil} size="sm" />}
              variant="ghost"
              size="sm"
              onClick={() => onAction?.(row.id)}
            />
          )}
        </HStack>
      ),
    },
  ];

  return (
    <Card padding={6} xstyle={styles.tableCard}>
      <VStack gap={0} hAlign="stretch">
        <HStack
          hAlign="between"
          vAlign="center"
          gap={3}
          wrap="wrap"
          xstyle={styles.tableHeader}
        >
          <Heading level={3}>{tableTitle}</Heading>
          <HStack gap={2} vAlign="center" wrap="wrap">
            {onExport ? (
              <Button
                label="Xuất Excel"
                variant="secondary"
                icon={
                  <Icon
                    icon={Download}
                    size="sm"
                    color={/** @type {any} */ ('meta-green')}
                  />
                }
                onClick={onExport}
              />
            ) : null}
            {onCreate ? (
              <Button
                label={createLabel}
                variant="primary"
                icon={<Icon icon={CirclePlus} size="sm" />}
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
                width="12%"
                height="var(--spacing-6)"
                radius="rounded"
                index={index}
              />
              <Skeleton
                width="16%"
                height="var(--spacing-4)"
                radius={2}
                index={index}
              />
              <Skeleton
                width="22%"
                height="var(--spacing-4)"
                radius={2}
                index={index}
              />
              <Skeleton
                width="16%"
                height="var(--spacing-6)"
                radius="rounded"
                index={index}
              />
            </HStack>
          ))
        ) : payments.length === 0 ? (
          <HStack hAlign="center" xstyle={styles.emptyRow}>
            <Text color="secondary">Chưa có đợt chi hoa hồng nào.</Text>
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
          gap={4}
          wrap="wrap"
          xstyle={[styles.band, styles.footnoteBand]}
        >
          <HStack gap={6} vAlign="center" wrap="wrap">
            <Text
              size="sm"
              weight="bold"
              color="secondary"
              xstyle={styles.caps}
            >
              {totals.label}
            </Text>
            {isLoading ? (
              <Skeleton width="8rem" height="var(--spacing-5)" radius={2} />
            ) : (
              <Text weight="bold" hasTabularNumbers>
                {totals.usd}
              </Text>
            )}
          </HStack>
          {!isLoading && totals.summary ? (
            <Text
              weight="semibold"
              color={/** @type {any} */ ('meta-green')}
              hasTabularNumbers
            >
              {totals.summary}
            </Text>
          ) : null}
          {!isLoading && totals.vnd ? (
            <Text weight="bold" color="secondary" hasTabularNumbers>
              ~{totals.vnd} VNĐ
            </Text>
          ) : null}
        </HStack>
      </VStack>
    </Card>
  );
}

/**
 * @param {MetaCommissionSummary & {
 *   icon: import('react').ComponentType,
 *   unit: string,
 *   isLoading: boolean,
 * }} props
 */
function SummaryCard({ label, value, note, tone, icon, unit, isLoading }) {
  const colors = SUMMARY_TONES[tone];
  return (
    <Card padding={5} xstyle={styles.card}>
      <VStack gap={3} hAlign="stretch">
        <HStack hAlign="between" vAlign="center" gap={2} wrap="nowrap">
          <HStack gap={1.5} vAlign="center" wrap="nowrap">
            {tone !== 'neutral' ? (
              <HStack
                as="span"
                xstyle={[
                  styles.dot,
                  tone === 'success' ? dotTones.green : dotTones.accent,
                ]}
              />
            ) : null}
            <Text
              weight="bold"
              color={/** @type {any} */ (colors.label)}
              xstyle={styles.caps}
            >
              {label}
            </Text>
          </HStack>
          <HStack
            as="span"
            hAlign="center"
            vAlign="center"
            xstyle={[styles.bubble, bubbleTones[colors.bubble]]}
          >
            <Icon icon={icon} size="md" color="inherit" />
          </HStack>
        </HStack>
        {isLoading ? (
          <VStack gap={2} hAlign="stretch">
            <Skeleton width="55%" height="var(--spacing-8)" radius={2} />
            <Skeleton width="45%" height="var(--spacing-4)" radius={2} />
          </VStack>
        ) : (
          <VStack gap={1} hAlign="stretch">
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
              <Text
                weight="semibold"
                color={/** @type {any} */ ('meta-subtle')}
              >
                {unit}
              </Text>
            </HStack>
            <Text weight="medium" color={/** @type {any} */ (colors.note)}>
              {note}
            </Text>
          </VStack>
        )}
      </VStack>
    </Card>
  );
}

/**
 * The Commission tab before a commission exists: one centered empty state
 * with the create action, instead of the full layout filled with blanks.
 * @param {{ createLabel?: string, onCreate?: () => void, isLoading?: boolean }} props
 */
export function MetaCommissionEmptyState({
  createLabel = 'Tạo Commission',
  onCreate,
  isLoading = false,
}) {
  return (
    <Card padding={6} xstyle={styles.card}>
      {isLoading ? (
        <VStack gap={3} hAlign="center" xstyle={styles.emptyState}>
          <Skeleton
            width="var(--spacing-12)"
            height="var(--spacing-12)"
            radius="rounded"
          />
          <Skeleton width="16rem" height="var(--spacing-5)" radius={2} />
          <Skeleton width="22rem" height="var(--spacing-4)" radius={2} />
        </VStack>
      ) : (
        <EmptyState
          icon={<Icon icon={HandCoins} size="lg" color="accent" />}
          title="Hợp đồng này chưa có Commission"
          description="Tạo thỏa thuận hoa hồng để theo dõi bên nhận, kế hoạch chi và các lần đã chi."
          actions={
            onCreate ? (
              <Button
                label={createLabel}
                variant="primary"
                icon={<Icon icon={CirclePlus} size="sm" />}
                onClick={onCreate}
              />
            ) : undefined
          }
          xstyle={styles.emptyState}
        />
      )}
    </Card>
  );
}

/** @param {{ broker: MetaCommissionBroker, isLoading: boolean }} props */
function BrokerCard({ broker, isLoading }) {
  return (
    <Card padding={5} xstyle={styles.card}>
      <VStack gap={3} hAlign="stretch">
        <HStack
          hAlign="between"
          vAlign="center"
          gap={2}
          wrap="wrap"
          xstyle={styles.cardHeader}
        >
          <HStack gap={2} vAlign="center" wrap="nowrap">
            <Icon icon={HandCoins} size="sm" color="accent" />
            <Text size="sm" weight="bold" color="accent" xstyle={styles.caps}>
              {broker.label}
            </Text>
          </HStack>
          <HStack gap={1.5} vAlign="center" wrap="wrap">
            <MetaPill
              label={broker.signedLabel}
              tone={broker.isSigned ? 'green' : 'muted'}
              icon={broker.isSigned ? CircleCheck : Clock}
              size="sm"
            />
            <MetaPill label={broker.code} tone="neutral" hasBorder size="sm" />
          </HStack>
        </HStack>
        {isLoading ? (
          <VStack gap={2} hAlign="stretch">
            <Skeleton width="60%" height="var(--spacing-5)" radius={2} />
            <Skeleton height="calc(var(--spacing-12) * 2)" radius={3} />
          </VStack>
        ) : (
          <>
            <Heading level={4} accessibilityLevel={3}>
              {broker.name}
            </Heading>
            <VStack gap={2} hAlign="stretch" xstyle={styles.inset}>
              <KeyValueRows rows={broker.rows} />
            </VStack>
          </>
        )}
      </VStack>
    </Card>
  );
}

/** @param {{ bank: MetaCommissionBank, isLoading: boolean }} props */
function BankCard({ bank, isLoading }) {
  return (
    <Card padding={5} xstyle={styles.card}>
      <VStack gap={3} hAlign="stretch">
        <HStack
          hAlign="between"
          vAlign="center"
          gap={2}
          wrap="wrap"
          xstyle={styles.cardHeader}
        >
          <HStack gap={2} vAlign="center" wrap="nowrap">
            <Icon icon={Landmark} size="sm" color="accent" />
            <Text size="sm" weight="bold" xstyle={styles.caps}>
              {bank.title}
            </Text>
          </HStack>
          {bank.status ? (
            <MetaPill label={bank.status} tone="green" icon={ShieldCheck} />
          ) : null}
        </HStack>
        {isLoading ? (
          <Skeleton height="calc(var(--spacing-12) * 3)" radius={3} />
        ) : bank.emptyMessage ? (
          <HStack gap={2} vAlign="center" xstyle={styles.inset}>
            <Icon icon={Info} size="sm" color="secondary" />
            <Text color="secondary">{bank.emptyMessage}</Text>
          </HStack>
        ) : (
          <>
            <VStack gap={1} hAlign="stretch" xstyle={styles.inset}>
              <HStack hAlign="between" vAlign="center" gap={3}>
                <Text size="sm" weight="medium" color="secondary">
                  Ngân hàng thụ hưởng:
                </Text>
                <Text weight="bold" color="accent">
                  {bank.shortName}
                </Text>
              </HStack>
              {bank.fullName && bank.fullName !== bank.shortName ? (
                <Text weight="semibold">{bank.fullName}</Text>
              ) : null}
              <Grid
                columns={bank.swift ? 2 : 1}
                gap={2}
                xstyle={styles.bankNumbers}
              >
                <VStack gap={0}>
                  <Text
                    size="sm"
                    weight="medium"
                    color="secondary"
                    xstyle={styles.caps}
                  >
                    TÀI KHOẢN USD / VND:
                  </Text>
                  <Text weight="bold" hasTabularNumbers>
                    {bank.account}
                  </Text>
                </VStack>
                {bank.swift ? (
                  <VStack gap={0}>
                    <Text
                      size="sm"
                      weight="medium"
                      color="secondary"
                      xstyle={styles.caps}
                    >
                      MÃ SWIFT:
                    </Text>
                    <Text weight="bold">{bank.swift}</Text>
                  </VStack>
                ) : null}
              </Grid>
            </VStack>
            <VStack gap={0} hAlign="stretch" xstyle={styles.detailRows}>
              {bank.rows.map(([label, value], index) => (
                <HStack
                  key={`${label}-${index}`}
                  hAlign="between"
                  vAlign="center"
                  gap={3}
                  xstyle={[
                    styles.detailRow,
                    index < bank.rows.length - 1 && styles.detailDivider,
                  ]}
                >
                  <Text color="secondary" xstyle={styles.rowLabel}>
                    {label}
                  </Text>
                  <Text weight="semibold" justify="end">
                    {value}
                  </Text>
                </HStack>
              ))}
            </VStack>
            {bank.note ? (
              <HStack gap={1} vAlign="center" xstyle={styles.hairlineTop}>
                <Icon icon={Info} size="xsm" color="accent" />
                <Text size="sm" color={/** @type {any} */ ('meta-subtle')}>
                  {bank.note}
                </Text>
              </HStack>
            ) : null}
          </>
        )}
      </VStack>
    </Card>
  );
}

/** @param {{ rows: MetaKeyValue[] }} props */
function KeyValueRows({ rows }) {
  return rows.map(([label, value, emphasis], index) => (
    <HStack key={`${label}-${index}`} hAlign="between" vAlign="start" gap={3}>
      <Text color="secondary" xstyle={styles.rowLabel}>
        {label}
      </Text>
      <Text
        weight={emphasis ? 'bold' : index === 0 ? 'semibold' : undefined}
        color={emphasis ? 'accent' : 'primary'}
        justify="end"
        hasTabularNumbers={Boolean(emphasis)}
        xstyle={styles.rowValue}
      >
        {value}
      </Text>
    </HStack>
  ));
}

const styles = stylex.create({
  emptyState: {
    paddingBlock: 'var(--spacing-10)',
  },
  responsiveGrid: {
    gridTemplateColumns: {
      default: null,
      '@media (max-width: 599px)': 'minmax(0, 1fr)',
    },
  },
  alignStart: {
    alignItems: 'start',
  },
  card: {
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
  bubble: {
    borderRadius: 'var(--radius-full)',
    flexShrink: 0,
    height: 'var(--spacing-8)',
    width: 'var(--spacing-8)',
  },
  numberBubble: {
    borderRadius: 'var(--radius-full)',
    flexShrink: 0,
    fontSize: 'var(--font-size-sm)',
    height: 'var(--spacing-7)',
    width: 'var(--spacing-7)',
  },
  baseline: {
    alignItems: 'baseline',
  },
  value: {
    lineHeight: 1,
  },
  cardHeader: {
    borderBottomColor: 'var(--color-border)',
    borderBottomStyle: 'solid',
    borderBottomWidth: 'var(--border-width)',
    paddingBottom: 'var(--spacing-3)',
  },
  inset: {
    backgroundColor: 'var(--meta-inset-bg)',
    borderColor: 'var(--color-border)',
    borderRadius: 'var(--meta-radius-inset)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    padding: 'var(--spacing-3)',
  },
  bankNumbers: {
    borderTopColor: 'var(--color-border)',
    borderTopStyle: 'solid',
    borderTopWidth: 'var(--border-width)',
    marginTop: 'var(--spacing-2)',
    paddingTop: 'var(--spacing-3)',
  },
  detailRows: {
    paddingInline: 'var(--spacing-1)',
  },
  detailRow: {
    paddingBlock: 'var(--spacing-1-5)',
  },
  detailDivider: {
    borderBottomColor: 'var(--color-border)',
    borderBottomStyle: 'solid',
    borderBottomWidth: 'var(--border-width)',
  },
  hairlineTop: {
    borderTopColor: 'var(--color-border)',
    borderTopStyle: 'solid',
    borderTopWidth: 'var(--border-width)',
    paddingTop: 'var(--spacing-2)',
  },
  rowLabel: { flexShrink: 0, whiteSpace: 'nowrap' },
  rowValue: { minWidth: 0, overflowWrap: 'anywhere' },
  tableCard: {
    boxShadow: 'var(--meta-shadow-card)',
    overflow: 'hidden',
  },
  // Card keeps its 24px padding so Astryx `Table` aligns its edge columns
  // to it; the header / totals / footnote bands bleed edge to edge through
  // the card's `--container-padding-*` vars (same as the payments tab).
  tableHeader: {
    borderBottomColor: 'var(--color-border)',
    borderBottomStyle: 'solid',
    borderBottomWidth: 'var(--border-width)',
    marginInline: 'calc(-1 * var(--container-padding-inline-start))',
    marginTop: 'calc(-1 * var(--container-padding-block-start))',
    paddingBlock: 'var(--spacing-4)',
    paddingInline: 'var(--container-padding-inline-start)',
  },
  table: {
    // eslint-disable-next-line @stylexjs/valid-styles
    '--color-background-muted': 'var(--meta-inset-bg)',
    overflowX: 'auto',
  },
  band: {
    backgroundColor: 'var(--meta-inset-bg)',
    borderTopColor: 'var(--color-border)',
    borderTopStyle: 'solid',
    borderTopWidth: 'var(--border-width)',
    marginInline: 'calc(-1 * var(--container-padding-inline-start))',
    paddingBlock: 'var(--spacing-4)',
    paddingInline: 'var(--container-padding-inline-start)',
  },
  footnoteBand: {
    marginBottom: 'calc(-1 * var(--container-padding-block-end))',
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

const dotTones = stylex.create({
  green: { backgroundColor: 'var(--meta-green)' },
  accent: { backgroundColor: 'var(--color-accent)' },
});

const bubbleTones = stylex.create({
  accent: {
    backgroundColor: 'var(--meta-blue-wash)',
    color: 'var(--color-accent)',
  },
  green: {
    backgroundColor: 'var(--meta-green-wash)',
    color: 'var(--meta-green)',
  },
});
