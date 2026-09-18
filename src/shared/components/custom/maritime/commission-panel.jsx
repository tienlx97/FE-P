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
  CreditCard,
  Download,
  Eye,
  Info,
  Landmark,
  Pencil,
  Plus,
  Wallet,
} from 'lucide-react';

import { MaritimeBadge } from './badge.jsx';

/**
 * Maritime theme — "Hoa hồng (Commission)" tab body (`MaritimeTabNav` id
 * `commission`): 3 summary cards, broker + beneficiary-bank cards side by
 * side, and the commission payment tracking table with a totals row and a
 * footnote bar. Built from the Figma frame `Container` (node 46:4775) read
 * via the Figma MCP bridge; text follows the other Maritime panels' 16px
 * desktop scale instead of Figma's 10-12px.
 *
 * All content is data and overridable via props; defaults are the mockup's.
 * @param {{
 *   summary?: CommissionSummary[],
 *   broker?: Broker,
 *   bank?: Bank,
 *   payments?: CommissionPayment[],
 *   totals?: { label: string, usd: string, summary: string, vnd: string },
 *   footnote?: string,
 *   confirmedTotal?: string,
 *   onExport?: () => void,
 *   onCreate?: () => void,
 *   onView?: (id: string) => void,
 *   onAction?: (id: string) => void,
 * }} props
 */
