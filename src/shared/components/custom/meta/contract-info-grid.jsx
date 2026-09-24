'use client';

import { Card } from '@astryxdesign/core/Card';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Link } from '@astryxdesign/core/Link';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Heading, Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import {
  ArrowRight,
  Banknote,
  Check,
  Container,
  FileText,
  Hourglass,
  Landmark,
  Package,
  Phone,
  Weight,
} from 'lucide-react';

import { MetaPill } from './pill.jsx';

/**
 * @typedef {{
 *   label: string,
 *   value: string,
 *   weight?: 'normal' | 'semibold' | 'bold',
 *   tone?: 'primary' | 'accent' | 'success',
 * }} MetaInfoRow
 *
 * @typedef {{ label: string, tone: 'accent' | 'success' | 'neutral' }} MetaTag
 */

/** Text `color` per row tone — `meta-success` is a Meta theme variant. */
const ROW_COLOR = /** @type {const} */ ({
  primary: 'primary',
  accent: 'accent',
  success: 'meta-success',
});

/**
 * "Meta" contract-detail information grid — Figma node 89:1064's
 * "3-COLUMN INFORMATION GRID": 1. Thông tin đối tác (seller / buyer /
 * consignee / notify party), 2. Vận chuyển & hàng hóa (incoterm + dates +
 * signing status, cargo metrics), 3. Ngân hàng & thanh toán (beneficiary
 * bank, payment-term milestones, annexes, broker commission). Every card
 * is data-driven; `null` hides an optional card and `commission` may be
 * `{ isEmpty: true, message, actionLabel?, onAction? }`. Composed from
 * Astryx `Grid` / `Card` / `Text` / `Link` / `Skeleton` + `MetaPill`
 * (golden rule #15). A card whose data is still being fetched (`loading`)
 * renders as a `Skeleton` card of the same shape instead of an empty state.
 *
 * @param {{
 *   parties: Array<{ eyebrow: string, tag?: MetaTag, name: string, rows: MetaInfoRow[] }>,
 *   contacts: Array<{ icon: import('react').ComponentType, label: string, name?: string, lines?: string[], phone?: string, emptyMessage?: string }>,
 *   transport: null | { trailing?: string, incotermLabel?: string, rows: MetaInfoRow[], signingTags: MetaTag[] },
 *   cargo: null | { subtitle?: string, weightValue: string, weightUnit: string, packingValue: string, packingUnit?: string },
 *   bank: null | { items: Array<{ title?: string, rows: MetaInfoRow[] }> },
 *   paymentTerms: null | { title: string, items: Array<{ label: string, amount: string, note?: string, status: 'paid' | 'active' }> },
 *   annexes: { countLabel: string, items: Array<{ code: string, label: string, amount: string, isPositive: boolean }> },
 *   onViewAnnexes?: () => void,
 *   commission: null | { isEmpty: true, message: string, actionLabel?: string, onAction?: () => void } | { isEmpty?: false, rateLabel: string, rateValue: string, recipient: string, paidLabel: string, remainingLabel: string },
 *   onViewCommission?: () => void,
 *   loading?: { cargo?: boolean, bank?: boolean, annexes?: boolean, commission?: boolean },
 * }} props
 */
