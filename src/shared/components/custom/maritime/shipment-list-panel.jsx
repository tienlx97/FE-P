'use client';

import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Divider } from '@astryxdesign/core/Divider';
import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Heading, Text } from '@astryxdesign/core/Text';
import { Tooltip } from '@astryxdesign/core/Tooltip';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import {
  Anchor,
  Banknote,
  ClipboardList,
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
  Warehouse,
} from 'lucide-react';
import { useState } from 'react';

import { MaritimeBadge } from './badge.jsx';
import { MaritimeShipmentTableView } from './shipment-table-view.jsx';

/**
 * Maritime theme — "Lô hàng (Shipment)" tab body (`MaritimeTabNav` id
 * `shipment`): 4 quick-stat cards, a toolbar, one expandable-style card per
 * shipment lot and a logistics-cost footer, built from the Figma frame
 * `Container` (node 36:2453) read via the Figma MCP bridge.
 *
 * Astryx `Card`/`Grid`/`Text`/`Button` do the layout and the
 * Figma-only look (mono numerics, tinted borders, tag chips) is `xstyle`
 * plus the theme's `--maritime-*` tokens.
 *
 * All content is data: `shipments` and `stats` default to the mockup's own
 * values and are overridable props.
 * @param {{
 *   stats?: ShipmentStat[],
 *   shipments?: Shipment[],
 *   totalCost?: string,
 *   currency?: string,
 *   contractCode?: string,
 *   declarationCurrency?: string,
 *   createDisabledReason?: string,
 *   onExportExcel?: () => void,
 *   onCreateShipment?: () => void,
 *   onShipmentMenu?: (id: string) => void,
 * }} props
 */
export function MaritimeShipmentListPanel({
  stats = DEFAULT_STATS,
  shipments = DEFAULT_SHIPMENTS,
  totalCost = '128,500,000',
  currency = 'VND',
  contractCode,
  declarationCurrency = 'USD',
  createDisabledReason,
  onExportExcel,
  onCreateShipment,
  onShipmentMenu,
}) {
  const [view, setView] = useState('card');
  const fclCount = shipments.filter((s) => s.kind === 'fcl').length;
  const lclCount = shipments.length - fclCount;

  return (
    <VStack gap={4} hAlign="stretch">
      <Grid
        columns={{ minWidth: 240, max: 4, repeat: 'fill' }}
        gap={4}
        xstyle={styles.fixedCols}
      >
        {stats.map((stat) => (
          <Card
            key={stat.label}
            padding={4}
            elevation="low"
            xstyle={styles.borderCard}
          >
            <VStack gap={1} hAlign="stretch">
              <Text
                type="label"
                weight="medium"
                color="maritime-muted"
                xstyle={styles.tracking}
              >
                {stat.label}
              </Text>
              <Text
                type="code"
                size="3xl"
                weight="bold"
                color={stat.color}
                xstyle={styles.statValue}
              >
                {stat.value}
              </Text>
              {stat.note ? (
                <Text color={stat.noteColor ?? 'maritime-subtle'}>
                  {stat.note}
                </Text>
              ) : null}
            </VStack>
          </Card>
        ))}
      </Grid>

      <HStack hAlign="between" vAlign="center" wrap="wrap" gap={3}>
        <HStack gap={3} vAlign="center" wrap="wrap">
          <Heading level={2}>Danh sách</Heading>
          <MaritimeBadge
            tone="blue"
            size="sm"
            label={`${shipments.length} Lô (${fclCount} FCL, ${lclCount} LCL)`}
          />
          <HStack
            gap={0.5}
            vAlign="center"
            wrap="nowrap"
            xstyle={styles.segmented}
          >
            <Button
              label="Dạng Thẻ"
              size="sm"
              variant={view === 'card' ? 'primary' : 'ghost'}
              onClick={() => setView('card')}
              icon={<Icon icon={LayoutGrid} size="xsm" />}
            />
            <Button
              label="Dạng Bảng"
              size="sm"
              variant={view === 'table' ? 'primary' : 'ghost'}
              onClick={() => setView('table')}
              icon={<Icon icon={Table2} size="xsm" />}
            />
          </HStack>
        </HStack>
        <HStack gap={2} vAlign="center" wrap="nowrap">
          {onExportExcel ? (
            <Button
              label="Xuất Excel"
              size="sm"
              variant="secondary"
              icon={<Icon icon={Download} size="xsm" />}
              onClick={onExportExcel}
            />
          ) : null}
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
                icon={<Icon icon={Plus} size="xsm" />}
                isDisabled={Boolean(createDisabledReason)}
                onClick={onCreateShipment}
              />
            </HStack>
          </Tooltip>
        </HStack>
      </HStack>

      {view === 'table' ? (
        <MaritimeShipmentTableView
          shipments={shipments}
          contractCode={contractCode}
          currency={declarationCurrency}
          onView={onShipmentMenu}
          onEdit={onShipmentMenu}
        />
      ) : (
        <VStack gap={4} hAlign="stretch">
          {shipments.length === 0 ? (
            <Card padding={4} elevation="low" xstyle={styles.borderCard}>
              <Text color="maritime-muted">Chưa có lô hàng nào.</Text>
            </Card>
          ) : null}
          {shipments.map((s) => (
            <ShipmentCard
              key={s.id}
              shipment={s}
              declarationCurrency={declarationCurrency}
              onMenu={onShipmentMenu}
            />
          ))}
        </VStack>
      )}

      <HStack
        hAlign="between"
        vAlign="center"
        wrap="wrap"
        gap={3}
        xstyle={styles.summaryBar}
      >
        <HStack gap={3} vAlign="center" wrap="nowrap">
          <HStack
            as="span"
            hAlign="center"
            vAlign="center"
            xstyle={styles.summaryIcon}
          >
            <Icon icon={Banknote} size="sm" color="inherit" />
          </HStack>
          <Text
            type="label"
            weight="bold"
            color="maritime-muted"
            xstyle={styles.tracking}
          >
            TỔNG CHI PHÍ LOGISTICS
          </Text>
        </HStack>
        <HStack gap={2} vAlign="center" wrap="nowrap">
          <Text weight="semibold" color="maritime-muted">
            TỔNG CỘNG:
          </Text>
          <Text type="code" size="3xl" weight="bold" color="accent">
            {totalCost}
          </Text>
          <Text weight="semibold" color="maritime-muted">
            {currency}
          </Text>
        </HStack>
      </HStack>
    </VStack>
  );
}

