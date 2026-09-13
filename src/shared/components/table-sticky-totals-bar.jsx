'use client';
import {
  borderVars,
  colorVars,
  spacingVars,
} from '@astryxdesign/core/theme/tokens.stylex';
import * as stylex from '@stylexjs/stylex';
import { useEffect, useState } from 'react';

const styles = stylex.create({
  clip: (left, right) => ({ clipPath: `inset(0 ${right}px 0 ${left}px)` }),
  wrapper: {
    // Fixed, spanning the full viewport width — child rows/cells below
    // position themselves with viewport-absolute `left`/`width` (measured
    // from the real header `<th>`s), which only
    // lines up correctly if this ancestor's own containing block starts at
    // viewport x=0.
    bottom: 0,
    left: 0,
    overflow: 'hidden',
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
    backgroundColor: colorVars['--color-background-muted'],
    bottom: 0,
    display: 'flex',
    overflow: 'hidden',
    paddingInline: spacingVars['--spacing-3'],
    position: 'absolute',
    top: 0,
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
 * real header `<th>`'s measured `left`/`width`, tracking column
 * resize/reorder/visibility and scroll. TanStack's grouped headers expose
 * data-column-key only on leaf cells so each total is measured once.
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
export function TableStickyTotalsBar({
  containerRef,
  tableColumns,
  totalsRows,
}) {
  const [columnRects, setColumnRects] = useState(
    /** @type {{ key: string, left: number, width: number, align: string | undefined, pinned: boolean }[]} */ ([]),
  );
  const [isContainerVisible, setIsContainerVisible] = useState(false);
  // The real totals row(s) already being fully on screen is a separate
  // condition from the container merely intersecting the viewport — a
  // short table that fits on one page has BOTH true at once, which used
  // to show the real row AND this fixed duplicate simultaneously. Hiding
  // the fixed bar whenever the real row is already fully visible fixes
  // that without weakening the actual pin-while-scrolling behavior (a
  // long table's totals row starts off-screen, so this stays false until
  // the user scrolls all the way down to it).
  const [isRealTotalsRowVisible, setIsRealTotalsRowVisible] = useState(false);
  const [clip, setClip] = useState({ left: 0, right: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const measure = () => {
      const bounds = container.getBoundingClientRect();
      setClip({
        left: Math.max(0, bounds.left),
        right: Math.max(0, window.innerWidth - bounds.right),
      });
      const cells = Array.from(
        container.querySelectorAll('th[data-column-key]'),
      );
      setColumnRects(
        cells.map((cell) => {
          const rect = cell.getBoundingClientRect();
          return {
            key: /** @type {string} */ (cell.getAttribute('data-column-key')),
            left: rect.left,
            width: rect.width,
            align: getComputedStyle(cell).textAlign,
            pinned: getComputedStyle(cell).position === 'sticky',
          };
        }),
      );

      const totalsRowElements = Array.from(
        container.querySelectorAll('[data-is-totals-row="true"]'),
      );
      setIsRealTotalsRowVisible(
        totalsRowElements.length > 0 &&
          totalsRowElements.every((row) => {
            const rect = row.getBoundingClientRect();
            return rect.top >= 0 && rect.bottom <= window.innerHeight;
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
    window.addEventListener('scroll', measure, {
      passive: true,
      capture: true,
    });

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

  if (
    !isContainerVisible ||
    isRealTotalsRowVisible ||
    columnRects.length === 0 ||
    totalsRows.length === 0
  ) {
    return null;
  }

  const columnsByKey = new Map(
    tableColumns.map((column) => [column.key, column]),
  );

  return (
    <div
      aria-hidden="true"
      data-testid="sticky-totals-bar"
      {...stylex.props(styles.wrapper, styles.clip(clip.left, clip.right))}
    >
      {totalsRows.map((totalsRow, rowIndex) => (
        <div
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
                  zIndex: columnRect.pinned ? 1 : 0,
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
