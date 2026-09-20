'use client';

import { Card } from '@astryxdesign/core/Card';
import { Carousel } from '@astryxdesign/core/Carousel';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Link } from '@astryxdesign/core/Link';
import { Heading, Text } from '@astryxdesign/core/Text';
import { Tooltip } from '@astryxdesign/core/Tooltip';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import {
  CheckCircle2,
  ChevronRight,
  Circle,
  CircleDollarSign,
  Clock,
  FileCheck2,
  FileText,
  RefreshCw,
  Truck,
} from 'lucide-react';

import { MaritimeBadge } from './badge.jsx';

/**
 * Maritime theme — Payment Summary card: the second card built from the
 * Figma file at
 * https://www.figma.com/design/lPZR4jL1VwX6ICnLiiBinv/Untitled?node-id=3-504
 * (frame `fg.card-gia-tri`, "4 Khối số liệu tài chính lớn" +
 * "Segmented Progress Bar" + "Dãy Stepper các đợt cuộn ngang"), read
 * directly via the Figma MCP bridge — no Stitch HTML mockup exists for
 * this screen, so exact colors/copy come from the Figma node tree itself
 * (hex fills read off each TEXT/RECTANGLE node), same "source of truth"
 * principle `theme.js`'s file header applies to the Stitch mockup.
 *
 * Layout: 4 `StatCard`s (financial figures) in a row, then a payment
 * progress section — label + "X% ĐÃ THU" badge + amount + a "Chi tiết
 * thanh toán" link, a 3-segment progress bar (paid/current/remaining),
 * and a horizontally-scrolling row of `InstallmentStep` cards (one per
 * payment installment — "Đợt 01".."Đợt 10" in the mockup).
 *
 * Astryx ships a real `Stepper`/`Step` pair with its own built-in
 * segmented progress bar, but its visual contract is a label+indicator
 * beside a connector line, not a bordered, color-tinted card per step —
 * the Figma installment row needs per-step background/border color
 * (paid=teal, active=accent, upcoming=neutral) that `Step` has no prop
 * for. Composed from plain Astryx primitives instead, matching this
 * folder's established pattern (`contract-overview-card.jsx`) over
 * forcing a component built for a different look.
 *
 * All copy below defaults to the Figma mockup's own Vietnamese strings
 * and data, but every list is an overridable prop — this card has no
 * fixed "contract" shape, it renders whatever a caller passes.
 * @param {{
 *   title?: string,
 *   titleIcon?: import('react').ComponentType,
 *   statCards?: Array<{
 *     id: string,
 *     label: string,
 *     value: string,
 *     unit?: string,
 *     note?: string,
 *     tone?: 'default' | 'teal' | 'accent',
 *     badgeTone?: 'default' | 'teal',
 *     icon?: import('react').ComponentType,
 *     noteIcon?: import('react').ComponentType,
 *     valueSize?: import('@astryxdesign/core/Text').TextProps['size'],
 *     unitSize?: import('@astryxdesign/core/Text').TextProps['size'],
 *   }>,
 *   progressLabel?: string,
 *   paidPercent?: number,
 *   currentPercent?: number,
 *   paidPercentLabel?: string,
 *   paidAmountValue?: string,
 *   totalAmountValue?: string,
 *   detailLabel?: string,
 *   onViewDetail?: () => void,
 *   installments?: Array<{
 *     id: string,
 *     label: string,
 *     amount: string,
 *     unit?: string,
 *     dueDate: string,
 *     term?: string,
 *     status: 'paid' | 'active' | 'upcoming',
 *   }>,
 *   activeBadgeLabel?: string,
 *   installmentDateLabel?: string,
 *   installmentTermLabel?: string,
 * }} props
 */
