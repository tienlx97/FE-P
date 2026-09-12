# Proposal: Add contracts list totals row

**Status:** done
**Created:** 2026-09-12

## Why

The Hợp đồng (contracts) list showed one summary line ("Tổng giá trị: …")
below the table, covering only `contractValue`. The user asked for a
per-column totals row instead — Giá trị hợp đồng / Quyết toán / Đã thanh
toán / Chưa thanh toán each summed under their own column, across the whole
filtered result set (not just the current page). BE-kt-xnk's
`add-contract-totals-by-currency` change added the backend aggregate this
depends on (`Totals`, replacing `ValueTotals`).

## What changes

- `AdvanceTable` (`src/shared/components/advance-table.jsx`) gains a
  `totalsRows` prop: rows appended to the rendered data **after** the
  search/header-filter pipeline (never before — a totals row's cells aren't
  real per-contract values, so running them through the filter engine could
  hide the row under an active filter or throw).
- `contracts-list.jsx` builds one synthetic row per currency from the
  backend's `totals`, and wraps every column's `renderCell` so it renders
  the pre-summed amount for the four settlement columns, a "Tổng cộng"
  label for the first visible column, and blank for everything else on a
  totals row.
- The old single-line `summary` ("Tổng giá trị: …") is removed from the
  contracts list; the `summary` slot itself stays on `AdvanceTable` for any
  other list that still wants a plain footer line.

## Out of scope

- True `<tfoot>`/sticky-row rendering — `Table`'s data-driven mode has no
  footer concept (children mode does, but `AdvanceTable`'s shared shell
  isn't rewritten for it here). The totals row is an ordinary last row: it
  scrolls with the table and repeats identically on every page (the backend
  total covers the whole filtered set regardless of page).
- Any other list page (shipments, commissions, customers) — `totalsRows` is
  opt-in and unused by them.

## Decision log

| Date | Decision | Why |
|---|---|---|
| 2026-09-12 | Append totals rows to `AdvanceTable`'s data *after* filtering, not by threading them through the caller's `data` prop | Keeps them immune to the client-side quick-search/header-filter engine, which only knows about real Contract fields. |
| 2026-09-12 | Wrap every column's `renderCell` (not just the 4 financial ones) to special-case the totals row | `Table` calls every visible column's `renderCell` for every row; unguarded columns (Badge/Button-rendering ones especially) would crash on the totals row's missing fields. |
