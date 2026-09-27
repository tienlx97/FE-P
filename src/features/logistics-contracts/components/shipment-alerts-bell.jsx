'use client';

import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Divider } from '@astryxdesign/core/Divider';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Link } from '@astryxdesign/core/Link';
import { Popover } from '@astryxdesign/core/Popover';
import { ScrollableArea } from '@astryxdesign/core/ScrollableArea';
import { Heading, Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { Bell } from 'lucide-react';

import {
  MetaPill,
  MetaThemeProvider,
} from '@/shared/components/custom/meta/index.js';

import { alertMessage } from '../config/shipment-schedule.js';
import { useShipmentAlertsQuery } from '../hooks/use-shipment-schedule-query.js';

/**
 * Top-nav notifications for shipments needing attention (free time,
 * cut-offs, delays — BE `GET /api/v1/shipments/alerts`): a bell with the
 * number of shipments (red when one is overdue, amber otherwise); clicking
 * opens a popover listing them, most dangerous first, each linking to its
 * schedule tab. Replaces the "Lô hàng cần chú ý" card above the shipment
 * list (user request). Rendered only for `logistics:contracts:view`.
 */
export function ShipmentAlertsBell() {
  const query = useShipmentAlertsQuery();
  const rows = query.data?.success ? query.data.rows : [];
  const dangerRows = rows.filter((row) =>
    row.alerts.some((alert) => alert.severity === 'Danger'),
  ).length;
  const label =
    rows.length > 0 ? `Thông báo: ${rows.length} lô hàng cần chú ý` : 'Thông báo';

  return (
    <Popover
      label="Lô hàng cần chú ý"
      placement="below"
      alignment="end"
      width={440}
      content={
        <MetaThemeProvider>
          <VStack gap={3} hAlign="stretch">
            <VStack gap={0.5}>
              <Heading level={4}>Lô hàng cần chú ý</Heading>
              <Text size="sm" color="secondary">
                {rows.length === 0
                  ? 'Không có lô nào cần chú ý.'
                  : `${rows.length} lô${dangerRows > 0 ? ` · ${dangerRows} có mục quá hạn` : ''}`}
              </Text>
            </VStack>
            {rows.length > 0 ? (
              <>
                <Divider />
                <ScrollableArea label="Danh sách lô hàng cần chú ý" xstyle={styles.list}>
                  <VStack gap={0} hAlign="stretch">
                    {rows.map((row, index) => {
                      const isDanger = row.alerts.some((alert) => alert.severity === 'Danger');
                      return (
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
                              tone={isDanger ? 'danger' : 'warning'}
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
                      );
                    })}
                  </VStack>
                </ScrollableArea>
              </>
            ) : null}
            <Divider />
            <Link href="/logistics" size="sm">
              Xem lịch các lô hàng đang làm
            </Link>
          </VStack>
        </MetaThemeProvider>
      }
    >
      <Button
        label=""
        aria-label={label}
        tooltip={label}
        variant="ghost"
        size="sm"
        icon={<Icon icon={Bell} size="sm" />}
        endContent={
          rows.length > 0 ? (
            <Badge variant={dangerRows > 0 ? 'error' : 'warning'} label={rows.length} />
          ) : undefined
        }
      />
    </Popover>
  );
}

const styles = stylex.create({
  list: {
    maxHeight: 'min(60vh, 32rem)',
  },
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
