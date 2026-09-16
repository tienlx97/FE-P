'use client';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { DropdownMenu } from '@astryxdesign/core/DropdownMenu';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import {
  Layout,
  LayoutContent,
  LayoutFooter,
  LayoutHeader,
} from '@astryxdesign/core/Layout';
import { PowerSearch, usePowerSearchConfig } from '@astryxdesign/core/PowerSearch';
import {
  SegmentedControl,
  SegmentedControlItem,
} from '@astryxdesign/core/SegmentedControl';
import { Selector } from '@astryxdesign/core/Selector';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { StackItem } from '@astryxdesign/core/Stack';
import {
  toSearchFilters,
  useTableColumnSettingsState,
  useTableFiltering,
  useTableFilterState,
} from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { colorVars, spacingVars } from '@astryxdesign/core/theme/tokens.stylex';
import { Toolbar } from '@astryxdesign/core/Toolbar';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { Download, FileSpreadsheet, Printer } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';

import { IconRefresh } from '@/shared/components/icon/icon-refresh.jsx';
import {
  stickyColumnKeys,
  TableViewOptionsPopover,
} from '@/shared/components/table-view-options-popover.jsx';
import { usePersistedTableViewOptions } from '@/shared/hooks/use-persisted-table-view-options.js';

import { AdvanceTablePagination } from './advance-table-pagination.jsx';
import { AdvanceTableSearchDialog } from './advance-table-search-dialog.jsx';
import { TanStackDataTable } from './tanstack-data-table.jsx';

/**
 * `TableColumn` plus an optional export override — see
 * `buildExportTable`'s doc comment below for when a column needs one
 * (enum codes, nested objects, combined display fields) versus falling
 * back to the raw `row[key]` dump. Used by Excel, CSV and print export.
 * @template {Record<string, unknown>} T
 * @typedef {import('@astryxdesign/core/Table').TableColumn<T> & {
 *   exportValue?: (row: T) => string | number | null | undefined,
 *   sortField?: string,
 * }} AdvanceTableColumn
 */

// `sortField` above: the backend's wire field name for this column's `sort`
// (BE-kt-xnk's `SortRequest`) — only needed when it differs from both `key`
// and `filter` (e.g. `key: 'buyer'`/`filter: 'buyerCompanyName'` both name
// the same BE field, so neither needs it); `TanStackDataTable` falls back
// to `filter`, then `key`, when `sortField` is omitted.

// So Excel opens an exported CSV as UTF-8 instead of guessing
// Windows-1252 and mangling every Vietnamese diacritic. Written as the
// escape sequence, not a literal BOM character — a real BOM byte in
// source trips ESLint's `no-irregular-whitespace` rule.
const CSV_BOM = String.fromCharCode(0xfeff);