export function MaritimePaymentSummaryCard({
  title = 'GIÁ TRỊ',
  titleIcon = CircleDollarSign,
  statCards = DEFAULT_STAT_CARDS,
  progressLabel = 'TIẾN ĐỘ THANH TOÁN:',
  paidPercent = 65,
  currentPercent = 15,
  paidPercentLabel = '65% ĐÃ THU',
  paidAmountValue = '315,250 USD',
  totalAmountValue = '485,000 USD',
  detailLabel = 'Chi tiết thanh toán',
  onViewDetail,
  installments = DEFAULT_INSTALLMENTS,
  activeBadgeLabel = 'ĐANG THU',
  installmentDateLabel = 'Ngày thanh toán',
  installmentTermLabel = 'Hình thức',
}) {
  const remainingPercent = Math.max(0, 100 - paidPercent - currentPercent);

  return (
    <Card padding={5}>
      <VStack gap={4} hAlign="stretch">
        <HStack gap={2} vAlign="center" xstyle={styles.header}>
          <Icon icon={titleIcon} size="sm" color="accent" />
          <Heading level={2}>{title}</Heading>
        </HStack>

        {/*
          Grid, not a stretching HStack: on a very wide monitor an
          equal-flex-grow row would stretch these 5 cards edge-to-edge,
          reading as oversized/empty (user feedback, 2026-09-18). `Grid`'s
          `repeat: 'fill'` keeps each card at its natural width and lets
          unused width become empty track instead of inflating the cards;
          `stat`'s own `maxWidth` (below) is the hard cap for the case
          where there's still leftover space smaller than one more
          `minWidth`-sized track.
        */}
        <Grid columns={{ minWidth: 240, max: 5, repeat: 'fill' }} gap={1}>
          {statCards.map((stat) => (
            <StatCard key={stat.id} {...stat} />
          ))}
        </Grid>

        <VStack gap={2} hAlign="stretch">
          {/* Figma (node 7:1320): the row splits into two groups, not
              "label alone" vs. "badge + amount + button" — the badge sits
              beside the label on the left, the amount and button pair up
              on the right (user feedback, 2026-09-18). The amount itself
              is a mixed-color run in Figma: the paid figure in
              `--maritime-teal-value` (#0F766E), the "/ total" remainder
              in `--color-text-primary` (#0B1C30) — exact hex values from
              user feedback, 2026-09-18 — instead of one flat bold
              string. */}
          <HStack gap={2} vAlign="center" hAlign="between" wrap="wrap">
            <HStack gap={2} vAlign="center" wrap="wrap">
              <Text type="label" color="maritime-muted">
                {progressLabel}
              </Text>
              <MaritimeBadge
                size="lg"
                label={paidPercentLabel}
                tone="success"
              />
            </HStack>
            <HStack gap={2} vAlign="center" wrap="wrap">
              <Text as="span" weight="bold" color="maritime-teal">
                {paidAmountValue}
              </Text>
              <Text as="span" weight="bold" color="primary">
                / {totalAmountValue}
              </Text>
              <HStack
                as="span"
                vAlign="center"
                gap={1}
                xstyle={styles.detailLink}
              >
                <Link
                  weight="semibold"
                  color="inherit"
                  onClick={onViewDetail}
                >
                  {detailLabel}
                </Link>
                <Icon icon={ChevronRight} size="xsm" color="inherit" />
              </HStack>
            </HStack>
          </HStack>

          <HStack xstyle={styles.track}>
            <HStack
              as="span"
              xstyle={[
                styles.segment,
                styles.segmentPaid,
                styles.width(paidPercent),
              ]}
            />
            <HStack
              as="span"
              xstyle={[
                styles.segment,
                styles.segmentCurrent,
                styles.width(currentPercent),
              ]}
            />
            <HStack
              as="span"
              xstyle={[
                styles.segment,
                styles.segmentRemaining,
                styles.width(remainingPercent),
              ]}
            />
          </HStack>

          {/*
            Carousel (swiper-style), not a plain overflow-x row (user
            request, 2026-09-18): snap-scrolling + prev/next buttons +
            edge fade instead of a bare scrollbar for the 10 installment
            cards.
          */}
          <Carousel gap={2} hasSnap aria-label="Các đợt thanh toán">
            {installments.map((installment) => (
              <InstallmentStep
                key={installment.id}
                {...installment}
                activeBadgeLabel={activeBadgeLabel}
                dateLabel={installmentDateLabel}
                termLabel={installmentTermLabel}
              />
            ))}
          </Carousel>
        </VStack>
      </VStack>
    </Card>
  );
}

// Per-tone `color` prop values for each stat-card text role — see
// `theme.js`'s `components.text` comment for why these are explicit
// props (`accent` is Astryx's own built-in color; the `maritime-*` ones
// are custom variants registered there) instead of CSS-inherited from a
// tone-colored parent.
/**
 * @type {Record<'default' | 'teal' | 'accent', {
 *   label: import('@astryxdesign/core/Text').TextProps['color'],
 *   value: import('@astryxdesign/core/Text').TextProps['color'],
 *   unit: import('@astryxdesign/core/Text').TextProps['color'],
 *   note: import('@astryxdesign/core/Text').TextProps['color'],
 * }>}
 */
