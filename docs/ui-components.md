# UI component map

## Shared

| Responsibility | Source |
|---|---|
| Table state, filtering and plugins | `src/shared/components/advance-table.jsx` |
| Search/filter dialog | `src/shared/components/advance-table-search-dialog.jsx` |
| Page navigation and ranges | `src/shared/components/advance-table-pagination.jsx`, `src/shared/config/table-pagination.js` |
| View-options navigation, density and pinning | `src/shared/components/table-view-options-popover.jsx` |
| Visible/available columns and reordering | `src/shared/components/table-columns-panel.jsx` |
| Responsive paired fields | `src/shared/components/form-grid.jsx` |
| Collapsible form topic | `src/shared/components/form-section.jsx` |

## Logistics

List entrypoints stay under `src/features/logistics-contracts/components/`.
Static table definitions live in `config/{contracts,commissions,shipments,customers}-table.js`.
`sidebarLogistics.json` groups routes into "NGHIỆP VỤ" (Hợp đồng/Shipment/
Commission/BOQ) and "DANH MỤC" (Khách hàng/Quốc gia/Cảng·Nơi), each item
carrying its own `allowedPermissions` (`shared/api/nav.js`'s
`filterSidebarRoutesByPermissions`, which also drops a section header once
every item under it is filtered out). `/logistics` itself redirects to
Hợp đồng for `logistics:contracts:view`, offers a BOQ shortcut for
`logistics:secret`-only visitors, or shows a plain landing banner otherwise
— it never redirects into a route the visitor can't open. The old two-level
hub pages (`/logistics/contracts-overview`, `/logistics/config`) still
resolve directly for old bookmarks/links; the sidebar just no longer routes
through them.

