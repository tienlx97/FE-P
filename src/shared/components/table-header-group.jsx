'use client';
import { Text } from '@astryxdesign/core/Text';
import { borderVars, colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import * as stylex from '@stylexjs/stylex';
import { useEffect, useState } from 'react';

const styles = stylex.create({
  bar: {
    alignItems: 'center',
    // Opaque, not just positioned on top: with `dividers="grid"` each
    // grouped column's own `<th>` still paints its own column-divider
    // border for its *entire* height, including the blank caption strip
    // this bar covers — without a matching background those dividers cut
    // straight through the middle of the spanning label. Painting over
    // them here merges the group visually while leaving those dividers
    // doing their job one row down, between the actual sub-column labels —
    // same as a spreadsheet's merged header cell.
    //
    // No `backgroundColor` here — `measure()` below reads the real header
    // cell's own computed background and applies it inline instead. A
    // theme's `table-header-cell` override (`astryx theme targets Table`)
    // compiles straight to a literal color in the built CSS, not a
    // reusable token, so hardcoding a second copy of that color here would
    // silently drift out of sync the next time the theme changes the
    // header color (as happened once already) — reading the live computed
    // style instead means this bar always matches whatever the header
    // actually looks like, with nothing to keep in sync by hand.
    borderBottomColor: colorVars['--color-border'],
    borderBottomStyle: 'solid',
    borderBottomWidth: borderVars['--border-width'],
    display: 'flex',
    justifyContent: 'center',
    pointerEvents: 'none',
    // `fixed`, not `absolute` — the real header `<th>` this bar overlays
    // is itself `position: sticky` (`theme.js`'s `table-header-cell`), so
    // once the page scrolls it visually stays pinned at the viewport's
    // top edge while an `absolute` sibling (positioned relative to the
    // scrolling `containerRef`) would scroll away underneath it, making
    // the "GIÁ TRỊ" label disappear (2026-09-12 regression). `fixed` keeps
    // this bar anchored to the viewport too, and `measure()` below
    // recomputes on scroll (not just resize/mutation) to track the sticky
    // header's on-screen position throughout the scroll, not just once
    // it's fully stuck.
    position: 'fixed',
    zIndex: 1,
  },
  hiddenCaption: {
    visibility: 'hidden',
  },
});

/**
 * Placeholder that a grouped `TableColumn.header` renders in place of the
 * per-column caption `TableHeaderGroupBar` used to repeat in every column of
 * the group (e.g. "GIÁ TRỊ" over "QUYẾT TOÁN", "GIÁ TRỊ" over "ĐÃ THANH
 * TOÁN", ...). It stays invisible — `TableHeaderGroupBar` draws the single
 * spanning label on top of it — but keeps reserving the same line height so
 * the header row doesn't reflow when the bar mounts/unmounts.
 * @param {{ groupKey: string, children: import('react').ReactNode }} props
 */
export function TableHeaderGroupCaption({ groupKey, children }) {
  return (
    <span data-header-group={groupKey} {...stylex.props(styles.hiddenCaption)}>
      <Text type="supporting" color="secondary">
        {children}
      </Text>
    </span>
  );
}

/**
 * Draws one label spanning the combined width of every header cell whose
 * column key is in `columnKeys`, positioned over the blank caption line
 * `TableHeaderGroupCaption` reserves in each of those columns' header — so
 * a set of related columns (e.g. the three settlement value columns) reads
 * as one grouped header ("GIÁ TRỊ" spanning "QUYẾT TOÁN" / "ĐÃ THANH TOÁN" /
 * "CHƯA THANH TOÁN") instead of the label being repeated in each column.
 *
 * astryx's `Table` maps header cells 1:1 to columns with no
 * spanning/colspan-header primitive, so this measures the real header
 * `<th>` and caption DOM instead of using a layout primitive — it keeps
 * working as columns resize, reorder, or get hidden via the view-options
 * popover, and renders nothing once the group's columns aren't all present
 * (e.g. one got hidden), silently degrading back to no group header.
 *
 * Render as an absolutely-positioned sibling of the `<Table>` (or whatever
 * wraps it), inside a `position: relative` container passed as
 * `containerRef`.
 * @param {{
 *   containerRef: import('react').RefObject<HTMLElement | null>,
 *   groupKey: string,
 *   columnKeys: string[],
 *   label: string,
 * }} props
 */
export function TableHeaderGroupBar({
  containerRef,
  groupKey,
  columnKeys,
  label,
}) {
  const [rect, setRect] = useState(
    /** @type {{ left: number, top: number, width: number, height: number, background: string } | null} */ (
      null
    ),
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    // Assigned to a `const` (not a hoisted `function` declaration) so
    // TypeScript keeps `container`'s non-null narrowing from the guard
    // above inside this closure — a hoisted declaration could in principle
    // be reached before that guard runs, so tsc otherwise re-widens it back
    // to `Element | null` here.
    const measure = () => {
      const cells = columnKeys
        .map((key) => container.querySelector(`th[data-column-key="${key}"]`))
        .filter((cell) => cell != null);
      if (cells.length !== columnKeys.length) {
        setRect(null);
        return;
      }
      const captions = cells
        .map((cell) => cell.querySelector(`[data-header-group="${groupKey}"]`))
        .filter((caption) => caption != null);
      if (captions.length !== cells.length) {
        setRect(null);
        return;
      }
      // Viewport-relative, not offset against `containerRect` — the bar is
      // `position: fixed` now (see `styles.bar`'s comment), so its `left`/
      // `top` need to be actual viewport coordinates, the same frame
      // `getBoundingClientRect()` already reports in.
      const cellRects = cells.map((cell) => cell.getBoundingClientRect());
      const captionRects = captions.map((caption) =>
        caption.getBoundingClientRect(),
      );
      const left = Math.min(...cellRects.map((r) => r.left));
      const right = Math.max(...cellRects.map((r) => r.right));
      const top = Math.min(...captionRects.map((r) => r.top));
      const bottom = Math.max(...captionRects.map((r) => r.bottom));
      // Read the real header cell's own resolved background instead of
      // guessing a token — whatever the theme paints `<th>` with, this bar
      // matches exactly, with nothing to keep in sync by hand.
      const background = getComputedStyle(
        /** @type {Element} */ (cells[0]),
      ).backgroundColor;
      setRect({ left, top, width: right - left, height: bottom - top, background });
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
    // The sticky header's on-screen position changes continuously while
    // scrolling (until it's fully stuck at `top: 0`), and this bar is
    // `position: fixed` now — without tracking scroll too, it would only
    // ever reflect the pre-scroll position. `capture: true` also catches
    // scroll on an inner scrollable ancestor (e.g. the table's own
    // horizontal-scroll wrapper), not just the window.
    window.addEventListener('scroll', measure, { passive: true, capture: true });
    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, { capture: true });
    };
    // columnKeys is a fresh array literal from the caller on every render —
    // compare by content instead of restarting the observers each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, groupKey, columnKeys.join('|')]);

  if (!rect) return null;

  return (
    <div
      aria-hidden="true"
      {...stylex.props(styles.bar)}
      style={{
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        backgroundColor: rect.background,
      }}
    >
      <Text type="supporting" color="secondary">
        {label}
      </Text>
    </div>
  );
}
