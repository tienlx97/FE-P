'use client';

import { Typeahead } from '@astryxdesign/core/Typeahead';
import { useMemo } from 'react';

import { searchPorts } from '../api/ports.js';

const SEARCH_DEBOUNCE_MS = 250;
const MAX_RESULTS = 20;

/**
 * @typedef {import('@astryxdesign/core/Typeahead').SearchableItem<{
 *   code: string,
 *   name: string,
 * }>} PortItem
 */

/**
 * A catalog port as a typeahead item, UN/LOCODE first: "VNCLI — Cát Lái".
 * @param {import('../types/index.js').Port & { code: string }} port
 * @returns {PortItem}
 */
function toItem(port) {
  return {
    id: port.id,
    label: `${port.code} — ${port.name}`,
    auxiliaryData: { code: port.code, name: port.name },
  };
}

/**
 * Picks one UN/LOCODE port of the catalog (~17.5k) by typing part of its
 * code, name or full name (`POST /ports/search`). Facilities without a
 * UN/LOCODE are left out: the vessel schedule is looked up by UN/LOCODE.
 * @param {{
 *   label: string,
 *   placeholder?: string,
 *   value: PortItem | null,
 *   onChange: (item: PortItem | null) => void,
 * }} props
 */
export function PortTypeahead({ label, placeholder, value, onChange }) {
  /** @type {import('@astryxdesign/core/Typeahead').SearchSource<PortItem>} */
  const searchSource = useMemo(() => {
    let latest = 0;

    return {
      async search(query) {
        const version = ++latest;
        const text = query.trim();
        const result = await searchPorts({
          page: 1,
          pageSize: MAX_RESULTS,
          conditions: ['code', 'name', 'fullName'].map((field, index) => ({
            id: field,
            field,
            operator: 'Contains',
            value: text,
            valueTo: '',
            connector: index === 0 ? 'And' : 'Or',
          })),
        });
        if (version !== latest || !result.success) {
          return [];
        }
        return result.ports
          .filter((port) => Boolean(port.code))
          .map((port) => toItem(/** @type {import('../types/index.js').Port & { code: string }} */ (port)));
      },
      bootstrap() {
        return [];
      },
      cancel() {
        latest++;
      },
    };
  }, []);

  return (
    <Typeahead
      label={label}
      placeholder={placeholder}
      searchSource={searchSource}
      value={value}
      onChange={onChange}
      debounceMs={SEARCH_DEBOUNCE_MS}
      minQueryLength={2}
      maxMenuItems={MAX_RESULTS}
      emptySearchResultsText="Không tìm thấy cảng"
      width="100%"
    />
  );
}
