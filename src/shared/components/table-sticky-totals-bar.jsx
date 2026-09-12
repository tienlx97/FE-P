'use client';
import { borderVars, colorVars, spacingVars } from '@astryxdesign/core/theme/tokens.stylex';
import * as stylex from '@stylexjs/stylex';
import { useEffect, useState } from 'react';

const styles = stylex.create({
  wrapper: {
    // Fixed, spanning the full viewport width — child rows/cells below
    // position themselves with viewport-absolute `left`/`width` (measured
    // from the real header `<th>`s, same technique
    // `table-header-group.jsx`'s `TableHeaderGroupBar` uses), which only
    // lines up correctly if this ancestor's own containing block starts at
    // viewport x=0.
    bottom: 0,
    left: 0,
    pointerEvents: 'none',
    position: 'fixed',
    right: 0,
    zIndex: 2,
  },
  row: {
    borderTopColor: colorVars['--color-border'],
    borderTopStyle: 'solid',
    borderTopWidth: borderVars['--border-width'],
    height: '40px',
    position: 'relative',
  },
  cell: {
    alignItems: 'center',
    display: 'flex',
    paddingInline: spacingVars['--spacing-3'],
    position: 'absolute',
    top: 0,
    bottom: 0,
    overflow: 'hidden',
  },
});

/**
 * Pins the totals row(s) `AdvanceTable`'s `totalsRows` prop supplies to the
 * bottom of the viewport, independent of `Table`'s own scrolling body.
 *
 * `Table` (data-driven mode, used everywhere via `AdvanceTable`) has no
 * `<tfoot>`/footer concept and no per-row styling hook — a totals row is
 * just an ordinary last `<tr>`, and `position: sticky` isn't reliably
 * supported on `<tr>` itself. So instead of trying to sticky the real row,
 * this re-renders each column's totals cell (via the same `renderCell`
 * `columnsWithTotalsRow` already special-cases for `__isTotalsRow`) inside
 * an independent `position: fixed` bar, positioned per-column using the
 * real header `<th>`'s measured `left`/`width` — same DOM-measurement
 * technique `TableHeaderGroupBar` uses for its spanning group label,
 * proven there to track column resize/reorder/visibility changes and (as
 * of the 2026-09-12 sticky-header fix) scroll.
 *
 * Multiple `totalsRows` entries (one per currency) stack as separate rows
 * within the one fixed wrapper — cheaper than computing a `bottom` offset
 * per row, since they're normal flow children of the single fixed
 * ancestor.
 * @param {{
 *   containerRef: import('react').RefObject<HTMLElement | null>,
 *   tableColumns: import('@astryxdesign/core/Table').TableColumn<any>[],
 *   totalsRows: Record<string, unknown>[],
 * }} props
 */
export function TableStickyTotalsBar({ containerRef, tableColumns, totalsRows }) {
  const [columnRects, setColumnRects] = useState(
    /** @type {{ key: string, left: number, width: number, align: string | undefined }[]} */ (
      []
    ),
  );
  const [isContainerVisible, setIsContainerVisible] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const measure = () => {
      const cells = Array.from(container.querySelectorAll('th[data-column-key]'));
      setColumnRects(
        cells.map((cell) => {
          const rect = cell.getBoundingClientRect();
          return {
            key: /** @type {string} */ (cell.getAttribute('data-column-key')),
            left: rect.left,
            width: rect.width,
            align: /** @type {HTMLElement} */ (cell).style.textAlign || undefined,
          };
        }),
      );
    };

    measure();
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(container);
    const mutationObserver = new MutationObserver(measure);
    mutationObserver.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    });
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, { passive: true, capture: true });

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => setIsContainerVisible(entry.isIntersecting),
      // Only pin while the table itself is at least partly on screen —
      // otherwise the bar would keep floating at the bottom of the
      // viewport long after the user scrolled past the whole table.
      { threshold: 0 },
    );
    intersectionObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, { capture: true });
    };
  }, [containerRef, tableColumns]);

  if (!isContainerVisible || columnRects.length === 0 || totalsRows.length === 0) {
    return null;
  }

  const columnsByKey = new Map(tableColumns.map((column) => [column.key, column]));

  return (
    <div aria-hidden="true" {...stylex.props(styles.wrapper)}>
      {totalsRows.map((totalsRow, rowIndex) => (
        <div
          // eslint-disable-next-line react/no-array-index-key -- totalsRows has no stable id of its own worth threading through just for this key
          key={rowIndex}
          {...stylex.props(styles.row)}
          style={{ backgroundColor: 'var(--color-background-muted)' }}
        >
          {columnRects.map((columnRect) => {
            const column = columnsByKey.get(columnRect.key);
            if (!column) return null;
            return (
              <div
                key={columnRect.key}
                {...stylex.props(styles.cell)}
                style={{
                  left: columnRect.left,
                  width: columnRect.width,
                  justifyContent:
                    columnRect.align === 'end' ? 'flex-end' : 'flex-start',
                }}
              >
                {column.renderCell?.(totalsRow)}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
