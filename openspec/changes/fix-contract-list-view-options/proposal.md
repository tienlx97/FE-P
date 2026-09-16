# Fix contract list view-options bugs

**Status:** done
**Created:** 2026-09-16

## Why

User report, three items in one message:
1. The "Lọc theo trạng thái" status quick filter (Chưa thực hiện / Đang
   thực hiện / Đã hoàn thành / Đã huỷ) above the contracts list showed a
   spurious vertical scrollbar.
2. Fields added to `Contract` in earlier changes (`sellerSigned`,
   `buyerSigned`, `projectCompletionDate`) never reached the "Tuỳ chọn
   hiển thị" column picker — user asked for a golden rule so this stops
   recurring.
3. Column visibility/order, row density, and sticky-column-edge choices
   made in "Tuỳ chọn hiển thị" reset on every reload — user asked for
   `localStorage` persistence, same treatment as the existing layout
   preferences (hide side nav / focus mode).

## What changes

- `contracts-list.jsx`'s `statusFilter` xstyle now pins `overflowY:
  'hidden'` alongside the existing `overflowX: 'auto'`. Root cause:
  Astryx `SegmentedControl`'s own base styles default both axes to
  `overflow: auto`; a 1px `scrollHeight`/`clientHeight` rounding mismatch
  on this always-single-line row tripped the inherited Y-axis auto into
  showing a permanent, empty scrollbar. Verified live (`agent-browser`/
  Claude-in-Chrome): scrollbar gone, `overflowY` computed as `hidden`.
- `contracts-table.js` `COLUMN_OPTIONS` gained `projectCompletionDate`
  ("Ngày hoàn thành dự án"), `sellerSigned` ("Bên bán đã ký"),
  `buyerSigned` ("Bên mua đã ký"); `contracts-list.jsx` gained matching
  column definitions (date formatting / "Đã ký"–"Chưa ký", same pattern
  as `commissions-list.jsx`'s `sellerSigned`/`partySigned` columns).
  `projectCompletionDate` also added to `SORTABLE_COLUMN_KEYS` (BE already
  supports it — `ContractSortFields.cs`).
- Discovered and fixed the *inverse* of the same drift in the same file:
  `note` ("Ghi chú") already had a `COLUMN_OPTIONS` entry but no column
  definition — toggling it on silently did nothing. Added the matching
  column.
- New `harness/GOLDEN_RULES.md` rule #14 (v5) covering this whole class of
  drift (schema field ↔ `COLUMN_OPTIONS` ↔ column definition, both
  directions), enforcement `manual` (no automated check written this
  pass — recorded as a harness gap below).
- New `src/shared/hooks/use-persisted-table-view-options.js`: persists
  `AdvanceTable`'s column keys / density / sticky-start / sticky-end to
  `localStorage`, keyed per list via a slugified `entityLabel` (already
  unique per `AdvanceTable` caller — contracts, shipments, commissions,
  customers, etc., 10 lists total). Uses the same `useSyncExternalStore`
  idiom as `useLayoutPreferences` (avoids both a hydration mismatch
  against server-rendered defaults and the "no setState inside an effect"
  lint rule a naive `useEffect`-based read would trip). Wired into
  `advance-table.jsx`, replacing its four local `useState` calls — every
  `AdvanceTable` consumer gets persistence "for free," not just contracts.
  Stored column keys are intersected against the *current* `columnOptions`
  on every read, so a stale/renamed key never resurfaces and a newly-added
  `isAlwaysVisible` column always stays included.
- Verified live: added the 3 new columns via the picker, reloaded the
  page — selection survived; confirmed the `localStorage` key/value
  directly (`kt-xnk.table-view:hop-dong`).

## Out of scope

- No automated check for golden rule #14 (schema/`COLUMN_OPTIONS`/column-def
  drift) — flagged as a harness gap, not built this pass.
- Other 9 `AdvanceTable` consumers get persistence via the same shared
  hook but weren't individually re-verified in the browser — the change is
  in the shared component only, no per-caller wiring needed, and
  `./harness/verify.sh` (lint/typecheck/structure/unit tests/build) covers
  them.
- Did not audit other features (Shipment, Commission, BOQ, ...) for the
  same "new field never added to COLUMN_OPTIONS" drift beyond what golden
  rule #14 now documents — out of the scope of this user's report, which
  was Contract-specific.

## Decision log

| Date | Decision | Why |
|---|---|---|
| 2026-09-16 | `usePersistedTableViewOptions` lives in `src/shared/hooks/`, wired once into `advance-table.jsx` rather than per-list | User's ask ("Tuỳ chọn hiển thị ở UI") wasn't contracts-specific; `entityLabel` is already a unique per-list identifier every caller supplies, so the shared component is the natural single point of change |
| 2026-09-16 | `useSyncExternalStore`, not `useState` + `useEffect` | A naive effect-based localStorage read trips this repo's `react-hooks/set-state-in-effect` lint rule and risks a hydration mismatch; `useLayoutPreferences` already established this idiom for the same class of problem |
