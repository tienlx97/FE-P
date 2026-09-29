'use client';

import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Selector } from '@astryxdesign/core/Selector';
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
import { Search } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { searchCarrierSchedules } from '../api/carrier-schedules.js';
import {
  ALL_CARRIERS,
  carrierCategories,
  carrierOptions,
  carriersToSearch,
  portQueryValue,
  sailingEvents,
  SCHEDULE_TIMEZONE,
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
 * @typedef {{
 *   pol: string,
 *   pod: string,
 *   carriers: import('../types/index.js').ShippingCarrier[],
 * }} ScheduleSearch
 */

/**
 * One carrier's sailings over the visible range (one call per ≤ 62-day
 * window). Never throws: a failure becomes `problem`, so one carrier being
 * blocked never hides the others.
 * @param {import('../types/index.js').ShippingCarrier} carrier
 * @param {string} pol - UN/LOCODE
 * @param {string} pod - UN/LOCODE
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
 * "Lịch tàu": pick POL and POD by UN/LOCODE and a carrier ("Tất cả hãng" =
 * every carrier whose vessel schedule is connected), then "Tìm". The BE
 * maps the UN/LOCODEs to each carrier's own codes (BE-kt-xnk
 * `add-carrier-schedules`). Each sailing sits on its ETD, tagged
 * `[HÃNG TÀU] - [TÊN TÀU] / [SỐ CHUYẾN]`; paging months asks the BE for the
 * new range of the same search.
 */
export function VesselScheduleWorkspace() {
  const [pol, setPol] = useState(/** @type {import('./port-typeahead.jsx').PortItem | null} */ (null));
  const [pod, setPod] = useState(/** @type {import('./port-typeahead.jsx').PortItem | null} */ (null));
  const [carrierChoice, setCarrierChoice] = useState(ALL_CARRIERS);
  const [search, setSearch] = useState(/** @type {ScheduleSearch | null} */ (null));
  const [date, setDate] = useState(() => Date.now());
  const [view, setView] = useState(VIEWS[0].view);
  const [outcomes, setOutcomes] = useState(/** @type {CarrierOutcome[]} */ ([]));

  const adaptersQuery = useCarrierAdaptersQuery();
  const adapters = useMemo(
    () => (adaptersQuery.data?.success ? adaptersQuery.data.carriers : []),
    [adaptersQuery.data],
  );
  // Colours over every carrier, so a carrier keeps its colour whatever is chosen.
  const categories = useMemo(() => carrierCategories(adapters.map((adapter) => adapter.carrier)), [adapters]);
  const colorOf = (/** @type {string} */ name) =>
    categories.find((category) => category.label === name)?.color ?? 'default';

  const polCode = portQueryValue(pol?.auxiliaryData);
  const podCode = portQueryValue(pod?.auxiliaryData);
  const canSearch = Boolean(polCode && podCode) && adapters.length > 0;

  const runSearch = () => {
    setOutcomes([]);
    // A new object also re-runs an unchanged search ("Tìm" again).
    setSearch({ pol: polCode, pod: podCode, carriers: carriersToSearch(adapters, carrierChoice) });
  };

  const loadEvents = useCallback(
    async (/** @type {number} */ start, /** @type {number} */ end) => {
      if (!search || search.carriers.length === 0) {
        return [];
      }
      const windows = searchWindows(start, end);
      const results = await Promise.all(
        search.carriers.map((carrier) => loadCarrier(carrier, search.pol, search.pod, windows)),
      );
      setOutcomes(
        results.map(({ carrier, sailings, problem }) => ({ carrier, count: sailings.length, problem })),
      );
      return results.flatMap(({ carrier, sailings }) => sailingEvents(carrier, sailings));
    },
    [search],
  );

  const plugins = [
    useSchedulePaginationPlugin(),
    useScheduleViewSelectorPlugin(VIEWS, { onChangeView: setView }),
  ];

  return (
    <VStack gap={3} hAlign="stretch" height="100%">
      <HStack gap={3} vAlign="end" wrap="wrap">
        <StackItem size="fill">
          <PortTypeahead
            label="POL — cảng xếp (UN/LOCODE)"
            placeholder="VNSGN, VNHPH, Cát Lái…"
            value={pol}
            onChange={setPol}
          />
        </StackItem>
        <StackItem size="fill">
          <PortTypeahead
            label="POD — cảng dỡ (UN/LOCODE)"
            placeholder="THBKK, THLCH, Laem Chabang…"
            value={pod}
            onChange={setPod}
          />
        </StackItem>
        <Selector
          label="Hãng tàu"
          options={carrierOptions(adapters)}
          value={carrierChoice}
          onChange={(value) => setCarrierChoice(value ?? ALL_CARRIERS)}
          isDisabled={adapters.length === 0}
          width={220}
        />
        <Button
          label="Tìm"
          variant="primary"
          icon={<Icon icon={Search} size="sm" />}
          isDisabled={!canSearch}
          onClick={runSearch}
        />
      </HStack>

      <HStack gap={2} vAlign="center" wrap="wrap">
        {!search ? (
          <Text color="secondary" type="supporting">
            Chọn POL, POD (mã UN/LOCODE) và hãng tàu rồi bấm Tìm.
          </Text>
        ) : search.carriers.length === 0 ? (
          <Text color="secondary" type="supporting">
            Chưa có hãng tàu nào kết nối lịch tàu.
          </Text>
        ) : (
          outcomes.map(({ carrier, count, problem }) =>
            problem ? (
              <Token key={carrier.code} color="red" label={`${carrier.name}: ${problem}`} />
            ) : (
              <Token key={carrier.code} color={colorOf(carrier.name)} label={`${carrier.name} · ${count} chuyến`} />
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
