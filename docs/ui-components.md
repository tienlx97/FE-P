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

- Contract: `contracts-list` owns one fullscreen `contract-form-dialog` for
  create/view/edit. It renders `contract-general-fields` while editing and
  `contract-expanded-details` → `contract-info-tab` / `contract-commission-tab`
  while viewing related data. New contracts keep related tabs disabled until
  saved; related editors remain siblings of the table (ADR-0004).
- Commission: `commissions-list` → `commission-form-dialog` (create/view/edit);
  view content uses `commission-expanded-details` with related annex/payment actions.
- Shipment: `shipments-list` → `shipment-form-dialog` (create/view/edit);
  view content uses `shipment-expanded-details`, controlled by workspace tabs.
  Editing uses `shipment-fields` → `shipment-booking-fields` / `shipment-lot-fields`
  / existing VGM and cost editors.

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
(Xem/Sửa) in an always-visible final column. `AdvanceTable.fixedEndColumnKeys`
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

Contract, Shipment and Commission keep the same field grid in every mode.
Prefer a control's read-only API; for Selector/DateInput/CheckboxList, retain
the same control with `isDisabled` because these Astryx controls do not expose
read-only behavior. Keep toolbar actions and table columns in place, disabling
parent mutations in view. Commission quick-payment reuses the Add slot for its
independent child dialog. VGM mutations remain available only in edit.

Existing-record titles, footer action widths and seller/buyer disclosures
remain stable across view/edit. Do not reintroduce separate MetadataList
branches for editable fields or conditionally remove currency/action slots.
Creation keeps helper text and Commission's metadata placeholder slots.

`node harness/checks/stable-dialog-layout-browser.mjs` compares control
rectangles, footer geometry, scroll and zero writes on edit at desktop/mobile
widths. The accepted per-control displacement is at most 2 CSS pixels. This
mocked browser runner supplements the full gate; it still requires a local
dev server. See `openspec/changes/stable-dialog-layout/` for scenarios.
