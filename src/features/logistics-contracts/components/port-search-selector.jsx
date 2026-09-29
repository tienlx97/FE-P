'use client';

import { ComplexSelector } from '@astryxdesign/core/ComplexSelector';
import { Text } from '@astryxdesign/core/Text';
import { TreeList } from '@astryxdesign/core/TreeList';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { TextInput } from '@/shared/components/text-input.jsx';

import {
  parseRecentPorts,
  PORT_SEARCH_MIN_LENGTH,
  portSearchConditions,
  withRecentPort,
} from '../config/vessel-schedule.js';
import { useSearchPortsQuery } from '../hooks/use-ports-query.js';

const SEARCH_DEBOUNCE_MS = 250;
const MAX_RESULTS = 30;
/** Per-viewer convenience only (browser storage may be unavailable). */
const RECENT_STORAGE_KEY = 'kt-xnk.vessel-schedule.recent-pods';

const styles = stylex.create({
  panel: {
    width: '22rem',
  },
  results: {
    maxHeight: '18rem',
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
 * The popup: a search field over the whole catalog (~17.5k UN/LOCODE ports,
 * searched on the server) and, before typing, the recently picked PODs.
 * @param {{
 *   value: PickedPort | null,
 *   recent: PickedPort[],
 *   onPick: (port: PickedPort) => void,
 * }} props
 */
function PortSearchPanel({ value, recent, onPick }) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const isSearching = debounced.length >= PORT_SEARCH_MIN_LENGTH;
  const conditions = useMemo(() => portSearchConditions(debounced), [debounced]);
  const searchQuery = useSearchPortsQuery({ page: 1, pageSize: MAX_RESULTS, conditions, enabled: isSearching });

  /** @type {PickedPort[]} */
  const found = useMemo(
    () =>
      isSearching && searchQuery.data?.success
        ? searchQuery.data.ports
            .filter((port) => Boolean(port.code))
            .map((port) => ({ code: /** @type {string} */ (port.code), name: port.name }))
        : [],
    [isSearching, searchQuery.data],
  );
  const ports = isSearching ? found : recent;

  const items = ports.map((port) => ({
    id: port.code,
    label: portLabel(port),
    isSelected: port.code === value?.code,
    onClick: () => onPick(port),
  }));

  const status = isSearching
    ? searchQuery.isFetching && found.length === 0
      ? 'Đang tìm…'
      : searchQuery.data && !searchQuery.data.success
        ? searchQuery.data.message
        : found.length === 0
          ? 'Không tìm thấy cảng'
          : null
    : recent.length === 0
      ? `Gõ ít nhất ${PORT_SEARCH_MIN_LENGTH} ký tự mã hoặc tên cảng`
      : null;

  return (
    <VStack gap={2} xstyle={styles.panel}>
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
      {status ? (
        <Text type="supporting" color="secondary">
          {status}
        </Text>
      ) : null}
      {items.length > 0 ? (
        <TreeList
          items={items}
          density="compact"
          variant="noGuides"
          header={
            isSearching ? undefined : (
              <Text type="supporting" color="secondary">
                Chọn gần đây
              </Text>
            )
          }
          xstyle={styles.results}
        />
      ) : null}
    </VStack>
  );
}

/**
 * Picks one UN/LOCODE port of the whole catalog in a selector: the popup
 * searches on the server as you type (a plain `Selector` would have to load
 * and render all ~17.5k ports) and lists the recently picked ones first.
 * @param {{
 *   label: string,
 *   placeholder?: string,
 *   value: PickedPort | null,
 *   onChange: (port: PickedPort | null) => void,
 * }} props
 */
export function PortSearchSelector({ label, placeholder = 'Chọn cảng', value, onChange }) {
  const [recent, setRecent] = useState(/** @type {PickedPort[]} */ ([]));
  // The popup stays mounted while closed; a new key per opening starts it
  // with an empty search, so the recent PODs show first.
  const [opening, setOpening] = useState(0);

  return (
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
  );
}
