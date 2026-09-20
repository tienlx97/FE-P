'use client';

import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Link } from '@astryxdesign/core/Link';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { pixel, proportional, Table } from '@astryxdesign/core/Table';
import { Heading, Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import {
  BadgeCheck,
  CirclePlus,
  ClipboardClock,
  Download,
  Eye,
  ScrollText,
} from 'lucide-react';

import { MaritimeBadge } from './badge.jsx';

/**
 * Maritime theme — "Tiến độ thanh toán" tab body (`MaritimeTabNav` id
 * `payments`): 3 KPI cards + a payment-schedule table, built from the
 * Figma frame `Container` (node 33:1959) read via the Figma MCP bridge.
 *
 * Built from Astryx components (Card, Grid, Text, ProgressBar, Divider,
 * Badge, Token, Button, Table, ...) and customized on top: the
 * Figma-only look (header band + 12px uppercase column
 * titles, 14px cells) lives in `theme.js` as themed overrides
 * (`table-*`), since `Text` colors
 * and `Table` cells can't be reached by `xstyle`; only per-card border
 * tints and a few spacing tweaks are `xstyle` here.
 *
 * Every string/number defaults to the Figma mockup's own data but is an
 * overridable prop — this panel has no fixed contract shape.
 * @param {{
 *   totalValue?: string,
 *   settlementBreakdown?: SettlementBreakdown,
 *   paidValue?: string,
 *   paidPercent?: number,
 *   remainingValue?: string,
 *   unit?: string,
 *   amountHeader?: string,
 *   payments?: PaymentRow[],
 *   paidTotalValue?: string,
 *   onAddPayment?: () => void,
 *   onViewPayment?: (id: string) => void,
 *   onDownloadPayment?: (id: string) => void,
 *   onOpenReconciliation?: (reference: string) => void,
 * }} props
 */
export function MaritimePaymentProgressPanel({
  totalValue = '485,000',
  settlementBreakdown = DEFAULT_BREAKDOWN,
  paidValue = '315,250',
  paidPercent = 65,
  remainingValue = '169,750',
  unit = 'USD',
  amountHeader = 'Số tiền (USD)',
  payments = DEFAULT_PAYMENTS,
  paidTotalValue = '$315,250.00 USD',
  onAddPayment,
  onViewPayment,
  onDownloadPayment,
  onOpenReconciliation,
}) {
  const remainingPercent = Math.max(0, 100 - paidPercent);

  /** @type {import('@astryxdesign/core/Table').TableColumn<PaymentRow & Record<string, unknown>>[]} */
  const columns = [
    {
      key: 'code',
      header: 'Mã đợt',
      width: proportional(0.7),
      renderCell: (row) => (
        <Text type="inherit" weight="bold" color="accent" xstyle={styles.mono}>
          {row.code}
        </Text>
      ),
    },
    {
      key: 'amount',
      header: amountHeader,
      width: proportional(1),
      align: 'end',
      renderCell: (row) => (
        <Text
          type="inherit"
          weight="bold"
          xstyle={styles.mono}
          color={row.status === 'upcoming' ? 'maritime-muted' : 'maritime-teal'}
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
        <Text type="inherit" weight="medium">
          {row.condition}
        </Text>
      ),
    },
    {
      key: 'date',
      header: 'Ngày thanh toán',
      width: proportional(1.2),
      renderCell: (row) => (
        <Text type="inherit" color="maritime-muted">
          {row.date}
        </Text>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      width: proportional(1.5),
      renderCell: (row) => (
        <MaritimeBadge
          label={row.statusLabel}
          tone={STATUS_TONES[row.status]}
          dotVariant={STATUS_DOTS[row.status]}
        />
      ),
    },
    {
      key: 'note',
      header: 'Ghi chú',
      width: proportional(3),
      renderCell: (row) => (
        <HStack gap={1} vAlign="center" wrap="wrap">
          <Text type="inherit" color="maritime-subtle">
            {row.note}
          </Text>
          {row.reference ? (
            <>
              <Text type="inherit" color="maritime-subtle">
                •
              </Text>
              <Link
                xstyle={styles.linkCell}
                weight="medium"
                onClick={() => onOpenReconciliation?.(String(row.reference))}
              >
                UNC {row.reference}
              </Link>
            </>
          ) : null}
        </HStack>
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
      {/* Three tracks; each card keeps its natural width up to 520px
          (user feedback, 2026-09-19: 340px, the overview stat-card cap, then 440px
          read too short for these denser KPI cards, while filling the full
          track stretched them too long on wide monitors). */}
      <Grid columns={{ minWidth: 320, max: 3, repeat: 'fill' }} gap={4}>
        <Card
          padding={5}
          elevation="low"
          xstyle={[cardTones.default, styles.kpiCard]}
        >
          <VStack gap={3} hAlign="stretch">
            <HStack hAlign="between" vAlign="center" wrap="nowrap">
              <Text
                type="label"
                weight="bold"
                color="maritime-muted"
                xstyle={styles.tracking}
              >
                GIÁ TRỊ QUYẾT TOÁN
              </Text>
              <IconBox icon={ScrollText} tone="default" />
            </HStack>
            <Amount value={totalValue} unit={unit} color="primary" />
            <SettlementBar breakdown={settlementBreakdown} />
          </VStack>
        </Card>

        <Card
          padding={5}
          elevation="low"
          xstyle={[cardTones.teal, styles.kpiCard]}
        >
          <VStack gap={3} hAlign="stretch">
            <HStack hAlign="between" vAlign="center" wrap="nowrap">
              <HStack gap={1.5} vAlign="center" wrap="nowrap">
                <Dot tone="teal" />
                <Text
                  type="label"
                  weight="bold"
                  color="maritime-teal-text"
                  xstyle={styles.tracking}
                >
                  ĐÃ THỰC THU
                </Text>
              </HStack>
              <IconBox icon={BadgeCheck} tone="teal" />
            </HStack>
            <Amount value={paidValue} unit={unit} color="maritime-teal" />
            <ProgressBar
              label="Đã thực thu"
              isLabelHidden
              value={paidPercent}
              variant="success"
            />
            <Text weight="semibold" color="maritime-teal-text">
              {paidPercent}%
            </Text>
          </VStack>
        </Card>

        <Card
          padding={5}
          elevation="low"
          xstyle={[cardTones.blue, styles.kpiCard]}
        >
          <VStack gap={3} hAlign="stretch">
            <HStack hAlign="between" vAlign="center" wrap="nowrap">
              <HStack gap={1.5} vAlign="center" wrap="nowrap">
                <Dot tone="blue" />
                <Text
                  type="label"
                  weight="bold"
                  color="accent"
                  xstyle={styles.tracking}
                >
                  CÒN PHẢI THU
                </Text>
              </HStack>
              <IconBox icon={ClipboardClock} tone="blue" />
            </HStack>
            <Amount value={remainingValue} unit={unit} color="accent" />
            <ProgressBar
              label="Còn phải thu"
              isLabelHidden
              value={remainingPercent}
              variant="accent"
            />
            <Text weight="semibold" color="accent">
              {remainingPercent}%
            </Text>
          </VStack>
        </Card>
      </Grid>

      <Card padding={0} xstyle={cardTones.default}>
        <VStack hAlign="stretch">
          <HStack hAlign="between" vAlign="center" wrap="nowrap" padding={4}>
            <Heading level={2}>Tiến độ thanh toán</Heading>
            <Button
              label="Thêm đợt thanh toán"
              variant="primary"
              size="sm"
              icon={<Icon icon={CirclePlus} size="sm" />}
              xstyle={/** @type {any} */ (styles.addButton)}
              onClick={onAddPayment}
            />
          </HStack>
          <Table
            columns={columns}
            data={/** @type {any} */ (payments)}
            idKey="id"
            dividers="rows"
            density="spacious"
          />
          <HStack
            hAlign="between"
            vAlign="center"
            wrap="wrap"
            xstyle={styles.footer}
          >
            <Text color="maritime-subtle">
              Tổng số {payments.length} đợt thanh toán chính
            </Text>
            <HStack gap={2} vAlign="center" wrap="nowrap">
              <Text weight="semibold">TỔNG ĐÃ THU:</Text>
              <Text type="code" weight="bold" color="maritime-teal">
                {paidTotalValue}
              </Text>
            </HStack>
          </HStack>
        </VStack>
      </Card>
    </VStack>
  );
}

/**
 * @param {{
 *   value: string,
 *   unit: string,
 *   color: import('@astryxdesign/core/Text').TextProps['color'],
 * }} props
 */
function Amount({ value, unit, color }) {
  return (
    <HStack gap={2} vAlign="center" wrap="nowrap">
      <Text
        type="code"
        weight="bold"
        size="3xl"
        color={color}
        xstyle={styles.amount}
      >
        {value}
      </Text>
      <Text weight="semibold" color="maritime-muted">
        {unit}
      </Text>
    </HStack>
  );
}

/** @param {{ icon: import('react').ComponentType, tone: 'default' | 'teal' | 'blue' }} props */
function IconBox({ icon, tone }) {
  return (
    <HStack
      as="span"
      hAlign="center"
      vAlign="center"
      xstyle={[styles.iconBox, iconBoxTones[tone]]}
    >
      <Icon icon={icon} size="sm" color="inherit" />
    </HStack>
  );
}

/** @param {{ tone: 'teal' | 'blue' }} props */
function Dot({ tone }) {
  return <HStack as="span" xstyle={[styles.dot, dotTones[tone]]} />;
}

/**
 * @typedef {{
 *   contractPercent: number,
 *   annexPercent: number,
 *   contractLabel: string,
 *   annexLabel?: string,
 *   isAnnexDeduction?: boolean,
 * }} SettlementBreakdown
 */

/** @type {SettlementBreakdown} */
const DEFAULT_BREAKDOWN = {
  contractPercent: 93,
  annexPercent: 7,
  contractLabel: '450,000 USD',
  annexLabel: '+35,000 USD',
};

/**
 * Two-segment bar for the settlement total: original contract value + the
 * net annex adjustment (a deduction is drawn in the error tone). The legend
 * only names the segments that exist.
 * @param {{ breakdown: SettlementBreakdown }} props
 */
function SettlementBar({ breakdown }) {
  const { contractPercent, annexPercent, contractLabel, annexLabel } =
    breakdown;
  return (
    <VStack gap={1.5} hAlign="stretch">
      <HStack xstyle={styles.settlementTrack}>
        <HStack
          as="span"
          xstyle={[
            styles.settlementContract,
            styles.segmentWidth(contractPercent),
          ]}
        />
        {annexLabel ? (
          <HStack
            as="span"
            xstyle={[
              breakdown.isAnnexDeduction
                ? styles.settlementDeduction
                : styles.settlementAnnex,
              styles.segmentWidth(annexPercent),
            ]}
          />
        ) : null}
      </HStack>
      <HStack gap={3} vAlign="center" wrap="wrap">
        <HStack gap={1} vAlign="center" wrap="nowrap">
          <HStack
            as="span"
            xstyle={[styles.legendDot, styles.settlementContract]}
          />
          <Text color="maritime-muted">{contractLabel}</Text>
        </HStack>
        {annexLabel ? (
          <HStack gap={1} vAlign="center" wrap="nowrap">
            <HStack
              as="span"
              xstyle={[
                styles.legendDot,
                breakdown.isAnnexDeduction
                  ? styles.settlementDeduction
                  : styles.settlementAnnex,
              ]}
            />
            <Text color="maritime-muted">{annexLabel}</Text>
          </HStack>
        ) : null}
      </HStack>
    </VStack>
  );
}

/** @typedef {'paid' | 'reconciling' | 'upcoming'} PaymentStatus */
/**
 * @typedef {{
 *   id: string,
 *   code: string,
 *   amount: string,
 *   method: 'advance' | 'against-bl' | 'lc' | 'settlement',
 *   condition: string,
 *   date: string,
 *   status: PaymentStatus,
 *   statusLabel: string,
 *   note: string,
 *   reference?: string,
 * }} PaymentRow
 */

/** @type {Record<PaymentStatus, 'success' | 'blue' | 'neutral'>} */
const STATUS_TONES = {
  paid: 'success',
  reconciling: 'blue',
  upcoming: 'neutral',
};

/** @type {Record<PaymentStatus, 'success' | 'accent' | 'neutral'>} */
const STATUS_DOTS = {
  paid: 'success',
  reconciling: 'accent',
  upcoming: 'neutral',
};

/** @type {PaymentRow[]} */
const DEFAULT_PAYMENTS = [
  {
    id: 'pr-01',
    code: 'PR-01',
    amount: '$135,000.00',
    method: 'advance',
    condition: 'T/T Advance',
    date: '22/03/2024',
    status: 'paid',
    statusLabel: 'Đã thu',
    note: 'Đặt cọc sau ký HĐ',
    reference: '#90881',
  },
  {
    id: 'pr-02',
    code: 'PR-02',
    amount: '$180,250.00',
    method: 'against-bl',
    condition: 'T/T against B/L',
    date: '14/05/2024',
    status: 'paid',
    statusLabel: 'Đã thu',
    note: 'Xuất trình B/L & Tờ khai HQ',
    reference: '#92134',
  },
  {
    id: 'pr-03',
    code: 'PR-03',
    amount: '$97,000.00',
    method: 'lc',
    condition: 'Irrevocable L/C at Sight',
    date: '30/11/2024',
    status: 'reconciling',
    statusLabel: 'Đang đối chiếu UNC',
    note: 'Thanh toán qua L/C trước khi giao bộ chứng từ gốc',
  },
  {
    id: 'pr-04',
    code: 'PR-04',
    amount: '$72,750.00',
    method: 'settlement',
    condition: 'Final Settlement',
    date: '31/12/2024',
    status: 'upcoming',
    statusLabel: 'Chưa đến hạn',
    note: 'Nghiệm thu dỡ hàng tại cảng Long Beach',
  },
];

const styles = stylex.create({
  mono: { fontFamily: 'var(--font-family-code)' },
  settlementTrack: {
    backgroundColor: 'var(--color-border)',
    borderRadius: 'var(--radius-full)',
    display: 'flex',
    gap: '2px',
    height: '8px',
    overflow: 'hidden',
    width: '100%',
  },
  settlementContract: { backgroundColor: 'var(--maritime-text-muted)' },
  settlementAnnex: { backgroundColor: 'var(--color-accent)' },
  settlementDeduction: { backgroundColor: 'var(--color-error)' },
  segmentWidth: (percent) => ({ flexShrink: 0, width: `${percent}%` }),
  legendDot: {
    borderRadius: 'var(--radius-full)',
    flexShrink: 0,
    height: '8px',
    width: '8px',
  },
  kpiCard: { maxWidth: '520px' },
  tracking: { letterSpacing: '0.05em', whiteSpace: 'nowrap' },
  linkCell: { fontSize: 'inherit' },
  amount: { letterSpacing: '-0.025em', lineHeight: 1 },
  iconBox: {
    borderRadius: 'var(--radius-inner)',
    borderStyle: 'solid',
    borderWidth: '1px',
    flexShrink: 0,
    height: '32px',
    width: '32px',
  },
  dot: {
    borderRadius: 'var(--radius-full)',
    flexShrink: 0,
    height: '8px',
    width: '8px',
  },
  // Figma: solid black "+ Thêm đợt thanh toán" button, not the theme's
  // accent-blue primary.
  addButton: {
    backgroundColor: {
      default: 'var(--color-text-primary)',
      ':hover': {
        '@media (hover: hover)': 'var(--maritime-text-subtle)',
      },
    },
  },
  footer: {
    backgroundColor: 'var(--color-background-muted)',
    borderTopColor: 'var(--color-border)',
    borderTopStyle: 'solid',
    borderTopWidth: '1px',
    paddingBlock: 'var(--spacing-3)',
    paddingInline: 'var(--spacing-4)',
  },
});

// Per-card border tints from Figma (default #dce9ff/80, teal-200/80, blue-200).
const cardTones = stylex.create({
  default: { borderColor: 'var(--color-border)' },
  teal: { borderColor: 'var(--maritime-teal-border)' },
  blue: { borderColor: 'var(--maritime-badge-info-border)' },
});

const iconBoxTones = stylex.create({
  default: {
    backgroundColor: 'var(--color-background-muted)',
    borderColor: 'var(--color-border)',
    color: 'var(--maritime-badge-info-text)',
  },
  teal: {
    backgroundColor: 'var(--color-success-muted)',
    borderColor: 'var(--maritime-teal-border)',
    color: 'var(--maritime-teal-value)',
  },
  blue: {
    backgroundColor: 'var(--maritime-step-active-bg)',
    borderColor: 'var(--maritime-badge-info-border)',
    color: 'var(--maritime-badge-info-text)',
  },
});

const dotTones = stylex.create({
  teal: { backgroundColor: 'var(--maritime-teal-value)' },
  blue: { backgroundColor: 'var(--maritime-badge-info-text)' },
});
