'use client';

import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import {
  pixel,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from '@astryxdesign/core/Table';
import { borderVars, colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { VisuallyHidden } from '@astryxdesign/core/VisuallyHidden';
import * as stylex from '@stylexjs/stylex';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Fragment, useEffect, useMemo, useState } from 'react';

import { expandableRowStyles } from '@/shared/components/expandable-row-styles.jsx';
import { resolveTableSizes } from '@/shared/config/tanstack-table-columns.js';

const EXPANSION_COLUMN_KEY = '__expansion';

// Plain (non-StyleX) copies of the same four row-background values `styles`
// below compiles — StyleX's Babel plugin statically analyzes `stylex.create`
// and rejects a `backgroundColor` that resolves through an external `const`
// instead of a literal expression, so those colors have to stay inlined
// there. These exist only so a pinned cell's runtime inline `style` (see
// `rowBg` below) can use the exact same values without a third copy.
const CARD_BG = colorVars['--color-background-card'];
const CARD_HOVER_BG = `color-mix(in srgb, ${colorVars['--color-overlay-hover']}, ${CARD_BG})`;
const TOTALS_BG = colorVars['--color-background-muted'];
const TOTALS_HOVER_BG = `color-mix(in srgb, ${colorVars['--color-overlay-hover']}, ${TOTALS_BG})`;

const styles = stylex.create({
  // `height: '100%'` is what lets this wrapper — and through it, `Table`'s
  // own internal scroll container (`table-scroll-wrapper`, `theme.js`) —
  // fill a real, ancestor-provided height (`AdvanceTable`'s `Layout
  // height="fill"` / `LayoutContent`) instead of the table growing to its
  // full natural content height and leaving the *page* to scroll. Requires
  // every ancestor up to that `Layout` to also resolve to a real height —
  // `100%` of an auto-height ancestor is a no-op.
  wrapper: { height: '100%', minWidth: 0 },
  // `minWidth` is the real sum of column widths (`resolveTableSizes`,
  // keyed off `availableWidth` — 0 until the wrapper's `ResizeObserver`
  // fires its first callback post-mount), so a table with more columns
  // than fit the viewport still triggers the scroll wrapper's horizontal
  // scroll. `width: '100%'` (not the same `width` value) is what actually
  // fills the container the moment it renders — relying on the JS-measured
  // width alone left a visible gap on the right for that first frame (or
  // longer, on a table whose columns never reach the container's true
  // width) instead of stretching, reported as "table/skeleton chưa full
  // width" 2026-09-14.
  table: (width) => ({
    borderCollapse: 'separate',
    borderSpacing: 0,
    minWidth: width,
    tableLayout: 'fixed',
    width: '100%',
  }),
  header: { position: 'sticky', top: 0, zIndex: 3 },
  // Mirrors `header` above (same mechanism, opposite edge): totals row(s)
  // live in a real `<tfoot>` — not mixed into `<tbody>` behind a fixed-
  // position overlay duplicate, the earlier approach — because `position:
  // sticky` on a table section works exactly the same at the bottom as it
  // does at the top, once the table actually has a `<tfoot>` to put it on
  // (previously it didn't; see the removed `TableStickyTotalsBar`, whose
  // own doc comment explains why that workaround existed). This also keeps
  // the totals row scrolling horizontally in lockstep with the body — the
  // fixed-position overlay had to remeasure and reposition itself on every
  // scroll/resize to fake that.
  footer: {
    borderBlockStartColor: colorVars['--color-border'],
    borderBlockStartStyle: 'solid',
    borderBlockStartWidth: borderVars['--border-width'],
    bottom: 0,
    position: 'sticky',
    zIndex: 3,
  },
  // Column-separator border between header cells (both the group row and
  // the leaf row) — the header previously only had the bottom divider
  // separating it from the body, with no vertical rule between columns.
  // Both borders use `--color-border-emphasized` (not the plain
  // `--color-border` hairline `TableHeaderCell` defaults to for its own
  // bottom divider) — the header sits on the tinted mint background
  // (`refresh-workspace-colors`), where `--color-border` (~rgb(231,236,235))
  // is nearly the same luminance as that background (~rgb(220,238,232)) and
  // reads as no border at all ("table headers missing border width",
  // reported 2026-09-15). `--color-border-emphasized` is the token
  // `theme.js` already reserves for boundaries that need to stay visible
  // against a colored surface (form-control outlines), so it carries
  // through here for the same reason.
  headerCell: {
    borderBlockEndColor: colorVars['--color-border-emphasized'],
    borderBlockEndStyle: 'solid',
    borderBlockEndWidth: borderVars['--border-width'],
    borderInlineEndColor: colorVars['--color-border-emphasized'],
    borderInlineEndStyle: 'solid',
    borderInlineEndWidth: borderVars['--border-width'],
    position: 'relative',
    top: 'auto',
    zIndex: 0,
  },
  // Body/footer counterpart to `headerCell`'s override above: Astryx's own
  // `Table` renders a `dividers="grid"`/`"columns"` cell's vertical rule in
  // the plain `--color-border` token, which (same root cause as the header
  // bug this file already fixed) is close enough in luminance to this
  // theme's white row background to read as no divider at all — confirmed
  // 2026-09-15 on the Shipment cost ledger (`shipment-cost-lines-fields.jsx`,
  // "làm kiểu table"): computed style showed the border rule present
  // (`1px solid rgb(231, 236, 235)`) but zero visible vertical lines in a
  // cropped screenshot of the rendered table. `--color-border-emphasized`
  // only overrides the inline-end (vertical) rule, and only when the
  // caller actually asked for vertical dividers — a horizontal-only
  // `dividers="rows"` table (most existing callers) is unaffected.
  cellDivider: {
    borderInlineEndColor: colorVars['--color-border-emphasized'],
    borderInlineEndStyle: 'solid',
    borderInlineEndWidth: borderVars['--border-width'],
  },
  align: (align) => ({ textAlign: align }),
  pinned: (left, right) => ({ left, position: 'sticky', right, zIndex: 1 }),
  // Row hover is driven by React state (`hoveredRowId`), not a CSS `:hover`
  // pseudo-class, because `position: sticky` promotes a pinned cell to its
  // own compositing layer and Chromium doesn't reliably repaint that
  // layer from a pure `:hover` toggle on the ancestor row.
  row: { backgroundColor: colorVars['--color-background-card'] },
  rowHovered: {
    backgroundColor: `color-mix(in srgb, ${colorVars['--color-overlay-hover']}, ${colorVars['--color-background-card']})`,
  },
  totalsRow: { backgroundColor: colorVars['--color-background-muted'] },
  totalsRowHovered: {
    backgroundColor: `color-mix(in srgb, ${colorVars['--color-overlay-hover']}, ${colorVars['--color-background-muted']})`,
  },
  width: (width) => ({ width }),
  headerContent: { minWidth: 0 },
  chevronButton: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderStyle: 'none',
    borderWidth: 0,
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    padding: 0,
    width: '100%',
  },
  chevronIconExpanded: {
    transform: 'rotate(90deg)',
    transitionDuration: '150ms',
    transitionProperty: 'transform',
  },
  chevronIconCollapsed: {
    transform: 'none',
    transitionDuration: '150ms',
    transitionProperty: 'transform',
  },
  sortableHeader: {
    cursor: 'pointer',
    userSelect: 'none',
  },
  // Dimmed until this column is the active sort — an always-full-opacity
  // icon on every sortable header would read as "already sorted"
  // everywhere at once.
  sortIconInactive: {
    opacity: 0.4,
  },
});

