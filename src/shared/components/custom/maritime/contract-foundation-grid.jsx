'use client';

import { Card } from '@astryxdesign/core/Card';
import { Divider } from '@astryxdesign/core/Divider';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Link } from '@astryxdesign/core/Link';
import { Heading, Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import {
  Archive,
  Bell,
  Building2,
  Check,
  Container,
  FileText,
  Hourglass,
  Scale,
  Truck,
  Wallet,
} from 'lucide-react';

import { MaritimeBadge } from './badge.jsx';
import { MaritimeChip } from './chip.jsx';

const DEFAULT_PARTIES = [
  {
    eyebrow: 'BÊN BÁN (SELLER)',
    badge: { label: 'VIET NAM', tone: 'success' },
    name: 'CÔNG TY CỔ PHẦN THƯƠNG MẠI TIẾP VẬN QUỐC TẾ Á CHÂU',
    rows: [
      ['Người đại diện:', 'Ông Trần Đình Long', false, false, true],
      ['Chức vụ:', 'Tổng Giám Đốc'],
      ['Mã số thuế:', '0312345678', true],
      ['Địa chỉ:', 'Quận 1, TP. Hồ Chí Minh'],
    ],
  },
  {
    eyebrow: 'BÊN MUA (BUYER)',
    badge: { label: 'UNITED STATES', tone: 'blue' },
    name: 'PACIFIC METALS CORPORATION',
    rows: [
      ['Người đại diện:', 'Mr. Robert Sterling', false, false, true],
      ['Chức vụ:', 'Procurement Director'],
      ['Mã số thuế:', 'CUS-T-USA-9921', true],
      ['Địa chỉ:', 'Long Beach, California, USA'],
    ],
  },
];

const DEFAULT_CONTACTS = [
  {
    icon: Truck,
    label: 'CONSIGNEE',
    name: 'Trans-Pacific Forwarding LLC',
    rows: [
      ['Địa chỉ:', 'Terminal 4, Port of Long Beach, CA 90802, USA'],
      ['Liên hệ:', '+1 (562) 899-4400 (Mr. David Vance)', true, true],
    ],
  },
  {
    icon: Bell,
    label: 'NOTIFY PARTY',
    name: 'Global Logistics & Shipping Co.',
    rows: [
      ['Địa chỉ:', 'Suite 300, 1200 Seaside Ave, Long Beach, CA 90802'],
      ['Liên hệ:', '+1 (562) 555-0199 (Ms. Sarah Connor)', true, true],
    ],
  },
];

const DEFAULT_TRANSPORT = {
  sectionTrailing: '100% Đã xuất xưởng',
  incotermLabel: 'CIF 2020',
  rows: [
    ['Nơi xếp hàng:', 'Cảng Cát Lái (VN-SGN)'],
    ['Nơi dỡ hàng:', 'Cảng Long Beach (US-LGB)'],
    ['Ngày báo giá:', '10/03/2024', true],
    ['Ngày ký:', '15/03/2024', true],
    ['Ngày hoàn thành:', '31/12/2024', true],
  ],
  signingBadges: [
    { label: 'Bên A đã ký', tone: 'success' },
    { label: 'Bên B đã ký', tone: 'success' },
  ],
};

const DEFAULT_CARGO_METRICS = [
  { icon: Scale, label: 'KHỐI LƯỢNG TỜ KHAI', value: '73.5', unit: 'Tấn' },
  {
    icon: Container,
    label: 'SỐ LƯỢNG CONT / KIỆN',
    value: '3 Cont',
    unit: "(40' HC)",
  },
];

const DEFAULT_BANK = {
  items: [
    {
      rows: [
        ['Ngân hàng:', 'Vietcombank (VCB)'],
        ['Chi nhánh:', 'Tân Bình, TP.HCM'],
        ['Số tài khoản (USD):', '1032407684', true],
        ['Mã SWIFT:', 'BFTVVNVX044', true, true],
      ],
    },
  ],
};

const DEFAULT_PAYMENT_TERMS = {
  title: '3 MỐC ĐIỀU KHOẢN THANH TOÁN HỢP ĐỒNG',
  items: [
    {
      label: 'Đợt 1 (30% - T/T)',
      amount: '$135,000 USD',
      note: 'Thanh toán cọc trong 03 ngày kể từ ngày ký HĐ.',
      status: 'paid',
    },
    {
      label: 'Đợt 2 (40% - T/T)',
      amount: '$180,250 USD',
      note: 'Thanh toán khi xuất trình B/L & Tờ khai hải quan thông quan.',
      status: 'paid',
    },
    {
      label: 'Đợt 3 (30% - L/C)',
      amount: '$169,750 USD',
      note: 'Mở L/C không hủy ngang tại chỗ khi giao bộ chứng từ gốc.',
      status: 'active',
    },
  ],
};

const DEFAULT_ANNEXES = [
  {
    code: 'AN-01',
    label: 'Phát sinh tăng',
    amount: '+$35,000 USD',
    isPositive: true,
  },
  {
    code: 'AN-02',
    label: 'Thay đổi giá trị',
    amount: '$0 USD',
    isPositive: false,
  },
];

const DEFAULT_COMMISSION = {
  percentLabel: '3%',
  signedLabel: 'Đã ký 2 bên',
  signedTone: 'success',
  agreementCode: 'CMS-2024/088',
  recipient: 'Pacific Trade Link Ltd. (HK)',
  rateValue: '$14,550.00 USD (3%)',
  paidAmount: '$9,457.50',
  totalAmount: '$14,550.00',
  // 9,457.50 / 14,550 ≈ 65% — matches the reference image's fill exactly.
  paidPercent: 65,
  paidLabel: 'Đã chi Đợt 1 & 2',
  remainingAmount: '$5,092.50 USD',
};

/**
 * Every section is data-driven: each prop defaults to the Figma mockup's
 * demo content (what `/preview-maritime` shows), and a real caller passes
 * its own data. `null`/empty hides the optional cards (`transport`,
 * `bank`, `paymentTerms`, `commission`); `commission` may also be
 * `{ isEmpty: true, message, actionLabel?, onAction? }` to render the
 * "no commission yet" state.
 * @param {{
 *   parties?: any[],
 *   contacts?: any[],
 *   transport?: any,
 *   cargoMetrics?: any[],
 *   bank?: any,
 *   paymentTerms?: any,
 *   annexes?: any[],
 *   onViewAnnexes?: () => void,
 *   onViewCommission?: () => void,
 *   commission?: any,
 * }} props
 */
export function MaritimeContractFoundationGrid({
  parties = DEFAULT_PARTIES,
  contacts = DEFAULT_CONTACTS,
  transport = DEFAULT_TRANSPORT,
  cargoMetrics = DEFAULT_CARGO_METRICS,
  bank = DEFAULT_BANK,
  paymentTerms = DEFAULT_PAYMENT_TERMS,
  annexes = DEFAULT_ANNEXES,
  onViewAnnexes,
  onViewCommission,
  commission = DEFAULT_COMMISSION,
}) {
  return (
    <Grid
      columns={{ minWidth: 340, max: 3, repeat: 'fill' }}
      gap={4}
      xstyle={styles.grid}
    >
      <VStack gap={3} hAlign="stretch">
        <SectionTitle number="1" label="THÔNG TIN ĐỐI TÁC" />
        {parties.map((party) => (
          <PartyCard key={party.eyebrow} {...party} />
        ))}
        {contacts.map((contact) => (
          <ContactCard key={contact.label} {...contact} />
        ))}
      </VStack>

      <VStack gap={3} hAlign="stretch">
        <SectionTitle
          number="2"
          label="VẬN CHUYỂN & HÀNG HÓA"
          trailing={transport?.sectionTrailing}
        />
        {transport ? (
          <Card padding={4}>
            <VStack gap={2} hAlign="stretch">
              <HStack hAlign="between" vAlign="center">
                <Text type="label" color="maritime-muted">
                  VẬN CHUYỂN & INCOTERM
                </Text>
                {transport.incotermLabel ? (
                  <MaritimeChip label={transport.incotermLabel} size="md" />
                ) : null}
              </HStack>
              <InfoRows rows={transport.rows} />
              {transport.signingBadges?.length ? (
                <>
                  <Divider />
                  <HStack hAlign="between" vAlign="center" wrap="wrap" gap={2}>
                    <Text color="maritime-subtle">Trạng thái ký:</Text>
                    <HStack gap={1} wrap="wrap">
                      {transport.signingBadges.map(
                        (/** @type {any} */ badge) => (
                          <MaritimeBadge
                            key={badge.label}
                            label={badge.label}
                            tone={badge.tone}
                          />
                        ),
                      )}
                    </HStack>
                  </HStack>
                </>
              ) : null}
            </VStack>
          </Card>
        ) : null}
        {cargoMetrics ? (
          <Card padding={4}>
            <VStack gap={3} hAlign="stretch">
              <HStack gap={2} vAlign="center">
                <IconBadge icon={Archive} />
                <VStack gap={0}>
                  <Heading level={3}>QUY CÁCH HÀNG HÓA & ĐÓNG GÓI</Heading>
                </VStack>
              </HStack>
              <Divider />
              <Grid columns={{ minWidth: 180, max: 2, repeat: 'fill' }} gap={2}>
                {cargoMetrics.map((/** @type {any} */ metric) => (
                  <Metric key={metric.label} {...metric} />
                ))}
              </Grid>
            </VStack>
          </Card>
        ) : null}
      </VStack>

      <VStack gap={3} hAlign="stretch">
        <SectionTitle number="3" label="NGÂN HÀNG & THANH TOÁN" />
        {bank?.items?.length ? (
          <Card padding={4}>
            <VStack gap={2} hAlign="stretch">
              <HStack gap={2} vAlign="center">
                <Icon icon={Building2} size="sm" color="accent" />
                <Heading level={3}>NGÂN HÀNG THỤ HƯỞNG</Heading>
              </HStack>
              {bank.items.map(
                (/** @type {any} */ item, /** @type {number} */ index) => (
                  <VStack
                    key={item.title ?? index}
                    gap={1}
                    hAlign="stretch"
                    xstyle={styles.inset}
                  >
                    {item.title ? (
                      <Text type="label" color="maritime-muted">
                        {item.title}
                      </Text>
                    ) : null}
                    <InfoRows rows={item.rows} />
                  </VStack>
                ),
              )}
            </VStack>
          </Card>
        ) : null}
        {paymentTerms?.items?.length ? (
          <Card padding={4}>
            <VStack gap={2} hAlign="stretch">
              <Text type="label" color="maritime-muted">
                {paymentTerms.title}
              </Text>
              {paymentTerms.items.map((/** @type {any} */ item) => (
                <PaymentTerm
                  key={item.label}
                  label={item.label}
                  amount={item.amount}
                  note={item.note}
                  status={item.status}
                />
              ))}
            </VStack>
          </Card>
        ) : null}
        <Card padding={4}>
          <VStack gap={2} hAlign="stretch">
            <HStack hAlign="between" vAlign="center">
              <Text type="label" color="maritime-muted">
                PHỤ LỤC
              </Text>
              <Link weight="semibold" onClick={onViewAnnexes}>
                + Xem tất cả
              </Link>
            </HStack>
            {annexes.length === 0 ? (
              <Text color="maritime-muted">Chưa có phụ lục</Text>
            ) : (
              annexes.map((annex) => <AnnexRow key={annex.code} {...annex} />)
            )}
          </VStack>
        </Card>
        {commission?.isEmpty ? (
          <Card padding={4}>
            <VStack gap={2} hAlign="stretch">
              <HStack gap={2} vAlign="center">
                <IconBadge icon={Wallet} />
                <Text type="label" color="maritime-muted">
                  HOA HỒNG (COMMISSION)
                </Text>
              </HStack>
              <Text color="maritime-muted">{commission.message}</Text>
              {commission.onAction ? (
                <HStack>
                  <Link weight="semibold" onClick={commission.onAction}>
                    {commission.actionLabel}
                  </Link>
                </HStack>
              ) : null}
            </VStack>
          </Card>
        ) : null}
        {commission && !commission.isEmpty ? (
          <Card padding={4}>
            <VStack gap={2} hAlign="stretch">
              <HStack hAlign="between" vAlign="center">
                <HStack gap={2} vAlign="center">
                  <IconBadge icon={Wallet} />
                  <Text type="label" color="maritime-muted">
                    HOA HỒNG (COMMISSION)
                  </Text>
                  <MaritimeBadge
                    label={commission.percentLabel}
                    tone="success"
                  />
                </HStack>
                <Link weight="semibold" onClick={onViewCommission}>
                  + Chi tiết
                </Link>
              </HStack>
              <InfoRows
                rows={[
                  ['Mã thỏa thuận:', commission.agreementCode, true],
                  ['Bên nhận:', commission.recipient],
                  ['Giá trị định mức:', commission.rateValue, true],
                ]}
              />
              <HStack hAlign="between" vAlign="center" wrap="wrap" gap={2}>
                <Text color="maritime-muted">Trạng thái ký:</Text>
                <MaritimeBadge
                  label={commission.signedLabel}
                  tone={commission.signedTone}
                />
              </HStack>
              <Divider />
              <HStack hAlign="between" vAlign="center" wrap="wrap" gap={2}>
                <Text color="maritime-muted">Tiến độ chi hoa hồng:</Text>
                <Text type="code" weight="bold">
                  {commission.paidAmount} / {commission.totalAmount}
                </Text>
              </HStack>
              <HStack xstyle={styles.commissionTrack}>
                <HStack
                  as="span"
                  xstyle={[
                    styles.commissionFill,
                    styles.commissionFillWidth(commission.paidPercent),
                  ]}
                />
              </HStack>
              <HStack hAlign="between" vAlign="center" wrap="wrap" gap={2}>
                <HStack gap={1} vAlign="center">
                  <Icon
                    icon={Check}
                    size="xsm"
                    color={/** @type {any} */ ('maritime-teal')}
                  />
                  <Text color="maritime-muted">{commission.paidLabel}</Text>
                </HStack>
                <HStack gap={1} vAlign="center">
                  <Text color="maritime-muted">Còn lại:</Text>
                  <Text type="code" weight="bold" color="primary">
                    {commission.remainingAmount}
                  </Text>
                </HStack>
              </HStack>
            </VStack>
          </Card>
        ) : null}
      </VStack>
    </Grid>
  );
}

/** @param {{number: string, label: string, trailing?: string}} props */
function SectionTitle({ number, label, trailing }) {
  return (
    <HStack hAlign="between" vAlign="center" gap={2}>
      <HStack gap={2} vAlign="center">
        <HStack as="span" xstyle={styles.titleMark} />
        <Text type="label" weight="bold">
          {number}. {label}
        </Text>
      </HStack>
      {trailing ? (
        <Text weight="bold" color="maritime-teal">
          {trailing}
        </Text>
      ) : null}
    </HStack>
  );
}
/** @param {any} props */
function PartyCard({ eyebrow, badge, name, rows }) {
  return (
    <Card padding={4}>
      <VStack gap={2} hAlign="stretch">
        <HStack hAlign="between" vAlign="center">
          <Text type="label" color="accent" weight="bold">
            {eyebrow}
          </Text>
          {badge ? (
            <MaritimeBadge label={badge.label} tone={badge.tone} />
          ) : null}
        </HStack>
        <Heading level={3}>{name}</Heading>
        <VStack gap={1} hAlign="stretch" xstyle={styles.inset}>
          <InfoRows rows={rows} />
        </VStack>
      </VStack>
    </Card>
  );
}
/**
 * Same structure as `PartyCard` (white `Card`, accent eyebrow, heading name,
 * muted inset with key-value rows) so consignee/notify party read as siblings
 * of the seller/buyer cards.
 * @param {any} props
 */
function ContactCard({ icon, label, name, rows = [], emptyMessage }) {
  return (
    <Card padding={4}>
      <VStack gap={2} hAlign="stretch">
        <HStack gap={1.5} vAlign="center">
          <Icon icon={icon} size="sm" color="accent" />
          <Text type="label" color="accent" weight="bold">
            {label}
          </Text>
        </HStack>
        {emptyMessage ? (
          <Text color="maritime-muted">{emptyMessage}</Text>
        ) : (
          <>
            <Heading level={3}>{name}</Heading>
            {rows.length > 0 ? (
              <VStack gap={1} hAlign="stretch" xstyle={styles.inset}>
                <InfoRows rows={rows} />
              </VStack>
            ) : null}
          </>
        )}
      </VStack>
    </Card>
  );
}
/**
 * Each row is `[label, value, isMono?, accent?, isBold?]`. `isList` switches
 * from the compact "label ... value" spread (short values, right-aligned) to
 * a key-value list — fixed label column, left-aligned wrapping value — for
 * cards with many fields or long values (e.g. bank details).
 * @param {{rows: any[], isList?: boolean}} props
 */
function InfoRows({ rows, isList = false }) {
  return rows.map(([label, value, mono, accent, isBold], index) => (
    <HStack
      key={`${label}-${index}`}
      hAlign={isList ? 'start' : 'between'}
      vAlign="start"
      gap={3}
    >
      <Text
        color="maritime-subtle"
        xstyle={[styles.rowLabel, isList && styles.listLabel]}
      >
        {label}
      </Text>
      <Text
        weight={isBold ? 'bold' : mono ? 'semibold' : undefined}
        type={mono ? 'code' : undefined}
        color={accent ? (accent === true ? 'accent' : accent) : 'primary'}
        xstyle={isList ? styles.listValue : styles.right}
      >
        {value}
      </Text>
    </HStack>
  ));
}
/** @param {{icon: import('react').ComponentType}} props */
function IconBadge({ icon }) {
  return (
    <HStack as="span" hAlign="center" vAlign="center" xstyle={styles.iconBadge}>
      <Icon icon={icon} size="sm" color="inherit" />
    </HStack>
  );
}
/** @param {any} props */
function Metric({ icon, label, value, unit }) {
  return (
    <VStack gap={1} hAlign="stretch" xstyle={styles.metric}>
      <HStack gap={1} vAlign="center">
        <Icon icon={icon} size="sm" color="accent" />
        <Text type="label">{label}</Text>
      </HStack>
      {/* `vAlign="center"`, not `"end"` — the value (`3xl`) and unit
          (`lg`) have different line-box heights, so bottom-aligning them
          left the unit reading as sunk below the number's own visual
          baseline instead of sitting next to it (user feedback,
          2026-09-18, "Tấn và (40' HC) bị lệch" — same fix as
          `payment-summary-card.jsx`'s `StatCard` value/unit row). */}
      <HStack gap={1} vAlign="center">
        <Text type="code" size="3xl" weight="bold">
          {value}
        </Text>
        <Text color="maritime-muted">{unit}</Text>
      </HStack>
    </VStack>
  );
}
/** @param {any} props */
function PaymentTerm({ label, amount, note, status }) {
  const paid = status === 'paid';
  return (
    <HStack
      gap={2}
      vAlign="start"
      xstyle={[
        styles.payment,
        paid ? styles.paymentPaid : styles.paymentActive,
      ]}
    >
      <HStack
        as="span"
        hAlign="center"
        vAlign="center"
        xstyle={[
          styles.paymentIcon,
          paid ? styles.paymentIconPaid : styles.paymentIconActive,
        ]}
      >
        <Icon icon={paid ? Check : Hourglass} size="xsm" color="inherit" />
      </HStack>
      <VStack gap={0} hAlign="stretch" xstyle={styles.fill}>
        <HStack hAlign="between" vAlign="center" gap={2}>
          <Text weight="bold" color={paid ? 'primary' : 'accent'}>
            {label}
          </Text>
          <Text
            type="code"
            weight="bold"
            color={paid ? 'maritime-teal' : 'accent'}
          >
            {amount}
          </Text>
        </HStack>
        <Text color="maritime-muted">{note}</Text>
      </VStack>
    </HStack>
  );
}

/** @param {{code: string, label: string, amount: string, isPositive: boolean}} props */
function AnnexRow({ code, label, amount, isPositive }) {
  return (
    <HStack hAlign="between" vAlign="center" gap={2} xstyle={styles.annexRow}>
      <HStack gap={2} vAlign="center">
        <Icon icon={FileText} size="sm" color="accent" />
        <VStack gap={0}>
          <Text type="code" weight="bold">
            {code}
          </Text>
          <Text color="maritime-muted">{label}</Text>
        </VStack>
      </HStack>
      <Text
        type="code"
        weight="bold"
        color={isPositive ? 'maritime-teal' : 'primary'}
      >
        {amount}
      </Text>
    </HStack>
  );
}

const styles = stylex.create({
  grid: { alignItems: 'start', width: '100%' },
  titleMark: {
    backgroundColor: 'var(--color-accent)',
    borderRadius: '2px',
    flexShrink: 0,
    height: '8px',
    width: '8px',
  },
  inset: {
    backgroundColor: 'var(--color-background-muted)',
    borderColor: 'var(--color-border)',
    borderRadius: 'var(--radius-inner)',
    borderStyle: 'solid',
    borderWidth: '1px',
    padding: 'var(--spacing-2)',
  },
  iconBadge: {
    backgroundColor: 'var(--color-accent)',
    borderRadius: '2px',
    color: 'var(--color-on-accent)',
    flexShrink: 0,
    height: '28px',
    width: '28px',
  },
  metric: {
    backgroundColor: 'var(--color-background-muted)',
    borderColor: 'var(--color-border)',
    borderRadius: 'var(--radius-inner)',
    borderStyle: 'solid',
    borderWidth: '1px',
    padding: 'var(--spacing-3)',
  },
  right: { textAlign: 'right' },
  rowLabel: { flexShrink: 0, whiteSpace: 'nowrap' },
  listLabel: { width: '140px' },
  listValue: {
    flexGrow: 1,
    minWidth: 0,
    overflowWrap: 'anywhere',
    textAlign: 'left',
  },
  payment: {
    borderRadius: 'var(--radius-inner)',
    borderStyle: 'solid',
    borderWidth: '1px',
    padding: 'var(--spacing-2)',
  },
  paymentPaid: {
    backgroundColor: 'var(--color-background-muted)',
    borderColor: 'var(--color-border)',
  },
  paymentActive: {
    backgroundColor: 'var(--maritime-step-active-bg)',
    borderColor: 'var(--maritime-badge-info-border)',
  },
  paymentIcon: {
    borderRadius: 'var(--radius-full)',
    color: 'var(--color-on-accent)',
    flexShrink: 0,
    height: '24px',
    width: '24px',
  },
  paymentIconPaid: { backgroundColor: 'var(--maritime-teal-value)' },
  paymentIconActive: { backgroundColor: 'var(--color-accent)' },
  annexRow: {
    backgroundColor: 'var(--color-background-muted)',
    borderColor: 'var(--color-border)',
    borderRadius: 'var(--radius-inner)',
    borderStyle: 'solid',
    borderWidth: '1px',
    padding: 'var(--spacing-2)',
  },
  commissionTrack: {
    backgroundColor: 'var(--color-border)',
    borderRadius: 'var(--radius-full)',
    height: '8px',
    overflow: 'hidden',
    width: '100%',
  },
  commissionFill: {
    backgroundColor: 'var(--color-success)',
    borderRadius: 'var(--radius-full)',
    height: '100%',
  },
  commissionFillWidth: (percent) => ({ width: `${percent}%` }),
  fill: { flexGrow: 1, minWidth: 0 },
});
