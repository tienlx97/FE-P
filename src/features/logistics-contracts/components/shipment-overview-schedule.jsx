'use client';

import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import {
  createEventFromISO,
  createScheduleListView,
  createScheduleMonthlyView,
  createScheduleWeeklyView,
  Schedule,
  useSchedulePaginationPlugin,
  useScheduleViewSelectorPlugin,
} from '@astryxdesign/lab';
import * as stylex from '@stylexjs/stylex';
import { List } from 'lucide-react';
import { useMemo, useState } from 'react';

import { todayIsoDate } from '@/shared/config/date-input-format.js';

import {
  needsAttention,
  OVERVIEW_CATEGORIES,
  overviewEvents,
  shipmentFromEventText,
} from '../config/shipment-overview-schedule.js';
import { useShipmentOverviewQuery } from '../hooks/use-shipment-overview-query.js';
import { ShipmentOverviewDrawer } from './shipment-overview-drawer.jsx';

/** Shipment dates are business days in Vietnam (like the backend). */
const TIMEZONE = 'Asia/Ho_Chi_Minh';

/** How many levels above the clicked node an event's text is looked for. */
const EVENT_TEXT_DEPTH = 4;

/** Schedule matches an event's `category` to a category by its label. */
const CATEGORIES = Object.values(OVERVIEW_CATEGORIES);

/**
 * `/logistics` home: every shipment in progress on the Astryx lab
 * `Schedule`, filling the page (the page itself does not scroll). A bar =
 * departure → arrival, plus cut-off and free-time deadlines. More detail
 * opens in a drawer: "Lô hàng (n)" in the schedule header lists them all,
 * and clicking an event opens its shipment.
 */
export function ShipmentOverviewSchedule() {
  const query = useShipmentOverviewQuery();
  const views = useMemo(
    // The three views take different options; the selector just switches.
    /** @returns {Record<'month' | 'week' | 'list', import('@astryxdesign/lab').ScheduleView<any>>} */
    () => ({
      month: createScheduleMonthlyView({ weekStartsOn: 1 }),
      week: createScheduleWeeklyView({ weekStartsOn: 1 }),
      list: createScheduleListView({ days: 14 }),
    }),
    [],
  );
  const [view, setView] = useState(views.month);
  const [date, setDate] = useState(() => Date.now());
  const [drawer, setDrawer] = useState(
    /** @type {null | { shipmentId: string | null }} */ (null),
  );

  const rows = useMemo(
    () => (query.data?.success ? query.data.shipments : []),
    [query.data],
  );
  const events = useMemo(
    () =>
      overviewEvents(rows, todayIsoDate()).map((event) =>
        createEventFromISO({
          id: event.id,
          title: event.title,
          category: OVERVIEW_CATEGORIES[event.category].label,
          start: event.start,
          end: event.end,
        }),
      ),
    [rows],
  );
  const attentionCount = rows.filter(needsAttention).length;

  const pagination = useSchedulePaginationPlugin();
  const viewSelector = useScheduleViewSelectorPlugin(
    [
      { view: views.month, label: 'Tháng' },
      { view: views.week, label: 'Tuần' },
      { view: views.list, label: '2 tuần' },
    ],
    { onChangeView: setView },
  );
  /** @type {import('@astryxdesign/lab').SchedulePlugin} */
  const shipmentsButton = {
    renderHeader: (startContent, centerContent, endContent) => ({
      startContent,
      centerContent,
      endContent: (
        <HStack gap={2} vAlign="center">
          {endContent}
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
        </HStack>
      ),
    }),
  };

  /** Events carry no handler: find the shipment from the clicked text. */
  const handleClick = (/** @type {import('react').MouseEvent<HTMLDivElement>} */ event) => {
    let node = /** @type {Element | null} */ (event.target instanceof Element ? event.target : null);
    for (let depth = 0; node && depth < EVENT_TEXT_DEPTH; depth += 1, node = node.parentElement) {
      const text = node.textContent?.trim() ?? '';
      const shipment = shipmentFromEventText(text, rows);
      if (shipment && text.startsWith(shipment.shipmentCode)) {
        setDrawer({ shipmentId: shipment.shipmentId });
        return;
      }
    }
  };

  if (query.isLoading) {
    return <Skeleton width="100%" height="100%" />;
  }
  if (!query.data?.success) {
    return (
      <Banner
        status="error"
        title={query.data?.message ?? 'Không thể tải các lô hàng đang làm'}
        container="card"
      />
    );
  }

  const selected = drawer?.shipmentId
    ? (rows.find((row) => row.shipmentId === drawer.shipmentId) ?? null)
    : null;

  return (
    <>
      <Schedule
        view={view}
        events={events}
        categories={CATEGORIES}
        date={date}
        onChangeDate={setDate}
        timezoneID={TIMEZONE}
        plugins={[pagination, viewSelector, shipmentsButton]}
        headingLevel={2}
        onClick={handleClick}
        xstyle={styles.schedule}
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
    </>
  );
}

const styles = stylex.create({
  schedule: {
    height: '100%',
    width: '100%',
  },
});
