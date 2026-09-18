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
  Phone,
  Scale,
  Truck,
  Wallet,
} from 'lucide-react';

import { MaritimeBadge } from './badge.jsx';
import { MaritimeChip } from './chip.jsx';

const parties = [
  {
    eyebrow: 'BÊN BÁN (SELLER)',
    country: 'VIET NAM',
    countryTone: 'success',
    name: 'CÔNG TY CỔ PHẦN THƯƠNG MẠI TIẾP VẬN QUỐC TẾ Á CHÂU',
    rows: [
      ['Người đại diện:', 'Ông Trần Đình Long'],
      ['Chức vụ:', 'Tổng Giám Đốc'],
      ['Mã số thuế:', '0312345678', true],
      ['Địa chỉ:', 'Quận 1, TP. Hồ Chí Minh'],
    ],
  },
  {
    eyebrow: 'BÊN MUA (BUYER)',
    country: 'UNITED STATES',
    countryTone: 'blue',
    name: 'PACIFIC METALS CORPORATION',
    rows: [
      ['Người đại diện:', 'Mr. Robert Sterling'],
      ['Chức vụ:', 'Procurement Director'],
      ['Mã số thuế:', 'CUS-T-USA-9921', true],
      ['Địa chỉ:', 'Long Beach, California, USA'],
    ],
  },
];

const payments = [
  [
    'Đợt 1 (30% - T/T)',
    '$135,000 USD',
    'Thanh toán cọc trong 03 ngày kể từ ngày ký HĐ.',
    'paid',
  ],
  [
    'Đợt 2 (40% - T/T)',
    '$180,250 USD',
    'Thanh toán khi xuất trình B/L & Tờ khai hải quan thông quan.',
    'paid',
  ],
  [
    'Đợt 3 (30% - L/C)',
    '$169,750 USD',
    'Mở L/C không hủy ngang tại chỗ khi giao bộ chứng từ gốc.',
    'active',
  ],
];

const annexes = [
  { code: 'AN-01', label: 'Phát sinh tăng', amount: '+$35,000 USD', isPositive: true },
  { code: 'AN-02', label: 'Thay đổi giá trị', amount: '$0 USD', isPositive: false },
];

