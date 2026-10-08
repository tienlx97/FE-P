'use client';

import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import {
  Layout,
  LayoutContent,
  LayoutFooter,
  LayoutHeader,
} from '@astryxdesign/core/Layout';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Drawer } from '@astryxdesign/lab';
import * as stylex from '@stylexjs/stylex';
import { ArrowLeft, ExternalLink, List, Ship, TriangleAlert } from 'lucide-react';

import {
  MetaCompactTable,
  MetaDrawerHeader,
  MetaPill,
  MetaShipmentSection,
  MetaThemeProvider,
} from '@/shared/components/custom/meta/index.js';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';

import {
  arrivalOf,
  departureOf,
  overviewGroups,
  shipmentRoute,
} from '../config/shipment-overview-schedule.js';
import { formatScheduleValue } from '../config/shipment-schedule.js';
import { alertMessage } from '../config/shipment-schedule.js';
import { labelForShipmentStatus } from '../config/shipment-status.js';

/** @typedef {import('../types/index.js').ShipmentOverview} ShipmentOverview */

/**
 * "Xem thêm" for the `/logistics` schedule: the list of shipments in
 * progress (grouped, "Cần chú ý" first) or one shipment's schedule,
 * deadlines and alerts, with a link to its detail page.
 * @param {{
 *   rows: ShipmentOverview[],
 *   selected: ShipmentOverview | null,
 *   onSelect: (shipmentId: string) => void,
 *   onBack: () => void,
 *   onClose: () => void,
 * }} props
 */
export function ShipmentOverviewDrawer({ rows, selected, onSelect, onBack, onClose }) {
  return (
    <MetaThemeProvider>
      <Drawer
        isOpen
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        side="end"
        width={720}
        isFullWidthOnMobile
        label={selected ? selected.shipmentCode : 'Lô hàng đang làm'}
        xstyle={styles.surface}
      >
        <Layout
          defaultHasDividers
          xstyle={styles.layout}
          header={
            <LayoutHeader padding={4}>
              {selected ? (
                <MetaDrawerHeader
                  icon={Ship}
                  title={selected.shipmentCode}
                  meta={`${selected.buyerName} · ${selected.incoterm} · ${selected.type}`}
                  onClose={onClose}
                />
              ) : (
                <MetaDrawerHeader
                  icon={List}
                  title="Lô hàng đang làm"
                  meta={`${rows.length} lô chưa hoàn tất`}
                  onClose={onClose}
                />
              )}
            </LayoutHeader>
          }
          content={
            <LayoutContent padding={5} xstyle={styles.canvas}>
              {selected ? (
                <ShipmentDetail shipment={selected} />
              ) : (
                <ShipmentGroups rows={rows} onSelect={onSelect} />
              )}
            </LayoutContent>
          }
          footer={
            selected ? (
              <LayoutFooter padding={4}>
                <HStack hAlign="between" vAlign="center" gap={3} wrap="wrap">
                  <Button
                    label="Danh sách lô"
                    variant="secondary"
                    size="lg"
                    icon={<Icon icon={ArrowLeft} size="sm" />}
                    onClick={onBack}
                  />
                  <Button
                    label="Mở lô hàng"
                    variant="primary"
                    size="lg"
                    icon={<Icon icon={ExternalLink} size="sm" />}
                    href={`/logistics/contract/${selected.contractId}/shipment/${selected.shipmentId}`}
                  />
                </HStack>
              </LayoutFooter>
            ) : null
          }
        />
      </Drawer>
    </MetaThemeProvider>
  );
}

/** @param {{ date: string | null | undefined, actual?: boolean }} props */
function DateText({ date, actual = false }) {
  return (
    <Text type="code" weight={actual ? 'bold' : 'normal'} color={date ? undefined : 'secondary'}>
      {formatDisplayDate(date ?? undefined)}
    </Text>
  );
}

/** @param {{ rows: ShipmentOverview[], onSelect: (shipmentId: string) => void }} props */
function ShipmentGroups({ rows, onSelect }) {
  const groups = overviewGroups(rows);
  if (groups.length === 0) {
    return <Text color="secondary">Không có lô hàng nào đang làm.</Text>;
  }

  return (
    <VStack gap={4} hAlign="stretch">
      {groups.map((group) => (
        <MetaShipmentSection
          key={group.key}
          icon={group.key === 'attention' ? TriangleAlert : Ship}
          title={group.label}
          pill={{
            label: `${group.rows.length} lô`,
            tone: group.key === 'attention' ? 'danger' : 'neutral',
            hasDot: group.key === 'attention',
          }}
        >
          <MetaCompactTable
            columns={[
              { key: 'shipment', header: 'Lô hàng', isWrapping: true },
              { key: 'route', header: 'Hãng · tuyến', isWrapping: true },
              { key: 'dates', header: 'ETD → ETA' },
              { key: 'open', header: '', align: 'end' },
            ]}
            rows={group.rows.map((row) => ({
              id: row.shipmentId,
              cells: {
                shipment: (
                  <VStack gap={0.5}>
                    <Text type="code" weight="bold">
                      {row.shipmentCode}
                    </Text>
                    <Text size="sm" color="meta-subtle">
                      {row.buyerName}
                    </Text>
                  </VStack>
                ),
                route: (
                  <VStack gap={0.5}>
                    <Text size="sm">{row.shippingLine ?? '—'}</Text>
                    <Text size="sm" color="meta-subtle">
                      {shipmentRoute(row) || '—'}
                    </Text>
                  </VStack>
                ),
                dates: (
                  <HStack gap={1.5} vAlign="center">
                    <DateText date={departureOf(row)} actual={Boolean(row.actualDeparture)} />
                    <Text color="secondary">→</Text>
                    <DateText date={arrivalOf(row)} actual={Boolean(row.actualArrival)} />
                  </HStack>
                ),
                open: (
                  <Button label="Xem" variant="secondary" size="sm" onClick={() => onSelect(row.shipmentId)} />
                ),
              },
            }))}
            emptyLabel="Không có lô."
          />
        </MetaShipmentSection>
      ))}
    </VStack>
  );
}

