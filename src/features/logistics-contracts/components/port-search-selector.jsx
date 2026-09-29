'use client';

import { ComplexSelector } from '@astryxdesign/core/ComplexSelector';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Text } from '@astryxdesign/core/Text';
import { TreeList } from '@astryxdesign/core/TreeList';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { Search } from 'lucide-react';
import { useEffect, useId, useMemo, useState } from 'react';

import { TextInput } from '@/shared/components/text-input.jsx';

import { parseRecentPorts, portSearchConditions, withRecentPort } from '../config/vessel-schedule.js';
import { usePortPagesQuery } from '../hooks/use-ports-query.js';

const SEARCH_DEBOUNCE_MS = 250;
const PAGE_SIZE = 50;
/** Load the next page when the list is scrolled this close to its end (px). */
const LOAD_MORE_THRESHOLD = 96;
/** Per-viewer convenience only (browser storage may be unavailable). */
const RECENT_STORAGE_KEY = 'kt-xnk.vessel-schedule.recent-pods';

const styles = stylex.create({
  panel: (width) => ({
    width,
  }),
  results: {
    maxHeight: '20rem',
    overflowY: 'auto',
  },
});

/** @typedef {{ code: string, name: string }} PickedPort */

function readRecentPorts() {
  try {
    return parseRecentPorts(window.localStorage.getItem(RECENT_STORAGE_KEY));
  } catch {
    return [];
  }
}

/** @param {PickedPort[]} ports */
function writeRecentPorts(ports) {
  try {
    window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(ports));
  } catch {
    // Private window / blocked storage: the list is just not remembered.
  }
}

/** @param {PickedPort} port */
const portLabel = (port) => `${port.code} — ${port.name}`;

/**
 * Width of the element `id` (the selector field), so the popup lines up
 * with the trigger like a `Selector`'s; `fallback` until measured.
 * @param {string} id
 * @param {string} fallback
 */
function useElementWidth(id, fallback) {
  const [width, setWidth] = useState(fallback);

  useEffect(() => {
    const element = document.getElementById(id);
    if (!element || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(([entry]) => setWidth(`${Math.round(entry.contentRect.width)}px`));
    observer.observe(element);
    return () => observer.disconnect();
  }, [id]);

  return width;
}

/**
 * The popup, like a `Selector` with search: a search field, the recently
 * picked PODs, then the whole catalog (~17.5k UN/LOCODE ports) sorted by
 * code — loaded from the server a page at a time as the list scrolls, and
 * filtered on the server as you type.
 * @param {{
 *   value: PickedPort | null,
 *   recent: PickedPort[],
 *   width: string,
 *   onPick: (port: PickedPort) => void,
 * }} props
 */
function PortSearchPanel({ value, recent, width, onPick }) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const conditions = useMemo(() => portSearchConditions(debounced), [debounced]);
  const pagesQuery = usePortPagesQuery({ pageSize: PAGE_SIZE, conditions });
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = pagesQuery;

  /** @type {PickedPort[]} */
  const ports = useMemo(
    () =>
      (pagesQuery.data?.pages ?? []).flatMap((page) =>
        page.success
          ? page.ports
              .filter((port) => Boolean(port.code))
              .map((port) => ({ code: /** @type {string} */ (port.code), name: port.name }))
          : [],
      ),
    [pagesQuery.data],
  );
  const failure = pagesQuery.data?.pages.find((page) => !page.success);
  const showRecent = !debounced && recent.length > 0;

  /** @param {PickedPort[]} list @param {string} prefix */
  const toItems = (list, prefix) =>
    list.map((port) => ({
      id: `${prefix}:${port.code}`,
      label: portLabel(port),
      isSelected: port.code === value?.code,
      onClick: () => onPick(port),
    }));

  return (
    <VStack gap={2} xstyle={styles.panel(width)}>
      <TextInput
        label="Tìm cảng"
        isLabelHidden
        placeholder="Mã hoặc tên cảng: THLCH, Laem Chabang…"
        startIcon={Search}
        value={query}
        onChange={setQuery}
        hasClear
        hasAutoFocus
      />
      <VStack
        gap={2}
        hAlign="stretch"
        xstyle={styles.results}
        onScroll={(/** @type {import('react').UIEvent<HTMLElement>} */ event) => {
          const list = event.currentTarget;
          if (hasNextPage && !isFetchingNextPage && list.scrollHeight - list.scrollTop - list.clientHeight < LOAD_MORE_THRESHOLD) {
            fetchNextPage();
          }
        }}
      >
        {showRecent ? (
          <TreeList
            items={toItems(recent, 'recent')}
            density="compact"
            variant="noGuides"
            header={<Text type="supporting">Chọn gần đây</Text>}
          />
        ) : null}
        {pagesQuery.isLoading ? (
          <VStack gap={1} hAlign="stretch">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} height="var(--spacing-6)" radius={1} index={index} />
            ))}
          </VStack>
        ) : failure && !failure.success ? (
          <Text type="supporting">{failure.message}</Text>
        ) : ports.length === 0 ? (
          <Text type="supporting">Không tìm thấy cảng</Text>
        ) : (
          <TreeList
            items={toItems(ports, 'all')}
            density="compact"
            variant="noGuides"
            header={showRecent ? <Text type="supporting">Tất cả cảng</Text> : undefined}
          />
        )}
        {isFetchingNextPage ? <Skeleton height="var(--spacing-6)" radius={1} /> : null}
      </VStack>
    </VStack>
  );
}

/**
 * Picks one UN/LOCODE port of the whole catalog, used like the POL
 * `Selector` (list on open, search on top) — but the ~17.5k ports are paged
 * and searched on the server: a plain `Selector` renders every option at
 * once (measured 25 s to open on dev with all ports).
 * @param {{
 *   label: string,
 *   placeholder?: string,
 *   value: PickedPort | null,
 *   onChange: (port: PickedPort | null) => void,
 * }} props
 */
export function PortSearchSelector({ label, placeholder = 'Chọn cảng', value, onChange }) {
  const fieldId = useId();
  const width = useElementWidth(fieldId, '22rem');
  const [recent, setRecent] = useState(/** @type {PickedPort[]} */ ([]));
  // The popup stays mounted while closed; a new key per opening starts it
  // with an empty search, at the top of the list.
  const [opening, setOpening] = useState(0);

  return (
    <VStack id={fieldId} gap={0} hAlign="stretch">
      <ComplexSelector
        label={label}
        value={value}
        onChange={onChange}
        onOpenChange={(isOpen) => {
          // Read on open: stays in step with other tabs, and never runs on the server.
          if (isOpen) {
            setRecent(readRecentPorts());
            setOpening((count) => count + 1);
          }
        }}
        placeholder={placeholder}
        triggerLabel={value ? portLabel(value) : undefined}
        width="100%"
      >
        {(current, commit, close) => (
          <PortSearchPanel
            key={opening}
            value={current}
            recent={recent}
            width={width}
            onPick={(port) => {
              const next = withRecentPort(recent, port);
              setRecent(next);
              writeRecentPorts(next);
              commit(port);
              close();
            }}
          />
        )}
      </ComplexSelector>
    </VStack>
  );
}
