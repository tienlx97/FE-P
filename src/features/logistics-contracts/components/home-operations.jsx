'use client';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { HStack } from '@astryxdesign/core/HStack';
import { List, ListItem } from '@astryxdesign/core/List';
import { Heading, Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';

import {
  needsAttention,
  shipmentPhase,
  shipmentRoute,
} from '../config/shipment-overview-schedule.js';
import { useShipmentOverviewQuery } from '../hooks/use-shipment-overview-query.js';

export function HomeOperations() {
  const query = useShipmentOverviewQuery();
  const rows = query.data?.success ? query.data.shipments : [];
  const attention = rows.filter(needsAttention);
  const visible = [
    ...attention,
    ...rows.filter((row) => !needsAttention(row)),
  ].slice(0, 5);
  return (
    <Card>
      <VStack gap={4}>
        <HStack wrap="wrap" gap={3} justify="between">
          <Heading level={2}>Lô hàng đang vận hành</Heading>
          <Button
            as="a"
            href="/logistics"
            variant="secondary"
            size="sm"
            label="Xem lịch vận hành"
          />
        </HStack>
        {query.isLoading ? (
          <Text color="secondary">Đang tải lô hàng…</Text>
        ) : !query.data?.success ? (
          <Banner
            status="error"
            title={query.data?.message ?? 'Không thể tải lô hàng'}
            endContent={
              <Button
                label="Thử lại"
                size="sm"
                onClick={() => query.refetch()}
              />
            }
          />
        ) : (
          <>
            <HStack gap={6} wrap="wrap">
              <Text>{rows.length} lô đang làm</Text>
              <Text>
                {rows.filter((row) => shipmentPhase(row) === 'sailing').length}{' '}
                lô đang trên tàu
              </Text>
              <Text color="secondary">{attention.length} lô cần chú ý</Text>
            </HStack>
            {visible.length ? (
              <List header="Lô hàng cần theo dõi · tối đa 5 lô" hasDividers>
                {visible.map((row) => (
                  <ListItem
                    key={row.shipmentId}
                    href={`/logistics/contract/${row.contractId}/shipment/${row.shipmentId}`}
                    label={`${row.shipmentCode} · ${row.shipmentName || row.contractNumber}`}
                    description={`${shipmentRoute(row)} · ETD ${row.etd ?? '—'} · ETA ${row.eta ?? '—'}${needsAttention(row) ? ' · Cần chú ý' : ''}`}
                  />
                ))}
              </List>
            ) : (
              <Text color="secondary">
                Không có lô hàng đang vận hành trong phạm vi của bạn.
              </Text>
            )}
          </>
        )}
      </VStack>
    </Card>
  );
}
