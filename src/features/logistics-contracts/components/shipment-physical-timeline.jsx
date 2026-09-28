'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Route } from 'lucide-react';

import { MetaCompactTable, MetaPill, MetaShipmentSection } from '@/shared/components/custom/meta/index.js';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';

import {
  groupPhysicalEvents,
  PHYSICAL_EVENT_CLASSIFIERS,
  PHYSICAL_EVENT_LABELS,
  PHYSICAL_EVENT_SOURCES,
} from '../config/shipment-journey-events.js';
import { useShipmentJourneyEventsQuery } from '../hooks/use-shipment-journey-query.js';

/** @param {{contractId: string, shipmentId: string}} props */
export function ShipmentPhysicalTimeline({ contractId, shipmentId }) {
  const query = useShipmentJourneyEventsQuery(contractId, shipmentId);
  if (query.isLoading) return <Skeleton width="100%" height="var(--spacing-40)" />;
  if (!query.data?.success) {
    return <Banner status="error" title={query.data?.message ?? 'Không thể tải timeline vận chuyển'} container="card" />;
  }

  const groups = groupPhysicalEvents(query.data.events);
  return (
    <MetaShipmentSection
      icon={Route}
      title="Timeline vận chuyển"
      subtitle="Sự kiện vật lý theo container và chuyến tàu · chỉ hiện mốc đã có ngày"
      pill={{ label: `${query.data.events.length} sự kiện`, tone: 'neutral' }}
    >
      {groups.length === 0 ? (
        <Text color="secondary">Chưa có sự kiện có ngày. Ghi nhận container, lịch tàu hoặc xác nhận mốc để bắt đầu.</Text>
      ) : (
        <VStack gap={3} hAlign="stretch">
          {groups.map((group) => (
            <VStack key={group.container} gap={2} hAlign="stretch">
              <Text weight="bold">{group.container === 'Toàn lô' ? group.container : `Container ${group.container}`}</Text>
              {group.voyages.map((voyage) => (
                <VStack key={voyage.id} gap={1} hAlign="stretch">
                  <Text size="sm" color="secondary">{voyage.label}</Text>
                  <MetaCompactTable
                    emptyLabel="Chưa có sự kiện."
                    columns={[
                      { key: 'event', header: 'Sự kiện', isWrapping: true },
                      { key: 'when', header: 'Thời điểm' },
                      { key: 'place', header: 'Địa điểm', isWrapping: true },
                      { key: 'source', header: 'Nguồn' },
                    ]}
                    rows={voyage.events.map((event, index) => ({
                      id: `${event.code}-${event.eventAt ?? event.eventOn}-${index}`,
                      cells: {
                        event: <Text weight="semibold">{PHYSICAL_EVENT_LABELS[event.code] ?? event.code}</Text>,
                        when: (
                          <VStack gap={0.5}>
                            <Text type="code">{formatDisplayDate(event.eventOn)}{event.eventAt ? ` ${event.eventAt.slice(11, 16)}` : ''}</Text>
                            <MetaPill
                              label={PHYSICAL_EVENT_CLASSIFIERS[event.classifier] ?? event.classifier}
                              tone={event.classifier === 'Actual' ? 'success' : 'neutral'}
                              size="sm"
                            />
                          </VStack>
                        ),
                        place: <Text size="sm">{event.location || '—'}</Text>,
                        source: (
                          <VStack gap={0.5}>
                            <Text size="sm">{PHYSICAL_EVENT_SOURCES[event.source] ?? event.source}</Text>
                            {event.sourceDetail ? <Text size="sm" color="meta-subtle">{event.sourceDetail}</Text> : null}
                          </VStack>
                        ),
                      },
                    }))}
                  />
                </VStack>
              ))}
            </VStack>
          ))}
        </VStack>
      )}
    </MetaShipmentSection>
  );
}
