'use client';

import { Grid } from '@astryxdesign/core/Grid';
import { HStack } from '@astryxdesign/core/HStack';
import { StackItem } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { Token } from '@astryxdesign/core/Token';
import { VStack } from '@astryxdesign/core/VStack';
import {
  createScheduleListView,
  createScheduleMonthlyView,
  createScheduleWeeklyView,
  Schedule,
  useSchedulePaginationPlugin,
  useScheduleViewSelectorPlugin,
} from '@astryxdesign/lab';
import * as stylex from '@stylexjs/stylex';
import { useCallback, useMemo, useState } from 'react';

import { searchCarrierSchedules } from '../api/carrier-schedules.js';
import {
  carrierCategories,
  portQueryValue,
  sailingEvents,
  SCHEDULE_TIMEZONE,
  scheduleCarriers,
  searchWindows,
} from '../config/vessel-schedule.js';
import { useCarrierAdaptersQuery } from '../hooks/use-carrier-adapters-query.js';
import { PortTypeahead } from './port-typeahead.jsx';

const styles = stylex.create({
  schedule: {
    height: '100%',
    minHeight: 0,
  },
});

/** @type {ReadonlyArray<import('@astryxdesign/lab').ScheduleViewSelectorOption<import('@astryxdesign/lab').ScheduleView<any>>>} */
const VIEWS = [
  { label: 'Tháng', view: createScheduleMonthlyView({ weekStartsOn: 1 }) },
  { label: 'Tuần', view: createScheduleWeeklyView({ weekStartsOn: 1 }) },
  { label: 'Danh sách', view: createScheduleListView({ days: 42 }) },
];

/**
 * @typedef {{
 *   carrier: import('../types/index.js').ShippingCarrier,
 *   count: number,
 *   problem: string | null,
 * }} CarrierOutcome
 */

/**
 * One carrier's sailings over the visible range (one call per ≤ 62-day
 * window). Never throws: a failure becomes `problem`, so one carrier being
 * blocked never hides the others.
 * @param {import('../types/index.js').ShippingCarrier} carrier
 * @param {string} pol
 * @param {string} pod
 * @param {Array<{ from: string, to: string }>} windows
 */
async function loadCarrier(carrier, pol, pod, windows) {
  /** @type {import('../types/index.js').CarrierSailing[]} */
  const sailings = [];
  for (const window of windows) {
    const result = await searchCarrierSchedules({ carrier: carrier.code, pol, pod, ...window });
    if (!result.success) {
      return { carrier, sailings, problem: result.message };
    }
    if (result.search.status !== 'Synced') {
      return { carrier, sailings, problem: result.search.error ?? result.search.status };
    }
    sailings.push(...result.search.sailings);
  }
  return { carrier, sailings, problem: null };
}

/**
 * "Lịch tàu": pick POL and POD, then every carrier whose vessel schedule is
 * connected (BE-kt-xnk `add-carrier-schedules`) fills the calendar; each
 * sailing sits on its ETD, tagged `[HÃNG TÀU] - [TÊN TÀU] / [SỐ CHUYẾN]`.
 * Paging months asks the BE for the new range (it caches carrier months).
 */
export function VesselScheduleWorkspace() {
  const [pol, setPol] = useState(/** @type {import('./port-typeahead.jsx').PortItem | null} */ (null));
  const [pod, setPod] = useState(/** @type {import('./port-typeahead.jsx').PortItem | null} */ (null));
  const [date, setDate] = useState(() => Date.now());
  const [view, setView] = useState(VIEWS[0].view);
  const [outcomes, setOutcomes] = useState(/** @type {CarrierOutcome[]} */ ([]));

  const adaptersQuery = useCarrierAdaptersQuery();
  const carriers = useMemo(
    () => (adaptersQuery.data?.success ? scheduleCarriers(adaptersQuery.data.carriers) : []),
    [adaptersQuery.data],
  );
  const categories = useMemo(() => carrierCategories(carriers), [carriers]);

  const polValue = portQueryValue(pol?.auxiliaryData ?? null);
  const podValue = portQueryValue(pod?.auxiliaryData ?? null);

  const loadEvents = useCallback(
    async (/** @type {number} */ start, /** @type {number} */ end) => {
      if (!polValue || !podValue || carriers.length === 0) {
        return [];
      }
      const windows = searchWindows(start, end);
      const results = await Promise.all(
        carriers.map((carrier) => loadCarrier(carrier, polValue, podValue, windows)),
      );
      setOutcomes(
        results.map(({ carrier, sailings, problem }) => ({ carrier, count: sailings.length, problem })),
      );
      return results.flatMap(({ carrier, sailings }) => sailingEvents(carrier, sailings));
    },
    [carriers, polValue, podValue],
  );

  const plugins = [
    useSchedulePaginationPlugin(),
    useScheduleViewSelectorPlugin(VIEWS, { onChangeView: setView }),
  ];

  const hasRoute = Boolean(polValue && podValue);

  return (
    <VStack gap={3} hAlign="stretch" height="100%">
      <Grid columns={{ minWidth: 280, max: 2, repeat: 'fit' }} gap={3}>
        <PortTypeahead
          label="POL — cảng xếp"
          placeholder="Nhập mã / tên cảng, ví dụ VNSGN, Hai Phong"
          value={pol}
          onChange={setPol}
        />
        <PortTypeahead
          label="POD — cảng dỡ"
          placeholder="Nhập mã / tên cảng, ví dụ THBKK, Laem Chabang"
          value={pod}
          onChange={setPod}
        />
      </Grid>

      <HStack gap={2} vAlign="center" wrap="wrap">
        {!adaptersQuery.isPending && carriers.length === 0 ? (
          <Text color="secondary" type="supporting">
            Chưa có hãng tàu nào kết nối lịch tàu.
          </Text>
        ) : !hasRoute ? (
          <Text color="secondary" type="supporting">
            Chọn POL và POD để xem lịch tàu của{' '}
            {carriers.map((carrier) => carrier.name).join(', ') || 'các hãng'}.
          </Text>
        ) : (
          outcomes.map(({ carrier, count, problem }, index) =>
            problem ? (
              <Token key={carrier.code} color="red" label={`${carrier.name}: ${problem}`} />
            ) : (
              <Token
                key={carrier.code}
                color={categories[index]?.color ?? 'default'}
                label={`${carrier.name} · ${count} chuyến`}
              />
            ),
          )
        )}
      </HStack>

      <StackItem size="fill">
        <Schedule
          xstyle={styles.schedule}
          view={view}
          events={loadEvents}
          categories={categories}
          date={date}
          onChangeDate={setDate}
          timezoneID={SCHEDULE_TIMEZONE}
          plugins={plugins}
          headingLevel={2}
        />
      </StackItem>
    </VStack>
  );
}