const STAT_TONE_COLORS = {
  default: {
    label: 'maritime-muted',
    value: 'primary',
    unit: 'maritime-muted',
    note: 'maritime-subtle',
  },
  teal: {
    label: 'maritime-muted',
    value: 'maritime-teal',
    unit: 'maritime-muted',
    note: 'maritime-teal-text',
  },
  accent: {
    label: 'accent',
    value: 'accent',
    unit: 'maritime-muted',
    note: 'maritime-subtle',
  },
};

/**
 * @param {{
 *   label: string,
 *   value: string,
 *   unit?: string,
 *   note?: string,
 *   tone?: 'default' | 'teal' | 'accent',
 *   badgeTone?: 'default' | 'teal',
 *   icon?: import('react').ComponentType,
 *   noteIcon?: import('react').ComponentType,
 *   valueSize?: import('@astryxdesign/core/Text').TextProps['size'],
 *   unitSize?: import('@astryxdesign/core/Text').TextProps['size'],
 * }} props
 */
function StatCard({
  label,
  value,
  unit,
  note,
  tone = 'default',
  badgeTone = 'default',
  icon,
  noteIcon,
  valueSize = '3xl',
  unitSize = 'base',
}) {
  const colors = STAT_TONE_COLORS[tone];
  return (
    <VStack
      gap={2}
      hAlign="stretch"
      xstyle={/** @type {any} */ ([styles.stat, statToneStyles[tone]])}
    >
      <HStack gap={2} vAlign="start" hAlign="between">
        <Text type="label" color={colors.label}>
          {label}
        </Text>
        {icon ? (
          <HStack
            as="span"
            vAlign="center"
            hAlign="center"
            xstyle={[styles.statBadge, statBadgeToneStyles[badgeTone]]}
          >
            <Icon icon={icon} size="sm" color="inherit" />
          </HStack>
        ) : null}
      </HStack>
      {/* `vAlign="center"`, not `"end"` — the value (`lineHeight: 1`,
          via `statValue`) and unit (`Text`'s own default line-height,
          markedly taller at this size gap) have different line-box
          heights, so bottom-aligning them left "USD" reading as sunken
          below the number's own visual baseline instead of sitting next
          to it (user feedback, 2026-09-18, "USD đang bị lệch" — same fix
          as the payment-amount/date row above). */}
      <HStack gap={1} vAlign="center" wrap="wrap">
        <Text
          weight="bold"
          size={valueSize}
          color={colors.value}
          xstyle={styles.statValue}
        >
          {value}
        </Text>
        {unit ? (
          <Text weight="semibold" size={unitSize} color={colors.unit}>
            {unit}
          </Text>
        ) : null}
      </HStack>
      {note ? (
        <HStack gap={1} vAlign="center" wrap="nowrap">
          {noteIcon ? (
            <Icon
              icon={noteIcon}
              size="sm"
              color={/** @type {any} */ (colors.note)}
            />
          ) : null}
          <Text color={colors.note}>
            {note}
          </Text>
        </HStack>
      ) : null}
    </VStack>
  );
}

/**
 * @param {{
 *   label: string,
 *   amount: string,
 *   unit?: string,
 *   dueDate: string,
 *   term?: string,
 *   status: 'paid' | 'active' | 'upcoming',
 *   activeBadgeLabel: string,
 *   dateLabel: string,
 *   termLabel: string,
 * }} props
 */
