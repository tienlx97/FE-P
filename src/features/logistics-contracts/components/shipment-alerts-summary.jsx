'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { HStack } from '@astryxdesign/core/HStack';
import { Link } from '@astryxdesign/core/Link';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';

import { MetaPill } from '@/shared/components/custom/meta/index.js';

import { alertMessage } from '../config/shipment-schedule.js';
import { useShipmentAlertsQuery } from '../hooks/use-shipment-schedule-query.js';

/**
 * "Lô hàng cần chú ý" above the shipment list: every shipment with alerts
 * (free time, cut-offs, delays — BE `GET /api/v1/shipments/alerts`),
 * most dangerous first, each linking to its detail page. Collapsed by
 * default; nothing when no shipment has alerts or the list fails to load.
 */
export function ShipmentAlertsSummary() {
  const query = useShipmentAlertsQuery();
  const rows = query.data?.success ? query.data.rows : [];
  if (rows.length === 0) return null;

  const dangerRows = rows.filter((row) =>
    row.alerts.some((alert) => alert.severity === 'Danger'),
  ).length;

  return (
    <Banner
      status={dangerRows > 0 ? 'error' : 'warning'}
      title={`${rows.length} lô hàng cần chú ý${dangerRows > 0 ? ` · ${dangerRows} có mục quá hạn` : ''}`}
      description="Free time sắp hết / quá hạn, cut-off SI / hạ bãi, ETD / ETA bị dời."
      container="card"
      collapsible={{ defaultIsOpen: false }}
    >
      <VStack gap={0} hAlign="stretch">
        {rows.map((row, index) => (
          <VStack
            key={row.shipmentId}
            gap={1}
            hAlign="stretch"
            xstyle={[styles.row, index === 0 && styles.firstRow]}
          >
            <HStack gap={2} vAlign="center" wrap="wrap">
              <Link
                href={`/logistics/contract/${row.contractId}/shipment/${row.shipmentId}?tab=schedule`}
                weight="bold"
                color="accent"
              >
                {row.shipmentCode}
              </Link>
              <Text size="sm" color="secondary">
                {row.shipmentName}
              </Text>
              <MetaPill
                label={`${row.alerts.length} cảnh báo`}
                tone={
                  row.alerts.some((alert) => alert.severity === 'Danger')
                    ? 'danger'
                    : 'warning'
                }
                size="sm"
              />
            </HStack>
            {row.alerts.map((alert, alertIndex) => (
              <Text
                key={`${alert.kind}-${alert.containerNumber ?? ''}-${alert.freeTimeKind ?? ''}-${alertIndex}`}
                size="sm"
                color={alert.severity === 'Danger' ? 'meta-danger' : 'primary'}
              >
                {alertMessage(alert)}
              </Text>
            ))}
          </VStack>
        ))}
      </VStack>
    </Banner>
  );
}

const styles = stylex.create({
  row: {
    borderTopColor: 'var(--meta-hairline)',
    borderTopStyle: 'solid',
    borderTopWidth: 'var(--border-width)',
    paddingBlock: 'var(--spacing-3)',
  },
  firstRow: {
    borderTopWidth: 0,
    paddingTop: 0,
  },
});
