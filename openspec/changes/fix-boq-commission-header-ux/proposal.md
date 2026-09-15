# Proposal: Fix BOQ/Commission actions, table header borders, and party-picker UX

**Status:** done
**Created:** 2026-09-15

## Why

User-reported UI feedback (2026-09-15), four issues:

1. The BOQ list has no "Thêm" action, unlike every other list (Contracts,
   Shipments, Commissions) — inconsistent with the rest of the app.
2. Every `AdvanceTable`/`TanStackDataTable` header renders its column and
   bottom dividers in `--color-border`, which is nearly the same luminance
   as the header's own mint background — the border is effectively
   invisible.
3. The Commission create dialog shows no Số hợp đồng/Dự án — a user
   creating a Commission from the contract picker has no on-screen
   confirmation of which contract they're creating it for.
4. Seller/Buyer's "Xem thêm thông tin chi tiết" toggle is interactive
   before any Bên bán/Khách hàng is picked, expanding onto a detail card
   with nothing meaningful to show.

## What changes

- `ContractPrivateInfosList` (BOQ): add a "Thêm" button that opens a
  contract picker (every contract is eligible — BOQ has no "already
  exists" state to filter, unlike Commission's picker), then opens the
  existing `ContractPrivateInfoDetailDialog` directly in edit mode for the
  chosen contract.
- `TanStackDataTable`'s shared `headerCell` style: both the column divider
  and the header/body divider now use `--color-border-emphasized` instead
  of the plain `--color-border` hairline, so they stay visible against the
  tinted header background. Affects every list in the app (shared
  component).
- `CommissionFields`/`CommissionFormDialog`: accept dedicated
  `contractNumber`/`projectName` props (independent of `commission`, which
  is null while creating) and thread them from all three call sites
  (`CommissionsList`'s create-from-picker and edit flows,
  `ContractsList`'s "Liên quan" tab summary).
- `SellerFields`/`CustomerFields`: new `isExpandDisabled` prop disables the
  "Xem thêm thông tin chi tiết" toggle (and keeps the section collapsed)
  until a seller/customer is selected or an existing inline company name is
  present. Wired from `SellerPickerFields`/`BuyerFields`.

## Out of scope

- Changing the BOQ/Commission data model or backend contract.
- Any other list's header/column layout beyond the border-color fix.

## Decision log

| Date | Decision | Why |
|---|---|---|
| 2026-09-15 | BOQ's contract picker lists every contract, unlike Commission's (which excludes contracts that already have one) | A `ContractPrivateInfoListItem` is a Contract row with nullable BOQ fields — every contract already has one; there is no "doesn't exist yet" state to exclude |
| 2026-09-15 | Header border fix uses `--color-border-emphasized` (already reserved in `theme.js` for boundaries needing contrast against a colored surface) rather than a new token | Reuses an existing, already-contrast-checked token instead of inventing a new one |
