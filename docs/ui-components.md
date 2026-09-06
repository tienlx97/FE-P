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
- Commission: `commissions-list` → `commission-expanded-details`.
- Shipment: `shipment-fields` → `shipment-booking-fields` / `shipment-lot-fields`
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