export function MaritimeCommissionPanel({
  summary = DEFAULT_SUMMARY,
  broker = DEFAULT_BROKER,
  bank = DEFAULT_BANK,
  payments = DEFAULT_PAYMENTS,
  totals = DEFAULT_TOTALS,
  footnote = 'Áp dụng quy chế chi trả môi giới thương mại quốc tế theo biểu mẫu BM-MG-04 ban hành năm 2024',
  confirmedTotal = '$9,700.00 USD (~246,865,000 VNĐ)',
  onExport,
  onCreate,
  onView,
  onAction,
}) {
  const data = [...payments, { id: '__total', isTotal: true }];

  /** @type {import('@astryxdesign/core/Table').TableColumn<any>[]} */
  const columns = [
    {
      key: 'stage',
      header: 'ĐỢT THANH TOÁN',
      width: proportional(1.5),
      renderCell: (row) =>
        row.isTotal ? (
          <Cell>
            <Text size="lg" weight="semibold" color="maritime-muted">
              {totals.label}
            </Text>
          </Cell>
        ) : (
          <Cell>
            <HStack
              as="span"
              hAlign="center"
              vAlign="center"
              xstyle={[
                styles.stageBox,
                row.paid ? styles.stagePaid : styles.stagePending,
              ]}
            >
              <Text type="code" size="lg" weight="bold" color="inherit">
                {row.no}
              </Text>
            </HStack>
          </Cell>
        ),
    },
    {
      key: 'amount',
      header: 'SỐ TIỀN HOA HỒNG (USD)',
      width: proportional(2),
      align: 'end',
      renderCell: (row) =>
        row.isTotal ? (
          <Cell isEnd>
            <Text type="code" size="lg" weight="bold">
              {totals.usd}
            </Text>
          </Cell>
        ) : (
          <Cell isEnd>
            <VStack gap={0.5} hAlign="end">
              <Text
                type="code"
                size="lg"
                weight="bold"
                color={row.paid ? 'maritime-teal' : 'accent'}
              >
                {`${row.usd} USD`}
              </Text>
              <Text type="code" size="sm" color="maritime-subtle">
                {`≈ ${row.vnd} VNĐ`}
              </Text>
            </VStack>
          </Cell>
        ),
    },
    {
      key: 'method',
      header: 'HÌNH THỨC & THỜI HẠN',
      width: proportional(3),
      renderCell: (row) =>
        row.isTotal ? (
          <Cell>
            <Text size="lg" weight="semibold" color="maritime-teal">
              {totals.summary}
            </Text>
          </Cell>
        ) : (
          <Cell>
            <HStack gap={2} vAlign="center" wrap="nowrap">
              <Icon
                icon={row.paid ? Wallet : CreditCard}
                size="xsm"
                color={
                  /** @type {any} */ (row.paid ? 'maritime-subtle' : 'accent')
                }
              />
              <Text type="code" size="lg" color="maritime-muted">
                {`${row.method} • ${row.date}`}
              </Text>
            </HStack>
          </Cell>
        ),
    },
    {
      key: 'status',
      header: 'TRẠNG THÁI',
      width: proportional(2.6),
      renderCell: (row) =>
        row.isTotal ? (
          <Cell isEnd>
            <Text type="code" size="lg" weight="bold" color="maritime-muted">
              {totals.vnd}
            </Text>
          </Cell>
        ) : (
          <Cell>
            <MaritimeBadge
              size="sm"
              isUppercase={false}
              tone={row.paid ? 'success' : 'blue'}
              label={row.status}
            />
          </Cell>
        ),
    },
    {
      key: 'actions',
      header: 'THAO TÁC',
      width: pixel(112),
      renderCell: (row) =>
        row.isTotal ? null : (
          <Cell>
            <HStack gap={0.5} vAlign="center" wrap="nowrap">
              <IconButton
                label={`Xem đợt ${row.no}`}
                tooltip="Xem"
                icon={<Icon icon={Eye} size="sm" />}
                variant="ghost"
                size="md"
                onClick={() => onView?.(row.id)}
              />
              <IconButton
                label={`${row.paid ? 'Tải phiếu chi' : 'Sửa'} đợt ${row.no}`}
                tooltip={row.paid ? 'Tải phiếu chi' : 'Sửa'}
                icon={<Icon icon={row.paid ? Download : Pencil} size="sm" />}
                variant="ghost"
                size="md"
                onClick={() => onAction?.(row.id)}
              />
            </HStack>
          </Cell>
        ),
    },
  ];

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
            xstyle={styles.borderCard}
          >
            <VStack gap={2} hAlign="stretch">
              <Text
                type="label"
                size="lg"
                weight="bold"
                color={TONE_COLORS[s.tone]?.label ?? 'maritime-muted'}
                xstyle={styles.tracking}
              >
                {s.label}
              </Text>
              <HStack
                gap={2}
                vAlign={/** @type {any} */ ('baseline')}
                wrap="nowrap"
              >
                <Text
                  type="code"
                  size="4xl"
                  weight="bold"
                  color={TONE_COLORS[s.tone]?.value}
                  xstyle={styles.statValue}
                >
                  {s.value}
                </Text>
                <Text size="lg" weight="semibold" color="maritime-muted">
                  USD
                </Text>
              </HStack>
              <Divider />
              <Text
                size="lg"
                color={TONE_COLORS[s.tone]?.note ?? 'maritime-subtle'}
              >
                {s.note}
              </Text>
            </VStack>
          </Card>
        ))}
      </Grid>

      <Grid
        columns={{ minWidth: 480, max: 2, repeat: 'fill' }}
        gap={4}
        xstyle={styles.topGrid}
      >
        <Card padding={4} elevation="low" xstyle={styles.borderCard}>
          <VStack gap={3} hAlign="stretch">
            <HStack hAlign="between" vAlign="center" wrap="wrap" gap={2}>
              <Text
                type="label"
                size="lg"
                weight="bold"
                color="accent"
                xstyle={styles.tracking}
              >
                {broker.label}
              </Text>
              <HStack gap={2} vAlign="center" wrap="nowrap">
                <MaritimeBadge
                  size="sm"
                  isUppercase={false}
                  tone="success"
                  label={broker.signedLabel}
                />
                <MaritimeBadge size="sm" tone="blue" label={broker.code} />
              </HStack>
            </HStack>
            <Text as="h3" size="2xl" weight="bold">
              {broker.name}
            </Text>
            <KeyValueList rows={broker.rows} />
          </VStack>
        </Card>

        <Card padding={4} elevation="low" xstyle={styles.borderCard}>
          <VStack gap={3} hAlign="stretch">
            <HStack hAlign="between" vAlign="center" wrap="nowrap" gap={2}>
              <HStack gap={2} vAlign="center" wrap="nowrap">
                <Icon icon={Landmark} size="sm" color="accent" />
                <Text as="h3" size="xl" weight="bold">
                  {bank.title}
                </Text>
              </HStack>
              <MaritimeBadge
                size="sm"
                isUppercase={false}
                tone="success"
                label={bank.status}
              />
            </HStack>
            <VStack gap={2} hAlign="stretch" xstyle={styles.bankBox}>
              <HStack hAlign="between" vAlign="center" wrap="nowrap">
                <Text size="lg" color="maritime-subtle">
                  Ngân hàng thụ hưởng:
                </Text>
                <Text size="lg" weight="bold" color="accent">
                  {bank.shortName}
                </Text>
              </HStack>
              <Text size="lg" weight="semibold">
                {bank.fullName}
              </Text>
              <Divider />
              <Grid columns={2} gap={3}>
                <VStack gap={0.5}>
                  <Text type="label" size="lg" color="maritime-subtle">
                    TÀI KHOẢN USD / VND:
                  </Text>
                  <Text type="code" size="lg" weight="bold">
                    {bank.account}
                  </Text>
                </VStack>
                <VStack gap={0.5}>
                  <Text type="label" size="lg" color="maritime-subtle">
                    MÃ SWIFT:
                  </Text>
                  <Text type="code" size="lg" weight="bold">
                    {bank.swift}
                  </Text>
                </VStack>
              </Grid>
            </VStack>
            <KeyValueList rows={bank.rows} />
            <HStack gap={1.5} vAlign="center" wrap="nowrap">
              <Icon
                icon={Info}
                size="xsm"
                color={/** @type {any} */ ('maritime-subtle')}
              />
              <Text size="lg" color="maritime-subtle">
                {bank.note}
              </Text>
            </HStack>
          </VStack>
        </Card>
      </Grid>

      <Card padding={0} elevation="low" xstyle={styles.tableCard}>
        <HStack
          hAlign="between"
          vAlign="center"
          wrap="wrap"
          gap={3}
          xstyle={styles.header}
        >
          <Text as="h2" size="3xl" weight="bold">
            Bảng theo dõi
          </Text>
          <HStack gap={2} vAlign="center" wrap="nowrap">
            <Button
              label="Xuất Excel"
              size="lg"
              variant="secondary"
              icon={<Icon icon={Download} size="xsm" />}
              onClick={onExport}
            />
            <Button
              label="Thêm đợt thanh toán / hoa hồng"
              size="lg"
              variant="primary"
              icon={<Icon icon={Plus} size="xsm" />}
              onClick={onCreate}
            />
          </HStack>
        </HStack>
        <Table
          columns={columns}
          data={/** @type {any} */ (data)}
          idKey="id"
          dividers="rows"
          density="spacious"
        />
        <HStack
          hAlign="between"
          vAlign="center"
          wrap="wrap"
          gap={2}
          xstyle={styles.footer}
        >
          <Text size="lg" color="maritime-muted">
            {footnote}
          </Text>
          <HStack gap={2} vAlign="center" wrap="nowrap">
            <Text size="lg" weight="semibold">
              TỔNG THỰC CHI ĐÃ XÁC NHẬN:
            </Text>
            <Text type="code" size="lg" weight="bold" color="maritime-teal">
              {confirmedTotal}
            </Text>
          </HStack>
        </HStack>
      </Card>
    </VStack>
  );
}

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

