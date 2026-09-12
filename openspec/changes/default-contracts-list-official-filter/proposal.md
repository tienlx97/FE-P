# Proposal: Default contracts list to Loại hợp đồng = Chính thức

**Status:** done
**Created:** 2026-09-12

## Why

The Hợp đồng (contracts) list opened unfiltered, mixing Draft (working
copy) and Official contracts together. User asked for it to default-load
with "Loại hợp đồng: Chính thức" applied.

## What changes

- `contracts-list.jsx`'s `filterConditions` state initializes to one
  `contractType Equals Official` condition instead of `[]`. It's an
  ordinary advanced-filter condition, so it behaves exactly like a
  user-applied one (visible in the funnel dialog, counted in "Đang áp dụng
  N điều kiện lọc", removable/editable).

## Out of scope

- Persisting the user's own filter choice across sessions/reloads — this
  only changes the initial default, not a "remember last filter" feature.

## Decision log

| Date | Decision | Why |
|---|---|---|
| 2026-09-12 | Seed `filterConditions` state instead of adding a separate "default filter" concept | It's server-side filtering already wired through `AdvancedTable`'s existing condition-array contract; no new mechanism needed. |