function InstallmentStep({
  label,
  amount,
  unit,
  dueDate,
  term,
  status,
  activeBadgeLabel,
  dateLabel,
  termLabel,
}) {
  const StatusIcon = INSTALLMENT_STATUS_ICONS[status];
  const hasDetails = Boolean(dueDate || term);
  return (
    <Tooltip
      isEnabled={hasDetails}
      hasHoverIndication={false}
      content={
        <VStack gap={0.5} hAlign="start">
          {dueDate ? (
            <Text color="inherit">
              {dateLabel}:{' '}
              <Text as="span" weight="bold" color="inherit">
                {dueDate}
              </Text>
            </Text>
          ) : null}
          {term ? (
            <Text color="inherit">
              {termLabel}:{' '}
              <Text as="span" weight="bold" color="inherit">
                {term}
              </Text>
            </Text>
          ) : null}
        </VStack>
      }
    >
    <VStack
      gap={3}
      hAlign="stretch"
      xstyle={[styles.installment, installmentToneStyles[status]]}
    >
      <HStack gap={1} vAlign="center" hAlign="between" wrap="nowrap">
        <Text type="code" weight="bold" color="inherit">
          {label}
        </Text>
        <HStack gap={1} vAlign="center" wrap="nowrap">
          {status === 'active' ? (
            <HStack as="span" xstyle={styles.activeBadge}>
              <Text weight="bold" color="inherit">
                {activeBadgeLabel}
              </Text>
            </HStack>
          ) : null}
          <Icon icon={StatusIcon} size="sm" color="inherit" />
        </HStack>
      </HStack>
      {/* Divider sits as its own row in the `VStack` (not a border glued
          to the header) so the surrounding `gap` spaces it evenly from
          the label above and the amount below, instead of sitting
          closer to one side (user feedback, 2026-09-18). */}
      <HStack
        as="span"
        xstyle={[
          styles.installmentDivider,
          installmentDividerToneStyles[status],
        ]}
      />
      {/* Only the amount stays on the card face (Figma monospace, `type=
          "code"`); the payment date and terms are secondary detail, shown
          in a `Tooltip` on hovering/focusing the whole card so it stays
          uncluttered (user feedback, 2026-09-19). Disabled when neither
          exists. */}
      <HStack gap={1} vAlign="center" wrap="nowrap">
        <Text type="code" weight="bold" size="xl" color="inherit">
          {amount}
        </Text>
        {unit ? (
          <Text type="code" weight="semibold" color="inherit">
            {unit}
          </Text>
        ) : null}
      </HStack>
    </VStack>
    </Tooltip>
  );
}

/** @type {Record<'paid' | 'active' | 'upcoming', import('react').ComponentType>} */
const INSTALLMENT_STATUS_ICONS = {
  paid: CheckCircle2,
  active: Clock,
  upcoming: Circle,
};

/**
 * @type {Array<{
 *   id: string,
 *   label: string,
 *   value: string,
 *   unit?: string,
 *   note?: string,
 *   tone: 'default' | 'teal' | 'accent',
 *   badgeTone?: 'default' | 'teal',
 *   icon: import('react').ComponentType,
 *   noteIcon?: import('react').ComponentType,
 *   valueSize?: import('@astryxdesign/core/Text').TextProps['size'],
 *   unitSize?: import('@astryxdesign/core/Text').TextProps['size'],
 * }>}
 */
const DEFAULT_STAT_CARDS = [
  {
    id: 'original-contract',
    label: 'HỢP ĐỒNG',
    value: '450,000',
    unit: 'USD',
    note: 'HĐ gốc ban đầu',
    tone: 'default',
    icon: FileText,
    noteIcon: FileText,
  },
  {
    id: 'settlement',
    label: 'QUYẾT TOÁN',
    value: '485,000',
    unit: 'USD',
    note: 'HĐ gốc $450k + 2 PL (+$35k)',
    tone: 'default',
    icon: FileCheck2,
    noteIcon: FileText,
  },
  {
    id: 'exported-usd',
    label: 'ĐÃ XUẤT',
    value: '350,000',
    unit: 'USD',
    note: '72.16% tiến độ giao',
    tone: 'teal',
    badgeTone: 'teal',
    icon: Truck,
    noteIcon: CheckCircle2,
  },
  {
    id: 'exported-vnd',
    label: 'ĐÃ XUẤT (VNĐ)',
    value: '8,907,500,000',
    unit: 'VNĐ',
    note: 'Tỷ giá: 25,450 VND/USD',
    tone: 'default',
    icon: RefreshCw,
    noteIcon: RefreshCw,
  },
  {
    id: 'unexported',
    label: 'CHƯA XUẤT',
    value: '135,000',
    unit: 'USD',
    note: '27.84% còn lại',
    tone: 'accent',
    icon: FileText,
    noteIcon: Clock,
  },
];

/**
 * @type {Array<{
 *   id: string,
 *   label: string,
 *   amount: string,
 *   unit?: string,
 *   dueDate: string,
 *   term?: string,
 *   status: 'paid' | 'active' | 'upcoming',
 * }>}
 */