/** @param {{ rows: KeyValue[] }} props */
function KeyValueList({ rows }) {
  return (
    <VStack gap={2} hAlign="stretch" xstyle={styles.kvBox}>
      {rows.map(([label, value, tone]) => (
        <HStack
          key={label}
          hAlign="between"
          vAlign="center"
          wrap="nowrap"
          gap={3}
        >
          <Text size="lg" color="maritime-subtle">
            {label}
          </Text>
          <Text
            type={tone === 'code' || tone === 'accent' ? 'code' : undefined}
            size="lg"
            weight="semibold"
            color={tone === 'accent' ? 'accent' : undefined}
          >
            {value}
          </Text>
        </HStack>
      ))}
    </VStack>
  );
}

/** @typedef {[string, string, ('code' | 'accent')?]} KeyValue */
/** @typedef {{ label: string, value: string, note: string, tone: 'neutral' | 'success' | 'accent' }} CommissionSummary */
/** @typedef {{ label: string, signedLabel: string, code: string, name: string, rows: KeyValue[] }} Broker */
/** @typedef {{ title: string, status: string, shortName: string, fullName: string, account: string, swift: string, rows: KeyValue[], note: string }} Bank */
/** @typedef {{ id: string, no: string, usd: string, vnd: string, method: string, date: string, status: string, paid: boolean }} CommissionPayment */

const TONE_COLORS =
  /** @type {Record<string, { label?: any, value?: any, note?: any }>} */ ({
    neutral: {},
    success: {
      label: 'maritime-teal',
      value: 'maritime-teal',
      note: 'maritime-teal',
    },
    accent: { label: 'accent', value: 'accent' },
  });

/** @type {CommissionSummary[]} */
const DEFAULT_SUMMARY = [
  {
    label: 'TỔNG HOA HỒNG (3%)',
    value: '$14,550.00',
    note: 'Quy đổi: ≈ 370,300,000 đ',
    tone: 'neutral',
  },
  {
    label: 'ĐÃ CHI TRẢ',
    value: '$9,700.00',
    note: 'Đã chi 2/3 đợt (66.7%)',
    tone: 'success',
  },
  {
    label: 'CÒN PHẢI CHI',
    value: '$4,850.00',
    note: 'Còn 1 đợt cuối (33.3%)',
    tone: 'accent',
  },
];