export function MetaContractInfoGrid({
  parties,
  contacts,
  transport,
  cargo,
  bank,
  paymentTerms,
  annexes,
  onViewAnnexes,
  commission,
  onViewCommission,
  loading = {},
}) {
  return (
    <Grid columns={{ minWidth: 340, max: 3 }} gap={5} xstyle={styles.grid}>
      <VStack gap={4} hAlign="stretch">
        <SectionTitle label="1. THÔNG TIN ĐỐI TÁC" />
        {parties.map((party) => (
          <PartyCard key={party.eyebrow} {...party} />
        ))}
        {contacts.map((contact) => (
          <ContactCard key={contact.label} {...contact} />
        ))}
      </VStack>

      <VStack gap={4} hAlign="stretch">
        <SectionTitle
          label="2. VẬN CHUYỂN & HÀNG HÓA"
          trailing={transport?.trailing}
        />
        {transport ? (
          <Card padding={5}>
            <VStack gap={3} hAlign="stretch">
              <HStack hAlign="between" vAlign="center" gap={2}>
                <CardEyebrow label="VẬN CHUYỂN & INCOTERM" />
                {transport.incotermLabel ? (
                  <MetaPill
                    label={transport.incotermLabel}
                    tone="accent"
                    size="lg"
                  />
                ) : null}
              </HStack>
              <VStack gap={2} hAlign="stretch">
                <InfoRows rows={transport.rows} />
              </VStack>
              {transport.signingTags.length ? (
                <HStack
                  hAlign="between"
                  vAlign="center"
                  wrap="wrap"
                  gap={2}
                  xstyle={styles.hairlineTop}
                >
                  <Text color="secondary">Trạng thái ký:</Text>
                  <HStack gap={1.5} wrap="wrap">
                    {transport.signingTags.map((tag) => (
                      <MetaPill
                        key={tag.label}
                        label={tag.label}
                        tone={tag.tone}
                        icon={tag.tone === 'success' ? Check : undefined}
                        hasBorder
                        size="lg"
                      />
                    ))}
                  </HStack>
                </HStack>
              ) : null}
            </VStack>
          </Card>
        ) : null}
        {loading.cargo ? <CardSkeleton rows={2} index={1} /> : null}
        {!loading.cargo && cargo ? (
          <Card padding={5}>
            <VStack gap={3} hAlign="stretch">
              <HStack gap={3} vAlign="center" xstyle={styles.hairlineBottom}>
                <IconBubble icon={Package} />
                <VStack gap={0}>
                  <Text weight="bold" xstyle={styles.caps}>
                    QUY CÁCH HÀNG HÓA & ĐÓNG GÓI
                  </Text>
                  {cargo.subtitle ? (
                    <Text color="secondary">{cargo.subtitle}</Text>
                  ) : null}
                </VStack>
              </HStack>
              <Grid columns={{ minWidth: 180, max: 2, repeat: 'fit' }} gap={3}>
                <CargoMetric
                  icon={Weight}
                  label="KHỐI LƯỢNG TỜ KHAI"
                  value={cargo.weightValue}
                  unit={cargo.weightUnit}
                />
                <CargoMetric
                  icon={Container}
                  label="SỐ LƯỢNG CONT / KIỆN"
                  value={cargo.packingValue}
                  unit={cargo.packingUnit}
                />
              </Grid>
            </VStack>
          </Card>
        ) : null}
      </VStack>

      <VStack gap={4} hAlign="stretch">
        <SectionTitle label="3. NGÂN HÀNG & THANH TOÁN" />
        {loading.bank ? <CardSkeleton rows={4} index={0} /> : null}
        {!loading.bank && bank?.items.length ? (
          <Card padding={5}>
            <VStack gap={3} hAlign="stretch">
              <HStack gap={2} vAlign="center">
                <Icon icon={Landmark} size="sm" color="accent" />
                <Text weight="bold" xstyle={styles.caps}>
                  NGÂN HÀNG THỤ HƯỞNG
                </Text>
              </HStack>
              {bank.items.map((item, index) => (
                <Inset key={item.title ?? index}>
                  {item.title ? <CardEyebrow label={item.title} /> : null}
                  <InfoRows rows={item.rows} />
                </Inset>
              ))}
            </VStack>
          </Card>
        ) : null}

        {paymentTerms?.items.length ? (
          <Card padding={5}>
            <VStack gap={3} hAlign="stretch">
              <CardEyebrow label={paymentTerms.title} />
              <VStack gap={3} hAlign="stretch">
                {paymentTerms.items.map((item) => (
                  <PaymentTerm key={item.label} {...item} />
                ))}
              </VStack>
            </VStack>
          </Card>
        ) : null}

        {loading.annexes ? <CardSkeleton rows={3} index={2} /> : null}
        {!loading.annexes ? (
          <Card padding={5}>
            <VStack gap={3} hAlign="stretch">
              <CardHeader
                icon={FileText}
                label="PHỤ LỤC HỢP ĐỒNG"
                actionLabel="Xem phụ lục"
                onAction={onViewAnnexes}
              />
              {/* <InfoRows
                rows={[
                  {
                    label: 'Số lượng phụ lục:',
                    value: annexes.countLabel,
                    weight: 'bold',
                  },
                ]}
              /> */}
              {annexes.items.length ? (
                <VStack gap={1.5} hAlign="stretch" xstyle={styles.hairlineTop}>
                  {annexes.items.map((annex) => (
                    <AnnexRow key={annex.code} {...annex} />
                  ))}
                </VStack>
              ) : null}
            </VStack>
          </Card>
        ) : null}

        {loading.commission ? <CardSkeleton rows={3} index={3} /> : null}
        {!loading.commission && commission ? (
          <Card padding={5}>
            <VStack gap={3} hAlign="stretch">
              <CardHeader
                icon={Banknote}
                label="HOA HỒNG MÔI GIỚI"
                actionLabel={commission.isEmpty ? undefined : 'Xem chi tiết'}
                onAction={commission.isEmpty ? undefined : onViewCommission}
              />
              {commission.isEmpty ? (
                <VStack gap={2} hAlign="start">
                  <Text color="secondary">{commission.message}</Text>
                  {commission.onAction ? (
                    <Link weight="bold" onClick={commission.onAction}>
                      {commission.actionLabel}
                    </Link>
                  ) : null}
                </VStack>
              ) : (
                <Inset>
                  <InfoRows
                    rows={[
                      {
                        label: commission.rateLabel,
                        value: commission.rateValue,
                        weight: 'bold',
                      },
                      {
                        label: 'Đối tác môi giới:',
                        value: commission.recipient,
                        weight: 'semibold',
                      },
                    ]}
                  />
                  <HStack
                    hAlign="between"
                    vAlign="start"
                    gap={3}
                    xstyle={styles.borderTop}
                  >
                    <Text color="secondary">Tình trạng thanh toán:</Text>
                    <VStack gap={0} hAlign="end">
                      <Text
                        weight="semibold"
                        color={/** @type {any} */ ('meta-success')}
                        hasTabularNumbers
                      >
                        {commission.paidLabel}
                      </Text>
                      <Text size="sm" color="accent" hasTabularNumbers>
                        {commission.remainingLabel}
                      </Text>
                    </VStack>
                  </HStack>
                </Inset>
              )}
            </VStack>
          </Card>
        ) : null}
      </VStack>
    </Grid>
  );
}