const DEFAULT_INSTALLMENTS = [
  {
    id: 'dot-01',
    label: 'Đợt 01',
    amount: '48,500',
    unit: 'USD',
    dueDate: '22/03/24',
    term: 'T/T',
    status: 'paid',
  },
  {
    id: 'dot-02',
    label: 'Đợt 02',
    amount: '48,500',
    unit: 'USD',
    dueDate: '15/04/24',
    term: 'T/T',
    status: 'paid',
  },
  {
    id: 'dot-03',
    label: 'Đợt 03',
    amount: '72,750',
    unit: 'USD',
    dueDate: '14/05/24',
    term: 'T/T',
    status: 'paid',
  },
  {
    id: 'dot-04',
    label: 'Đợt 04',
    amount: '48,500',
    unit: 'USD',
    dueDate: '20/06/24',
    term: 'T/T',
    status: 'paid',
  },
  {
    id: 'dot-05',
    label: 'Đợt 05',
    amount: '48,500',
    unit: 'USD',
    dueDate: '18/07/24',
    term: 'T/T',
    status: 'paid',
  },
  {
    id: 'dot-06',
    label: 'Đợt 06',
    amount: '48,500',
    unit: 'USD',
    dueDate: '15/08/24',
    term: 'T/T',
    status: 'paid',
  },
  {
    id: 'dot-07',
    label: 'Đợt 07',
    amount: '72,750',
    unit: 'USD',
    dueDate: '30/11/24',
    term: 'L/C',
    status: 'active',
  },
  {
    id: 'dot-08',
    label: 'Đợt 08',
    amount: '48,500',
    unit: 'USD',
    dueDate: '15/12/24',
    status: 'upcoming',
  },
  {
    id: 'dot-09',
    label: 'Đợt 09',
    amount: '24,250',
    unit: 'USD',
    dueDate: '25/12/24',
    status: 'upcoming',
  },
  {
    id: 'dot-10',
    label: 'Đợt 10',
    amount: '24,250',
    unit: 'USD',
    dueDate: '31/12/24',
    term: 'Quyết toán cảng',
    status: 'upcoming',
  },
];

const styles = stylex.create({
  header: {
    borderBottomColor: 'var(--color-border)',
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
    paddingBottom: 'var(--spacing-2)',
  },
  stat: {
    backgroundColor: 'var(--color-background-surface)',
    borderColor: 'var(--color-border)',
    borderRadius: 'var(--radius-inner)',
    borderStyle: 'solid',
    borderWidth: '1px',
    // A resting whisper-shadow (`--shadow-low`, same token `Card`'s own
    // `elevation="low"` uses) lifts each stat off the flat grid instead
    // of reading as a bare bordered box; the hover step to `--shadow-med`
    // + a small rise is a cheap "alive" cue for what's otherwise a
    // static display card (purely cosmetic — no click handler here).
    boxShadow: {
      default: 'var(--shadow-low)',
      ':hover': { '@media (hover: hover)': 'var(--shadow-med)' },
    },
    // Figma cards sit around 313px wide — this is the hard cap `Grid`'s
    // own `repeat: 'fill'` columns can't always guarantee on their own
    // (see the comment above the `<Grid>` call).
    maxWidth: '340px',
    padding: 'var(--spacing-4)',
    transform: {
      default: 'translateY(0)',
      ':hover': { '@media (hover: hover)': 'translateY(-2px)' },
    },
    transitionDuration: '150ms',
    transitionProperty: 'box-shadow, transform',
    transitionTimingFunction: 'ease-out',
  },
  statBadge: {
    // Full-round chip instead of the square icon slot — reads softer,
    // more like an avatar/icon badge than a boxy control (user feedback,
    // 2026-09-18, "make StatCard prettier").
    borderRadius: 'var(--radius-full)',
    flexShrink: 0,
    height: '28px',
    width: '28px',
  },
  statValue: {
    lineHeight: 1,
  },
  track: {
    backgroundColor: 'var(--color-border)',
    borderRadius: '2px',
    gap: '2px',
    height: '12px',
    padding: '2px',
    width: '100%',
  },
  segment: {
    borderRadius: '2px',
    display: 'block',
    height: '100%',
  },
  segmentPaid: {
    backgroundColor: 'var(--color-success)',
  },
  segmentCurrent: {
    backgroundColor: 'var(--color-accent)',
  },
  segmentRemaining: {
    backgroundColor: 'var(--color-border)',
  },
  width: (percent) => ({ width: `${percent}%` }),
  installment: {
    borderRadius: 'var(--radius-inner)',
    borderStyle: 'solid',
    borderWidth: '1px',
    flexShrink: 0,
    minWidth: 260,
    padding: 'var(--spacing-3)',
  },
  // Figma ("HorizontalBorder" node): each installment card has a divider
  // between the label/status row and the amount below.
  installmentDivider: {
    flexShrink: 0,
    height: '1px',
    width: '100%',
  },
  activeBadge: {
    backgroundColor: 'var(--color-accent)',
    borderRadius: 'var(--radius-inner)',
    color: 'var(--color-on-accent)',
    display: 'inline-flex',
    flexShrink: 0,
    paddingBlock: '2px',
    paddingInline: 'var(--spacing-1)',
  },
  // `Link`'s own `color` prop only accepts Astryx's fixed roles
  // (primary/secondary/accent/…), none of which equal the mockup's
  // literal `#0051D5` (Astryx's generated `--color-accent` diverges from
  // that seed for contrast safety — see `theme.js`'s button-override
  // comment for the same issue on the old `MaritimeButton` version of
  // this link). Setting the exact color on this wrapper and passing
  // `color="inherit"` to `Link`/`Icon` sidesteps the fixed-role list
  // entirely.
  detailLink: {
    color: 'var(--maritime-badge-info-text)', // mockup: text-secondary, #0051D5
    // `Link`'s own inner `Text` wraps by default — with the outer row
    // already flex-wrapping, that let the label and its chevron drop to
    // a second line inside the link itself instead of just letting the
    // whole link wrap as one unit. Nowrap + no-shrink keeps it a single
    // unbreakable inline unit.
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },
});

