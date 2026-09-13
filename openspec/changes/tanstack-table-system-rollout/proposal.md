# TanStack table system rollout

**Status:** in-progress
**Created:** 2026-09-13

## Why

`tanstack-contracts-table` proved TanStack Table v8 as a drop-in engine
under `AdvanceTable`, scoped to contracts only (Golden Rule #12/ADR-0004
history shows patterns that stay scoped tend to get re-broken elsewhere —
`renderExpanded` was already a repeat offender). The user has now set this
as a system-wide golden rule (Golden Rule #13,
`harness/GOLDEN_RULES.md`): every list/data table renders through TanStack
Table, not just contracts. `AdvanceTable`'s legacy non-TanStack renderer
branch is removed entirely so there is only one engine to reason about,
test, and extend.

## What changes

- `AdvanceTable` always renders through `TanStackDataTable`; the legacy
  Astryx-driven `Table` renderer branch is deleted.
- `TanStackDataTable` gains row-expansion support (`renderExpanded` +
  controlled expanded-key set), replacing Astryx's
  `useTableRowExpansion`/`createRowExpansionInteractionPlugin` plugins,
  preserving the Golden Rule #12 portal-stacking fix (no `*FormDialog`
  inside `renderExpanded`).
- Every remaining `AdvanceTable` consumer keeps its existing visual
  behavior, filters, CSV export, server pagination and dialogs:
  `backup-list.jsx`, `user-list.jsx`, `commissions-list.jsx`,
  `contract-full-view-panel.jsx`, `contract-private-infos-list.jsx`,
  `countries-list.jsx`, `customers-list.jsx`, `places-list.jsx`,
  `shipments-list.jsx`.
- New mechanical check `harness/checks/tanstack-table-only.sh` wired into
  `./harness/verify.sh`, enforcing Golden Rule #13 going forward.

## Out of scope

- No new visual design; existing Astryx theme/density/dividers/toolbar
  stay as they are per list.
- No change to API/query contracts, pagination behavior, or CSV format.
- `TableStickyTotalsBar` (the fixed totals row) is unchanged — it already
  works engine-agnostically off `tableColumns`/`totalsRows`.

## Decision log

| Date | Decision | Why |
|---|---|---|
| 2026-09-13 | Add row-expansion to `TanStackDataTable` rather than keeping a legacy renderer path just for `user-list`/`customers-list` | Golden Rule #13 requires ONE engine; a permanent two-engine split defeats the point and leaves rule #12's fix duplicated across two code paths |