- Contract (`contracts-list.jsx` → `contract-form-dialog.jsx`, a bespoke
  `CommonDialog` shell, not `FormDialog`): one fullscreen workspace with
  five tabs — Hồ sơ (profile), Phụ lục (annexes), Thanh toán (payment
  schedule), Liên quan (related: Shipment/Commission/BOQ), Xem đầy đủ (full
  view). New contracts keep Phụ lục/Thanh toán/Liên quan/Xem đầy đủ
  `aria-disabled` until the contract itself is saved (no `contractId` to
  key child relations on yet). "Liên quan" opens Shipment/Commission/BOQ's
  own shared editor (below) — a summary card per related entity, not
  embedded fields; BOQ's card/query is gated on `logistics:secret` at the
  UI, route and query layer. "Xem đầy đủ" (`contract-full-view-panel.jsx`)
  is a read-only quick-lookup screen, not a management surface: a search
  bar filters a `TabList` of the contract's Shipments (matching
  Shipment/cost/VGM fields, lowercased substring — VGM is fetched for
  every Shipment up front via `use-shipments-vgms-queries.js`'s
  `useQueries` batch, only while this tab is mounted), and the selected
  Shipment's info/VGM(`isReadOnly`)/costs render stacked on one screen —
  no row-expansion, no inner tabs, unlike "Liên quan". `ShipmentInfoSection`/
  `ShipmentCostsSection` are shared with `ShipmentExpandedDetails`'s own
  Thông tin/Chi phí inner tabs (factored out to avoid duplicating the
  field lists). A funnel button opens "Bộ lọc nâng cao", reusing
  `AdvancedFilterBuilder` (the same field/operator/value condition-row
  component `AdvanceTable`'s own filter-builder dialog uses) evaluated
  client-side over 5 string fields (Shipment/booking/VGM container/VGM
  seal/cost name) instead of sent to a server; applying it replaces the
  plain search box (disabled while active).
- Shipment/Commission/BOQ share **one editor each** between Contract's
  "Liên quan" tab and their own standalone list —
  `shipment-form-dialog.jsx`/`commission-form-dialog.jsx`/
  `contract-private-info-detail-dialog.jsx`. Opening one from "Liên quan"
  hides (not unmounts) `ContractFormDialog` underneath instead of stacking
  a second fullscreen `<dialog>` — Astryx's `Dialog` never unmounts
  `children` when `isOpen` flips false (only the portal's native `<dialog>`
  hides), so toggling `isOpen` on the Contract dialog is a safe "pause,
  don't lose state" — and returning re-shows Contract exactly where it was
  (same tab, same scroll). Short "quick-add" child dialogs (annex/payment/
  VGM) still stack on top deliberately; those are not full workspaces.
- Shipment: `shipment-form-dialog.jsx` (create/view/edit) uses
  `shipment-fields.jsx` → `shipment-booking-fields.jsx` /
  `shipment-lot-fields.jsx` / VGM and cost editors, tabbed
  (Thông tin/VGM/Chi phí Logistics). VGM is disabled until the Shipment
  itself is saved.
- Commission: `commission-form-dialog.jsx` (create/view/edit); view content
  uses `commission-expanded-details.jsx` with related annex/payment
  actions. 1:1 with its Contract.
- Record code cells (contract number, shipment code, commission code, BOQ's
  contract number) are a ghost `Button` opening the same Xem
  `RecordActionsMenu`'s "Xem" item opens — one `open<Entity>(row, mode)`
  helper per list backs both, so they can't drift.
- `AdvanceTable` accepts an optional `viewPresets` prop (array of
  `{key, label, columnKeys}`) rendered as a `SegmentedControl` in the
  toolbar — a quick-swap between column sets (e.g. Contracts' "Mặc định"
  vs. "Tài chính", the latter surfacing the settlement-value group).
  Loose, not a strict mode: picking one just replaces the active column
  set: the column picker can still further customize afterward.

All names above refer to `.jsx` files. Existing feature `index.js` exports remain
the integration surface. Add/edit dialogs are siblings of their tables.

## Verification

Run `./harness/verify.sh`. For form layout, open the dialog in an isolated
agent-browser session and evaluate `harness/checks/form-geometry.js` using
`eval --stdin` or base64 input. It throws on horizontal clipping, overlapping
input controls, or an offscreen submit button. It is an explicit browser probe,
not an automatically scheduled e2e test; editable tables may intentionally
scroll and should be checked separately.

Capture desktop/mobile screenshots in a dated `harness/runs/` directory.
Check controls inside dialogs/popovers: document width alone misses clipping
inside overlays. Review column transfer, filter recovery, accordion/tab value
preservation, and mouse selection in edit dialogs after shared UI changes.

## Operational dialogs

`CommonDialog` owns overlay geometry and surface; compact dialogs use the
available mobile height. `FormDialog` owns the header, navigation slot, one
content scroll region and save/cancel footer. Pass controlled `draft` values,
`fieldStatuses` and the existing async `onSubmit`. Return/await all persistence
operations so the pending guard covers the complete save. Set `isReady=false`
until asynchronous defaults have been seeded. Do not nest another native form
inside its children; the shell already portals an independent themed form and
stops submit propagation. Reset/unmount controller state on confirmed close.

`FormDialog.onCancelEdit` (optional): when the parent supplies it — only
when an existing record is being edited, e.g. `ShipmentFormDialog`/
`CommissionFormDialog` pass it conditionally on `shipment`/`commission`
being non-null — "Hủy"/Escape on a non-dirty edit calls it instead of
closing the whole dialog, dropping back to Xem in place ("về Xem tại chỗ").
Creating a new record has no Xem to return to, so it's left unset there and
Hủy still closes. `ContractFormDialog`'s own bespoke shell implements the
same rule directly (`finish('cancel')`). A dirty draft always shows the
"Bỏ thay đổi chưa lưu?" confirm first, on either path.

Shipment, Commission and User use fullscreen. Customer, Country, Place, bank,
annex, payment, VGM, organization and password dialogs use compact widths.
Shipment keeps navigation outside the scroll region, disables VGM until saved,
and reveals the tab containing validation errors. User opens Work initially,
reveals all sections on validation and offers retry when detail/banks fail.

Run `node harness/checks/dialog-browser.mjs` against local `pnpm dev` for the
mocked regression suite. It intercepts backend calls with synthetic fixtures
and records screenshots, geometry and behavioral checks under `harness/runs/`.
The suite is manual; the full gate does not run a browser server automatically.

## Logistics list actions

Contracts, standalone Shipments and Commissions expose `RecordActionsMenu`
(Xem/Sửa) in an always-visible final column, plus the record's own code cell
(see above) as a second Xem entry point. `AdvanceTable.fixedEndColumnKeys`
keeps that column last and end-pinned when visible columns/pin options change.
Standalone Shipment/Commission row expansion is removed. The nested Shipment
panel inside Contract retains its existing behavior.

`FormDialog.isReadOnly` replaces Save with distinct keyed Edit/Close actions.
An edit transition rebases the draft after the feature controller resets from
its latest record, preserving payments added through a child editor. Successful
Commission/Shipment mutations await both per-contract and standalone list query
invalidation. The singular `/logistics/commission` URL redirects to the existing
canonical `/logistics/commissions` route with the same permission requirement.

Regression: `node harness/checks/logistics-actions-browser.mjs` runs against a
local dev server with synthetic backend fixtures only. It covers menu contents,
read-only view, direct edit, child operations, refreshed payments, sticky column
geometry and mobile dialogs. `dialog-browser.mjs` covers existing creation and
shared-form guards.

## Stable view/edit geometry

Contract (Hồ sơ/Phụ lục/Thanh toán/Liên quan/Xem đầy đủ), Shipment and Commission keep
the same field grid in every mode. Prefer a control's own read-only API
(`isReadOnly` on `TextInput`/etc.); Astryx's `Selector`/`DateInput`/
`CheckboxList` expose no such prop, only `isDisabled` — the wrong visual/tab-
order for Xem (dims the control, drops it from the tab order). Those wrap in
`shared/components/read-only-lock.jsx`'s `ReadOnlyLock` instead: a capture-
phase click/keydown/paste/cut interceptor (`display:contents`, no box of its
own) that keeps the control at full opacity, its value announced and
selectable, and still reachable by Tab, just inert to input. Keep toolbar
actions and table columns in place, disabling parent mutations in view.
Commission quick-payment reuses the Add slot for its independent child
dialog. VGM mutations remain available only in edit.

Existing-record titles, footer action widths and seller/buyer disclosures
remain stable across view/edit. Do not reintroduce separate MetadataList
branches for editable fields or conditionally remove currency/action slots.
Creation keeps helper text and Commission's metadata placeholder slots.

`node harness/checks/stable-dialog-layout-browser.mjs` compares control
rectangles, footer geometry, scroll and zero writes on edit at 1440/768/390/
320px (`browser('set','viewport', ...)`, not `resize_window` — see the
script's own comments for the Windows `agent-browser` quoting/`wait --fn`
workarounds this needed). The accepted per-control displacement is at most
2 CSS pixels; a `ReadOnlyLock`-wrapped control is excluded from the
"editable in Xem" check via its `data-readonly-lock` marker, not by
guessing at native `readOnly`/`disabled`. Also covers: the reverse Hủy
transition (edit with no changes must land back on the exact Xem geometry);
client-side validation and a real network-abort error (draft survives, no
real reflow — the error `Banner`'s own `scrollIntoView` is normalized out
before comparing, since that's a deliberate scroll, not a regression); and
keyboard/focus (`ReadOnlyLock` fields stay Tab-reachable and reject typed
input; Escape on a dirty edit routes through the same discard-confirm guard
as "Hủy", never a silent close). This mocked browser runner supplements the
full gate; it still requires a local dev server. See
`openspec/changes/stable-dialog-layout/` and
`openspec/changes/logistics-workspace-redesign/` for scenarios.