// A faint tone-matched wash instead of plain white for the two "hero"
// stats (teal = đã xuất, accent = chưa xuất) — on a row of otherwise
// identical white boxes, a border-color-only difference reads as barely
// there; a light background gives them actual presence (user feedback,
// 2026-09-18, "make StatCard prettier").
const statToneStyles = stylex.create({
  default: {},
  teal: {
    backgroundColor: 'var(--color-success-muted)',
  },
  accent: {
    // #EFF6FF80 (blue-50 @ 50%, exact value from user feedback,
    // 2026-09-18) — reuses `--maritime-badge-info-bg`, already this same
    // literal value (`rgba(239, 246, 255, 0.5)`) from theme.js.
    backgroundColor: 'var(--maritime-badge-info-bg)',
    borderColor: 'var(--color-accent)',
  },
});

// The badge-icon chip's bg/icon tone is independent of the card's text
// `tone` — the Figma "CHƯA XUẤT" card (`tone="accent"`, blue text) still
// uses the plain neutral badge, not an accent-tinted one.
const statBadgeToneStyles = stylex.create({
  default: {
    backgroundColor: 'var(--maritime-chip-bg)',
    color: 'var(--maritime-chip-text)',
  },
  teal: {
    backgroundColor: 'var(--maritime-badge-teal-bg)',
    color: 'var(--maritime-teal-text)',
  },
});

const installmentToneStyles = stylex.create({
  paid: {
    backgroundColor: 'var(--color-success-muted)',
    borderColor: 'var(--maritime-teal-border)',
    color: 'var(--maritime-teal-text)',
  },
  active: {
    backgroundColor: 'var(--maritime-step-active-bg)',
    borderColor: 'var(--color-accent)',
    borderWidth: '2px',
    color: 'var(--color-accent)',
  },
  upcoming: {
    backgroundColor: 'var(--color-background-muted)',
    borderColor: 'var(--color-border)',
    color: 'var(--maritime-text-muted)',
  },
});

// Divider colors reuse each status's own card-border token (Figma's
// per-card "HorizontalBorder" tints teal/accent/border to match).
const installmentDividerToneStyles = stylex.create({
  paid: {
    backgroundColor: 'var(--maritime-teal-border)',
  },
  active: {
    backgroundColor: 'var(--color-accent)',
  },
  upcoming: {
    backgroundColor: 'var(--color-border)',
  },
});
