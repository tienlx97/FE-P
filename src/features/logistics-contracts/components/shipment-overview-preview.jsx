'use client';

import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';

import {
  MetaPill,
  MetaScheduleSwatch,
} from '@/shared/components/custom/meta/index.js';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';

import {
  arrivalOf,
  departureOf,
  OVERVIEW_CATEGORIES,
  shipmentRoute,
} from '../config/shipment-overview-schedule.js';
import { alertMessage } from '../config/shipment-schedule.js';
import { labelForShipmentStatus } from '../config/shipment-status.js';

/** Alerts shown in the card; the drawer has them all. */
const ALERT_LINES = 2;

/**
 * Hover card of a schedule item: what this item is (kind + date), then the
 * shipment at a glance — buyer, route, carrier / vessel, departure →
 * arrival (actual in bold), status and its first alerts.
 * @param {{
 *   event: import('../config/shipment-overview-schedule.js').OverviewEvent,
 *   shipment: import('../types/index.js').ShipmentOverview,
 * }} props
 */
export function ShipmentOverviewPreview({ event, shipment }) {
  const category = OVERVIEW_CATEGORIES[event.category];
  const departure = departureOf(shipment);
  const arrival = arrivalOf(shipment);
  const vessel = [shipment.vesselName, shipment.voyageNumber].filter(Boolean).join(' // ');
  const moreAlerts = shipment.alerts.length - ALERT_LINES;

  return (
    <VStack gap={3} hAlign="stretch" xstyle={styles.card}>
      <HStack gap={2} vAlign="center">
        <MetaScheduleSwatch tone={category.tone} />
        <Text size="sm" weight="semibold">
          {category.label}
        </Text>
        <Text size="sm" color="secondary" type="code">
          {formatDisplayDate(event.start)}
        </Text>
      </HStack>

      <VStack gap={0.5}>
        <Text weight="bold" type="code">
          {shipment.shipmentCode}
        </Text>
        <Text size="sm" color="meta-subtle">
          {`${shipment.buyerName} · ${shipment.incoterm} · ${shipment.type}`}
        </Text>
      </VStack>

      <VStack gap={1}>
        <Fact label="Tuyến" value={shipmentRoute(shipment) || '—'} />
        <Fact label="Hãng tàu" value={[shipment.shippingLine, vessel].filter(Boolean).join(' · ') || '—'} />
        <HStack gap={2} vAlign="center">
          <Text size="sm" color="secondary" xstyle={styles.factLabel}>
            Rời → đến
          </Text>
          <Text size="sm" type="code" weight={shipment.actualDeparture ? 'bold' : 'normal'}>
            {formatDisplayDate(departure ?? undefined)}
          </Text>
          <Text size="sm" color="secondary">
            →
          </Text>
          <Text size="sm" type="code" weight={shipment.actualArrival ? 'bold' : 'normal'}>
            {formatDisplayDate(arrival ?? undefined)}
          </Text>
        </HStack>
        <HStack gap={2} vAlign="center">
          <Text size="sm" color="secondary" xstyle={styles.factLabel}>
            Tình trạng
          </Text>
          <MetaPill label={labelForShipmentStatus(shipment.status)} tone="accent" size="sm" />
        </HStack>
      </VStack>

      {shipment.alerts.length > 0 ? (
        <VStack gap={1}>
          {shipment.alerts.slice(0, ALERT_LINES).map((alert, index) => (
            <HStack key={`${alert.kind}-${index}`} gap={1.5} vAlign="start">
              <MetaPill
                label={alert.severity === 'Danger' ? 'Quá hạn' : 'Sắp tới'}
                tone={alert.severity === 'Danger' ? 'danger' : 'warning'}
                size="sm"
              />
              <Text size="sm">{alertMessage(alert)}</Text>
            </HStack>
          ))}
          {moreAlerts > 0 ? (
            <Text size="sm" color="meta-subtle">
              {`+${moreAlerts} cảnh báo khác`}
            </Text>
          ) : null}
        </VStack>
      ) : null}

      <Text size="xsm" color="meta-subtle">
        Bấm để xem chi tiết lô hàng
      </Text>
    </VStack>
  );
}

/** @param {{ label: string, value: string }} props */
function Fact({ label, value }) {
  return (
    <HStack gap={2} vAlign="start">
      <Text size="sm" color="secondary" xstyle={styles.factLabel}>
        {label}
      </Text>
      <Text size="sm">{value}</Text>
    </HStack>
  );
}

const styles = stylex.create({
  card: {
    maxWidth: 'var(--meta-kpi-card-max)',
    padding: 'var(--spacing-1)',
  },
  factLabel: {
    flexShrink: 0,
    width: 'calc(var(--spacing-10) * 2)',
  },
});