/** TanStack owns rows/columns; Astryx children primitives retain the app theme.
 * Existing filter UI is adapted at its documented header/context slots only.
 * @template {Record<string, unknown>} T
 * @param {{data: T[], columns: import('./advance-table.jsx').AdvanceTableColumn<T>[],
 * idKey: string, density: import('@astryxdesign/core/Table').TableDensity,
 * dividers: import('@astryxdesign/core/Table').TableDividers,
 * activeColumnKeys?: readonly string[], startKeys?: string[], endKeys?: string[],
 * filterPlugin?: import('@astryxdesign/core/Table').TablePlugin<T>,
 * headerGroups?: {id: string, label: string, columnKeys: string[]}[],
 * rowExpansion?: {
 *   expandedIds: ReadonlySet<string>,
 *   onToggle: (id: string) => void,
 *   getRowKey: (row: T) => string,
 *   isExpandable?: (row: T) => boolean,
 *   renderExpanded: (row: T) => import('react').ReactNode,
 * },
 * emptyState: import('react').ReactNode,
 * sort?: {field: string, direction: 'Ascending' | 'Descending'} | null,
 * onSortChange?: (field: string | null, direction: 'Ascending' | 'Descending') => void,
 * sortableColumnKeys?: readonly string[],
 * }} props
 */
