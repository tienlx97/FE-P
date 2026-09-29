'use client';

import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';

import { MetaPill, MetaScheduleSwatch } from '@/shared/components/custom/meta/index.js';

import {
  BOOKING_STATES,
  bookingState,
  formatCarrierTime,
  onCarriageNote,
  sailingTitle,
} from '../config/vessel-schedule.js';

/**
 * Hover card of a sailing on the vessel schedule: the tag, whether it still
 * takes bookings ("Hết chỗ" in red), ETD → ETA, the CY cut-off and, for a
 * transshipment, the transit port(s) and how the cargo goes on when the
 * vessel stops short of the POD (barge) — enough to pick a sailing;
 * everything else is in the drawer.
 * @param {{
 *   carrier: import('../types/index.js').ShippingCarrier,
 *   sailing: import('../types/index.js').CarrierSailing,
 *   tone: import('@/shared/components/custom/meta/schedule.jsx').MetaScheduleTone,
 *   now: string,
 * }} props
 */
export function VesselSailingPreview({ carrier, sailing, tone, now }) {
  const state = BOOKING_STATES[bookingState(sailing, now)];
  const note = onCarriageNote(sailing);

  return (
    <VStack gap={2} hAlign="stretch" xstyle={styles.card}>
      <HStack gap={2} vAlign="center">
        <MetaScheduleSwatch tone={tone} />
        <Text size="sm" weight="bold">
          {sailingTitle(carrier.name, sailing)}
        </Text>
      </HStack>
      <HStack gap={2} vAlign="center" wrap="wrap">
        <MetaPill label={state.label} tone={state.tone} size="sm" hasDot />
        <Text size="sm" color="meta-subtle">
          {`${sailing.portOfLoading} → ${sailing.portOfDischarge}`}
        </Text>
      </HStack>
      <Row label="ETD" value={formatCarrierTime(sailing.etd)} />
      <Row label="ETA" value={formatCarrierTime(sailing.eta)} />
      <Row label="CY cut-off" value={formatCarrierTime(sailing.cyCutoff)} />
      <Row label="Terminal dỡ" value={sailing.portOfDischargeTerminal ?? '—'} />
      {sailing.transshipmentPorts.length > 0 ? (
        <Row label="Chuyển tải" value={sailing.transshipmentPorts.join(' → ')} />
      ) : null}
      {note ? (
        <Text size="sm" color="meta-amber">
          {note}
        </Text>
      ) : null}
      <Text size="sm" color="secondary">
        Bấm để xem chi tiết
      </Text>
    </VStack>
  );
}

/** @param {{ label: string, value: string }} props */
function Row({ label, value }) {
  return (
    <HStack gap={3} hAlign="between" vAlign="center">
      <Text size="sm" color="meta-subtle">
        {label}
      </Text>
      <Text size="sm" type="code">
        {value}
      </Text>
    </HStack>
  );
}

const styles = stylex.create({
  card: {
    maxWidth: '20rem',
    minWidth: '16rem',
  },
});