/** @param {string} value */
function escapeCsvCell(value) {
  const needsQuoting = /[",\n\r]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuoting ? `"${escaped}"` : escaped;
}

/**
 * Strips Vietnamese diacritics and lowercases, so search matches
 * regardless of whether the user types with or without dấu — a common
 * complaint (2026-09-14) since Astryx's own `applyFilters`
 * (`usePowerSearchConfig.js`) only lowercases, never normalizes. NFD
 * decomposition strips combining marks (á, à, ả, ã, ạ, ...); `đ`/`Đ`
 * aren't decomposable that way (they're distinct base letters, not a
 * letter+diacritic), so they need an explicit replace.
 * @param {string} value
 */
function normalizeForSearch(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd');
}

/**
 * Wraps PowerSearch's `applyFilters` (from `usePowerSearchConfig`) with
 * diacritic-insensitive matching for string filters. Astryx's own
 * `matchesFilter` does a plain `s.toLowerCase().includes(t.toLowerCase())`
 * with no normalization, so it never matched "khach hang" typed without
 * dấu against "Khách hàng" data. Runs the real filter against a
 * same-shape clone with every string field (and every string filter
 * value) normalized, then maps matches back to the original row objects
 * by array position — a plain diacritic-preserving clone would come back
 * from `.filter()` by reference, so position-mapping (not re-deriving
 * fields) is what keeps the returned rows byte-identical to the input.
 * @template {Record<string, unknown>} T
 * @param {(filters: readonly unknown[], rows: T[]) => T[]} applyFiltersFn
 * @param {readonly unknown[]} filters
 * @param {T[]} rows
 * @returns {T[]}
 */
function applyFiltersDiacriticInsensitive(applyFiltersFn, filters, rows) {
  if (filters.length === 0) return [...rows];
  // Only fields targeted by a *string*-type filter get normalized on the
  // row clone below — an enum/entity/number/date filter's value is left
  // exact (not normalized, see the ternary below), so normalizing every
  // string field unconditionally made an enum "is" filter (e.g. "Khách
  // hàng") compare its exact-case value against a lowercased,
  // diacritic-stripped row field and never match (caught 2026-09-16,
  // once PowerSearch's field menu made enum fields reachable directly
  // instead of only through the advanced-filter dialog's own form).
  const stringFilterFields = new Set(
    filters
      .filter(
        (filter) => /** @type {any} */ (filter)?.value?.type === 'string',
      )
      .map((filter) => /** @type {any} */ (filter).field),
  );
  const normalizedFilters = filters.map((filter) => {
    const value = /** @type {any} */ (filter)?.value;
    return value?.type === 'string' && typeof value.value === 'string'
      ? {
          .../** @type {any} */ (filter),
          value: { ...value, value: normalizeForSearch(value.value) },
        }
      : filter;
  });
  const normalizedRows = rows.map((row, index) => {
    const normalized = /** @type {any} */ ({ __rowIndex: index });
    for (const [key, value] of Object.entries(row)) {
      normalized[key] =
        stringFilterFields.has(key) && typeof value === 'string'
          ? normalizeForSearch(value)
          : value;
    }
    return normalized;
  });
  const matched = applyFiltersFn(
    /** @type {any} */ (normalizedFilters),
    normalizedRows,
  );
  return matched.map((row) => rows[/** @type {any} */ (row).__rowIndex]);
}

/**
 * @typedef {Object} AdvanceTableQuickFilter
 * @property {string} field
 * @property {string} label
 * @property {string} placeholder
 * @property {ReadonlyArray<{ value: string, label?: string }>} options
 * @property {(option: { value: string, label?: string }) => string} renderValue
 * @property {boolean} [hasSearch] Shows a search input inside the dropdown —
 *   for fields whose option list is long enough (e.g. a customer catalog)
 *   that scrolling to find one isn't practical.
 */

/**
 * @typedef {Object} AdvanceTableAdvancedSearchField
 * @property {string} field
 * @property {string} label
 * @property {string} [placeholder]
 * @property {'string' | 'enum'} [type]
 * @property {ReadonlyArray<{ value: string, label?: string }>} [options] Required when type is 'enum'.
 */

/**
 * One quick-switch column preset — e.g. an operational default vs. a
 * financial-detail view — offered as a {@link SegmentedControl} in the
 * toolbar next to "Tuỳ chọn hiển thị". Selecting one just replaces the
 * active column set (same state the column picker itself edits), so a
 * visitor can still fine-tune from there afterward; the segmented control
 * doesn't track or enforce which preset (if any) the current column set
 * still matches.
 * @typedef {Object} AdvanceTableViewPreset
 * @property {string} key
 * @property {string} label
 * @property {string[]} columnKeys
 */

const styles = stylex.create({
  // Fills the StackItem it sits in rather than a fixed/expand-on-focus
  // width — the search bar claims the toolbar's full remaining width, same
  // as the reference table template.
  search: {
    width: '100%',
  },
  // Toolbar's start slot only stretches its own box to the row's full
  // width (see `startOnly` — it applies once `endContent` is unset); the
  // row inside it still defaults to shrink-to-fit like any flex item, so
  // this is what actually lets the StackItem(fill) search bar claim that
  // width.
  toolbarPrimary: {
    flexGrow: 1,
    minWidth: 0,
  },
  // Keeps the end cluster (view options, refresh, create) from shrinking
  // when the search bar next to it grows to fill the row.
  toolbarEnd: {
    flexShrink: 0,
    maxWidth: '100%',
    minWidth: 0,
  },
  searchSlot: {
    minWidth: 'min(100%, 16rem)',
  },
  filterRow: {
    rowGap: 6,
  },
  // Matches the search toolbar's own block/inline padding below it (see
  // Toolbar's `size="sm"` defaults) so the two rows line up edge-to-edge.
  titleRow: {
    paddingBlock: spacingVars['--spacing-2'],
    paddingInline: spacingVars['--spacing-4'],
  },
  // Fills the trigger once a quick filter is set, the same wash Selector's
  // own pressed/active state uses, so a set chip reads as "on" at a glance.
  filterFill: {
    backgroundColor: colorVars['--color-overlay-pressed'],
  },
  // Reads as the table's own footer row (bordered top, like a "Tổng cộng"
  // row) rather than a separate element floating below it — same divider
  // token `footer.jsx`'s top border uses.
  summary: {
    borderBlockStartColor: colorVars['--color-border'],
    borderBlockStartStyle: 'solid',
    borderBlockStartWidth: '1px',
    paddingBlock: spacingVars['--spacing-3'],
    paddingInline: spacingVars['--spacing-3'],
  },
});

/**
 * Shared list-page table shell: search + per-column filters + a "View
 * options" popover (columns / density / sticky columns) + optional quick
 * filter chips, wired to `TanStackDataTable` (TanStack Table v8; the
 * system's single table engine, Golden Rule #13), with a footer that's either a
 * plain row count or full pagination controls. Extracted from the Hợp đồng
 * (contracts) list so every list screen gets the same toolbar/table/footer
 * chrome instead of re-implementing it per feature.
 *
 * Search state (free-text filters, per-column header filters, quick filter
 * chips), column visibility/order, density, and sticky-column edges are all
 * owned internally — the caller only supplies column/row data and the
 * handful of callbacks that are genuinely page-specific (row expansion,
 * primary action, refresh, pagination).
 *
 * `title` is optional and opt-in: when given, it renders in its own row
 * above the search toolbar, alongside `primaryAction` and the In (print) /
 * Xuất (export) controls — per-page request to keep those three level with
 * the page heading instead of the search toolbar row. Omitting `title`
 * keeps the original layout (all three inline with search/view-options),
 * unchanged for every other caller.
 *
 * @template {Record<string, unknown>} T
 * @param {{
 *   title?: import('react').ReactNode,
 *   toolbarLabel: string,
 *   searchFieldDefs: ReadonlyArray<import('@astryxdesign/core/PowerSearch').FieldDefinition>,
 *   entityLabel: string,
 *   contentSearchFieldKey: string,
 *   searchPlaceholder: string,
 *   onContentSearchChange?: (value: string) => void,
 *   advancedSearchFields?: ReadonlyArray<AdvanceTableAdvancedSearchField>,
 *   filterFieldDefs?: ReadonlyArray<import('@/shared/components/advanced-filter-builder.jsx').AdvancedFilterFieldDef>,
 *   advancedFilterConditions?: ReadonlyArray<import('@/shared/components/advanced-filter-builder.jsx').AdvancedFilterCondition>,
 *   onAdvancedFilterChange?: (conditions: import('@/shared/components/advanced-filter-builder.jsx').AdvancedFilterCondition[]) => void,
 *   quickFilters?: ReadonlyArray<AdvanceTableQuickFilter>,
 *   columnOptions: ReadonlyArray<{ key: string, label: string, isAlwaysVisible?: boolean }>,
 *   initialColumnKeys?: string[],
 *   defaultColumnKeys?: string[],
 *   viewPresets?: ReadonlyArray<AdvanceTableViewPreset>,
 *   fixedEndColumnKeys?: string[],
 *   tableColumns: AdvanceTableColumn<T>[],
 *   headerGroups?: {id: string, label: string, columnKeys: string[]}[],
 *   data: T[],
 *   idKey: string,
 *   isLoading?: boolean,
 *   skeletonRows?: T[],
 *   rowExpansion?: {
 *     expandedIds: ReadonlySet<string>,
 *     onToggle: (id: string) => void,
 *     getRowKey: (row: T) => string,
 *     isExpandable?: (row: T) => boolean,
 *     renderExpanded: (row: T) => import('react').ReactNode,
 *   },
 *   fetchAllRows?: () => Promise<T[]>,
 *   primaryAction?: { label: string, onClick: () => void, icon?: import('react').ReactNode },
 *   onRefresh?: () => void,
 *   isRefreshing?: boolean,
 *   defaultStickyStart?: 'none' | 'one' | 'two',
 *   defaultStickyEnd?: 'none' | 'one' | 'two',
 *   totalsRows?: Partial<T>[],
 *   totalsRowLabel?: (row: any) => import('react').ReactNode,
 *   summary?: import('react').ReactNode,
 *   dividers?: import('@astryxdesign/core/Table').TableDividers,
 *   pagination?: {
 *     pageIndex: number,
 *     pageSize: number,
 *     totalCount: number,
 *     totalPages: number,
 *     onPageIndexChange: (pageIndex: number) => void,
 *     onPageSizeChange: (pageSize: number) => void,
 *     pageSizeOptions?: string[],
 *   },
 *   sort?: {field: string, direction: 'Ascending' | 'Descending'} | null,
 *   onSortChange?: (field: string | null, direction: 'Ascending' | 'Descending') => void,
 *   sortableColumnKeys?: readonly string[],
 * }} props
 */
export function AdvanceTable({
  title,
  toolbarLabel,
  searchFieldDefs,
  entityLabel,
  contentSearchFieldKey,
  searchPlaceholder,
  onContentSearchChange,
  advancedSearchFields,
  filterFieldDefs,
  advancedFilterConditions,
  onAdvancedFilterChange,
  quickFilters,
  columnOptions,
  initialColumnKeys,
  defaultColumnKeys,
  viewPresets,
  fixedEndColumnKeys = [],
  tableColumns,
  headerGroups,
  data,
  idKey,
  isLoading = false,
  skeletonRows,
  rowExpansion,
  fetchAllRows,
  primaryAction,
  onRefresh,
  isRefreshing = false,
  defaultStickyStart = 'one',
  defaultStickyEnd = 'one',
  totalsRows,
  totalsRowLabel,
  summary,
  dividers = 'rows',
  pagination,
  sort = null,
  onSortChange,
  sortableColumnKeys = [],
}) {
  const [searchFilters, setSearchFilters] = useState(
    /** @type {import('@astryxdesign/core/PowerSearch').PowerSearchFilter[]} */ ([]),
  );
  // Which `viewPresets` segment reads as selected — a label only, not a
  // strict mode: manually editing columns via the picker afterward doesn't
  // clear or resync this, same as the picker's own "Khôi phục" button
  // doesn't track a mode either. Not persisted — only the columns/density/
  // sticky settings it produces are.
  const [activePresetKey, setActivePresetKey] = useState(
    viewPresets?.[0]?.key ?? '',
  );
  const {
    activeColumnKeys,
    setActiveColumnKeys,
    density,
    setDensity,
    stickyStart,
    setStickyStart,
    stickyEnd,
    setStickyEnd,
  } = usePersistedTableViewOptions({
    storageKey: entityLabel,
    columnOptions,
    initialColumnKeys:
      initialColumnKeys ?? columnOptions.map((column) => column.key),
    defaultStickyStart,
    defaultStickyEnd,
  });

  // Header filters may target fields that intentionally do not belong in
  // the free-text PowerSearch menu (dates/numbers are the common case).
  // `useTableFiltering` still resolves its field references through the
  // PowerSearch config, so merge the server-filter definitions into that
  // config instead of silently rendering a dead/missing header control.
  const resolvedSearchFieldDefs = useMemo(() => {
    const knownKeys = new Set(searchFieldDefs.map((field) => field.key));
    const headerOnlyFields = (filterFieldDefs ?? [])
      .filter((field) => !knownKeys.has(field.key))
      .map((field) => ({
        key: field.key,
        type: field.type,
        label: field.label,
        ...(field.type === 'enum'
          ? {
              enumValues: (field.options ?? []).map((option) => ({
                value: option.value,
                label: option.label ?? option.value,
              })),
            }
          : {}),
      }));
    return [...searchFieldDefs, ...headerOnlyFields];
  }, [searchFieldDefs, filterFieldDefs]);
  const { config: baseSearchConfig, applyFilters } = usePowerSearchConfig(
    resolvedSearchFieldDefs,
    entityLabel,
  );
  const searchConfig = useMemo(
    () => ({ ...baseSearchConfig, contentSearchFieldKey }),
    [baseSearchConfig, contentSearchFieldKey],
  );

  // Any filter-affecting change (free-text search, quick filter chip, or a
  // per-column header filter) resets a server-paginated caller back to page
  // one — otherwise the current page can end up past the end of the new,
  // smaller result set.
  function resetPageIndex() {
    pagination?.onPageIndexChange(1);
  }

  // Debounce ref for `onContentSearchChange` (see `handleSearchFiltersChange`
  // below), which forwards the content-search field's value to the caller's
  // own server-side search — survives across renders, unlike a plain local
  // variable, and its cleanup effect cancels any pending call on unmount.
  const contentSearchDebounceRef = useRef(
    /** @type {ReturnType<typeof setTimeout> | null} */ (null),
  );
  useEffect(
    () => () => {
      if (contentSearchDebounceRef.current) {
        clearTimeout(contentSearchDebounceRef.current);
      }
    },
    [],
  );

  /** @param {ReadonlyArray<import('@astryxdesign/core/PowerSearch').PowerSearchFilter>} filters */
  function handleSearchFiltersChange(filters) {
    setSearchFilters([...filters]);
    resetPageIndex();

    // `onContentSearchChange` lets a caller (e.g. `contracts-list.jsx`) also
    // run the content-search field's text through its own server-side
    // search — this component only ever filters `data`, i.e. whatever page
    // the caller already fetched, so a caller with more rows than fit on
    // one page needs this to find a match outside it. Debounced so typing
    // doesn't fire a request per keystroke; the client-side filter still
    // updates immediately, so typing itself never feels laggy.
    if (onContentSearchChange) {
      const active = filters.find(
        (filter) => filter.field === contentSearchFieldKey,
      );
      const value = active
        ? String(/** @type {any} */ (active.value).value)
        : '';
      if (contentSearchDebounceRef.current) {
        clearTimeout(contentSearchDebounceRef.current);
      }
      contentSearchDebounceRef.current = setTimeout(
        () => onContentSearchChange(value),
        300,
      );
    }
  }

  /**
   * Quick filter chip: the closed Selector trigger doubles as the chip, so
   * setting or clearing it just writes/removes an "is" clause in the same
   * filter array PowerSearch itself edits.
   * @param {string} field
   * @param {string | null} value
   */
  function setQuickFilter(field, value) {
    setSearchFilters((current) => {
      const rest = current.filter((filter) => filter.field !== field);
      return value == null
        ? rest
        : [...rest, { field, operator: 'is', value: { type: 'enum', value } }];
    });
    resetPageIndex();
  }

  /** @param {string} field */
  function getQuickFilterValue(field) {
    const active = searchFilters.find((filter) => filter.field === field);
    return active ? String(/** @type {any} */ (active.value).value) : null;
  }

  // The funnel-icon trigger next to PowerSearch opens a popover with one
  // input per advanced field — a static form rather than PowerSearch's own
  // token menu, for fields callers want a dedicated, always-visible control
  // for. It writes into the same `searchFilters` array PowerSearch and the
  // per-column header filters all read from.
  const advancedSearchFieldsResolved = useMemo(
    () =>
      advancedSearchFields ??
      searchFieldDefs
        .filter((def) => def.type === 'string' || def.type === 'enum')
        .map((def) => ({
          field: def.key,
          label: def.label ?? def.key,
          placeholder: def.label ?? def.key,
          type: /** @type {'string' | 'enum'} */ (
            def.type === 'enum' ? 'enum' : 'string'
          ),
          options: def.enumValues,
        })),
    [advancedSearchFields, searchFieldDefs],
  );

  // When `filterFieldDefs` is given, the funnel button/dialog run the
  // server-driven condition builder (`AdvancedFilterBuilder`) instead of the
  // static one-input-per-field form below — the caller owns the applied
  // conditions (`advancedFilterConditions`) and sends them to its own
  // server-side search API via `onAdvancedFilterChange`; this component only
  // holds the in-dialog draft.
  const isServerFilterMode = Boolean(
    filterFieldDefs && filterFieldDefs.length > 0,
  );

  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [advancedSearchDraft, setAdvancedSearchDraft] = useState(
    /** @type {Record<string, string>} */ ({}),
  );
  const [advancedFilterDraft, setAdvancedFilterDraft] = useState(
    /** @type {import('@/shared/components/advanced-filter-builder.jsx').AdvancedFilterCondition[]} */ ([]),
  );

  // The funnel button opens a `Dialog`. Unlike the popover this replaced,
  // it's a plain controlled overlay: no anchor-click wiring to fight with,
  // so the trigger's own `onClick` drives it directly.
  /** @param {boolean} isOpen */
  function handleAdvancedSearchOpenChange(isOpen) {
    if (isOpen) {
      if (isServerFilterMode) {
        setAdvancedFilterDraft([...(advancedFilterConditions ?? [])]);
      } else {
        const draft = /** @type {Record<string, string>} */ ({});
        for (const field of advancedSearchFieldsResolved) {
          const active = searchFilters.find(
            (filter) => filter.field === field.field,
          );
          draft[field.field] = active
            ? String(/** @type {any} */ (active.value).value)
            : '';
        }
        setAdvancedSearchDraft(draft);
      }
    }
    setIsAdvancedSearchOpen(isOpen);
  }

  function handleAdvancedFilterSubmit() {
    onAdvancedFilterChange?.(advancedFilterDraft);
    resetPageIndex();
    setIsAdvancedSearchOpen(false);
  }

  // Clears immediately (applies the empty filter) rather than only resetting
  // the draft — matches the reference UI, where "Bỏ lọc" is a standalone
  // clear action, not a second step before "Lọc".
  function handleAdvancedFilterClear() {
    setAdvancedFilterDraft([]);
    onAdvancedFilterChange?.([]);
    resetPageIndex();
  }

  function handleAdvancedSearchSubmit() {
    const advancedFieldKeys = new Set(
      advancedSearchFieldsResolved.map((field) => field.field),
    );
    const nextAdvancedFilters = advancedSearchFieldsResolved
      .filter((field) => advancedSearchDraft[field.field]?.trim())
      .map((field) => {
        const value = advancedSearchDraft[field.field].trim();
        return field.type === 'enum'
          ? {
              field: field.field,
              operator: 'is',
              value: { type: 'enum', value },
            }
          : {
              field: field.field,
              operator: 'contains',
              value: { type: 'string', value },
            };
      });
    const preserved = searchFilters.filter(
      (filter) => !advancedFieldKeys.has(filter.field),
    );
    handleSearchFiltersChange(
      /** @type {any} */ ([...preserved, ...nextAdvancedFilters]),
    );
    setIsAdvancedSearchOpen(false);
  }

  // Per-column header filters (popover icon in the header), layered on top
  // of the search bar and quick-filter chips above — all three write into
  // the same PowerSearch filter engine, so applyFilters ANDs them together.
  const {
    filters: headerFilters,
    onFilterChange: setHeaderFilter,
    clearAll: clearHeaderFilters,
  } = useTableFilterState();

  const activeFilterCount =
    searchFilters.length +
    Object.keys(headerFilters).length +
    (advancedFilterConditions?.length ?? 0);
  function clearAllFilters() {
    setSearchFilters([]);
    clearHeaderFilters();
    setAdvancedFilterDraft([]);
    onAdvancedFilterChange?.([]);
    resetPageIndex();
  }
  // Kept computed but unreferenced — the per-column funnel trigger it backs
  // is turned off (see the comment on `TanStackDataTable` below); prefixed
  // `_` so this is a one-line revert (drop the prefix, pass it back in)
  // instead of reconstructing the whole plugin wiring later.
  const _filterPlugin =
    /** @type {import('@astryxdesign/core/Table').TablePlugin<T>} */ (
      useTableFiltering({
        filters: headerFilters,
        onFilterChange: (key, value) => {
          setHeaderFilter(key, value);
          resetPageIndex();
        },
        searchConfig,
      })
    );

  const filteredData = /** @type {T[]} */ (
    applyFiltersDiacriticInsensitive(
      /** @type {any} */ (applyFilters),
      [
        ...searchFilters,
        .../** @type {any} */ (
          toSearchFilters(headerFilters, tableColumns, searchConfig)
        ),
      ],
      /** @type {any} */ (data),
    )
  );
  // PowerSearch's `resultCount`: `pagination.totalCount` (the server's
  // true across-all-pages count) is right when nothing narrows beyond
  // what the server already filtered — but `searchFilters`/header filters
  // only ever run client-side against the already-fetched `data` (one
  // page), so a filter on a field that isn't also in `filterFieldDefs`
  // (server-routed) can narrow `filteredData` below `data.length` without
  // the server ever finding out. Comparing the two lengths — rather than
  // inspecting `filterFieldDefs` — catches that case exactly: no
  // additional client-side narrowing means `filteredData.length ===
  // data.length`, so trust the server total (or the plain filtered count
  // when there's no `pagination` at all); a shorter `filteredData` means
  // show what's actually on screen instead of a stale, too-large number
  // (caught 2026-09-17: "34 kết quả" while an enum quick-filter left only
  // 5 rows visible).
  const resultCount =
    filteredData.length === data.length
      ? (pagination?.totalCount ?? filteredData.length)
      : filteredData.length;

  // Appended after filtering, never before — a totals row's cells (labels,
  // pre-summed amounts) aren't real per-contract field values, so running
  // them through the quick-search/header-filter engine above would either
  // hide the row under an active filter or throw on a filter expecting a
  // shape the row doesn't have. Position within this array doesn't affect
  // where it renders — `tanstack-data-table.jsx` splits `__isTotalsRow`
  // rows out by that flag, not by array position (see its own comment).
  const renderedData =
    totalsRows && totalsRows.length > 0
      ? /** @type {T[]} */ (
          /** @type {any} */ ([...filteredData, ...totalsRows])
        )
      : filteredData;

  const [isExportingAll, setIsExportingAll] = useState(false);

  /**
   * Shared by every export/print format: the same visible/ordered columns
   * (respecting the View options picker), minus `fixedEndColumnKeys` (the
   * actions column has nothing to export) and any totals row — unless
   * `allColumns` asks for every column regardless of what's currently
   * hidden (used by "Xuất toàn bộ dữ liệu": exporting everything but
   * dropping columns the user happened to have hidden on screen would be
   * a silent data loss surprise). A column's optional `exportValue(row)`
   * overrides the plain `row[key]` dump for cases where the rendered cell
   * isn't the raw field (enum codes, nested objects, combined fields) —
   * falls back to the raw value when absent. Values are left as their raw
   * type (number/string/null) — CSV/print stringify them, Excel keeps
   * numbers numeric.
   * @param {T[]} rows
   * @param {{ allColumns?: boolean }} [options]
   */
  function buildExportTable(rows, { allColumns = false } = {}) {
    const exportColumnKeys = (
      allColumns
        ? columnOptions.map((column) => column.key)
        : columnSettingsState.activeColumnKeys
    ).filter((key) => !fixedEndColumnKeys.includes(key));
    const columnsByKey = new Map(
      tableColumns.map((column) => [column.key, column]),
    );
    const headerRow = exportColumnKeys.map(
      (key) => columnOptions.find((column) => column.key === key)?.label ?? key,
    );
    const dataRows = rows
      .filter((row) => !(/** @type {any} */ (row).__isTotalsRow))
      .map((row) =>
        exportColumnKeys.map((key) => {
          const column = /** @type {any} */ (columnsByKey.get(key));
          return column?.exportValue
            ? column.exportValue(row)
            : /** @type {any} */ (row)[key];
        }),
      );
    return { headerRow, dataRows };
  }

  /** @param {T[]} rows @param {{ allColumns?: boolean }} [options] */
  function exportCsv(rows, options) {
    const { headerRow, dataRows } = buildExportTable(rows, options);
    const csv = [headerRow, ...dataRows]
      .map((cells) =>
        cells
          .map((value) => escapeCsvCell(value == null ? '' : String(value)))
          .join(','),
      )
      .join('\r\n');
    // Leading BOM so Excel opens the file as UTF-8 instead of guessing
    // Windows-1252 and mangling every Vietnamese diacritic.
    const blob = new Blob([CSV_BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${entityLabel}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /** @param {T[]} rows @param {{ allColumns?: boolean }} [options] */
  function exportExcel(rows, options) {
    const { headerRow, dataRows } = buildExportTable(rows, options);
    const worksheet = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    XLSX.writeFile(
      workbook,
      `${entityLabel}-${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  }

  /** @param {T[]} rows */
  function printRows(rows) {
    const { headerRow, dataRows } = buildExportTable(rows);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const escapeHtml = (/** @type {unknown} */ value) =>
      String(value ?? '').replace(
        /[&<>]/g,
        (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[char] ?? char,
      );
    printWindow.document.write(`<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><title>${escapeHtml(entityLabel)}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; }
  h1 { font-size: 16px; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid darkgray; padding: 4px 8px; text-align: left; }
  th { background: whitesmoke; }
</style></head><body>
<h1>${escapeHtml(entityLabel)}</h1>
<table><thead><tr>${headerRow.map((cell) => `<th>${escapeHtml(cell)}</th>`).join('')}</tr></thead>
<tbody>${dataRows
      .map(
        (row) =>
          `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`,
      )
      .join('')}</tbody></table>
</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.onload = () => printWindow.print();
  }

  /** @param {'excel' | 'csv'} format */
  async function exportAllRows(format) {
    if (!fetchAllRows) return;
    setIsExportingAll(true);
    try {
      const allRows = await fetchAllRows();
      const filteredAllRows = /** @type {T[]} */ (
        applyFiltersDiacriticInsensitive(
          /** @type {any} */ (applyFilters),
          [
            ...searchFilters,
            .../** @type {any} */ (
              toSearchFilters(headerFilters, tableColumns, searchConfig)
            ),
          ],
          /** @type {any} */ (allRows),
        )
      );
      if (format === 'excel')
        exportExcel(filteredAllRows, { allColumns: true });
      else exportCsv(filteredAllRows, { allColumns: true });
    } finally {
      setIsExportingAll(false);
    }
  }

  const columnSettingsState = useTableColumnSettingsState({
    columns: columnOptions,
    activeColumnKeys: [
      ...activeColumnKeys.filter((key) => !fixedEndColumnKeys.includes(key)),
      ...fixedEndColumnKeys,
    ],
    onChangeActiveColumnKeys: (keys) => setActiveColumnKeys([...keys]),
  });
  // Pins whichever edge columns the View options popover currently asks
  // for, computed from the table's own visible/ordered column keys so the
  // pin always tracks what "first/last column(s)" actually means on screen.
  const tableStartKeys = stickyColumnKeys(
    stickyStart,
    columnSettingsState.activeColumnKeys,
    false,
  ).filter((key) => !fixedEndColumnKeys.includes(key));
  const tableEndKeys = [
    ...new Set([
      ...stickyColumnKeys(
        stickyEnd,
        columnSettingsState.activeColumnKeys,
        true,
      ),
      ...fixedEndColumnKeys,
    ]),
  ];

  // The totals-row label always lands on whichever column key is actually
  // first in `columnSettingsState.activeColumnKeys` — the real render order
  // (`tanstack-data-table.jsx` feeds it straight in as `columnOrder`) —
  // instead of a column key a feature hardcodes, which drifts out of the
  // leftmost spot the moment a view preset or column-visibility change
  // reorders things (e.g. a date column moving ahead of it).
  const firstActiveColumnKey = columnSettingsState.activeColumnKeys[0];
  const renderedTableColumns = totalsRowLabel
    ? tableColumns.map((column) =>
        column.key === firstActiveColumnKey
          ? {
              ...column,
              renderCell: (/** @type {any} */ row) =>
                row.__isTotalsRow
                  ? totalsRowLabel(row)
                  : column.renderCell?.(row),
            }
          : column,
      )
    : tableColumns;

  const skeletonColumns = renderedTableColumns.map((column, columnIndex) => ({
    ...column,
    renderCell: () => <Skeleton height={16} width="70%" index={columnIndex} />,
  }));

  // Extracted so `title`'s header row and the search toolbar's end cluster
  // can share the exact same elements — only one of the two renders them,
  // decided by whether `title` was given (see this component's doc comment).
  const printButton = (
    <IconButton
      label="In"
      tooltip="In (trang hiện tại)"
      icon={<Icon icon={Printer} size="sm" />}
      variant="ghost"
      size="sm"
      isDisabled={isLoading || filteredData.length === 0}
      onClick={() => printRows(filteredData)}
    />
  );

  const exportMenu = (
    <DropdownMenu
      button={{
        label: 'Xuất',
        tooltip: 'Xuất dữ liệu',
        variant: 'ghost',
        size: 'sm',
        icon: <Icon icon={Download} size="sm" />,
        isDisabled: isLoading || filteredData.length === 0,
      }}
      items={[
        {
          type: 'section',
          title: 'Trang hiện tại',
          items: [
            {
              id: 'excel-page',
              label: 'Xuất Excel (trang hiện tại)',
              icon: <Icon icon={FileSpreadsheet} size="sm" />,
              onClick: () => exportExcel(filteredData),
            },
            {
              id: 'csv-page',
              label: 'Xuất CSV (trang hiện tại)',
              icon: <Icon icon={Download} size="sm" />,
              onClick: () => exportCsv(filteredData),
            },
          ],
        },
        ...(fetchAllRows
          ? [
              {
                type: /** @type {const} */ ('section'),
                title: 'Toàn bộ dữ liệu (đã lọc)',
                items: [
                  {
                    id: 'excel-all',
                    label: isExportingAll
                      ? 'Đang xuất...'
                      : 'Xuất Excel (toàn bộ dữ liệu)',
                    icon: <Icon icon={FileSpreadsheet} size="sm" />,
                    isDisabled: isExportingAll,
                    onClick: () => exportAllRows('excel'),
                  },
                  {
                    id: 'csv-all',
                    label: isExportingAll
                      ? 'Đang xuất...'
                      : 'Xuất CSV (toàn bộ dữ liệu)',
                    icon: <Icon icon={Download} size="sm" />,
                    isDisabled: isExportingAll,
                    onClick: () => exportAllRows('csv'),
                  },
                ],
              },
            ]
          : []),
      ]}
    />
  );

  const primaryActionButton = primaryAction ? (
    <Button
      label={primaryAction.label}
      variant="primary"
      icon={primaryAction.icon}
      onClick={primaryAction.onClick}
    />
  ) : null;

  const titleRow =
    title != null ? (
      <HStack
        hAlign="between"
        vAlign="center"
        wrap="wrap"
        gap={3}
        xstyle={styles.titleRow}
      >
        {title}
        <HStack gap={2} vAlign="center" wrap="wrap">
          {printButton}
          {exportMenu}
          {primaryActionButton}
        </HStack>
      </HStack>
    ) : null;

  const toolbar = (
    <Toolbar
      label={toolbarLabel}
      size="sm"
      startContent={
        // Everything lives in the one slot: Toolbar only stretches a
        // slot to fill the row when it's the sole slot present, so the
        // search bar's "fill the row" behavior depends on `endContent`
        // being unset and this StackItem doing the actual growing.
        <HStack
          gap={3}
          vAlign="center"
          wrap="wrap"
          xstyle={styles.toolbarPrimary}
        >
          <StackItem size="fill" xstyle={styles.searchSlot}>
            <PowerSearch
              label={searchPlaceholder}
              isLabelHidden
              size="sm"
              config={searchConfig}
              filters={searchFilters}
              onChange={handleSearchFiltersChange}
              placeholder={searchPlaceholder}
              resultCount={resultCount}
              startIcon="search"
              hasClear
              endContent={
                isServerFilterMode || advancedSearchFieldsResolved.length > 0 ? (
                  <IconButton
                    label="Bộ lọc nâng cao"
                    tooltip="Bộ lọc nâng cao"
                    icon={<Icon icon="funnel" size="sm" />}
                    variant="ghost"
                    onClick={() => handleAdvancedSearchOpenChange(true)}
                  />
                ) : null
              }
              xstyle={styles.search}
            />
            <AdvanceTableSearchDialog
              isServerFilterMode={isServerFilterMode}
              isAdvancedSearchOpen={isAdvancedSearchOpen}
              handleAdvancedSearchOpenChange={handleAdvancedSearchOpenChange}
              filterFieldDefs={filterFieldDefs}
              advancedFilterDraft={advancedFilterDraft}
              setAdvancedFilterDraft={setAdvancedFilterDraft}
              handleAdvancedFilterClear={handleAdvancedFilterClear}
              handleAdvancedFilterSubmit={handleAdvancedFilterSubmit}
              advancedSearchFieldsResolved={advancedSearchFieldsResolved}
              advancedSearchDraft={advancedSearchDraft}
              setAdvancedSearchDraft={setAdvancedSearchDraft}
              handleAdvancedSearchSubmit={handleAdvancedSearchSubmit}
            />
          </StackItem>
          <HStack
            gap={2}
            vAlign="center"
            wrap="wrap"
            xstyle={styles.toolbarEnd}
          >
            {viewPresets && viewPresets.length > 0 ? (
              <SegmentedControl
                label="Chế độ xem cột"
                size="sm"
                value={activePresetKey}
                onChange={(key) => {
                  setActivePresetKey(key);
                  const preset = viewPresets.find(
                    (candidate) => candidate.key === key,
                  );
                  if (preset) setActiveColumnKeys([...preset.columnKeys]);
                }}
              >
                {viewPresets.map((preset) => (
                  <SegmentedControlItem
                    key={preset.key}
                    value={preset.key}
                    label={preset.label}
                  />
                ))}
              </SegmentedControl>
            ) : null}
            <TableViewOptionsPopover
              fixedEndLabel={fixedEndColumnKeys
                .map(
                  (key) =>
                    columnOptions.find((column) => column.key === key)?.label ??
                    key,
                )
                .join(', ')}
              columns={columnOptions}
              activeColumnKeys={[...columnSettingsState.activeColumnKeys]}
              onChangeActiveColumnKeys={columnSettingsState.setActiveColumnKeys}
              defaultColumnKeys={defaultColumnKeys}
              density={density}
              onChangeDensity={(value) =>
                setDensity(
                  /** @type {import('@astryxdesign/core/Table').TableDensity} */ (
                    value
                  ),
                )
              }
              stickyStart={stickyStart}
              onChangeStickyStart={(value) =>
                setStickyStart(/** @type {'none' | 'one' | 'two'} */ (value))
              }
              stickyEnd={stickyEnd}
              onChangeStickyEnd={(value) =>
                setStickyEnd(/** @type {'none' | 'one' | 'two'} */ (value))
              }
            />
            {title == null ? printButton : null}
            {title == null ? exportMenu : null}
            {onRefresh ? (
              <IconButton
                label="Tải lại danh sách"
                tooltip="Tải lại"
                icon={<Icon icon={IconRefresh} size="sm" />}
                variant="ghost"
                size="sm"
                isLoading={isRefreshing}
                onClick={onRefresh}
              />
            ) : null}
            {title == null ? primaryActionButton : null}
          </HStack>
        </HStack>
      }
    />
  );

  return (
    <Layout
      height="fill"
      header={
        <LayoutHeader padding={0}>
          <VStack gap={0} hAlign="stretch">
            {titleRow}
            {toolbar}
            {quickFilters && quickFilters.length > 0 ? (
              <HStack
                gap={2}
                vAlign="center"
                wrap="wrap"
                xstyle={styles.filterRow}
              >
                {quickFilters.map((quickFilter) => (
                  <Selector
                    key={quickFilter.field}
                    label={quickFilter.label}
                    isLabelHidden
                    placeholder={quickFilter.placeholder}
                    size="sm"
                    hasClear
                    hasSearch={quickFilter.hasSearch}
                    options={[...quickFilter.options]}
                    value={getQuickFilterValue(quickFilter.field)}
                    renderValue={quickFilter.renderValue}
                    xstyle={
                      getQuickFilterValue(quickFilter.field)
                        ? styles.filterFill
                        : undefined
                    }
                    onChange={(next) => setQuickFilter(quickFilter.field, next)}
                  />
                ))}
              </HStack>
            ) : null}
            {activeFilterCount > 0 ? (
              <HStack gap={2} wrap="wrap" vAlign="center">
                <Text type="supporting" color="secondary">
                  Đang áp dụng {activeFilterCount} điều kiện lọc
                </Text>
                <Button
                  label="Xóa tất cả bộ lọc"
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                />
              </HStack>
            ) : null}
          </VStack>
        </LayoutHeader>
      }
      content={
        <LayoutContent padding={0} isScrollable={false}>
          <TanStackDataTable
            headerGroups={headerGroups}
            activeColumnKeys={columnSettingsState.activeColumnKeys}
            startKeys={tableStartKeys}
            endKeys={tableEndKeys}
            // Per-column header filter (funnel icon popover) turned off app-
            // wide per user request (2026-09-16) — redundant with the search
            // bar's "Bộ lọc nâng cao" and now crowded the header next to the
            // new sort indicator. `filterPlugin` (below) is left computed but
            // unused rather than torn out, so this is a one-line revert if
            // wanted back.
            rowExpansion={rowExpansion}
            emptyState={
              isLoading ? (
                false
              ) : (
                <VStack gap={2} hAlign="center" paddingBlock={6}>
                  <Text weight="semibold">
                    {activeFilterCount > 0
                      ? 'Không tìm thấy kết quả phù hợp'
                      : 'Chưa có dữ liệu'}
                  </Text>
                  <Text type="supporting" color="secondary">
                    {activeFilterCount > 0
                      ? 'Thử từ khóa khác hoặc xóa bộ lọc để xem lại danh sách.'
                      : 'Dữ liệu sẽ xuất hiện tại đây sau khi được thêm.'}
                  </Text>
                </VStack>
              )
            }
            data={isLoading ? (skeletonRows ?? []) : renderedData}
            columns={isLoading ? skeletonColumns : renderedTableColumns}
            idKey={idKey}
            density={density}
            dividers={dividers}
            sort={sort}
            onSortChange={onSortChange}
            sortableColumnKeys={sortableColumnKeys}
          />
        </LayoutContent>
      }
      footer={
        <LayoutFooter padding={0}>
          <VStack gap={0} hAlign="stretch">
            {summary && !isLoading ? (
              <HStack hAlign="end" xstyle={styles.summary}>
                {summary}
              </HStack>
            ) : null}
            <AdvanceTablePagination
              pagination={pagination}
              visibleCount={resultCount}
              isLoading={isLoading}
            />
          </VStack>
        </LayoutFooter>
      }
    />
  );
}

/**
 * Error banner for a list result, shown above the {@link AdvanceTable}. A
 * small helper (not folded into AdvanceTable itself) since some callers
 * don't have a discriminated `{ success, message }` result shape.
 * @param {{ message: string }} props
 */
export function AdvanceTableErrorBanner({ message }) {
  return <Banner status="error" title={message} container="card" />;
}
