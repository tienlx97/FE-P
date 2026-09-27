'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Icon } from '@astryxdesign/core/Icon';
import {
  SegmentedControl,
  SegmentedControlItem,
} from '@astryxdesign/core/SegmentedControl';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { List } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
  MetaSchedule,
  MetaScheduleSwatch,
  MetaThemeProvider,
} from '@/shared/components/custom/meta/index.js';
import { todayIsoDate } from '@/shared/config/date-input-format.js';

import {
  filterEvents,
  needsAttention,
  OVERVIEW_CATEGORIES,
  overviewEvents,
  overviewFilters,
} from '../config/shipment-overview-schedule.js';
import { useShipmentOverviewQuery } from '../hooks/use-shipment-overview-query.js';
import { ShipmentOverviewDrawer } from './shipment-overview-drawer.jsx';

/** @typedef {import('../config/shipment-overview-schedule.js').OverviewFilter} OverviewFilter */

/**
 * `/logistics` home: every shipment in progress on the Meta schedule
 * (`MetaSchedule`), filling the page (the page itself does not scroll) —
 * read at a glance: each day lists what happens (departure, arrival,
 * cut-off, free-time end), the color says which kind (blue departs, green
 * arrives, amber deadline, red overdue) and the header filter doubles as
 * that color legend with counts. More detail opens in a drawer: "Lô hàng
 * (n)" lists them all, and clicking an item opens its shipment.
 */
export function ShipmentOverviewSchedule() {
  const query = useShipmentOverviewQuery();
  const today = todayIsoDate();
  const [view, setView] = useState(
    /** @type {import('@/shared/components/custom/meta/schedule.jsx').MetaScheduleView} */ ('month'),
  );
  const [anchor, setAnchor] = useState(today);
  const [filter, setFilter] = useState(/** @type {OverviewFilter} */ ('all'));
  const [drawer, setDrawer] = useState(
    /** @type {null | { shipmentId: string | null }} */ (null),
  );

  const rows = useMemo(
    () => (query.data?.success ? query.data.shipments : []),
    [query.data],
  );
  const events = useMemo(() => overviewEvents(rows, today), [rows, today]);
  const items = useMemo(
    () =>
      filterEvents(events, filter).map((event) => ({
        id: event.id,
        date: event.start,
        title: event.title,
        tone: OVERVIEW_CATEGORIES[event.category].tone,
      })),
    [events, filter],
  );
  const attentionCount = rows.filter(needsAttention).length;

  if (query.isLoading) {
    return (
      <MetaThemeProvider>
        <Skeleton width="100%" height="100%" />
      </MetaThemeProvider>
    );
  }
  if (!query.data?.success) {
    return (
      <MetaThemeProvider>
        <Banner
          status="error"
          title={query.data?.message ?? 'Không thể tải các lô hàng đang làm'}
          container="card"
        />
      </MetaThemeProvider>
    );
  }

  const selected = drawer?.shipmentId
    ? (rows.find((row) => row.shipmentId === drawer.shipmentId) ?? null)
    : null;

  return (
    <MetaThemeProvider>
      <MetaSchedule
        label="Lịch các lô hàng đang làm"
        view={view}
        onViewChange={setView}
        anchor={anchor}
        onAnchorChange={setAnchor}
        today={today}
        items={items}
        onItemClick={(item) => {
          const event = events.find((candidate) => candidate.id === item.id);
          if (event) setDrawer({ shipmentId: event.shipmentId });
        }}
        headerStart={
          <SegmentedControl
            label="Lọc theo loại mốc (chú giải màu)"
            size="sm"
            value={filter}
            onChange={(value) => setFilter(/** @type {OverviewFilter} */ (value))}
          >
            {overviewFilters(events).map((option) => (
              <SegmentedControlItem
                key={option.key}
                value={option.key}
                label={`${option.label} ${option.count}`}
                icon={option.tone ? <MetaScheduleSwatch tone={option.tone} /> : undefined}
              />
            ))}
          </SegmentedControl>
        }
        headerEnd={
          <Button
            label={
              attentionCount > 0
                ? `Lô hàng (${rows.length}) · ${attentionCount} cần chú ý`
                : `Lô hàng (${rows.length})`
            }
            variant={attentionCount > 0 ? 'primary' : 'secondary'}
            size="sm"
            icon={<Icon icon={List} size="sm" />}
            onClick={() => setDrawer({ shipmentId: null })}
          />
        }
      />
      {drawer ? (
        <ShipmentOverviewDrawer
          rows={rows}
          selected={selected}
          onSelect={(shipmentId) => setDrawer({ shipmentId })}
          onBack={() => setDrawer({ shipmentId: null })}
          onClose={() => setDrawer(null)}
        />
      ) : null}
    </MetaThemeProvider>
  );
}