/**
 * Placeholder card: a header bar and `rows` label/value line pairs.
 * @param {{ rows: number, index: number }} props
 */
function CardSkeleton({ rows, index }) {
  return (
    <Card padding={5}>
      <VStack gap={3} hAlign="stretch">
        <HStack gap={2} vAlign="center" xstyle={styles.hairlineBottom}>
          <Skeleton
            width="var(--spacing-6)"
            height="var(--spacing-6)"
            radius="rounded"
            index={index}
          />
          <Skeleton
            width="45%"
            height="var(--spacing-4)"
            radius={2}
            index={index}
          />
        </HStack>
        <Inset>
          {Array.from({ length: rows }, (_, row) => (
            <HStack key={row} hAlign="between" vAlign="center" gap={3}>
              <Skeleton
                width="30%"
                height="var(--spacing-4)"
                radius={2}
                index={index + row}
              />
              <Skeleton
                width="40%"
                height="var(--spacing-4)"
                radius={2}
                index={index + row}
              />
            </HStack>
          ))}
        </Inset>
      </VStack>
    </Card>
  );
}

/** @param {{ label: string, trailing?: string }} props */
function SectionTitle({ label, trailing }) {
  return (
    <HStack
      hAlign="between"
      vAlign="center"
      gap={2}
      wrap="wrap"
      xstyle={styles.sectionTitle}
    >
      <HStack gap={2} vAlign="center">
        <HStack as="span" xstyle={styles.sectionDot} />
        <Heading level={4} accessibilityLevel={2} xstyle={styles.caps}>
          {label}
        </Heading>
      </HStack>
      {/* {trailing ? <MetaPill label={trailing} tone="success" /> : null} */}
    </HStack>
  );
}

/** @param {{ label: string }} props */
function CardEyebrow({ label }) {
  return (
    <Text weight="semibold" color="secondary" xstyle={styles.caps}>
      {label}
    </Text>
  );
}

/**
 * @param {{
 *   icon: import('react').ComponentType,
 *   label: string,
 *   actionLabel?: string,
 *   onAction?: () => void,
 * }} props
 */
function CardHeader({ icon, label, actionLabel, onAction }) {
  return (
    <HStack
      hAlign="between"
      vAlign="center"
      gap={2}
      xstyle={styles.hairlineBottom}
    >
      <HStack gap={2} vAlign="center">
        <Icon icon={icon} size="sm" color="accent" />
        <Text weight="bold" color="secondary" xstyle={styles.caps}>
          {label}
        </Text>
      </HStack>
      {actionLabel && onAction ? (
        <Link weight="bold" color="accent" onClick={onAction}>
          <HStack as="span" gap={1} vAlign="center" wrap="nowrap">
            <Text as="span" type="inherit" color="inherit" size="base">
              {actionLabel}
            </Text>
            <Icon icon={ArrowRight} size="sm" color="inherit" />
          </HStack>
        </Link>
      ) : null}
    </HStack>
  );
}

