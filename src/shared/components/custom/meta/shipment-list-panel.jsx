'use client';

import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Divider } from '@astryxdesign/core/Divider';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Link } from '@astryxdesign/core/Link';
import { Heading, Text } from '@astryxdesign/core/Text';
import { Tooltip } from '@astryxdesign/core/Tooltip';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import {
  Anchor,
  Banknote,
  ClipboardList,
  Container,
  Download,
  Factory,
  LayoutGrid,
  MapPin,
  MoreVertical,
  Package,
  Plus,
  Ship,
  Table2,
  Truck,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { MetaPill } from './pill.jsx';

const PARTNER_ICONS = {
  booking: ClipboardList,
  trucking: Truck,
  customs: Package,
  shipping: Ship,
};
const KPI_ICONS = [Container, Truck, Package, Banknote];

/** @typedef {{ icon: keyof typeof PARTNER_ICONS, title: string, tag?: string, tagTone?: string, lead?: string, units?: Array<{name: string, cont: number}>, totalCont?: number, unitLabel?: string, restLabel?: string, rows: Array<[string, string, ('accent' | 'teal')?]> }} Partner */
/** @typedef {{ id: string, no: string, code: string, kind: 'fcl' | 'lcl', kindLabel?: string, status: {label: string, tone: string}, value: {usd: string, vnd: string, rate: string, scaleTag: string, weight: string, vgm?: string}, route: {from: string, to: string, etd: string, eta: string}, costs: {total: string, items: Array<[string, string]>}, partners: Partner[] }} Shipment */

/** Meta shipment tab, based on Figma frame 98:2343. All figures and details are supplied by the contract API.
 * `shipmentHref` turns each card's shipment code into a link (detail page).
 * @param {{ stats: Array<{label: string, value: string, highlight?: string, unit?: string, note: string, color?: string}>, shipments: Shipment[], declarationCurrency: string, createDisabledReason?: string, onCreateShipment: () => void, onShipmentMenu: (id: string) => void, onExportExcel: () => void, renderTable: (onViewShipment: (id: string) => void) => import('react').ReactNode, shipmentHref?: (id: string) => string }} props
 */
export function MetaShipmentListPanel({
  stats,
  shipments,
  declarationCurrency,
  createDisabledReason,
  onCreateShipment,
  onShipmentMenu,
  onExportExcel,
  renderTable,
  shipmentHref,
}) {
  const [view, setView] = useState('card');
  const [focusedShipmentId, setFocusedShipmentId] = useState(
    /** @type {string | null} */ (null),
  );
  useEffect(() => {
    if (view !== 'card' || !focusedShipmentId) return;
    document
      .getElementById(`shipment-card-${focusedShipmentId}`)
      ?.scrollIntoView({
        block: 'center',
      });
  }, [focusedShipmentId, view]);
  const fclCount = shipments.filter(
    (shipment) => shipment.kind === 'fcl',
  ).length;

  return (
    <VStack gap={5} hAlign="stretch">
      <Grid
        columns={{ minWidth: 280, max: 4 }}
        maxWidth="calc(4 * var(--meta-kpi-card-max) + 3 * var(--spacing-4))"
        gap={4}
      >
        {stats.map((stat, index) => (
          <Card
            key={stat.label}
            padding={5}
            elevation="none"
            xstyle={styles.kpiCard}
          >
            <VStack gap={3} hAlign="stretch">
              <HStack hAlign="between" vAlign="center" gap={2}>
                <Text
                  type="label"
                  weight="bold"
                  color="secondary"
                  xstyle={styles.uppercase}
                >
                  {stat.label}
                </Text>
                <HStack as="span" xstyle={styles.iconBox}>
                  <Icon icon={KPI_ICONS[index]} size="sm" color="accent" />
                </HStack>
              </HStack>
              <HStack gap={2} vAlign="center" wrap="wrap">
                <Text
                  size="3xl"
                  weight="bold"
                  color={stat.color === 'accent' ? 'accent' : undefined}
                  hasTabularNumbers
                >
                  {stat.value}
                </Text>
                {stat.highlight ? (
                  <Text
                    size="3xl"
                    weight="bold"
                    color="accent"
                    hasTabularNumbers
                  >
                    {stat.highlight}
                  </Text>
                ) : null}
                {stat.unit ? <Text color="secondary">{stat.unit}</Text> : null}
              </HStack>
              <Text color="secondary">{stat.note}</Text>
            </VStack>
          </Card>
        ))}
      </Grid>

      <HStack hAlign="between" vAlign="center" wrap="wrap" gap={3}>
        <HStack gap={3} vAlign="center" wrap="wrap">
          <Heading level={2}>Danh sách</Heading>
          <MetaPill
            label={`${shipments.length} Lô (${fclCount} FCL, ${shipments.length - fclCount} LCL)`}
            tone="neutral"
            size="md"
          />
          <HStack gap={0.5} vAlign="center" xstyle={styles.segmented}>
            <Button
              label="Dạng Thẻ"
              size="md"
              variant={view === 'card' ? 'primary' : 'ghost'}
              icon={<Icon icon={LayoutGrid} size="sm" />}
              onClick={() => setView('card')}
            />
            <Button
              label="Dạng Bảng"
              size="md"
              variant={view === 'table' ? 'primary' : 'ghost'}
              icon={<Icon icon={Table2} size="sm" />}
              onClick={() => setView('table')}
            />
          </HStack>
        </HStack>
        <HStack gap={2} vAlign="center" wrap="wrap">
          <Button
            label="Xuất Excel"
            size="sm"
            variant="secondary"
            icon={<Icon icon={Download} size="sm" />}
            onClick={onExportExcel}
            isDisabled={shipments.length === 0}
          />
          <Tooltip
            isEnabled={Boolean(createDisabledReason)}
            hasHoverIndication={false}
            content={createDisabledReason}
          >
            <HStack>
              <Button
                label="Tạo lô hàng mới"
                size="sm"
                variant="primary"
                icon={<Icon icon={Plus} size="sm" />}
                isDisabled={Boolean(createDisabledReason)}
                onClick={onCreateShipment}
              />
            </HStack>
          </Tooltip>
        </HStack>
      </HStack>

      {view === 'table' ? (
        renderTable((id) => {
          setFocusedShipmentId(id);
          setView('card');
        })
      ) : (
        <VStack gap={4} hAlign="stretch">
          {shipments.length === 0 ? (
            <Card padding={5}>
              <Text color="secondary">
                Chưa có lô hàng. Hãy tạo lô hàng đầu tiên để theo dõi vận
                chuyển.
              </Text>
            </Card>
          ) : null}
          {shipments.map((shipment) => (
            <ShipmentCard
              key={shipment.id}
              shipment={shipment}
              declarationCurrency={declarationCurrency}
              onMenu={onShipmentMenu}
              href={shipmentHref?.(shipment.id)}
            />
          ))}
        </VStack>
      )}
    </VStack>
  );
}

/** @param {{shipment: Shipment, declarationCurrency: string, onMenu: (id: string) => void, href?: string}} props */
function ShipmentCard({ shipment: s, declarationCurrency, onMenu, href }) {
  return (
    <Card
      id={`shipment-card-${s.id}`}
      padding={5}
      elevation="none"
      xstyle={styles.shipmentCard}
    >
      <VStack gap={4} hAlign="stretch">
        <HStack
          hAlign="between"
          vAlign="center"
          wrap="wrap"
          gap={3}
          xstyle={styles.cardHeader}
        >
          <HStack gap={2} vAlign="center" wrap="wrap">
            <HStack
              as="span"
              hAlign="center"
              vAlign="center"
              xstyle={styles.numberBox}
            >
              <Text type="inherit" weight="bold" color="inherit">
                {s.no}
              </Text>
            </HStack>
            {href ? (
              <Link href={href} weight="bold" color="accent">
                {s.code}
              </Link>
            ) : (
              <Text weight="bold">{s.code}</Text>
            )}
            <MetaPill
              label={s.kindLabel ?? s.kind.toUpperCase()}
              tone="neutral"
              size="md"
            />
          </HStack>
          <HStack gap={2} vAlign="center">
            <MetaPill
              label={s.status.label}
              tone={
                s.status.tone === 'success'
                  ? 'success'
                  : s.status.tone === 'neutral'
                    ? 'neutral'
                    : 'accent'
              }
              hasDot
              size="md"
            />
            <IconButton
              label={`Sửa ${s.code}`}
              tooltip="Sửa lô hàng"
              icon={<Icon icon={MoreVertical} size="sm" />}
              variant="ghost"
              size="sm"
              onClick={() => onMenu(s.id)}
            />
          </HStack>
        </HStack>

        <Grid columns={{ minWidth: 300, max: 3 }} gap={3}>
          <SummaryPanel>
            <HStack hAlign="between" vAlign="center" wrap="wrap" gap={2}>
              <SectionLabel>GIÁ TRỊ TỜ KHAI & QUY MÔ</SectionLabel>
              <Text color="secondary">Tỷ giá {s.value.rate}</Text>
            </HStack>
            <HStack gap={2} vAlign="center" wrap="wrap">
              <Text size="xl" weight="bold" hasTabularNumbers>
                {s.value.usd}
              </Text>
              <Text color="secondary">{declarationCurrency}</Text>
              <Text color="secondary">≈ {s.value.vnd} VNĐ</Text>
            </HStack>
            <Divider />
            <HStack gap={2} wrap="wrap" vAlign="center">
              <MetaPill label={s.value.scaleTag} tone="neutral" size="md" />
              <Text color="secondary">
                {s.value.weight}
                {s.value.vgm ? ` · VGM: ${s.value.vgm}` : ''}
              </Text>
            </HStack>
          </SummaryPanel>
          <SummaryPanel>
            <SectionLabel>HÀNH TRÌNH & LỊCH TRÌNH</SectionLabel>
            <RoutePoint icon={Anchor} label="Nơi đi:" value={s.route.from} />
            <RoutePoint icon={MapPin} label="Nơi đến:" value={s.route.to} />
            <Divider />
            <HStack hAlign="between" gap={3} wrap="wrap">
              <VStack gap={0.5}>
                <Text color="secondary">ETD:</Text>
                <Text weight="semibold">{s.route.etd}</Text>
              </VStack>
              <VStack gap={0.5}>
                <Text color="secondary">ETA:</Text>
                <Text weight="semibold" color="meta-success">
                  {s.route.eta}
                </Text>
              </VStack>
            </HStack>
          </SummaryPanel>
          <SummaryPanel>
            <HStack hAlign="between" vAlign="center" wrap="wrap" gap={2}>
              <HStack gap={1} vAlign="center">
                <Icon icon={Banknote} size="sm" color="accent" />
                <SectionLabel>CHI PHÍ LOGISTICS</SectionLabel>
              </HStack>
              <Text weight="bold" hasTabularNumbers>
                {s.costs.total} VNĐ
              </Text>
            </HStack>
            <Divider />
            {/* One cost type per row. The list is taken out of flow so it
                never sets the row height: it fills whatever height the
                sibling panels give and scrolls the rest. */}
            <VStack xstyle={styles.costListFrame}>
              <VStack
                gap={2}
                hAlign="stretch"
                isScrollable
                xstyle={styles.costList}
              >
                {s.costs.items.map(([label, value]) => (
                  <HStack key={label} hAlign="between" vAlign="center" gap={3}>
                    <Text color="secondary" maxLines={1}>
                      {label}
                    </Text>
                    <Text
                      weight="semibold"
                      hasTabularNumbers
                      xstyle={styles.noShrink}
                    >
                      {value}
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </VStack>
          </SummaryPanel>
        </Grid>

        <VStack gap={3} hAlign="stretch" xstyle={styles.partnersArea}>
          <HStack hAlign="between" vAlign="center" wrap="wrap" gap={2}>
            <HStack gap={2} vAlign="center">
              <Icon icon={Factory} size="sm" color="accent" />
              <SectionLabel>NHÀ CUNG CẤP & ĐƠN VỊ LIÊN KẾT</SectionLabel>
            </HStack>
            <MetaPill
              label={`${s.partners.length} Đơn vị vận hành`}
              tone="success"
              size="md"
            />
          </HStack>
          <Grid columns={{ minWidth: 240, max: 4 }} gap={3}>
            {s.partners.map((partner) => (
              <PartnerCard key={partner.title} partner={partner} />
            ))}
          </Grid>
        </VStack>
      </VStack>
    </Card>
  );
}

/** @param {{children: import('react').ReactNode}} props */
function SummaryPanel({ children }) {
  return (
    <Card padding={4} elevation="none" xstyle={styles.innerCard}>
      <VStack gap={2} hAlign="stretch" height="100%">
        {children}
      </VStack>
    </Card>
  );
}
/** @param {{children: import('react').ReactNode}} props */
function SectionLabel({ children }) {
  return (
    <Text
      type="label"
      weight="bold"
      color="secondary"
      xstyle={styles.uppercase}
    >
      {children}
    </Text>
  );
}
/** @param {{icon: import('react').ComponentType, label: string, value: string}} props */
function RoutePoint({ icon, label, value }) {
  return (
    <HStack gap={2} vAlign="center" wrap="wrap">
      <Icon icon={icon} size="sm" color="accent" />
      <Text color="secondary">{label}</Text>
      <Text weight="semibold">{value}</Text>
    </HStack>
  );
}

/** @param {{partner: Partner}} props */
function PartnerCard({ partner: p }) {
  return (
    <Card padding={3} elevation="none" xstyle={styles.innerCard}>
      <VStack gap={2} hAlign="stretch">
        <HStack hAlign="between" vAlign="center" wrap="wrap" gap={1}>
          <HStack gap={1} vAlign="center">
            <Icon icon={PARTNER_ICONS[p.icon]} size="sm" color="accent" />
            <SectionLabel>{p.title}</SectionLabel>
          </HStack>
          {p.tag ? (
            <MetaPill
              label={p.tag}
              tone={p.tagTone === 'success' ? 'success' : 'accent'}
              size="md"
            />
          ) : null}
        </HStack>
        {p.lead ? <Text weight="semibold">{p.lead}</Text> : null}
        {p.units ? <TruckingAllocation partner={p} /> : null}
        {p.rows.length ? (
          <VStack gap={1} hAlign="stretch">
            {p.rows.map(([label, value, tone]) => (
              <HStack key={label} hAlign="between" gap={2} wrap="wrap">
                <Text color="secondary">{label}</Text>
                <Text
                  weight="medium"
                  color={
                    tone === 'accent'
                      ? 'accent'
                      : tone === 'teal'
                        ? 'meta-success'
                        : undefined
                  }
                >
                  {value}
                </Text>
              </HStack>
            ))}
          </VStack>
        ) : null}
      </VStack>
    </Card>
  );
}

/** @param {{partner: Partner}} props */
function TruckingAllocation({ partner: p }) {
  const units = p.units ?? [];
  const used = units.reduce((sum, unit) => sum + unit.cont, 0);
  const total = p.totalCont ?? used;
  return (
    <VStack gap={2} hAlign="stretch">
      <HStack hAlign="between" gap={2} wrap="wrap">
        <Text color="secondary">{units.length} nhà xe điều phối</Text>
        <Text color="meta-success" weight="semibold">
          {used}/{total} {p.unitLabel ?? 'Cont'}
        </Text>
      </HStack>
      <HStack gap={0} xstyle={styles.track} aria-hidden>
        {units.map((unit, index) => (
          <HStack
            key={`${unit.name}-${index}`}
            as="span"
            xstyle={[
              styles.segment,
              index % 2 ? styles.segmentBlue : styles.segmentGreen,
              dynamic.segmentWidth(unit.cont / Math.max(total, 1)),
            ]}
          />
        ))}
      </HStack>
      {units.length ? (
        units.map((unit, index) => (
          <HStack
            key={`${unit.name}-${index}`}
            hAlign="between"
            gap={2}
            wrap="wrap"
          >
            <Text>{unit.name}</Text>
            <Text
              weight="semibold"
              color={index % 2 ? 'accent' : 'meta-success'}
            >
              {unit.cont} {p.unitLabel ?? 'Cont'}
            </Text>
          </HStack>
        ))
      ) : (
        <Text color="secondary">Chưa phân bổ xe</Text>
      )}
      {p.restLabel ? <Text color="secondary">{p.restLabel}</Text> : null}
    </VStack>
  );
}

const dynamic = stylex.create({
  segmentWidth: (ratio) => ({ width: `${ratio * 100}%` }),
});
const styles = stylex.create({
  uppercase: { letterSpacing: '0.04em' },
  kpiCard: { borderColor: 'var(--color-border)' },
  iconBox: {
    backgroundColor: 'var(--meta-blue-wash)',
    borderRadius: 'var(--radius-element)',
    padding: 'var(--spacing-2)',
  },
  segmented: {
    backgroundColor: 'var(--meta-surface-container-low)',
    borderRadius: 'var(--radius-full)',
    padding: 'var(--spacing-0-5)',
  },
  shipmentCard: { borderColor: 'var(--color-border)' },
  cardHeader: {
    borderBottomColor: 'var(--meta-hairline)',
    borderBottomStyle: 'solid',
    borderBottomWidth: 'var(--border-width)',
    paddingBottom: 'var(--spacing-3)',
  },
  numberBox: {
    backgroundColor: 'var(--meta-blue-wash)',
    borderRadius: 'var(--radius-element)',
    color: 'var(--color-accent)',
    minHeight: 'var(--size-element-sm)',
    minWidth: 'var(--size-element-sm)',
  },
  innerCard: {
    borderColor: 'var(--color-border)',
    borderRadius: 'var(--radius-element)',
  },
  // ~5 cost rows, then the list scrolls.
  // Grows into the panel's leftover height; the floor keeps ~3 rows
  // visible when the sibling panels are short.
  costListFrame: {
    flexBasis: 0,
    flexGrow: 1,
    minHeight: 'calc(var(--spacing-10) * 2.5)',
    position: 'relative',
  },
  costList: {
    inset: 0,
    paddingInlineEnd: 'var(--spacing-2)',
    position: 'absolute',
  },
  noShrink: { flexShrink: 0, whiteSpace: 'nowrap' },
  partnersArea: {
    backgroundColor: 'var(--meta-surface-container-low)',
    borderColor: 'var(--color-border)',
    borderRadius: 'var(--meta-radius-inset)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    padding: 'var(--spacing-3)',
  },
  track: {
    backgroundColor: 'var(--meta-surface-container-high)',
    borderRadius: 'var(--radius-full)',
    height: 'var(--spacing-2)',
    overflow: 'hidden',
  },
  segment: { flexShrink: 0, height: '100%' },
  segmentBlue: { backgroundColor: 'var(--color-accent)' },
  segmentGreen: { backgroundColor: 'var(--meta-emerald-fill)' },
});