/** @type {Broker} */
const DEFAULT_BROKER = {
  label: 'BÊN NHẬN HOA HỒNG (MÔI GIỚI)',
  signedLabel: 'Đã ký bản gốc',
  code: 'BRK-2024/09-DLT',
  name: 'CÔNG TY TNHH TIẾP VẬN TOÀN CẦU DELTA',
  rows: [
    ['Người đại diện:', 'Ông Trần Minh Tuấn'],
    ['Chức vụ:', 'Trưởng đại diện thương mại (Số 14/UQ-DLT)'],
    ['Mã số thuế:', '0314892182', 'accent'],
    ['Địa chỉ / Trụ sở:', 'Quận 1, TP. Hồ Chí Minh'],
  ],
};

/** @type {Bank} */
const DEFAULT_BANK = {
  title: '3. NGÂN HÀNG THỤ HƯỞNG & PHƯƠNG THỨC',
  status: 'Hoạt động',
  shortName: 'Vietcombank',
  fullName: 'Ngân hàng TMCP Ngoại thương Việt Nam - CN TP.HCM',
  account: '0071001289388',
  swift: 'BFTVVNVX',
  rows: [
    ['Chủ tài khoản:', 'CÔNG TY TNHH TIẾP VẬN TOÀN CẦU DELTA'],
    ['Hình thức chi trả:', 'Chuyển khoản T/T UNC điện tử'],
    ['Kênh đối soát:', 'E-BANKING TỰ ĐỘNG'],
  ],
  note: 'Tự động đối chiếu và xuất phiếu UNC kế toán ngay sau khi duyệt chi đợt.',
};

/** @type {CommissionPayment[]} */
const DEFAULT_PAYMENTS = [
  {
    id: 'p1',
    no: '01',
    usd: '$4,365.00',
    vnd: '111,089,250',
    method: 'T/T',
    date: '25/03/2024',
    status: 'Đã chi 25/03/24 (T/T)',
    paid: true,
  },
  {
    id: 'p2',
    no: '02',
    usd: '$5,335.00',
    vnd: '135,775,750',
    method: 'T/T',
    date: '15/05/2024',
    status: 'Đã chi 15/05/24 (T/T)',
    paid: true,
  },
  {
    id: 'p3',
    no: '03',
    usd: '$4,850.00',
    vnd: '123,432,500',
    method: 'Chuyển khoản',
    date: '31/12/2024',
    status: 'Chờ thanh toán (31/12/24)',
    paid: false,
  },
];

const DEFAULT_TOTALS = {
  label: 'TỔNG CỘNG (3 ĐỢT)',
  usd: '$14,550.00 USD',
  summary: 'Đã thanh toán: $9,700.00 (66.7%) • Còn lại: $4,850.00 (33.3%)',
  vnd: '~370,300,000 VNĐ',
};

const styles = stylex.create({
  tracking: { letterSpacing: '0.05em' },
  statValue: { letterSpacing: '-0.025em', lineHeight: 1.1 },
  borderCard: { borderColor: 'var(--color-border)' },
  summaryGrid: {
    gridTemplateColumns: 'repeat(3, minmax(0, 480px))',
    justifyContent: 'start',
  },
  topGrid: { alignItems: 'start' },
  tableCard: { borderColor: 'var(--color-border)', overflow: 'hidden' },
  header: {
    borderBottomColor: 'var(--color-border)',
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
    padding: 'var(--spacing-4)',
  },
  footer: {
    backgroundColor: 'var(--color-background-muted)',
    borderTopColor: 'var(--color-border)',
    borderTopStyle: 'solid',
    borderTopWidth: '1px',
    paddingBlock: 'var(--spacing-3)',
    paddingInline: 'var(--spacing-4)',
  },
  cell: { minHeight: '68px', width: '100%' },
  kvBox: {
    backgroundColor: 'var(--color-background-muted)',
    borderRadius: 'var(--radius-inner)',
    padding: 'var(--spacing-3)',
  },
  bankBox: {
    backgroundColor: 'var(--color-background-muted)',
    borderColor: 'var(--color-border)',
    borderRadius: 'var(--radius-inner)',
    borderStyle: 'solid',
    borderWidth: '1px',
    padding: 'var(--spacing-3)',
  },
  stageBox: {
    borderRadius: 'var(--radius-inner)',
    height: '32px',
    width: '32px',
  },
  stagePaid: {
    backgroundColor: 'var(--maritime-badge-success-bg)',
    color: 'var(--maritime-badge-success-text)',
  },
  stagePending: {
    backgroundColor: 'var(--maritime-chip-bg)',
    color: 'var(--maritime-chip-text)',
  },
});
