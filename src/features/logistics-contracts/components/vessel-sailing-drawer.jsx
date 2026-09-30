'use client';

import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import {
  Layout,
  LayoutContent,
  LayoutFooter,
  LayoutHeader,
} from '@astryxdesign/core/Layout';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Drawer } from '@astryxdesign/lab';
import * as stylex from '@stylexjs/stylex';
import { Anchor, CalendarClock, MapPin, Ship } from 'lucide-react';

import {
  MetaCompactTable,
  MetaDrawerHeader,
  MetaPill,
  MetaShipmentSection,
  MetaThemeProvider,
} from '@/shared/components/custom/meta/index.js';

import {
  BOOKING_STATES,
  bookingState,
  formatCarrierTime,
  onCarriageNote,
  sailingTitle,
} from '../config/vessel-schedule.js';

/** @typedef {Array<[string, import('react').ReactNode]>} Facts */

/** @param {Facts} pairs */
function toRows(pairs) {
  return pairs.map(([label, value]) => ({
    id: label,
    cells: { label: <Text weight="semibold">{label}</Text>, value },
  }));
}

/** @param {{ value: string | null | undefined }} props */
function TimeText({ value }) {
  return (
    <Text type="code" color={value ? undefined : 'secondary'}>
      {formatCarrierTime(value)}
    </Text>
  );
}

/**
 * A sailing of the vessel schedule, as the carrier publishes it: whether it
 * still takes bookings ("Hết chỗ" in red), ETD / ETA, SI, VGM and CY
 * cut-offs, terminal, route and transshipment (the transit ports, and how
 * the cargo goes on when the vessel stops short of the POD). Times are the
 * carrier's local port times.
 * @param {{
 *   carrier: import('../types/index.js').ShippingCarrier,
 *   sailing: import('../types/index.js').CarrierSailing,
 *   now: string,
 *   onClose: () => void,
 * }} props
 */
export function VesselSailingDrawer({ carrier, sailing, now, onClose }) {
  const title = sailingTitle(carrier.name, sailing);
  const state = BOOKING_STATES[bookingState(sailing, now)];
  const isDirect = sailing.transshipmentPorts.length === 0;
  const note = onCarriageNote(sailing);
  const stops = [sailing.portOfLoading, ...sailing.transshipmentPorts, sailing.portOfDischarge];

  /** @type {Facts} */
  const schedule = [
    ['Booking', <MetaPill key="booking" label={state.label} tone={state.tone} size="sm" hasDot />],
    ['ETD', <TimeText key="etd" value={sailing.etd} />],
    ['ETA', <TimeText key="eta" value={sailing.eta} />],
    [
      'Thời gian',
      <Text key="transit">{sailing.transitDays != null ? `${sailing.transitDays} ngày` : '—'}</Text>,
    ],
  ];
  /** @type {Facts} */
  const cutoffs = [
    ['SI cut-off', <TimeText key="si" value={sailing.siCutoff} />],
    ['VGM cut-off', <TimeText key="vgm" value={sailing.vgmCutoff} />],
    ['CY cut-off', <TimeText key="cy" value={sailing.cyCutoff} />],
  ];
  /** @type {Facts} */
  const route = [
    ['Cảng xếp (POL)', <Text key="pol">{sailing.portOfLoading || '—'}</Text>],
    ['Terminal xếp', <Text key="pol-terminal">{sailing.portOfLoadingTerminal ?? '—'}</Text>],
    ['Cảng dỡ (POD)', <Text key="pod">{sailing.portOfDischarge || '—'}</Text>],
    [
      'Terminal dỡ',
      sailing.portOfDischargeTerminal ? (
        <Text key="pod-terminal" color="accent" weight="semibold">
          {sailing.portOfDischargeTerminal}
        </Text>
      ) : (
        <Text key="pod-terminal">—</Text>
      ),
    ],
    [
      'Chuyển tải',
      isDirect ? (
        <MetaPill key="ts" label="Đi thẳng" tone="success" size="sm" />
      ) : (
        <Text key="ts">{sailing.transshipmentPorts.join(' → ')}</Text>
      ),
    ],
    ...(/** @type {Facts} */ (
      note ? [['Đi tiếp', <Text key="on-carriage" color="meta-amber">{note}</Text>]] : []
    )),
    ['Tuyến (service)', <Text key="service" type="code">{sailing.serviceCode ?? '—'}</Text>],
  ];

  return (
    <MetaThemeProvider>
      <Drawer
        isOpen
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        side="end"
        width={560}
        isFullWidthOnMobile
        label={title}
        hasCloseButton={false}
        xstyle={styles.surface}
      >
        <Layout
          defaultHasDividers
          xstyle={styles.layout}
          header={
            <LayoutHeader padding={4}>
              <MetaDrawerHeader
                icon={Ship}
                title={title}
                titleBadge={<MetaPill label={state.label} tone={state.tone} size="sm" hasDot />}
                meta={stops.join(' → ')}
                onClose={onClose}
              />
            </LayoutHeader>
          }
          content={
            <LayoutContent padding={5} xstyle={styles.canvas}>
              <VStack gap={4} hAlign="stretch">
                <MetaShipmentSection icon={CalendarClock} title="Lịch tàu">
                  <MetaCompactTable
                    columns={[
                      { key: 'label', header: 'Mốc' },
                      { key: 'value', header: 'Ngày giờ' },
                    ]}
                    rows={toRows(schedule)}
                    emptyLabel="—"
                  />
                </MetaShipmentSection>
                <MetaShipmentSection icon={Anchor} tone="warning" title="Cut-off">
                  <MetaCompactTable
                    columns={[
                      { key: 'label', header: 'Hạn' },
                      { key: 'value', header: 'Ngày giờ' },
                    ]}
                    rows={toRows(cutoffs)}
                    emptyLabel="—"
                  />
                </MetaShipmentSection>
                <MetaShipmentSection icon={MapPin} title="Cảng & tuyến">
                  <MetaCompactTable
                    columns={[
                      { key: 'label', header: 'Mục' },
                      { key: 'value', header: 'Giá trị', isWrapping: true },
                    ]}
                    rows={toRows(route)}
                    emptyLabel="—"
                  />
                </MetaShipmentSection>
                <Text size="sm" color="secondary">
                  Giờ theo giờ địa phương của cảng, như hãng tàu công bố.
                </Text>
              </VStack>
            </LayoutContent>
          }
          footer={
            <LayoutFooter padding={4}>
              <HStack hAlign="end">
                <Button label="Đóng" variant="secondary" size="lg" onClick={onClose} />
              </HStack>
            </LayoutFooter>
          }
        />
      </Drawer>
    </MetaThemeProvider>
  );
}

const styles = stylex.create({
  surface: {
    backgroundColor: 'var(--color-background-surface)',
    borderRadius: 0,
    boxShadow: 'var(--meta-shadow-drawer)',
  },
  layout: {
    height: '100%',
  },
  canvas: {
    backgroundColor: 'var(--meta-row-hover)',
  },
});
