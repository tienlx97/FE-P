'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Check, ListChecks, RefreshCw, Ship, X } from 'lucide-react';
import { useState } from 'react';

import {
  MetaCompactTable,
  MetaPill,
  MetaShipmentSection,
} from '@/shared/components/custom/meta/index.js';
import { formatDisplayDate } from '@/shared/config/date-input-format.js';

import {
  discrepancyTargetLabel,
  labelForTrackedField,
  trackingEventLabel,
  trackingStatus,
  trackingSubtitle,
} from '../config/shipment-tracking.js';
import {
  useShipmentTrackingMutations,
  useShipmentTrackingQuery,
} from '../hooks/use-shipment-tracking-query.js';

/** Events shown in the table, newest first. */
const EVENT_ROWS = 30;

/**
 * "Theo dõi hãng tàu" on the schedule tab (plan
 * `docs/carrier-tracking-integration-plan.md`): carrier + adapter version,
 * last sync, "Đồng bộ ngay", the "Hãng tàu báo khác" list to accept /
 * dismiss, then the carrier's events (which ones filled a field = source
 * "API").
 * @param {{
 *   contractId: string,
 *   shipmentId: string,
 *   legs: import('../types/index.js').TransshipmentLeg[],
 *   canEdit: boolean,
 * }} props
 */
export function ShipmentCarrierTrackingSection({ contractId, shipmentId, legs, canEdit }) {
  const query = useShipmentTrackingQuery(contractId, shipmentId);
  const { sync, resolve } = useShipmentTrackingMutations(contractId, shipmentId);
  const [error, setError] = useState(/** @type {string | null} */ (null));

  if (query.isLoading) {
    return <Skeleton width="100%" height="var(--spacing-24)" />;
  }
  if (!query.data?.success) {
    return (
      <Banner
        status="error"
        title={query.data?.message ?? 'Không thể tải tracking hãng tàu'}
        container="card"
      />
    );
  }

  const { tracking } = query.data;
  const status = trackingStatus(tracking);
  const isBusy = sync.isPending || resolve.isPending;

  const handleSync = async () => {
    setError(null);
    const result = await sync.mutateAsync();
    if (!result.success) setError(result.message);
  };
  const handleResolve = async (
    /** @type {string} */ discrepancyId,
    /** @type {'accept' | 'dismiss'} */ action,
  ) => {
    setError(null);
    const result = await resolve.mutateAsync({ discrepancyId, action });
    if (!result.success) setError(result.message);
  };

  const discrepancyRows = tracking.discrepancies.map((discrepancy) => ({
    id: discrepancy.id,
    cells: {
      target: <Text weight="semibold">{discrepancyTargetLabel(discrepancy, legs)}</Text>,
      current: (
        <Text type="code" color="secondary">
          {formatDisplayDate(discrepancy.currentValue ?? undefined)}
        </Text>
      ),
      carrier: (
        <VStack gap={0.5}>
          <Text type="code" weight="bold">
            {formatDisplayDate(discrepancy.carrierValue)}
          </Text>
          {discrepancy.carrierDepot ? (
            <Text size="sm" color="meta-subtle">
              {discrepancy.carrierDepot}
            </Text>
          ) : null}
        </VStack>
      ),
      actions: canEdit ? (
        <HStack gap={1.5}>
          <Button
            label="Lấy giá trị hãng tàu"
            variant="primary"
            size="sm"
            icon={<Icon icon={Check} size="sm" />}
            isDisabled={isBusy}
            onClick={() => handleResolve(discrepancy.id, 'accept')}
          />
          <Button
            label="Giữ giá trị đang có"
            variant="secondary"
            size="sm"
            icon={<Icon icon={X} size="sm" />}
            isDisabled={isBusy}
            onClick={() => handleResolve(discrepancy.id, 'dismiss')}
          />
        </HStack>
      ) : null,
    },
  }));

  const eventRows = tracking.events.slice(0, EVENT_ROWS).map((event) => ({
    id: event.id,
    cells: {
      at: (
        <Text type="code" color="secondary">
          {`${formatDisplayDate(event.eventAt.slice(0, 10))} ${event.eventAt.slice(11, 16)}`}
        </Text>
      ),
      event: (
        <Text weight={event.classifier === 'Actual' ? 'semibold' : 'normal'}>
          {trackingEventLabel(event)}
        </Text>
      ),
      place: <Text size="sm">{event.locationName ?? '—'}</Text>,
      subject: (
        <Text size="sm" type="code">
          {event.containerNumber ??
            ([event.vesselName, event.voyageNumber].filter(Boolean).join(' // ') || '—')}
        </Text>
      ),
      applied: (
        <HStack gap={1.5} wrap="wrap">
          {event.appliedTo ? (
            <MetaPill
              label={`Đã điền ${labelForTrackedField(event.appliedTo)}`}
              tone="success"
              size="sm"
              hasDot
            />
          ) : null}
          <Text size="sm" color="meta-subtle">
            {`${event.carrierCode} ${event.adapterVersion}`}
          </Text>
        </HStack>
      ),
    },
  }));

  return (
    <VStack gap={4} hAlign="stretch">
      <MetaShipmentSection
        icon={Ship}
        title="Theo dõi hãng tàu"
        subtitle={trackingSubtitle(tracking)}
        pill={{ label: status.label, tone: status.tone, hasDot: status.tone !== 'neutral' }}
        actions={
          canEdit ? (
            <Button
              label={sync.isPending ? 'Đang đồng bộ…' : 'Đồng bộ ngay'}
              variant="secondary"
              size="sm"
              icon={<Icon icon={RefreshCw} size="sm" />}
              isDisabled={!status.canSync || isBusy}
              onClick={handleSync}
            />
          ) : null
        }
      >
        {error ? <Banner status="error" title={error} container="card" /> : null}
        {status.hint ? (
          <Banner
            status={status.tone === 'danger' ? 'error' : 'info'}
            title={status.hint}
            container="card"
          />
        ) : null}
        <MetaCompactTable
          columns={[
            { key: 'target', header: 'Hãng tàu báo khác' },
            { key: 'current', header: 'Đang có' },
            { key: 'carrier', header: 'Hãng tàu báo' },
            { key: 'actions', header: '', align: 'end' },
          ]}
          rows={discrepancyRows}
          emptyLabel="Không có mục nào khác với dữ liệu đang nhập."
        />
      </MetaShipmentSection>

      {tracking.events.length > 0 ? (
        <MetaShipmentSection
          icon={ListChecks}
          title="Sự kiện từ hãng tàu"
          subtitle={`${tracking.events.length} sự kiện · mới nhất trước`}
        >
          <MetaCompactTable
            columns={[
              { key: 'at', header: 'Thời điểm' },
              { key: 'event', header: 'Sự kiện' },
              { key: 'place', header: 'Nơi', isWrapping: true },
              { key: 'subject', header: 'Container / tàu' },
              { key: 'applied', header: 'Nguồn', isWrapping: true },
            ]}
            rows={eventRows}
            emptyLabel="Chưa có sự kiện."
          />
        </MetaShipmentSection>
      ) : null}
    </VStack>
  );
}