/** @param {{ children: import('react').ReactNode }} props */
function Inset({ children }) {
  return (
    <VStack gap={1.5} hAlign="stretch" xstyle={styles.inset}>
      {children}
    </VStack>
  );
}

/** @param {{ rows: MetaInfoRow[] }} props */
function InfoRows({ rows }) {
  return rows.map((row, index) => (
    <HStack
      key={`${row.label}-${index}`}
      hAlign="between"
      vAlign="start"
      gap={3}
    >
      <Text color="secondary" xstyle={styles.rowLabel}>
        {row.label}
      </Text>
      <Text
        weight={row.weight}
        color={/** @type {any} */ (ROW_COLOR[row.tone ?? 'primary'])}
        justify="end"
        xstyle={styles.rowValue}
      >
        {row.value}
      </Text>
    </HStack>
  ));
}

/**
 * @param {{ eyebrow: string, tag?: MetaTag, name: string, rows: MetaInfoRow[] }} props
 */
function PartyCard({ eyebrow, tag, name, rows }) {
  return (
    <Card padding={5}>
      <VStack gap={3} hAlign="stretch">
        <HStack hAlign="between" vAlign="center" gap={2}>
          <Text weight="bold" color="accent" xstyle={styles.caps}>
            {eyebrow}
          </Text>
          {tag ? (
            <MetaPill label={tag.label} tone={tag.tone} size="sm" />
          ) : null}
        </HStack>
        <Heading level={4} accessibilityLevel={3}>
          {name}
        </Heading>
        <Inset>
          <InfoRows rows={rows} />
        </Inset>
      </VStack>
    </Card>
  );
}

/**
 * @param {{
 *   icon: import('react').ComponentType,
 *   label: string,
 *   name?: string,
 *   lines?: string[],
 *   phone?: string,
 *   emptyMessage?: string,
 * }} props
 */
function ContactCard({ icon, label, name, lines = [], phone, emptyMessage }) {
  return (
    <Card padding={4}>
      <VStack gap={1.5} hAlign="stretch">
        <HStack gap={1.5} vAlign="center">
          <Icon icon={icon} size="sm" color="accent" />
          <Text size="sm" weight="bold" xstyle={styles.caps}>
            {label}
          </Text>
        </HStack>
        {emptyMessage ? (
          <Text color="secondary">{emptyMessage}</Text>
        ) : (
          <>
            <Text weight="semibold">{name}</Text>
            {lines.map((line) => (
              <Text key={line} size="sm" color="secondary">
                {line}
              </Text>
            ))}
            {phone ? (
              <HStack gap={1} vAlign="center" xstyle={styles.phone}>
                <Icon icon={Phone} size="xsm" color="accent" />
                <Text size="sm" weight="medium" color="accent">
                  {phone}
                </Text>
              </HStack>
            ) : null}
          </>
        )}
      </VStack>
    </Card>
  );
}

/** @param {{ icon: import('react').ComponentType }} props */
function IconBubble({ icon }) {
  return (
    <HStack as="span" hAlign="center" vAlign="center" xstyle={styles.bubble}>
      <Icon icon={icon} size="sm" color="inherit" />
    </HStack>
  );
}

/**
 * @param {{
 *   icon: import('react').ComponentType,
 *   label: string,
 *   value: string,
 *   unit?: string,
 * }} props
 */
function CargoMetric({ icon, label, value, unit }) {
  return (
    <VStack gap={1.5} hAlign="stretch" xstyle={[styles.inset, styles.cargo]}>
      <HStack gap={1.5} vAlign="center">
        <Icon icon={icon} size="sm" color="accent" />
        <Text size="sm" weight="bold" xstyle={styles.caps}>
          {label}
        </Text>
      </HStack>
      <HStack gap={1.5} wrap="wrap" xstyle={styles.baseline}>
        <Text size="xl" weight="bold" hasTabularNumbers>
          {value}
        </Text>
        {unit ? (
          <Text
            size="sm"
            weight="semibold"
            color={/** @type {any} */ ('meta-subtle')}
          >
            {unit}
          </Text>
        ) : null}
      </HStack>
    </VStack>
  );
}

/**
 * @param {{ label: string, amount: string, note?: string, status: 'paid' | 'active' }} props
 */