/** @param {{ shipment: Shipment, declarationCurrency: string, onMenu?: (id: string) => void }} props */
function ShipmentCard({ shipment: s, declarationCurrency, onMenu }) {
  return (
    <Card
      padding={4}
      elevation="low"
      xstyle={[
        styles.borderCard,
        styles.lotCard,
        lotBorderTones[s.status.tone],
      ]}
    >
      <VStack gap={3} hAlign="stretch">
        <HStack
          hAlign="between"
          vAlign="center"
          wrap="nowrap"
          xstyle={styles.cardHeader}
        >
          <HStack gap={2} vAlign="center" wrap="wrap">
            <HStack
              as="span"
              hAlign="center"
              vAlign="center"
              xstyle={[
                styles.indexBox,
                s.status.tone === 'success'
                  ? styles.indexSuccess
                  : styles.indexBlue,
              ]}
            >
              <Text type="code" weight="bold" color="inherit">
                {s.no}
              </Text>
            </HStack>
            <Text type="code" size="base" weight="bold">
              {s.code}
            </Text>
          </HStack>
          <HStack gap={2}>
            <MaritimeBadge
              size="sm"
              tone={s.status.tone}
              label={s.status.label}
            />
            <IconButton
              label={`Tùy chọn ${s.code}`}
              icon={<Icon icon={MoreVertical} size="sm" />}
              variant="ghost"
              size="sm"
              onClick={() => onMenu?.(s.id)}
            />
          </HStack>
        </HStack>

        <Grid columns={{ minWidth: 320, max: 3, repeat: 'fill' }} gap={4}>
          <Panel>
            <HStack hAlign="between" vAlign="center" wrap="nowrap">
              <SectionLabel>GIÁ TRỊ TỜ KHAI & QUY MÔ</SectionLabel>
              <Text type="code" color="maritime-muted">
                Tỷ giá {s.value.rate}
              </Text>
            </HStack>
            <HStack
              gap={2}
              vAlign={/** @type {any} */ ('baseline')}
              wrap="wrap"
            >
              <Text type="code" size="3xl" weight="bold">
                {s.value.usd}
              </Text>
              <Text type="code" color="maritime-muted">
                {declarationCurrency} ≈
              </Text>
              <Text type="code" weight="bold" color="accent">
                {s.value.vnd}
              </Text>
              <Text type="code" color="maritime-muted">
                VND
              </Text>
            </HStack>
            <HStack gap={2} vAlign="center" wrap="wrap">
              <Tag label={s.value.scaleTag} tone="blue" />
            </HStack>
            <Text type="code" color="maritime-subtle">
              {s.value.weight}
            </Text>
          </Panel>

          <Panel>
            <SectionLabel>HÀNH TRÌNH & LỊCH TRÌNH</SectionLabel>
            <RoutePoint icon={Anchor} label="Nơi đi:" value={s.route.from} />
            <RoutePoint
              icon={MapPin}
              label="Nơi đến:"
              value={s.route.to}
              tone="teal"
            />
            <Divider />
            <HStack hAlign="between" wrap="nowrap">
              <VStack gap={0.5}>
                <Text color="maritime-subtle">Khởi hành (ETD):</Text>
                <Text type="code" weight="semibold">
                  {s.route.etd}
                </Text>
              </VStack>
              <VStack gap={0.5}>
                <Text color="maritime-subtle">{s.route.etaLabel}</Text>
                <Text type="code" weight="semibold" color="maritime-teal">
                  {s.route.eta}
                </Text>
              </VStack>
            </HStack>
          </Panel>

          <Panel>
            <HStack hAlign="between" vAlign="center" wrap="nowrap">
              <HStack gap={1.5} vAlign="center" wrap="nowrap">
                <Icon icon={Banknote} size="xsm" color="accent" />
                <SectionLabel>CHI PHÍ LOGISTICS</SectionLabel>
              </HStack>
              <HStack
                gap={1}
                vAlign={/** @type {any} */ ('baseline')}
                wrap="nowrap"
              >
                <Text type="code" size="xl" weight="bold">
                  {s.costs.total}
                </Text>
                <Text color="maritime-muted">VND</Text>
              </HStack>
            </HStack>
            <Grid columns={2} gap={2} columnGap={4} xstyle={styles.costList}>
              {s.costs.items.map(([label, value, tone]) => (
                <HStack key={label} hAlign="between" wrap="nowrap" gap={2}>
                  <Text color="maritime-subtle">{label}</Text>
                  <Text
                    type="code"
                    weight="medium"
                    color={tone === 'accent' ? 'accent' : undefined}
                  >
                    {value}
                  </Text>
                </HStack>
              ))}
            </Grid>
          </Panel>
        </Grid>

        {s.partners.length > 0 ? (
          <VStack gap={3} hAlign="stretch" xstyle={styles.partnersWrap}>
            <HStack hAlign="between" vAlign="center" wrap="nowrap">
              <HStack gap={2} vAlign="center" wrap="nowrap">
                <Icon icon={Factory} size="sm" color="accent" />
                <Text type="label" weight="bold" xstyle={styles.tracking}>
                  NHÀ CUNG CẤP & ĐƠN VỊ LIÊN KẾT
                </Text>
              </HStack>
              <Tag label={`${s.partners.length} Đơn vị vận hành`} tone="blue" />
            </HStack>
            <Grid columns={{ minWidth: 300, max: 4, repeat: 'fit' }} gap={3}>
              {s.partners.map((p) => (
                <PartnerCard key={p.title} partner={p} />
              ))}
            </Grid>
          </VStack>
        ) : null}
      </VStack>
    </Card>
  );
}