const commission = {
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

export function MaritimeContractFoundationGrid() {
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
        <ContactCard
          icon={Truck}
          label="CONSIGNEE"
          name="Trans-Pacific Forwarding LLC"
          address="Terminal 4, Port of Long Beach, CA 90802, USA"
          phone="+1 (562) 899-4400 (Mr. David Vance)"
        />
        <ContactCard
          icon={Bell}
          label="NOTIFY PARTY"
          name="Global Logistics & Shipping Co."
          address="Suite 300, 1200 Seaside Ave, Long Beach, CA 90802"
          phone="+1 (562) 555-0199 (Ms. Sarah Connor)"
        />
      </VStack>

      <VStack gap={3} hAlign="stretch">
        <SectionTitle
          number="2"
          label="VẬN CHUYỂN & HÀNG HÓA"
          trailing="100% Đã xuất xưởng"
        />
        <Card padding={4}>
          <VStack gap={2} hAlign="stretch">
            <HStack hAlign="between" vAlign="center">
              <Text type="label" size="lg" color="maritime-muted">
                VẬN CHUYỂN & INCOTERM
              </Text>
              <MaritimeChip label="CIF 2020" size="md" />
            </HStack>
            <InfoRows
              rows={[
                ['Nơi xếp hàng:', 'Cảng Cát Lái (VN-SGN)'],
                ['Nơi dỡ hàng:', 'Cảng Long Beach (US-LGB)'],
                ['Ngày báo giá:', '10/03/2024', true],
                ['Ngày ký:', '15/03/2024', true],
                ['Ngày hoàn thành:', '31/12/2024', true],
              ]}
            />
            <Divider />
            <HStack hAlign="between" vAlign="center" wrap="wrap" gap={2}>
              <Text size="lg" color="maritime-muted">
                Trạng thái ký:
              </Text>
              <HStack gap={1} wrap="wrap">
                <MaritimeBadge label="Bên A đã ký" tone="success" />
                <MaritimeBadge label="Bên B đã ký" tone="success" />
              </HStack>
            </HStack>
          </VStack>
        </Card>
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
              <Metric
                icon={Scale}
                label="KHỐI LƯỢNG TỜ KHAI"
                value="73.5"
                unit="Tấn"
              />
              <Metric
                icon={Container}
                label="SỐ LƯỢNG CONT / KIỆN"
                value="3 Cont"
                unit="(40' HC)"
              />
            </Grid>
          </VStack>
        </Card>
      </VStack>

      <VStack gap={3} hAlign="stretch">
        <SectionTitle number="3" label="NGÂN HÀNG & THANH TOÁN" />
        <Card padding={4}>
          <VStack gap={2} hAlign="stretch">
            <HStack gap={2} vAlign="center">
              <Icon icon={Building2} size="sm" color="accent" />
              <Heading level={3}>NGÂN HÀNG THỤ HƯỞNG</Heading>
            </HStack>
            <VStack gap={1} hAlign="stretch" xstyle={styles.inset}>
              <InfoRows
                rows={[
                  ['Ngân hàng:', 'Vietcombank (VCB)'],
                  ['Chi nhánh:', 'Tân Bình, TP.HCM'],
                  ['Số tài khoản (USD):', '1032407684', true],
                  ['Mã SWIFT:', 'BFTVVNVX044', true, true],
                ]}
              />
            </VStack>
          </VStack>
        </Card>
        <Card padding={4}>
          <VStack gap={2} hAlign="stretch">
            <Text type="label" size="lg" color="maritime-muted">
              3 MỐC ĐIỀU KHOẢN THANH TOÁN HỢP ĐỒNG
            </Text>
            {payments.map(([label, amount, note, status]) => (
              <PaymentTerm
                key={label}
                label={label}
                amount={amount}
                note={note}
                status={status}
              />
            ))}
          </VStack>
        </Card>
        <Card padding={4}>
          <VStack gap={2} hAlign="stretch">
            <HStack hAlign="between" vAlign="center">
              <Text type="label" size="lg" color="maritime-muted">
                PHỤ LỤC
              </Text>
              <Link size="lg" weight="semibold">
                + Xem tất cả
              </Link>
            </HStack>
            {annexes.map((annex) => (
              <AnnexRow key={annex.code} {...annex} />
            ))}
          </VStack>
        </Card>
        <Card padding={4}>
          <VStack gap={2} hAlign="stretch">
            <HStack hAlign="between" vAlign="center">
              <HStack gap={2} vAlign="center">
                <IconBadge icon={Wallet} />
                <Text type="label" size="lg" color="maritime-muted">
                  HOA HỒNG (COMMISSION)
                </Text>
                <MaritimeBadge label="3%" tone="success" />
              </HStack>
              <Link size="lg" weight="semibold">
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
              <Text size="lg" color="maritime-muted">
                Trạng thái ký:
              </Text>
              <MaritimeBadge label="Đã ký 2 bên" tone="success" />
            </HStack>
            <Divider />
            <HStack hAlign="between" vAlign="center" wrap="wrap" gap={2}>
              <Text size="lg" color="maritime-muted">
                Tiến độ chi hoa hồng:
              </Text>
              <Text type="code" size="lg" weight="bold">
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
                <Text size="lg" color="maritime-muted">
                  {commission.paidLabel}
                </Text>
              </HStack>
              <HStack gap={1} vAlign="center">
                <Text size="lg" color="maritime-muted">
                  Còn lại:
                </Text>
                <Text type="code" size="lg" weight="bold" color="primary">
                  {commission.remainingAmount}
                </Text>
              </HStack>
            </HStack>
          </VStack>
        </Card>
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
        <Text type="label" size="lg" weight="bold">
          {number}. {label}
        </Text>
      </HStack>
      {trailing ? (
        <Text size="lg" weight="bold" color="maritime-teal">
          {trailing}
        </Text>
      ) : null}
    </HStack>
  );
}
/** @param {any} props */
function PartyCard({ eyebrow, country, countryTone, name, rows }) {
  return (
    <Card padding={4}>
      <VStack gap={2} hAlign="stretch">
        <HStack hAlign="between" vAlign="center">
          <Text type="label" size="lg" color="accent" weight="bold">
            {eyebrow}
          </Text>
          <MaritimeBadge label={country} tone={countryTone} />
        </HStack>
        <Heading level={3}>{name}</Heading>
        <VStack gap={1} hAlign="stretch" xstyle={styles.inset}>
          <InfoRows rows={rows} />
        </VStack>
      </VStack>
    </Card>
  );
}
/** @param {any} props */
function ContactCard({ icon, label, name, address, phone }) {
  return (
    <VStack gap={1} hAlign="stretch" xstyle={styles.contact}>
      <HStack gap={1} vAlign="center">
        <Icon icon={icon} size="xsm" color="primary" />
        <Text type="label" size="lg">
          {label}
        </Text>
      </HStack>
      <Text size="lg" weight="semibold">
        {name}
      </Text>
      <Text size="lg" color="maritime-muted">
        {address}
      </Text>
      <HStack gap={1} vAlign="center">
        <Icon icon={Phone} size="xsm" color="accent" />
        <Text type="code" size="lg" color="accent">
          {phone}
        </Text>
      </HStack>
    </VStack>
  );
}
/** @param {{rows: any[]}} props */
function InfoRows({ rows }) {
  return rows.map(([label, value, mono, accent]) => (
    <HStack key={label} hAlign="between" vAlign="start" gap={3}>
      <Text size="lg" color="maritime-muted">
        {label}
      </Text>
      <Text
        size="lg"
        weight={mono ? 'semibold' : undefined}
        type={mono ? 'code' : undefined}
        color={accent ? (accent === true ? 'accent' : accent) : 'primary'}
        xstyle={styles.right}
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
        <Text type="label" size="lg">
          {label}
        </Text>
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
        <Text size="lg" color="maritime-muted">
          {unit}
        </Text>
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
          <Text size="lg" weight="bold" color={paid ? 'primary' : 'accent'}>
            {label}
          </Text>
          <Text
            type="code"
            size="lg"
            weight="bold"
            color={paid ? 'maritime-teal' : 'accent'}
          >
            {amount}
          </Text>
        </HStack>
        <Text size="lg" color="maritime-muted">
          {note}
        </Text>
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
          <Text type="code" size="lg" weight="bold">
            {code}
          </Text>
          <Text size="lg" color="maritime-muted">
            {label}
          </Text>
        </VStack>
      </HStack>
      <Text
        type="code"
        size="lg"
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
  contact: {
    backgroundColor: 'var(--color-background-muted)',
    borderColor: 'var(--color-border)',
    borderRadius: 'var(--radius-inner)',
    borderStyle: 'solid',
    borderWidth: '1px',
    padding: 'var(--spacing-3)',
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