function PaymentTerm({ label, amount, note, status }) {
  const isPaid = status === 'paid';
  return (
    <HStack
      gap={3}
      vAlign="start"
      xstyle={[styles.inset, !isPaid && styles.termActive]}
    >
      <HStack
        as="span"
        hAlign="center"
        vAlign="center"
        xstyle={[
          styles.termIcon,
          isPaid ? styles.termIconPaid : styles.termIconActive,
        ]}
      >
        <Icon icon={isPaid ? Check : Hourglass} size="xsm" color="inherit" />
      </HStack>
      <VStack gap={0.5} hAlign="stretch" xstyle={styles.fill}>
        <HStack hAlign="between" vAlign="center" gap={2} wrap="wrap">
          <Text weight="bold" color={isPaid ? 'primary' : 'accent'}>
            {label}
          </Text>
          <Text
            weight="bold"
            color={/** @type {any} */ (isPaid ? 'meta-success' : 'accent')}
            hasTabularNumbers
          >
            {amount}
          </Text>
        </HStack>
        {note ? (
          <Text size="sm" color="secondary">
            {note}
          </Text>
        ) : null}
      </VStack>
    </HStack>
  );
}

/**
 * @param {{ code: string, label: string, amount: string, isPositive: boolean }} props
 */
function AnnexRow({ code, label, amount, isPositive }) {
  const tone = isPositive ? 'meta-success' : 'secondary';
  return (
    <HStack
      hAlign="between"
      vAlign="center"
      gap={2}
      xstyle={[styles.inset, styles.annex]}
    >
      <VStack gap={0}>
        <Text weight="semibold">{code}</Text>
        <Text weight="medium" color={/** @type {any} */ (tone)}>
          {label}
        </Text>
      </VStack>
      <Text weight="bold" color={/** @type {any} */ (tone)} hasTabularNumbers>
        {amount}
      </Text>
    </HStack>
  );
}

const styles = stylex.create({
  // Value + unit share a baseline (Figma "$485,000 USD", "73.5 Tấn").
  baseline: { alignItems: 'baseline' },
  grid: {
    alignItems: 'start',
    gridTemplateColumns: {
      default: null,
      '@media (max-width: 599px)': 'minmax(0, 1fr)',
    },
    width: '100%',
  },
  sectionTitle: {
    paddingInline: 'var(--spacing-1)',
  },
  sectionDot: {
    backgroundColor: 'var(--color-accent)',
    borderRadius: 'var(--radius-full)',
    flexShrink: 0,
    height: 'calc(var(--spacing-2) + var(--spacing-0-5))',
    width: 'calc(var(--spacing-2) + var(--spacing-0-5))',
  },
  caps: {
    letterSpacing: '0.05em',
  },
  inset: {
    backgroundColor: 'var(--meta-inset-bg)',
    borderColor: 'var(--meta-hairline)',
    borderRadius: 'var(--meta-radius-inset)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    padding: 'var(--spacing-3)',
  },
  cargo: {
    borderRadius: 'var(--radius-container)',
  },
  annex: {
    padding: 'var(--spacing-2)',
  },
  termActive: {
    backgroundColor: 'var(--meta-blue-active-bg)',
    borderColor: 'var(--meta-blue-active-border)',
  },
  termIcon: {
    borderRadius: 'var(--radius-full)',
    color: 'var(--color-on-accent)',
    flexShrink: 0,
    height: 'var(--spacing-6)',
    width: 'var(--spacing-6)',
  },
  termIconPaid: { backgroundColor: 'var(--meta-emerald-fill)' },
  termIconActive: { backgroundColor: 'var(--color-accent)' },
  bubble: {
    backgroundColor: 'var(--meta-blue-wash)',
    borderRadius: 'var(--radius-full)',
    color: 'var(--color-accent)',
    flexShrink: 0,
    height: 'var(--spacing-8)',
    width: 'var(--spacing-8)',
  },
  hairlineTop: {
    borderTopColor: 'var(--meta-hairline)',
    borderTopStyle: 'solid',
    borderTopWidth: 'var(--border-width)',
    paddingTop: 'var(--spacing-2)',
  },
  hairlineBottom: {
    borderBottomColor: 'var(--meta-hairline)',
    borderBottomStyle: 'solid',
    borderBottomWidth: 'var(--border-width)',
    paddingBottom: 'var(--spacing-2)',
  },
  borderTop: {
    borderTopColor: 'var(--color-border)',
    borderTopStyle: 'solid',
    borderTopWidth: 'var(--border-width)',
    paddingTop: 'var(--spacing-1)',
  },
  phone: {
    paddingTop: 'var(--spacing-1)',
  },
  rowLabel: { flexShrink: 0, whiteSpace: 'nowrap' },
  rowValue: { minWidth: 0, overflowWrap: 'anywhere' },
  fill: { flexGrow: 1, minWidth: 0 },
});
