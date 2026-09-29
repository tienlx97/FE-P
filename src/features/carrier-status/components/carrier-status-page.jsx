'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Heading, Text } from '@astryxdesign/core/Text';
import { Tooltip } from '@astryxdesign/core/Tooltip';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { Activity, RefreshCw } from 'lucide-react';

import { MetaPageHeader } from '@/shared/components/custom/meta/index.js';

import {
  componentState,
  dayTooltip,
  formatCheckedAt,
  formatLatency,
  formatUptime,
  INTEGRATION_LABELS,
  overallBanner,
  splitCarriers,
} from '../config/carrier-status.js';
import { useCarrierStatusQuery, useCheckCarrierStatusMutation } from '../hooks/use-carrier-status.js';

const styles = stylex.create({
  page: {
    marginInline: 'auto',
    maxWidth: '64rem',
    width: '100%',
  },
  bars: {
    height: 'var(--spacing-8)',
  },
  bar: {
    borderRadius: 'var(--radius-element)',
    flexBasis: 0,
    flexGrow: 1,
    height: '100%',
    minWidth: 0,
    opacity: {
      default: 1,
      ':hover': 0.7,
    },
  },
  none: {
    backgroundColor: 'var(--meta-hairline)',
  },
  up: {
    backgroundColor: 'var(--meta-emerald-fill)',
  },
  degraded: {
    backgroundColor: 'var(--meta-amber)',
  },
  down: {
    backgroundColor: 'var(--color-error)',
  },
  legendSwatch: {
    borderRadius: 'var(--radius-element)',
    height: 'var(--spacing-3)',
    width: 'var(--spacing-3)',
  },
  divider: {
    borderBlockStartColor: 'var(--meta-outline-light)',
    borderBlockStartStyle: 'solid',
    borderBlockStartWidth: 'var(--border-width)',
    paddingBlockStart: 'var(--spacing-4)',
  },
});

/** @param {import('../types/index.js').CarrierHealthOutcome | null} outcome */
const barStyle = (outcome) =>
  outcome === 'Up' ? styles.up : outcome === 'Degraded' ? styles.degraded : outcome === 'Down' ? styles.down : styles.none;

/**
 * One bar per day, oldest first — hover for the day's probes.
 * @param {{ days: import('../types/index.js').CarrierStatusDay[], label: string }} props
 */
function UptimeBars({ days, label }) {
  return (
    <HStack gap={0.5} vAlign="stretch" xstyle={styles.bars} aria-label={label} role="img">
      {days.map((day) => (
        <Tooltip key={day.date} content={dayTooltip(day)}>
          <HStack gap={0} xstyle={[styles.bar, barStyle(day.outcome)]} tabIndex={0} aria-label={dayTooltip(day)} />
        </Tooltip>
      ))}
    </HStack>
  );
}

/**
 * @param {{
 *   carrierName: string,
 *   component: import('../types/index.js').CarrierStatusComponent,
 *   windowDays: number,
 *   isFirst: boolean,
 * }} props
 */
function ComponentRow({ carrierName, component, windowDays, isFirst }) {
  const state = componentState(component);
  const label = `${carrierName} — ${INTEGRATION_LABELS[component.integration]}`;
  const latest = component.latest;

  return (
    <VStack gap={2} hAlign="stretch" xstyle={isFirst ? undefined : styles.divider}>
      <HStack gap={3} hAlign="between" vAlign="center" wrap="wrap">
        <HStack gap={2} vAlign="center">
          <StatusDot variant={state.variant} label={state.label} isPulsing={state.variant === 'error'} />
          <Text weight="semibold">{INTEGRATION_LABELS[component.integration]}</Text>
          <Text size="sm" color="secondary">
            {state.label}
          </Text>
          {component.activeVersion ? (
            <Text size="sm" type="code" color="secondary">
              {component.activeVersion}
            </Text>
          ) : null}
        </HStack>
        {component.isImplemented && component.isWatched ? (
          <Text size="sm" color="secondary" hasTabularNumbers>
            {formatUptime(component.uptimePercent)}
          </Text>
        ) : null}
      </HStack>

      {component.isImplemented && component.isWatched ? (
        <>
          <UptimeBars days={component.days} label={`${label}: ${windowDays} ngày gần nhất`} />
          <HStack gap={3} hAlign="between" vAlign="center">
            <Text size="sm" color="secondary">
              {`${windowDays} ngày trước`}
            </Text>
            {latest ? (
              <Text size="sm" color="secondary">
                {[latest.detail, formatLatency(latest.latencyMs), formatCheckedAt(latest.checkedAtUtc)].filter(Boolean).join(' · ')}
              </Text>
            ) : null}
            <Text size="sm" color="secondary">
              Hôm nay
            </Text>
          </HStack>
        </>
      ) : null}
    </VStack>
  );
}

