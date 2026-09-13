# Proposal: Status quick-filter + CSV export

**Status:** done
**Created:** 2026-09-13

## Why

Follow-on to a UI review (kiểm tra UI, đề xuất chỉnh sửa/thêm tính năng).
User picked two of the proposed items: server-side quick filtering by
Trạng thái/Tình trạng (Hợp đồng, Shipment), and CSV export for the list
tables. Also asked to double-check whether the payment-term percentage
validator ("Tổng tỷ lệ: 200%/100%" seen on sample data) actually blocks
save — confirmed it does, server-side
(`ContractInputValidator.PaymentRatiosSumTo100`, `FluentValidation`); the
200% sample row was inserted directly via `db/sample-data.sql`, bypassing
the API, not a validation gap.

## What changes

- **Status quick filter — Hợp đồng**: a `SegmentedControl` pill row
  ("Tất cả" + the 4 `contractStatusOptions`) above the table, writing a
  `status Equals X` condition into the same `filterConditions` state the
  funnel dialog edits — a real server refetch across the whole filtered
  set, not `AdvanceTable`'s own `quickFilters` prop (client-side-only,
  filters just the already-fetched page — confirmed by reading its
  implementation, same limitation the existing per-column header filter
  already has).
- **Status quick filter — Shipment**: same idea, but a `Selector` dropdown
  (`hasClear`, `hasSearch`) instead of pills — 8 `shipmentStatusOptions`
  don't fit a pill row.
- New shared helper `upsertEqualsFilterCondition` (`src/shared/config/`):
  replaces-or-removes one condition by field in an
  `AdvancedFilterCondition[]`, leaving every other condition (e.g.
  contracts' default `contractType Equals Official`) untouched.
- **CSV export**: `AdvanceTable` gained a toolbar button ("Xuất CSV (trang
  hiện tại)") next to Refresh, automatic for all 4 lists that use it. New
  `AdvanceTableColumn<T>` type (`TableColumn<T>` + optional
  `exportValue(row)`) lets a column override the plain `row[key]` dump —
  added where the raw field isn't the right export value: enum codes
  (status, contractType, shipment type), nested objects (`buyer` →
  `.companyName`), combined display fields (`incoterm` + `incotermYear`),
  arrays (`paymentTerms`, `bankIds`), booleans (`sellerSigned`/
  `partySigned` → "Đã ký"/"Chưa ký"). UTF-8 BOM prefix so Excel opens
  Vietnamese diacritics correctly instead of guessing Windows-1252.

## Out of scope

- Exporting the *whole* filtered dataset across every page — `data` is
  whatever the caller already paginated-fetched; exporting everything
  would need a separate unpaginated request per list. Scoped to "current
  page" (button tooltip says so explicitly).
- Status quick filter for Commission/BOQ — neither has a status-like enum
  field worth a dedicated quick filter.
- `exportValue` fidelity for BOQ/Commission columns beyond the couple that
  clearly needed it (booleans) — most of their columns are already
  raw-compatible strings/numbers.

## Decision log

| Date | Decision | Why |
|---|---|---|
| 2026-09-13 | Status quick filter writes into `filterConditions` (server-side) directly in each list component, not `AdvanceTable`'s `quickFilters` prop | That prop is wired to client-side-only `searchFilters`, which only filters the already-fetched page — confirmed by reading `advance-table.jsx`; reusing it for "Trạng thái" would have silently missed matches on other pages. |
| 2026-09-13 | CSV export scoped to the current page, not the whole filtered dataset | Every list here is server-paginated; a "export everything" version needs a second unpaginated fetch per list — bigger scope than asked for, can be added later if wanted. |
