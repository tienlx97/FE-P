'use client';

import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { MultiSelector } from '@astryxdesign/core/MultiSelector';
import { Selector } from '@astryxdesign/core/Selector';
import { StackItem } from '@astryxdesign/core/Stack';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { ArrowRight, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { MetaPill, MetaSchedule } from '@/shared/components/custom/meta/index.js';
import { todayIsoDate } from '@/shared/config/date-input-format.js';

import {
  BOOKING_STATES,
  bookingState,
  carrierOptions,
  carrierSelectionLabel,
  carriersToSearch,
  carrierTone,
  localNow,
  portOptions,
  sailingId,
  scheduleCarriers,
  scheduleItems,
  visibleRange,
} from '../config/vessel-schedule.js';
import { findVietnamCountry } from '../config/vietnam-country.js';
import { useCarrierAdaptersQuery } from '../hooks/use-carrier-adapters-query.js';
import { useCarrierSchedulesQueries } from '../hooks/use-carrier-schedules-queries.js';
import { useCountriesQuery } from '../hooks/use-countries-query.js';
import { usePortsQuery } from '../hooks/use-ports-query.js';
import { PortSearchSelector } from './port-search-selector.jsx';
import { VesselSailingDrawer } from './vessel-sailing-drawer.jsx';
import { VesselSailingPreview } from './vessel-sailing-preview.jsx';

/**
 * @typedef {{
 *   pol: string,
 *   pod: string,
 *   carriers: import('../types/index.js').ShippingCarrier[],
 * }} ScheduleSearch
 */

/**
 * @typedef {{
 *   carrier: import('../types/index.js').ShippingCarrier,
 *   sailing: import('../types/index.js').CarrierSailing,
 * }} SailingEntry
 */

/**
 * "Lịch tàu": POL (Vietnamese ports, selector), POD (any port, a selector
 * that searches on the server) and one or more carriers (none checked =
 * "Tất cả hãng", every carrier whose vessel schedule is connected), then
 * "Tìm". Ports are sent as UN/LOCODE; the BE maps them to
 * each carrier's codes (BE-kt-xnk `add-carrier-schedules`). Sailings sit on
 * their ETD in the same calendar as `/logistics` (`MetaSchedule`), tagged
 * `[HÃNG TÀU] - [TÊN TÀU] / [SỐ CHUYẾN]`; hovering shows ETD / ETA / CY,
 * clicking opens every detail in a drawer.
 */
export function VesselScheduleWorkspace() {
  const today = todayIsoDate();
  const [polCode, setPolCode] = useState('');
  const [pod, setPod] = useState(/** @type {{ code: string, name: string } | null} */ (null));
  const [carrierCodes, setCarrierCodes] = useState(/** @type {string[]} */ ([]));
  const [search, setSearch] = useState(/** @type {ScheduleSearch | null} */ (null));
  const [view, setView] = useState(
    /** @type {import('@/shared/components/custom/meta/schedule.jsx').MetaScheduleView} */ ('month'),
  );
  const [anchor, setAnchor] = useState(today);
  const [selectedId, setSelectedId] = useState(/** @type {string | null} */ (null));

  const adaptersQuery = useCarrierAdaptersQuery();
  const adapters = useMemo(
    () => (adaptersQuery.data?.success ? adaptersQuery.data.carriers : []),
    [adaptersQuery.data],
  );
  const allCarriers = useMemo(() => adapters.map((adapter) => adapter.carrier), [adapters]);
  const connectedCount = useMemo(() => scheduleCarriers(adapters).length, [adapters]);

  const countriesQuery = useCountriesQuery();
  const countries = countriesQuery.data?.success ? countriesQuery.data.countries : [];
  const vietnamId = findVietnamCountry(countries)?.id ?? '';
  const polPortsQuery = usePortsQuery({ countryId: vietnamId });
  const polOptions = useMemo(
    () => portOptions(polPortsQuery.data?.success ? polPortsQuery.data.ports : []),
    [polPortsQuery.data],
  );
  const podCode = pod?.code ?? '';

  const range = visibleRange(view, anchor);
  // To the minute, so the memo below recomputes at most once a minute.
  const now = localNow().slice(0, 16);
  const results = useCarrierSchedulesQueries({ search, ...range });
  // Skeletons while any searched carrier's sailings for this range are still loading.
  const isLoadingSailings = Boolean(search) && results.some((result) => result.isLoading);

  const entries = useMemo(() => {
    /** @type {Map<string, SailingEntry>} */
    const byId = new Map();
    (search?.carriers ?? []).forEach((carrier, index) => {
      const data = results[index]?.data;
      if (data?.success && data.search.status === 'Synced') {
        for (const sailing of data.search.sailings) {
          byId.set(sailingId(carrier.code, sailing), { carrier, sailing });
        }
      }
    });
    return byId;
  }, [results, search]);

  const items = useMemo(
    () =>
      scheduleItems(
        (search?.carriers ?? []).flatMap((carrier, index) => {
          const data = results[index]?.data;
          return data?.success && data.search.status === 'Synced'
            ? [{ carrier, sailings: data.search.sailings, tone: carrierTone(allCarriers, carrier.code) }]
            : [];
        }),
        now,
      ),
    [results, search, allCarriers, now],
  );

  const canSearch = Boolean(polCode && podCode) && adapters.length > 0;
  const selected = selectedId ? (entries.get(selectedId) ?? null) : null;

  return (
    <VStack gap={3} hAlign="stretch" height="100%">
      <HStack gap={3} vAlign="end" wrap="wrap" xstyle={styles.filters}>
        <StackItem size="fill" xstyle={styles.field}>
          <Selector
            label="POL — cảng xếp"
            placeholder="Chọn cảng Việt Nam"
            hasSearch
            searchPlaceholder="Mã hoặc tên cảng…"
            options={polOptions}
            value={polCode}
            onChange={(value) => setPolCode(value ?? '')}
            isLoading={polPortsQuery.isLoading}
            isDisabled={!vietnamId}
            disabledMessage='Danh mục nước chưa có "Việt Nam"'
            width="100%"
          />
        </StackItem>
        <HStack gap={1} vAlign="center" xstyle={styles.arrow}>
          <Icon icon={ArrowRight} size="sm" color="secondary" />
        </HStack>
        <StackItem size="fill" xstyle={styles.field}>
          {/* Any port worldwide (~17.5k): the selector searches on the server. */}
          <PortSearchSelector label="POD — cảng dỡ" placeholder="Chọn cảng dỡ" value={pod} onChange={setPod} />
        </StackItem>
        <MultiSelector
          label="Hãng tàu"
          placeholder="Tất cả hãng"
          options={carrierOptions(adapters)}
          value={carrierCodes}
          onChange={setCarrierCodes}
          triggerDisplay="labels"
          formatValue={(items) => carrierSelectionLabel(items, connectedCount)}
          hasClear
          isLoading={adaptersQuery.isLoading}
          width={240}
        />
        <Button
          label="Tìm"
          variant="primary"
          icon={<Icon icon={Search} size="sm" />}
          isDisabled={!canSearch}
          onClick={() => {
            setSelectedId(null);
            setSearch({ pol: polCode, pod: podCode, carriers: carriersToSearch(adapters, carrierCodes) });
          }}
        />
      </HStack>

      <StackItem size="fill">
        <MetaSchedule
          label="Lịch tàu theo tuyến"
          view={view}
          onViewChange={setView}
          anchor={anchor}
          onAnchorChange={setAnchor}
          today={today}
          items={items}
          isLoading={isLoadingSailings}
          onItemClick={(item) => setSelectedId(item.id)}
          renderItemPreview={(item) => {
            const entry = entries.get(item.id);
            return entry ? (
              <VesselSailingPreview carrier={entry.carrier} sailing={entry.sailing} tone={item.tone} now={now} />
            ) : null;
          }}
          headerStart={
            <HStack gap={2} vAlign="center" wrap="wrap">
              {!search ? (
                <MetaPill label="Chọn POL, POD rồi bấm Tìm" tone="neutral" size="sm" />
              ) : search.carriers.length === 0 ? (
                <MetaPill label="Chưa có hãng tàu nào kết nối lịch tàu" tone="neutral" size="sm" />
              ) : (
                <>
                  <MetaPill label={`${search.pol} → ${search.pod}`} tone="neutral" size="sm" />
                  {search.carriers.map((carrier, index) => {
                    const result = results[index];
                    if (!result || result.isPending) {
                      return <MetaPill key={carrier.code} label={`${carrier.name} · đang tải…`} tone="neutral" size="sm" />;
                    }
                    const data = result.data;
                    if (!data?.success || data.search.status !== 'Synced') {
                      const reason = !data ? 'lỗi' : data.success ? (data.search.error ?? data.search.status) : data.message;
                      return <MetaPill key={carrier.code} label={`${carrier.name}: ${reason}`} tone="danger" size="sm" hasDot />;
                    }
                    const unavailableCount = data.search.sailings.filter(
                      (sailing) => BOOKING_STATES[bookingState(sailing, now)].tone === 'danger',
                    ).length;
                    return (
                      <HStack key={carrier.code} gap={1} vAlign="center">
                        <MetaPill
                          label={`${carrier.name} · ${data.search.sailings.length} chuyến`}
                          tone={carrierTone(allCarriers, carrier.code)}
                          size="sm"
                          hasDot
                        />
                        {unavailableCount > 0 ? (
                          <MetaPill label={`${unavailableCount} không thể book`} tone="danger" size="sm" hasDot />
                        ) : null}
                      </HStack>
                    );
                  })}
                </>
              )}
            </HStack>
          }
        />
      </StackItem>

      {selected ? (
        <VesselSailingDrawer
          carrier={selected.carrier}
          sailing={selected.sailing}
          now={now}
          onClose={() => setSelectedId(null)}
        />
      ) : null}
    </VStack>
  );
}

const styles = stylex.create({
  filters: {
    backgroundColor: 'var(--color-background-card)',
    borderColor: 'var(--color-border)',
    borderRadius: 'var(--radius-container)',
    borderStyle: 'solid',
    borderWidth: 'var(--border-width)',
    padding: 'var(--spacing-4)',
  },
  field: {
    minWidth: '14rem',
  },
  arrow: {
    paddingBlockEnd: 'var(--spacing-2)',
  },
});
