# Proposal: Pin the totals row to the viewport bottom

**Status:** done
**Created:** 2026-09-12

## Why

Follow-on to `pin-table-header`: user asked for the "Tổng cộng" totals row
to also stay visible while scrolling, matching the header. `Table`'s
data-driven mode (used everywhere via `AdvanceTable`) has no `<tfoot>` and
no per-row styling hook, so the real totals row can't be made sticky
directly (see that change's "Out of scope"). Asked the user to choose
between swizzling `Table` (ejects it from the shared design system,
app-wide blast radius) or a scoped overlay bar; they asked for the
optimal choice instead of re-deciding.

## What changes

- New `TableStickyTotalsBar` (`src/shared/components/table-sticky-totals-bar.jsx`):
  a `position: fixed` bar pinned to the viewport bottom, independent of
  `Table`'s own DOM. For each real header `<th data-column-key>`, it
  measures `left`/`width` (same DOM-measurement technique
  `TableHeaderGroupBar` already uses and that this change's sibling fix
  hardened for scroll-tracking) and re-renders that column's totals cell
  at the same X position using the *same* `renderCell` `columnsWithTotalsRow`
  already special-cases for `__isTotalsRow` — so there's no separate
  totals-rendering logic to keep in sync.
  - One stacked row per `totalsRows` entry (multi-currency lists show
    several).
  - Only visible while the table itself is at least partly on screen
    (`IntersectionObserver`), so it doesn't float over unrelated content
    once the user scrolls well past the whole table.
- `AdvanceTable` renders it automatically whenever `totalsRows` is
  non-empty — no caller changes needed in `contracts-list.jsx`/
  `shipments-list.jsx`/`commissions-list.jsx`/`contract-private-infos-list.jsx`,
  all four already pass `totalsRows`.
- The real totals row still renders normally inside the `<table>` too
  (unchanged) — `Table` gives no way to suppress one specific row's
  rendering, so this is an *additional* fixed overlay, not a replacement.
  When scrolled all the way to the table's own bottom, the totals may
  render twice (once inline, once in the fixed bar) — accepted, minor,
  matches how many spreadsheet-style UIs behave.

## Out of scope

- Swizzling `Table` — rejected: it's used broadly across the app: opting
  the whole shared component out of upstream Astryx updates for a benefit
  scoped to 4 lists is a worse trade than a self-contained overlay
  component.
- Suppressing the real totals row's inline rendering — not supported by
  `Table`'s data-driven API (no per-row style/visibility hook).

## Decision log

| Date | Decision | Why |
|---|---|---|
| 2026-09-12 | Overlay bar (reusing `TableHeaderGroupBar`'s measurement technique) over swizzling `Table` | Contained to one new component + a few lines in `AdvanceTable`; swizzling would opt every table in the app out of upstream updates for a benefit scoped to 4 lists. |
| 2026-09-12 | Re-render totals cells via the existing `renderCell` instead of cloning the real totals row's DOM | `Table` exposes no `data-row-id` to find that specific `<tr>` in the DOM, and cloning rendered React output isn't straightforward; re-invoking `renderCell` is the same content the real row already shows, just positioned independently. |