/** @param {{ shipment: ShipmentOverview }} props */
function ShipmentDetail({ shipment }) {
  /** @type {Array<[string, import('react').ReactNode]>} */
  const facts = [
    ['Tình trạng', <MetaPill key="status" label={labelForShipmentStatus(shipment.status)} tone="accent" size="sm" />],
    ['Hành trình', <Text key="journey">{shipment.journeySummary || '—'}</Text>],
    ['Hãng tàu', <Text key="line">{shipment.shippingLine ?? '—'}</Text>],
    [
      'Tàu / chuyến',
      <Text key="vessel" type="code">
        {[shipment.vesselName, shipment.voyageNumber].filter(Boolean).join(' // ') || '—'}
      </Text>,
    ],
    ['Tuyến', <Text key="route">{shipmentRoute(shipment) || '—'}</Text>],
    ['Booking', <Text key="booking" type="code">{shipment.bookingNumber}</Text>],
    ['Container', <Text key="containers">{`${shipment.containerCount} cont`}</Text>],
  ];
  /** @type {Array<[string, import('react').ReactNode]>} */
  const dates = [
    ['ETD', <DateText key="etd" date={shipment.etd} />],
    ['ATD', <DateText key="atd" date={shipment.actualDeparture} actual />],
    ['ETA', <DateText key="eta" date={shipment.eta} />],
    ['ATA', <DateText key="ata" date={shipment.actualArrival} actual />],
    [
      'Cutoff SI/VGM',
      <Text key="si" type="code">{formatScheduleValue('siCutoff', shipment.siCutoff)}</Text>,
    ],
    [
      'Cutoff CY',
      <Text key="cy" type="code">{formatScheduleValue('cyCutoff', shipment.cyCutoff)}</Text>,
    ],
    ['LFD', <DateText key="ft" date={shipment.freeTimeLastDay} actual />],
  ];
  /** @param {Array<[string, import('react').ReactNode]>} pairs */
  const toRows = (pairs) =>
    pairs.map(([label, value]) => ({
      id: label,
      cells: { label: <Text weight="semibold">{label}</Text>, value },
    }));

  return (
    <VStack gap={4} hAlign="stretch">
      <MetaShipmentSection
        icon={TriangleAlert}
        title="Cảnh báo"
        pill={
          shipment.alerts.length > 0
            ? { label: `${shipment.alerts.length}`, tone: 'danger', hasDot: true }
            : { label: 'Không có', tone: 'success', hasDot: true }
        }
      >
        {shipment.alerts.length > 0 ? (
          <VStack gap={2} hAlign="stretch">
            {shipment.alerts.map((alert, index) => (
              <HStack key={`${alert.kind}-${index}`} gap={2} vAlign="center">
                <MetaPill
                  label={alert.severity === 'Danger' ? 'Quá hạn' : 'Sắp tới'}
                  tone={alert.severity === 'Danger' ? 'danger' : 'warning'}
                  size="sm"
                />
                <Text size="sm">{alertMessage(alert)}</Text>
              </HStack>
            ))}
          </VStack>
        ) : (
          <Text size="sm" color="secondary">
            Lô hàng không có mục nào cần chú ý.
          </Text>
        )}
      </MetaShipmentSection>

      <MetaShipmentSection icon={Ship} title="Schedule & cutoff">
        <MetaCompactTable
          columns={[
            { key: 'label', header: 'Mốc' },
            { key: 'value', header: 'Ngày' },
          ]}
          rows={toRows(dates)}
          emptyLabel="—"
        />
      </MetaShipmentSection>

      <MetaShipmentSection icon={List} title="Thông tin lô" subtitle={shipment.shipmentName}>
        <MetaCompactTable
          columns={[
            { key: 'label', header: 'Mục' },
            { key: 'value', header: 'Giá trị', isWrapping: true },
          ]}
          rows={toRows(facts)}
          emptyLabel="—"
        />
      </MetaShipmentSection>
    </VStack>
  );
}

const styles = stylex.create({
  surface: {
    backgroundColor: 'var(--color-background-surface)',
    borderRadius: 0,
    boxShadow: 'var(--meta-shadow-drawer)',
  },
  layout: {
    height: '100%',
  },
  canvas: {
    backgroundColor: 'var(--meta-row-hover)',
  },
});
