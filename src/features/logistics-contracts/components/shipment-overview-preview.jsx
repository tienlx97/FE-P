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

/**
 * Hover card of a schedule item — just what is needed to decide whether to
 * open the shipment: what this item is (kind + date), which shipment
 * (code, buyer), where (full route, delivery site included), who carries
 * it and when (departure → arrival, actual in bold), and the most urgent
 * alert with the total. Everything else is one click away (drawer).
 * @param {{
 *   event: import('../config/shipment-overview-schedule.js').OverviewEvent,
 *   shipment: import('../types/index.js').ShipmentOverview,
 * }} props
 */
export function ShipmentOverviewPreview({ event, shipment }) {
  const category = OVERVIEW_CATEGORIES[event.category];
  const departure = departureOf(shipment);
  const arrival = arrivalOf(shipment);
  const alerts = [...shipment.alerts].sort(
    (a, b) => Number(b.severity === 'Danger') - Number(a.severity === 'Danger'),
  );
  const topAlert = alerts[0];

  return (
    <VStack gap={3} hAlign="stretch" xstyle={styles.card}>
      <HStack gap={2} vAlign="center">
        <MetaScheduleSwatch tone={category.tone} />
        <Text size="sm" weight="semibold">
          {`${event.term} · ${formatDisplayDate(event.start)}${event.category === 'overdue' ? ' · quá hạn' : ''}`}
        </Text>
      </HStack>

      <VStack gap={0.5}>
        <Text weight="bold" type="code">
          {shipment.shipmentCode}
        </Text>
        <Text size="sm" color="meta-subtle">
          {shipment.buyerName}
        </Text>
      </VStack>

      <VStack gap={1}>
        <Fact label="Tuyến">
          <Text size="sm">{shipmentRoute(shipment) || '—'}</Text>
        </Fact>
        {shipment.shippingLine ? (
          <Fact label="Hãng tàu">
            <Text size="sm">{shipment.shippingLine}</Text>
          </Fact>
        ) : null}
        <Fact label={`${shipment.actualDeparture ? 'ATD' : 'ETD'} → ${shipment.actualArrival ? 'ATA' : 'ETA'}`}>
          <Text size="sm" type="code" weight={shipment.actualDeparture ? 'bold' : 'normal'}>
            {formatDisplayDate(departure ?? undefined)}
          </Text>
          <Text size="sm" color="secondary">
            →
          </Text>
          <Text size="sm" type="code" weight={shipment.actualArrival ? 'bold' : 'normal'}>
            {formatDisplayDate(arrival ?? undefined)}
          </Text>
        </Fact>
      </VStack>

      {topAlert ? (
        <HStack gap={1.5} vAlign="start">
          <MetaPill
            label={alerts.length > 1 ? `${alerts.length} cảnh báo` : '1 cảnh báo'}
            tone={topAlert.severity === 'Danger' ? 'danger' : 'warning'}
            size="sm"
          />
          <Text size="sm">{alertMessage(topAlert)}</Text>
        </HStack>
      ) : null}
    </VStack>
  );
}

/** @param {{ label: string, children: import('react').ReactNode }} props */
function Fact({ label, children }) {
  return (
    <HStack gap={2} vAlign="start">
      <Text size="sm" color="secondary" xstyle={styles.factLabel}>
        {label}
      </Text>
      <HStack gap={1.5} vAlign="center" wrap="wrap" xstyle={styles.factValue}>
        {children}
      </HStack>
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
  factValue: {
    minWidth: 0,
  },
});
