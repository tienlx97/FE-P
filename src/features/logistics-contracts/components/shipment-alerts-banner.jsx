'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';

import { alertMessage } from '../config/shipment-schedule.js';

/**
 * A shipment's alerts (free time, cut-offs, delays) as one banner: red
 * when any is overdue / passed, amber otherwise; the first one in the
 * header, every one in the open content. Nothing when there are none.
 * @param {{ alerts: import('../types/index.js').ShipmentAlert[] }} props
 */
export function ShipmentAlertsBanner({ alerts }) {
  if (alerts.length === 0) return null;
  const dangerCount = alerts.filter((alert) => alert.severity === 'Danger').length;

  return (
    <Banner
      status={dangerCount > 0 ? 'error' : 'warning'}
      title={
        dangerCount > 0
          ? `${alerts.length} cảnh báo · ${dangerCount} quá hạn`
          : `${alerts.length} cảnh báo`
      }
      description={alertMessage(alerts[0])}
      container="card"
      collapsible={alerts.length > 1 ? { defaultIsOpen: false } : false}
    >
      {alerts.length > 1 ? (
        <VStack gap={1} hAlign="stretch">
          {alerts.map((alert, index) => (
            <Text
              key={`${alert.kind}-${alert.containerNumber ?? ''}-${alert.freeTimeKind ?? ''}-${index}`}
              size="sm"
              color={alert.severity === 'Danger' ? 'meta-danger' : 'primary'}
            >
              {alertMessage(alert)}
            </Text>
          ))}
        </VStack>
      ) : null}
    </Banner>
  );
}
