# Proposal: Pin table header while scrolling

**Status:** done
**Created:** 2026-09-12

## Why

User asked for the table header (and ideally the "Tổng cộng" totals row) to
stay visible while scrolling a long list.

## What changes

- `theme.js`'s `table-header-cell` component override gains
  `position: sticky; top: 0; z-index: 1` — sticky is applied per header
  cell (`<th>`), not on `<thead>` itself (sticky on a table-header-group
  isn't reliably supported across browsers; sticky per cell is). This is a
  theme-wide change: every `Table` in the app gets a sticky header, not
  just the four lists with a totals row.
- Verified via computed style in a live browser session
  (`position: sticky`, `top: 0px`, `z-index: 1`, opaque background) against
  the running dev stack.

## Out of scope

- Pinning the totals ("Tổng cộng") row. `Table`'s data-driven mode (which
  `AdvanceTable` uses everywhere) has no `<tfoot>`/footer concept and no
  per-row styling hook — the totals row is an ordinary last `<tr>` in
  `<tbody>`, and `position: sticky` isn't reliably supported on `<tr>`
  itself (only on cells), and a theme override can't target *one specific*
  row differently from the rest of the body. Making it sticky would need
  either swizzling `Table` (`astryx swizzle Table`, ejecting it from the
  shared design system) or moving the totals row out of the `<table>`
  entirely into a separately-positioned bar with manually mirrored column
  widths — both are a materially bigger change than this one. Left for a
  follow-up once the user picks a direction.

## Decision log

| Date | Decision | Why |
|---|---|---|
| 2026-09-12 | Sticky header shipped as a global theme change; sticky totals row deferred, pending user decision on approach | The two asks have very different costs: header pin is a one-line CSS property on an existing theme key; totals-row pin needs an architectural change `Table`'s current API doesn't support. |