export function TanStackDataTable({
  data,
  columns,
  idKey,
  density,
  dividers,
  activeColumnKeys = columns.map((column) => column.key),
  startKeys = [],
  endKeys = [],
  filterPlugin = {},
  headerGroups = [],
  rowExpansion,
  emptyState,
  sort = null,
  onSortChange,
  sortableColumnKeys = [],
}) {
  'use no memo';
  const [availableWidth, setAvailableWidth] = useState(0);
  const [hoveredRowId, setHoveredRowId] = useState(
    /** @type {string | null} */ (null),
  );
  // Measured off the real scrolling element (the `<Table>`'s own internal
  // overflow wrapper, reached via `transformScrollWrapper` — the same hook
  // `useTableStickyColumns` uses for its scroll-shadow ref), not an
  // ancestor of it. An ancestor's own box never shrinks when ITS
  // *descendant* grows a scrollbar — only the scrolling element's own
  // content box does — so measuring one level too high missed the ~15px a
  // vertical scrollbar carves out of the horizontal space once a tall
  // result set (many rows, filling the full height `theme.js`'s
  // `table-scroll-wrapper` now gives this wrapper) triggers one. That
  // stale-too-wide
  // `availableWidth` then forced a spurious *horizontal* scrollbar too,
  // even on a narrow-column table with no real horizontal overflow
  // (reported 2026-09-13: "hợp đồng có vài column mà vẫn bị [scroll] show").
  const [scrollElement, setScrollElement] = useState(
    /** @type {HTMLDivElement | null} */ (null),
  );
  const measureScrollWidthPlugin = useMemo(
    () => ({
      transformScrollWrapper(
        /** @type {import('@astryxdesign/core/Table').ScrollWrapperRenderProps} */ props,
      ) {
        const existingRef = props.htmlProps.ref;
        return {
          ...props,
          htmlProps: {
            ...props.htmlProps,
            ref: (/** @type {HTMLDivElement | null} */ node) => {
              setScrollElement(node);
              if (typeof existingRef === 'function') existingRef(node);
              else if (existingRef) existingRef.current = node;
            },
          },
        };
      },
    }),
    [],
  );
  useEffect(() => {
    if (!scrollElement) return;
    const observer = new ResizeObserver(([entry]) =>
      setAvailableWidth(entry.contentRect.width),
    );
    observer.observe(scrollElement);
    return () => observer.disconnect();
  }, [scrollElement]);
  // The expansion chevron is a synthetic leading column, not part of the
  // caller's own column list, so it's always visible and pinned first.
  const expansionColumn = rowExpansion
    ? /** @type {import('./advance-table.jsx').AdvanceTableColumn<T>} */ ({
        key: EXPANSION_COLUMN_KEY,
        header: <VisuallyHidden>Mở rộng hàng</VisuallyHidden>,
        align: 'center',
        width: pixel(40),
      })
    : undefined;
  const effectiveColumns = useMemo(
    () => (expansionColumn ? [expansionColumn, ...columns] : columns),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- expansionColumn is a fresh object per render, keyed only by rowExpansion's presence
    [columns, Boolean(rowExpansion)],
  );
  const effectiveActiveColumnKeys = expansionColumn
    ? [EXPANSION_COLUMN_KEY, ...activeColumnKeys]
    : activeColumnKeys;
  const effectiveStartKeys = expansionColumn
    ? [EXPANSION_COLUMN_KEY, ...startKeys]
    : startKeys;
  const columnDefs = useMemo(() => {
    const leaves = effectiveColumns.map((column) => ({
      id: column.key,
      accessorFn: (/** @type {T} */ row) => row[column.key],
      header: () => column.header ?? column.key,
      cell: (
        /** @type {import('@tanstack/react-table').CellContext<T, unknown>} */ {
          row,
        },
      ) => {
        if (column.key === EXPANSION_COLUMN_KEY && rowExpansion) {
          const isExpandable = rowExpansion.isExpandable
            ? rowExpansion.isExpandable(row.original)
            : true;
          if (!isExpandable) return null;
          const key = rowExpansion.getRowKey(row.original);
          const isExpanded = rowExpansion.expandedIds.has(key);
          return (
            <button
              type="button"
              {...stylex.props(styles.chevronButton)}
              aria-label={isExpanded ? 'Thu gọn hàng' : 'Mở rộng hàng'}
              aria-expanded={isExpanded}
              onClick={(event) => {
                event.stopPropagation();
                rowExpansion.onToggle(key);
              }}
            >
              <Icon
                icon="chevronRight"
                size="xsm"
                xstyle={
                  isExpanded
                    ? styles.chevronIconExpanded
                    : styles.chevronIconCollapsed
                }
              />
            </button>
          );
        }
        return column.renderCell
          ? column.renderCell(row.original)
          : /** @type {import('react').ReactNode} */ (row.original[column.key]);
      },
      enableSorting: sortableColumnKeys.includes(column.key),
      meta: { source: column },
    }));
    const grouped = new Set(headerGroups.flatMap((group) => group.columnKeys));
    return [
      ...leaves.filter((column) => !grouped.has(column.id)),
      ...headerGroups.map((group) => ({
        id: group.id,
        header: group.label,
        columns: leaves.filter((column) =>
          group.columnKeys.includes(column.id),
        ),
      })),
    ];
  }, [effectiveColumns, headerGroups, rowExpansion, sortableColumnKeys]);
  // `sort`/`onSortChange` speak the backend's wire field name (`sortField`
  // — falls back to `filter`, then `key`; see `AdvanceTableColumn`'s doc
  // comment), but TanStack's own `sorting` state addresses columns by their
  // `id` (== `key`) — translated at this boundary so callers never need to
  // know a column's key differs from its wire name (only `buyer`/
  // `buyerCompanyName` does today).
  const sortFieldByColumnKey = useMemo(
    () =>
      new Map(
        effectiveColumns.map((column) => [
          column.key,
          column.sortField ??
            (typeof column.filter === 'string' ? column.filter : column.key),
        ]),
      ),
    [effectiveColumns],
  );
  const columnKeyBySortField = useMemo(() => {
    const map = new Map();
    for (const [key, field] of sortFieldByColumnKey) map.set(field, key);
    return map;
  }, [sortFieldByColumnKey]);
  // The backend only ever sorts by one field at a time (`SortRequest`,
  // BE-kt-xnk) — TanStack's own `sorting` state is still an array (its
  // multi-sort shape), so it's translated to/from this single-entry form
  // at the boundary rather than exposed to callers.
  const sortingState = sort
    ? [
        {
          id: columnKeyBySortField.get(sort.field) ?? sort.field,
          desc: sort.direction === 'Descending',
        },
      ]
    : [];
  // This v8 instance is intentionally outside React Compiler memoization.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row[idKey]),
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    enableSorting: sortableColumnKeys.length > 0,
    enableMultiSort: false,
    autoResetAll: false,
    onSortingChange: (updater) => {
      if (!onSortChange) return;
      const next =
        typeof updater === 'function' ? updater(sortingState) : updater;
      const first = next[0];
      if (!first) {
        onSortChange(null, 'Ascending');
        return;
      }
      onSortChange(
        sortFieldByColumnKey.get(first.id) ?? first.id,
        first.desc ? 'Descending' : 'Ascending',
      );
    },
    state: {
      sorting: sortingState,
      columnOrder: [...effectiveActiveColumnKeys],
      columnVisibility: Object.fromEntries(
        effectiveColumns.map((column) => [
          column.key,
          effectiveActiveColumnKeys.includes(column.key),
        ]),
      ),
      columnPinning: {
        left: effectiveStartKeys.filter((key) => !endKeys.includes(key)),
        right: endKeys,
      },
      columnSizing: resolveTableSizes(
        effectiveColumns,
        effectiveActiveColumnKeys,
        availableWidth,
      ),
    },
  });
  /** @param {import('@tanstack/react-table').Column<T, unknown>} column */
  function pinStyle(column) {
    const edge = column.getIsPinned();
    return edge
      ? styles.pinned(
          edge === 'left' ? column.getStart('left') : 'auto',
          edge === 'right' ? column.getAfter('right') : 'auto',
        )
      : undefined;
  }
  /** A group can split across pinned regions; position only this header's leaves.
   * @param {import('@tanstack/react-table').Header<T, unknown>} header
   */
  function headerPinStyle(header) {
    const leaves = header
      .getLeafHeaders()
      .filter((leaf) => !leaf.column.columns.length);
    const first = leaves[0]?.column;
    const last = leaves.at(-1)?.column;
    const edge = first?.getIsPinned();
    return edge && last?.getIsPinned() === edge
      ? styles.pinned(
          edge === 'left' ? first.getStart('left') : 'auto',
          edge === 'right' ? last.getAfter('right') : 'auto',
        )
      : undefined;
  }
  // Build each pinned region independently so a financial group splits at
  // the sticky boundary even when its leaf columns remain adjacent.
  const headerRows = table.getHeaderGroups().map((group, index) => ({
    ...group,
    headers: [
      ...(table.getLeftHeaderGroups()[index]?.headers ?? []),
      ...(table.getCenterHeaderGroups()[index]?.headers ?? []),
      ...(table.getRightHeaderGroups()[index]?.headers ?? []),
    ],
  }));
  // Totals row(s) render in a real `<tfoot>` (below), not here — split them
  // out of TanStack's row model rather than filtering `data` upstream, so
  // every existing caller (which appends `totalsRows` into the same `data`
  // array `AdvanceTable` passes down) keeps working unchanged.
  const bodyRows = table
    .getRowModel()
    .rows.filter((row) => !(/** @type {any} */ (row.original).__isTotalsRow));
  const footerRows = table
    .getRowModel()
    .rows.filter((row) => /** @type {any} */ (row.original).__isTotalsRow);
  const content = (
    <div {...stylex.props(styles.wrapper)}>
      <Table
        density={density}
        dividers={dividers}
        xstyle={styles.table(table.getTotalSize())}
        aria-label="Danh sách hợp đồng"
        data-table-engine="tanstack"
        plugins={{ measureScrollWidth: measureScrollWidthPlugin }}
      >
        <colgroup>
          {table.getVisibleLeafColumns().map((column) => (
            <col
              key={column.id}
              {...stylex.props(styles.width(column.getSize()))}
            />
          ))}
        </colgroup>
        <TableHeader xstyle={styles.header}>
          {headerRows.map((group) => (
            <TableRow key={group.id} isHeaderRow>
              {group.headers.map((header) => {
                // Ungrouped columns span both header rows; omit their duplicate
                // leaf header in the second row instead of drawing blank cells.
                if (group.depth > 0 && !header.column.parent) return null;
                const source =
                  /** @type {{source?: import('./advance-table.jsx').AdvanceTableColumn<T>}} */ (
                    header.column.columnDef.meta
                  )?.source;
                const slots = source
                  ? filterPlugin.transformHeaderCell?.(
                      {
                        htmlProps: {},
                        xstyle: [],
                        content: flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        ),
                      },
                      source,
                      header.index,
                      columns,
                    )
                  : undefined;
                return (
                  <TableHeaderCell
                    key={header.id}
                    {...{
                      colSpan: header.colSpan,
                      rowSpan: header.isPlaceholder
                        ? table.getHeaderGroups().length
                        : 1,
                    }}
                    scope={source ? 'col' : 'colgroup'}
                    data-column-key={source ? header.column.id : undefined}
                    xstyle={[
                      styles.headerCell,
                      styles.align(source?.align ?? 'center'),
                      headerPinStyle(header),
                    ]}
                  >
                    {
                      <HStack
                        gap={1}
                        vAlign="center"
                        hAlign={
                          source?.align === 'end'
                            ? 'end'
                            : source
                              ? 'start'
                              : 'center'
                        }
                        xstyle={[
                          styles.headerContent,
                          header.column.getCanSort() && styles.sortableHeader,
                        ]}
                        {...(header.column.getCanSort()
                          ? {
                              role: 'button',
                              tabIndex: 0,
                              onClick: header.column.getToggleSortingHandler(),
                              onKeyDown: (event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault();
                                  header.column.getToggleSortingHandler()?.(
                                    event,
                                  );
                                }
                              },
                            }
                          : {})}
                      >
                        {slots?.content ??
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                        {header.column.getCanSort() ? (
                          <Icon
                            icon={
                              header.column.getIsSorted() === 'asc'
                                ? 'arrowUp'
                                : header.column.getIsSorted() === 'desc'
                                  ? 'arrowDown'
                                  : 'arrowsUpDown'
                            }
                            size="xsm"
                            xstyle={
                              !header.column.getIsSorted() &&
                              styles.sortIconInactive
                            }
                          />
                        ) : null}
                        {slots?.after}
                      </HStack>
                    }
                  </TableHeaderCell>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {bodyRows.map((row) => {
            const isExpandable = Boolean(
              rowExpansion &&
              (rowExpansion.isExpandable
                ? rowExpansion.isExpandable(row.original)
                : true),
            );
            const expansionKey =
              rowExpansion && isExpandable
                ? rowExpansion.getRowKey(row.original)
                : undefined;
            const isExpanded = Boolean(
              rowExpansion &&
              expansionKey &&
              rowExpansion.expandedIds.has(expansionKey),
            );
            const isRowHovered = hoveredRowId === row.id;
            const rowBg = isRowHovered ? CARD_HOVER_BG : CARD_BG;
            return (
              <Fragment key={row.id}>
                <TableRow
                  xstyle={[
                    isRowHovered ? styles.rowHovered : styles.row,
                    isExpandable && expandableRowStyles.clickableRow,
                    isExpanded && expandableRowStyles.expandedRow,
                  ]}
                  onMouseEnter={() => setHoveredRowId(row.id)}
                  onMouseLeave={() =>
                    setHoveredRowId((current) =>
                      current === row.id ? null : current,
                    )
                  }
                  {...(rowExpansion && isExpandable && expansionKey
                    ? {
                        'aria-expanded': isExpanded,
                        tabIndex: 0,
                        onClick: () => rowExpansion.onToggle(expansionKey),
                        onKeyDown: (event) => {
                          if (
                            event.target === event.currentTarget &&
                            (event.key === 'Enter' || event.key === ' ')
                          ) {
                            event.preventDefault();
                            rowExpansion.onToggle(expansionKey);
                          }
                        },
                      }
                    : {})}
                >
                  {row.getVisibleCells().map((cell) => {
                    const source =
                      /** @type {{source: import('./advance-table.jsx').AdvanceTableColumn<T>}} */ (
                        cell.column.columnDef.meta
                      ).source;
                    return (
                      <TableCell
                        key={cell.id}
                        data-column-key={cell.column.id}
                        xstyle={[
                          styles.align(source.align ?? 'start'),
                          pinStyle(cell.column),
                          (dividers === 'grid' || dividers === 'columns') &&
                            styles.cellDivider,
                        ]}
                        // Plain inline `style`, not `xstyle` — StyleX only
                        // takes background-color from its fixed token/
                        // keyword list, and `rowBg` is a runtime value (the
                        // whole point: it must be the row's OWN currently-
                        // resolved color, not a value the pinned cell
                        // merely `inherit`s — see the comment on `row`
                        // above for why `inherit` alone left pinned cells
                        // visibly stale on hover).
                        style={
                          cell.column.getIsPinned()
                            ? { backgroundColor: rowBg }
                            : undefined
                        }
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
                {isExpanded && rowExpansion ? (
                  <TableRow>
                    <TableCell
                      colSpan={row.getVisibleCells().length}
                      xstyle={expandableRowStyles.expandedPanel}
                    >
                      {rowExpansion.renderExpanded(row.original)}
                    </TableCell>
                  </TableRow>
                ) : null}
              </Fragment>
            );
          })}
          {bodyRows.length === 0 && emptyState ? (
            <TableRow>
              <TableCell colSpan={table.getVisibleLeafColumns().length}>
                {emptyState}
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
        {footerRows.length > 0 ? (
          <TableFooter xstyle={styles.footer}>
            {footerRows.map((row) => {
              const isRowHovered = hoveredRowId === row.id;
              const rowBg = isRowHovered ? TOTALS_HOVER_BG : TOTALS_BG;
              return (
                <TableRow
                  key={row.id}
                  data-is-totals-row="true"
                  xstyle={[
                    isRowHovered ? styles.totalsRowHovered : styles.totalsRow,
                  ]}
                  onMouseEnter={() => setHoveredRowId(row.id)}
                  onMouseLeave={() =>
                    setHoveredRowId((current) =>
                      current === row.id ? null : current,
                    )
                  }
                >
                  {row.getVisibleCells().map((cell) => {
                    const source =
                      /** @type {{source: import('./advance-table.jsx').AdvanceTableColumn<T>}} */ (
                        cell.column.columnDef.meta
                      ).source;
                    return (
                      <TableCell
                        key={cell.id}
                        data-column-key={cell.column.id}
                        xstyle={[
                          styles.align(source.align ?? 'start'),
                          pinStyle(cell.column),
                          (dividers === 'grid' || dividers === 'columns') &&
                            styles.cellDivider,
                        ]}
                        style={
                          cell.column.getIsPinned()
                            ? { backgroundColor: rowBg }
                            : undefined
                        }
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableFooter>
        ) : null}
      </Table>
    </div>
  );
  return filterPlugin.transformTableContext?.(content) ?? content;
}
