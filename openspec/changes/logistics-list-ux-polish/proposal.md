# Logistics list UX polish: InProgress-only shipments, toolbar layout, link styling

## Why
A batch of Vietnamese feedback on the Contract/Shipment lists, same session
as `add-contract-export-value-columns`:
2. Only a contract "Đang thực hiện" (InProgress) should be selectable when
   creating a new Shipment (BE-kt-xnk tightened the matching rule).
3. Print/Export should sit on the same row as the primary "+" action button
   — refined mid-session to: that row should itself sit level with the page
   Title ("Hợp đồng"/"Shipment"), not the search/filter toolbar row below.
4. "Số hợp đồng" should render as a vivid blue link, not a ghost button —
   per a reference screenshot of an unrelated internal report.

## Accepted decisions
- **InProgress-only**: `shipment-contract-eligibility.js`'s two exported
  helpers now require `status === 'InProgress'` instead of `status !==
  'Cancelled'`. A third, separately hardcoded Vietnamese help string in
  `shipments-list.jsx`'s contract-picker dialog (not derived from either
  helper) needed its own fix — caught only by manually reopening that
  dialog in-browser after the helper-function fix looked complete.
- **Toolbar layout**: first pass reused `AdvanceTable`'s existing
  `primaryAction` prop (already in the same row as Print/Xuất/Refresh) to
  avoid restructuring the shared component (12 list screens). The
  follow-up ask — level with the page *Title*, not the search toolbar —
  needed an actual (but narrowly scoped) `AdvanceTable` change: a new
  optional `title` prop. When given, `AdvanceTable` renders a dedicated
  header row (`title` + Print/Xuất/`primaryAction`, extracted into shared
  local variables so the search-toolbar row's copy and the title row's copy
  are the exact same elements, never duplicated markup) above its own
  search toolbar; Refresh, ViewPresets, and "Tuỳ chọn hiển thị" deliberately
  stay in the toolbar row (not part of the request). Omitting `title` keeps
  every other consumer's layout byte-for-byte unchanged.
  `ContractsList`/`ShipmentsList` now pass `title={<Heading level={1}>…</Heading>}`
  instead of rendering that `Heading` themselves above `AdvanceTable`.
  `primaryAction`'s type gained an optional `icon` field (backward
  compatible) so Shipment's "+" icon survives the move.
- **Link styling**: `Link` (Astryx's sanctioned rich-table-cell pattern —
  see `astryx template TableRichCellTable`) with no `href` (renders as a
  link-styled button) replaces the ghost `Button`. Its `color` prop only
  offers this theme's brand-green accent, so `xstyle` sets
  `--color-icon-blue` directly — the same vivid blue as the un-themed base
  accent, matching the reference; `--color-text-blue` was tried first but
  is a deliberately muted/darker body-text shade that didn't match.

## Scope and behavior
Frontend only. Item 2's backend half is `BE-kt-xnk`'s
`restrict-shipment-creation-to-inprogress-contracts`.

## Out of scope
- Adding `title` to any other `AdvanceTable` consumer (only
  Contracts/Shipments were raised) — the other 10 keep their existing
  separate page-header layout.

## Verification
`pnpm lint`/`typecheck`/`structure`/`test`/`build`/`verify:quality` all
green. Manual browser check (claude-in-chrome): contract picker shows both
an ineligible-type and an ineligible-status (Cancelled) contract disabled
with correct reason text; "Số hợp đồng" renders as vivid blue link text
(`#0064E0`, confirmed via computed style); on both lists, In/Xuất/primary
action now render on the same row as the page Title, with Refresh/View
options staying in the search toolbar row below.