/** @param {{ partner: Partner }} props */
function PartnerCard({ partner: p }) {
  const rowColor = (/** @type {string | undefined} */ tone) =>
    tone === 'accent'
      ? 'accent'
      : tone === 'teal'
        ? 'maritime-teal'
        : undefined;
  return (
    <Card padding={3} elevation="none" xstyle={styles.partnerCard}>
      <VStack gap={2} hAlign="stretch">
        <HStack
          hAlign="between"
          vAlign="center"
          wrap="nowrap"
          gap={2}
          xstyle={styles.partnerHeader}
        >
          <HStack gap={1.5} vAlign="center" wrap="nowrap">
            <Icon icon={PARTNER_ICONS[p.icon]} size="xsm" color="accent" />
            <Text
              type="label"
              weight="bold"
              color="maritime-muted"
              xstyle={[styles.tracking, styles.noWrap]}
            >
              {p.title}
            </Text>
          </HStack>
          {p.tag ? <Tag label={p.tag} tone={p.tagTone ?? 'blue'} /> : null}
        </HStack>
        {p.lead ? <Text weight="semibold">{p.lead}</Text> : null}
        {p.units ? <TruckingAllocation partner={p} /> : null}
        {p.rows.length > 0 && !p.units ? (
          <VStack gap={1.5} hAlign="stretch" xstyle={styles.detailBlock}>
            {p.rows.map(([label, value, tone]) => (
              <HStack key={label} hAlign="between" wrap="nowrap" gap={2}>
                <Text color="maritime-subtle">{label}</Text>
                <Text type="code" weight="medium" color={rowColor(tone)}>
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

/** Trucking "PHÂN BỔ XE": one bar segment per company, sized by its cont count. */
/** @param {{ partner: Partner }} props */
function TruckingAllocation({ partner: p }) {
  const units = p.units ?? [];
  const total = p.totalCont ?? units.reduce((sum, u) => sum + u.cont, 0);
  const used = units.reduce((sum, u) => sum + u.cont, 0);
  const rest = Math.max(0, total - used);
  // Guards the all-empty state (no units, no total yet): the bar is drawn as
  // an empty track instead of dividing by zero.
  const denom = total || 1;
  const unitLabel = p.unitLabel ?? 'Cont';
  return (
    <VStack gap={1.5} hAlign="stretch">
      <VStack gap={1} hAlign="stretch">
        <HStack hAlign="between" wrap="nowrap">
          <Text type="label" color="maritime-subtle" xstyle={styles.tracking}>
            PHÂN BỔ XE
          </Text>
          <Text type="code" weight="semibold">
            {`${used}/${total} ${unitLabel}`}
          </Text>
        </HStack>
        <HStack wrap="nowrap" gap={0.5} xstyle={styles.barTrack} aria-hidden>
          {units.map((u, index) => (
            <HStack
              key={`${u.name}-${index}`}
              as="span"
              xstyle={[
                styles.barSeg,
                segTones[u.tone],
                segWidth(u.cont / denom),
              ]}
            />
          ))}
          {rest > 0 || total === 0 ? (
            <HStack
              as="span"
              xstyle={[
                styles.barSeg,
                segTones.rest,
                segWidth(total === 0 ? 1 : rest / total),
              ]}
            />
          ) : null}
        </HStack>
      </VStack>
      <VStack gap={0.5} hAlign="stretch">
        {units.length === 0 ? (
          <HStack
            hAlign="between"
            vAlign="center"
            wrap="nowrap"
            gap={2}
            xstyle={styles.unitRow}
          >
            <Text weight="medium">___</Text>
            <Text type="code" weight="semibold" color="maritime-muted">
              {`___ ${unitLabel}`}
            </Text>
          </HStack>
        ) : null}
        {units.map((u, index) => (
          <HStack
            key={`${u.name}-${index}`}
            hAlign="between"
            vAlign="center"
            wrap="nowrap"
            gap={2}
            xstyle={styles.unitRow}
          >
            <Text weight="medium">{u.name}</Text>
            <Text
              type="code"
              weight="semibold"
              color={u.tone === 'teal' ? 'maritime-teal' : 'accent'}
            >
              {`${u.cont} ${unitLabel}`}
            </Text>
          </HStack>
        ))}
      </VStack>
      {p.restLabel ? <Text color="maritime-subtle">{p.restLabel}</Text> : null}
    </VStack>
  );
}

/** @param {{ children: import('react').ReactNode }} props */
function Panel({ children }) {
  return (
    <Card padding={3} elevation="none" xstyle={styles.panel}>
      <VStack gap={2} hAlign="stretch">
        {children}
      </VStack>
    </Card>
  );
}

/** @param {{ children: import('react').ReactNode }} props */
function SectionLabel({ children }) {
  return (
    <Text
      type="label"
      weight="bold"
      color="maritime-muted"
      xstyle={styles.tracking}
    >
      {children}
    </Text>
  );
}

/** @param {{ icon: import('react').ComponentType, label: string, value: string, tone?: 'teal' }} props */
function RoutePoint({ icon, label, value, tone }) {
  return (
    <HStack gap={2} vAlign="center" wrap="nowrap">
      <Icon
        icon={icon}
        size="xsm"
        color={
          tone === 'teal' ? /** @type {any} */ ('maritime-teal') : 'accent'
        }
      />
      <Text color="maritime-subtle">{label}</Text>
      <Text weight="semibold">{value}</Text>
    </HStack>
  );
}

/** @param {{ label: string, tone: 'blue' | 'success' | 'neutral' }} props */
function Tag({ label, tone }) {
  return (
    <HStack as="span" vAlign="center" xstyle={[styles.tag, tagTones[tone]]}>
      <span {...stylex.props(styles.tagLabel)}>{label}</span>
    </HStack>
  );
}

/** @typedef {{ label: string, value: string, note?: string, color?: any, noteColor?: any }} ShipmentStat */
/**
 * @typedef {{
 *   icon: 'booking' | 'trucking' | 'customs' | 'shipping' | 'cfs',
 *   title: string,
 *   tag?: string,
 *   tagTone?: 'blue' | 'success' | 'neutral',
 *   lead?: string,
 *   units?: Array<{ name: string, cont: number, tone: 'primary' | 'secondary' | 'teal' }>,
 *   totalCont?: number,
 *   unitLabel?: string,
 *   restLabel?: string,
 *   rows: Array<[string, string, ('accent' | 'teal')?]>,
 * }} Partner
 */
/**
 * @typedef {{
 *   id: string,
 *   table: { declDate: string, quantity: string, vgm: string },
 *   no: string,
 *   code: string,
 *   kind: 'fcl' | 'lcl',
 *   status: { label: string, icon?: 'ship' | 'anchor' | 'yard' | 'pack', tone: 'blue' | 'success' | 'warning' | 'neutral' },
 *   value: { usd: string, vnd: string, rate: string, scaleTag: string, weight: string },
 *   route: { from: string, to: string, etd: string, etaLabel: string, eta: string },
 *   costs: { total: string, items: Array<[string, string, ('accent')?]> },
 *   partners: Partner[],
 * }} Shipment
 */

/** @type {Record<Partner['icon'], import('react').ComponentType>} */
const PARTNER_ICONS = {
  booking: ClipboardList,
  trucking: Truck,
  customs: Package,
  shipping: Ship,
  cfs: Warehouse,
};

/** @type {ShipmentStat[]} */
const DEFAULT_STATS = [
  {
    label: 'SỐ LƯỢNG CONT FCL',
    value: '3 Lô FCL',
    note: "Container 40' High Cube",
    color: 'primary',
  },
  { label: 'TỔNG KHỐI LƯỢNG TỜ KHAI', value: '73.5 Tấn', color: 'accent' },
  {
    label: 'TÌNH TRẠNG HẠ BÃI',
    value: '3/3 Cont',
    note: '✓ Đã cấp seal & hạ bãi Cát Lái',
    color: 'maritime-teal',
    noteColor: 'maritime-teal',
  },
  {
    label: 'TỜ KHAI HẢI QUAN',
    value: '100%',
    note: '✓ Hoàn tất thông quan luồng xanh',
    color: 'accent',
    noteColor: 'maritime-teal',
  },
];

/** @type {Partner} */
const BOOKING = {
  icon: 'booking',
  title: '1. BOOKING',
  tag: 'FCL',
  lead: 'Á Châu Logistics & Trade',
  rows: [],
};

/** @type {Shipment[]} */
const DEFAULT_SHIPMENTS = [
  {
    id: 'lot-01',
    table: {
      declDate: '24/03/2024',
      quantity: "1 Cont 40' HC",
      vgm: '28.4 Tấn',
    },
    no: '01',
    code: '26KCT14/LOT-01',
    kind: 'fcl',
    status: { label: 'Đang trên biển (Shipping)', icon: 'ship', tone: 'blue' },
    value: {
      usd: '175,000',
      vnd: '4,453,750,000',
      rate: '25,450',
      scaleTag: "1 Cont 40' HC",
      weight: '24.5 Tấn • VGM: 28,400 kg',
    },
    route: {
      from: 'Cát Lái (VN)',
      to: 'Long Beach (US)',
      etd: '25/03/2024',
      etaLabel: 'Dự kiến đến (ETA):',
      eta: '12/04/2024',
    },
    costs: {
      total: '128,500,000',
      items: [
        ['O/F:', '106.89M', 'accent'],
        ['Trucking:', '18.50M'],
        ['Hải quan:', '1,250,000'],
        ['Cảng:', '850,000'],
        ['Bảo hiểm:', '650,000', 'accent'],
        ['Thuế DDP:', '360,000'],
      ],
    },
    partners: [
      {
        ...BOOKING,
        rows: [
          ['Mã Booking:', 'BKG-MAERSK-9021', 'accent'],
          ['Số Vận đơn:', 'MSK-882910'],
          ['Hình thức:', 'Direct B/L', 'accent'],
        ],
      },
      {
        icon: 'trucking',
        title: '2. TRUCKING',
        tag: '10 ĐƠN VỊ (100 CONT)',
        units: [
          { name: 'Vận tải Hưng Phát', cont: 35, tone: 'primary' },
          { name: 'Toàn Cầu Express', cont: 30, tone: 'secondary' },
          { name: 'Transimex Logistics', cont: 20, tone: 'teal' },
        ],
        totalCont: 100,
        restLabel: '+7 đơn vị (15 cont)',
        rows: [],
      },
      {
        icon: 'customs',
        title: '3. HẢI QUAN',
        tag: 'LUỒNG XANH',
        tagTone: 'success',
        lead: 'CTCP Vietrans TP.HCM',
        rows: [
          ['Số TK HQ:', '105928172910'],
          ['Ngày thông quan:', '24/03/2024'],
          ['Số C/O (Form B):', 'VN-US24/01/0921', 'accent'],
          ['Ngày cấp C/O:', '22/03/2024'],
        ],
      },
      {
        icon: 'shipping',
        title: '4. SHIPPING (HÃNG TÀU)',
        tag: 'MAERSK',
        lead: 'Maersk Line Logistics',
        rows: [
          ['Tàu vận tải:', 'MC-KINNEY'],
          ['Chuyến (Voy):', '402E', 'accent'],
          ['Hành trình:', 'SGN ⇢ LGB', 'accent'],
        ],
      },
    ],
  },
  {
    id: 'lot-02',
    table: {
      declDate: '17/03/2024',
      quantity: "1 Cont 40' HC",
      vgm: '28.2 Tấn',
    },
    no: '02',
    code: '26KCT14/LOT-02',
    kind: 'fcl',
    status: {
      label: 'Đã cập cảng đích (DeliveredToPort)',
      icon: 'anchor',
      tone: 'success',
    },
    value: {
      usd: '175,000',
      vnd: '4,453,750,000',
      rate: '25,450',
      scaleTag: "1 Cont 40' HC",
      weight: '24.5 Tấn • VGM: 28,200 kg',
    },
    route: {
      from: 'Cát Lái (VN)',
      to: 'Long Beach (US)',
      etd: '18/03/2024',
      etaLabel: 'Cập cảng (ETA):',
      eta: '05/04/2024',
    },
    costs: {
      total: '126,200,000',
      items: [
        ['O/F:', '104.50M', 'accent'],
        ['Trucking:', '18.50M'],
        ['Hải quan:', '1,250,000'],
        ['Cảng:', '850,000'],
        ['Bảo hiểm:', '650,000', 'accent'],
        ['Thuế DDP:', '450,000'],
      ],
    },
    partners: [
      {
        ...BOOKING,
        rows: [
          ['Mã Booking:', 'BKG-ONE-8812', 'accent'],
          ['Số Vận đơn:', 'ONE-339102'],
          ['Hình thức:', 'Direct B/L', 'accent'],
        ],
      },
      {
        icon: 'trucking',
        title: '2. TRUCKING',
        tag: 'ĐÃ HẠ BÃI',
        units: [{ name: 'Vận tải Hưng Phát', cont: 35, tone: 'teal' }],
        totalCont: 35,
        rows: [],
      },
      {
        icon: 'customs',
        title: '3. HẢI QUAN',
        tag: 'LUỒNG XANH',
        tagTone: 'success',
        lead: 'CTCP Vietrans TP.HCM',
        rows: [
          ['Số TK HQ:', '105928172911'],
          ['Ngày thông quan:', '17/03/2024'],
          ['Số C/O (Form B):', 'VN-US24/01/0922', 'accent'],
          ['Ngày cấp C/O:', '15/03/2024'],
        ],
      },
      {
        icon: 'shipping',
        title: '4. SHIPPING (HÃNG TÀU)',
        tag: 'ONE',
        lead: 'Ocean Network Express (ONE)',
        rows: [
          ['Tàu vận tải:', 'ONE APUS'],
          ['Chuyến (Voy):', '021E', 'accent'],
          ['Hành trình:', 'SGN ⇢ LGB', 'accent'],
        ],
      },
    ],
  },
  {
    id: 'lot-03',
    table: {
      declDate: '30/03/2024',
      quantity: "1 Cont 40' HC",
      vgm: '27.9 Tấn',
    },
    no: '03',
    code: '26KCT14/LOT-03',
    kind: 'fcl',
    status: {
      label: 'Chờ hạ bãi xuất khẩu (AtYardAwaitingExport)',
      icon: 'yard',
      tone: 'blue',
    },
    value: {
      usd: '135,000',
      vnd: '3,435,750,000',
      rate: '25,450',
      scaleTag: "1 Cont 40' HC",
      weight: '24.5 Tấn • VGM: 27,900 kg',
    },
    route: {
      from: 'Cát Lái (VN)',
      to: 'Long Beach (US)',
      etd: '02/04/2024',
      etaLabel: 'Dự kiến đến (ETA):',
      eta: '20/04/2024',
    },
    costs: {
      total: '119,800,000',
      items: [
        ['O/F:', '98.20M', 'accent'],
        ['Trucking:', '18.50M'],
        ['Hải quan:', '1,200,000'],
        ['Cảng:', '850,000'],
        ['Bảo hiểm:', '600,000', 'accent'],
        ['Phí D/O:', '450,000'],
      ],
    },
    partners: [
      {
        ...BOOKING,
        lead: 'Á Châu Logistics',
        rows: [
          ['Mã Booking:', 'BKG-CMA-4420', 'accent'],
          ['Số Vận đơn:', 'CMA-991204'],
          ['Hình thức:', 'Direct B/L', 'accent'],
        ],
      },
      {
        icon: 'trucking',
        title: '2. TRUCKING',
        tag: '30 CONT',
        units: [{ name: 'Toàn Cầu Express', cont: 30, tone: 'primary' }],
        totalCont: 30,
        rows: [],
      },
      {
        icon: 'customs',
        title: '3. HẢI QUAN',
        tag: 'LUỒNG VÀNG',
        tagTone: 'neutral',
        lead: 'CTCP Vietrans TP.HCM',
        rows: [
          ['Số TK HQ:', '105928172912'],
          ['Ngày thông quan:', '_____'],
          ['Số C/O (Form B):', '_____'],
          ['Ngày cấp C/O:', '_____'],
        ],
      },
      {
        icon: 'shipping',
        title: '4. SHIPPING (HÃNG TÀU)',
        tag: 'CMA CGM',
        lead: 'CMA CGM',
        rows: [
          ['Tàu vận tải:', 'CMA CGM JULES VERNE'],
          ['Chuyến (Voy):', '114E', 'accent'],
          ['Hành trình:', 'SGN ⇢ LGB', 'accent'],
        ],
      },
    ],
  },
  {
    id: 'lot-04',
    table: { declDate: '05/04/2024', quantity: '45 Kiện rời', vgm: '2.4 Tấn' },
    no: '04',
    code: '26KCT14/LOT-04-LCL',
    kind: 'lcl',
    status: {
      label: 'Đang đóng hàng kho CFS (Packing / CFS)',
      icon: 'pack',
      tone: 'blue',
    },
    value: {
      usd: '25,000',
      vnd: '636,250,000',
      rate: '25,450',
      scaleTag: '45 Kiện',
      weight: '3.8 CBM • Khối lượng: 2.4 Tấn',
    },
    route: {
      from: 'Kho CFS Cát Lái (VN)',
      to: 'Long Beach CFS Terminal (US)',
      etd: '08/04/2024',
      etaLabel: 'Dự kiến đến (ETA):',
      eta: '28/04/2024',
    },
    costs: {
      total: '34,500,000',
      items: [
        ['Cước LCL O/F:', '22.50M', 'accent'],
        ['Phí CFS & THC:', '6.80M'],
        ['Trucking nội địa:', '3,200,000'],
        ['Hải quan lẻ:', '1,200,000'],
        ['Hun trùng & Tem:', '800,000', 'accent'],
      ],
    },
    partners: [
      {
        icon: 'booking',
        title: '1. BOOKING / CONSOL',
        tag: 'LCL',
        lead: 'Á Châu Consol & Logistics',
        rows: [
          ['Mã Booking:', 'CSL-SGN-5501', 'accent'],
          ['House B/L:', 'ACL-LCL-9081'],
          ['Hình thức:', 'CFS / CFS', 'accent'],
        ],
      },
      {
        icon: 'trucking',
        title: '2. TRUCKING NỘI ĐỊA',
        tag: 'XE TẢI THÙNG',
        units: [{ name: 'Transimex Logistics', cont: 45, tone: 'teal' }],
        totalCont: 45,
        unitLabel: 'Kiện',
        rows: [],
      },
      {
        icon: 'cfs',
        title: '3. HẢI QUAN & KHO CFS',
        tag: 'CFS CÁT LÁI',
        lead: 'Đại lý Khai báo HQ Á Châu',
        rows: [
          ['Số TK HQ:', '105928172930'],
          ['Ngày thông quan:', '_____'],
          ['Số C/O (Form B):', '_____'],
          ['Ngày cấp C/O:', '_____'],
        ],
      },
      {
        icon: 'shipping',
        title: '4. SHIPPING (LCL)',
        tag: 'SEALAND',
        lead: 'Sealand / Maersk LCL',
        rows: [
          ['Master B/L:', 'MSK-LCL-0912'],
          ['Dịch vụ:', 'Consol Direct', 'accent'],
          ['Hành trình:', 'SGN ⇢ LGB CFS', 'accent'],
        ],
      },
    ],
  },
];

// A saturated border per lot status so each lot card stands out from the page
// and from its own inner panels (user feedback, 2026-09-19): done = teal,
// in progress = accent blue, warning = amber, not started = slate.
// `Card`'s border colour is set by the theme's `card` override (a higher
// layer than `xstyle`), so a `borderColor` here is ignored — an inset outline
// drawn over the 1px border does the job instead.
const lotBorderTones = stylex.create({
  success: {
    outlineColor: 'var(--maritime-teal-value)',
    outlineOffset: '-1px',
    outlineStyle: 'solid',
    outlineWidth: '2px',
  },
  blue: {
    outlineColor: 'var(--color-accent)',
    outlineOffset: '-1px',
    outlineStyle: 'solid',
    outlineWidth: '2px',
  },
  warning: {
    outlineColor: 'var(--color-warning)',
    outlineOffset: '-1px',
    outlineStyle: 'solid',
    outlineWidth: '2px',
  },
  neutral: {
    outlineColor: 'var(--maritime-text-muted)',
    outlineOffset: '-1px',
    outlineStyle: 'solid',
    outlineWidth: '2px',
  },
});

const styles = stylex.create({
  tracking: { letterSpacing: '0.05em' },
  fixedCols: {
    gridTemplateColumns: 'repeat(4, minmax(0, 400px))',
    justifyContent: 'start',
  },
  // ~3 rows visible; more cost items scroll inside the card instead of
  // stretching it.
  costList: {
    alignContent: 'start',
    maxHeight: '104px',
    overflowY: 'auto',
    paddingRight: 'var(--spacing-1)',
  },
  partnerHeader: {
    borderBottomColor: 'var(--color-border)',
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
    paddingBottom: 'var(--spacing-1-5)',
  },
  detailBlock: {
    backgroundColor: 'var(--color-background-muted)',
    borderRadius: 'var(--radius-inner)',
    padding: 'var(--spacing-2)',
  },
  unitRow: {
    backgroundColor: 'var(--color-background-muted)',
    borderRadius: 'var(--radius-inner)',
    paddingBlock: '2px',
    paddingInline: 'var(--spacing-2)',
  },
  barTrack: {
    backgroundColor: 'var(--color-border)',
    borderRadius: 'var(--radius-full)',
    height: '6px',
    overflow: 'hidden',
    width: '100%',
  },
  barSeg: { flexShrink: 0, height: '100%' },
  noWrap: { whiteSpace: 'nowrap' },
  statValue: { letterSpacing: '-0.025em', lineHeight: 1.1 },
  borderCard: { borderColor: 'var(--color-border)' },
  segmented: {
    backgroundColor: 'var(--color-background-muted)',
    borderColor: 'var(--color-border)',
    borderRadius: 'var(--radius-inner)',
    borderStyle: 'solid',
    borderWidth: '1px',
    padding: '2px',
  },
  cardHeader: {
    borderBottomColor: 'var(--color-border)',
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
    paddingBottom: 'var(--spacing-2)',
  },
  indexBox: {
    borderRadius: 'var(--radius-inner)',
    height: '32px',
    width: '32px',
  },
  indexBlue: {
    backgroundColor: 'var(--maritime-chip-bg)',
    color: 'var(--maritime-chip-text)',
  },
  indexSuccess: {
    backgroundColor: 'var(--maritime-badge-success-bg)',
    color: 'var(--maritime-badge-success-text)',
  },
  panel: {
    backgroundColor: 'var(--color-background-card)',
    borderColor: 'var(--color-border)',
  },
  partnersWrap: {
    backgroundColor: 'var(--color-background-muted)',
    borderColor: 'var(--color-border)',
    borderRadius: 'var(--radius-inner)',
    borderStyle: 'solid',
    borderWidth: '1px',
    padding: 'var(--spacing-3)',
  },
  partnerCard: {
    backgroundColor: 'var(--color-background-card)',
    borderColor: 'var(--color-border)',
  },
  lotCard: {
    backgroundColor: 'var(--color-background-card)',
    overflow: 'hidden',
  },
  summaryBar: {
    backgroundColor: 'var(--maritime-chip-bg)',
    borderColor: 'var(--maritime-badge-info-border)',
    borderRadius: 'var(--radius-inner)',
    borderStyle: 'solid',
    borderWidth: '1px',
    paddingBlock: 'var(--spacing-3)',
    paddingInline: 'var(--spacing-4)',
  },
  summaryIcon: {
    backgroundColor: 'var(--color-background-body)',
    borderColor: 'var(--maritime-badge-info-border)',
    borderRadius: 'var(--radius-inner)',
    borderStyle: 'solid',
    borderWidth: '1px',
    color: 'var(--maritime-badge-info-text)',
    height: '36px',
    width: '36px',
  },
  tag: {
    borderRadius: 'var(--radius-inner)',
    borderStyle: 'solid',
    borderWidth: '1px',
    flexShrink: 0,
    paddingBlock: '1px',
    paddingInline: 'var(--spacing-1-5)',
  },
  tagLabel: {
    color: 'inherit',
    fontFamily: 'var(--font-family-code)',
    fontSize: '14px',
    fontWeight: 'var(--font-weight-semibold)',
    lineHeight: '20px',
  },
});

const tagTones = stylex.create({
  blue: {
    backgroundColor: 'var(--maritime-chip-bg)',
    borderColor: 'transparent',
    color: 'var(--maritime-chip-text)',
  },
  success: {
    backgroundColor: 'var(--maritime-badge-success-bg)',
    borderColor: 'var(--maritime-badge-success-border)',
    color: 'var(--maritime-badge-success-text)',
  },
  neutral: {
    backgroundColor: 'var(--maritime-badge-warning-bg)',
    borderColor: 'var(--maritime-badge-warning-border)',
    color: 'var(--maritime-badge-warning-text)',
  },
});

const segWidth = stylex.create({
  w: (/** @type {number} */ ratio) => ({ width: `${ratio * 100}%` }),
}).w;

const segTones = stylex.create({
  primary: { backgroundColor: 'var(--color-accent)' },
  secondary: {
    backgroundColor: 'color-mix(in srgb, var(--color-accent) 70%, white)',
  },
  teal: { backgroundColor: 'var(--color-success)' },
  rest: {
    backgroundColor: 'color-mix(in srgb, var(--color-accent) 18%, white)',
  },
});