function Legend() {
  const entries = /** @type {const} */ ([
    ['Up', 'Hoạt động'],
    ['Degraded', 'Chậm / không có dữ liệu'],
    ['Down', 'Lỗi'],
    [null, 'Không có dữ liệu'],
  ]);
  return (
    <HStack gap={4} vAlign="center" wrap="wrap">
      {entries.map(([outcome, text]) => (
        <HStack key={text} gap={1.5} vAlign="center">
          <HStack gap={0} xstyle={[styles.legendSwatch, barStyle(outcome)]} />
          <Text size="sm" color="secondary">
            {text}
          </Text>
        </HStack>
      ))}
    </HStack>
  );
}

function LoadingCards() {
  return (
    <VStack gap={4} hAlign="stretch">
      {[0, 1].map((index) => (
        <Card key={index}>
          <VStack gap={3} hAlign="stretch">
            <Skeleton width="10rem" height="var(--spacing-6)" index={index} />
            <Skeleton height="var(--spacing-8)" index={index + 1} />
            <Skeleton height="var(--spacing-8)" index={index + 2} />
          </VStack>
        </Card>
      ))}
    </VStack>
  );
}

/**
 * "/live": whether each carrier's vessel schedule and tracking API works,
 * like a status page — overall banner, then per carrier the integrations
 * with their state, uptime and one bar per day (the BE probes every 15
 * minutes; "Kiểm tra ngay" probes now). Carriers with nothing connected
 * are listed in one line.
 */
export function CarrierStatusPage() {
  const statusQuery = useCarrierStatusQuery();
  const checkMutation = useCheckCarrierStatusMutation();
  const data = statusQuery.data;
  const status = data?.success ? data.status : null;
  const banner = overallBanner(status?.overall ?? null);
  const { connected, notConnected } = splitCarriers(status?.carriers ?? []);
  const checkError = checkMutation.data && !checkMutation.data.success ? checkMutation.data.message : null;

  return (
    <VStack gap={5} hAlign="stretch" xstyle={styles.page}>
      <MetaPageHeader
        trail={[{ label: 'Logistics', href: '/logistics' }, { label: 'Trạng thái API hãng tàu' }]}
        icon={Activity}
        title="Trạng thái API hãng tàu"
        description="Lịch tàu và tracking của từng hãng — tự kiểm tra 15 phút một lần, gọi thẳng tới hãng (không qua cache)."
        meta={
          <HStack gap={3} vAlign="center" wrap="wrap">
            <Text size="sm" color="secondary">
              {`Kiểm tra gần nhất: ${formatCheckedAt(status?.lastCheckedAtUtc ?? null)}`}
            </Text>
            <Button
              label="Kiểm tra ngay"
              variant="secondary"
              size="sm"
              icon={<Icon icon={RefreshCw} size="sm" />}
              isLoading={checkMutation.isPending}
              onClick={() => checkMutation.mutate()}
            />
          </HStack>
        }
      />

      {data && !data.success ? (
        <Banner status="error" title={data.message} />
      ) : status ? (
        <Banner status={banner.status} title={banner.title} />
      ) : null}
      {checkError ? <Banner status="error" title={checkError} /> : null}

      {statusQuery.isLoading ? (
        <LoadingCards />
      ) : (
        <VStack gap={4} hAlign="stretch">
          {connected.map((entry) => (
            <Card key={entry.carrier.code}>
              <VStack gap={4} hAlign="stretch">
                <Heading level={3}>{entry.carrier.name}</Heading>
                {entry.components.map((component, index) => (
                  <ComponentRow
                    key={component.integration}
                    carrierName={entry.carrier.name}
                    component={component}
                    windowDays={status?.windowDays ?? component.days.length}
                    isFirst={index === 0}
                  />
                ))}
              </VStack>
            </Card>
          ))}
          {notConnected.length > 0 ? (
            <Text size="sm" color="secondary">
              {`Chưa kết nối: ${notConnected.join(', ')}`}
            </Text>
          ) : null}
          {status ? <Legend /> : null}
        </VStack>
      )}
    </VStack>
  );
}
