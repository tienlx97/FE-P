'use client';

import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import {
  pixel,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from '@astryxdesign/core/Table';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { VisuallyHidden } from '@astryxdesign/core/VisuallyHidden';
import * as stylex from '@stylexjs/stylex';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';

import { expandableRowStyles } from '@/shared/components/expandable-row-styles.jsx';
import { resolveTableSizes } from '@/shared/config/tanstack-table-columns.js';

const EXPANSION_COLUMN_KEY = '__expansion';

const styles = stylex.create({
  wrapper: { minWidth: 0 },
  table: (width) => ({
    borderCollapse: 'separate',
    borderSpacing: 0,
    minWidth: width,
    tableLayout: 'fixed',
    width,
  }),
  header: { position: 'sticky', top: 0, zIndex: 3 },
  headerCell: { position: 'relative', top: 'auto', zIndex: 0 },
  align: (align) => ({ textAlign: align }),
  pinned: (left, right) => ({ left, position: 'sticky', right, zIndex: 1 }),
  row: {
    backgroundColor: {
      default: colorVars['--color-background-card'],
      ':hover': `color-mix(in srgb, ${colorVars['--color-overlay-hover']}, ${colorVars['--color-background-card']})`,
    },
  },
  bodyPin: {
    backgroundColor: 'inherit',
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
 * emptyState: import('react').ReactNode}} props
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
}) {
  'use no memo';
  const wrapperRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const [availableWidth, setAvailableWidth] = useState(0);
  useEffect(() => {
    const element = wrapperRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setAvailableWidth(entry.contentRect.width),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
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
  }, [effectiveColumns, headerGroups, rowExpansion]);
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
    autoResetAll: false,
    state: {
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
  const content = (
    <div ref={wrapperRef} {...stylex.props(styles.wrapper)}>
      <Table
        density={density}
        dividers={dividers}
        hasHover
        xstyle={styles.table(table.getTotalSize())}
        aria-label="Danh sách hợp đồng"
        data-table-engine="tanstack"
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
                        xstyle={styles.headerContent}
                      >
                        {slots?.content ??
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
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
          {table.getRowModel().rows.map((row) => {
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
            return (
              <Fragment key={row.id}>
                <TableRow
                  xstyle={[
                    styles.row,
                    isExpandable && expandableRowStyles.clickableRow,
                    isExpanded && expandableRowStyles.expandedRow,
                  ]}
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
                          cell.column.getIsPinned()
                            ? styles.bodyPin
                            : undefined,
                        ]}
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
          {!data.some((row) => !row.__isTotalsRow) && emptyState ? (
            <TableRow>
              <TableCell colSpan={table.getVisibleLeafColumns().length}>
                {emptyState}
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
  return filterPlugin.transformTableContext?.(content) ?? content;
}
