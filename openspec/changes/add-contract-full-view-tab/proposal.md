# Proposal: Contract "Xem đầy đủ" (Full View) Tab

**Status:** implemented
**Created:** 2026-09-12

## Why

User request (2026-09-12): the Contract workspace's "Liên quan" tab already
lists Shipments, but seeing one Shipment's info + VGM means expanding its
row then switching an inner tab — too many clicks for a quick lookup
("có những lúc cần tra cứu nhanh"). Add a 5th tab, "Xem đầy đủ", that is a
single read-only screen: search bar → per-Shipment tabs → that Shipment's
info/VGM/costs stacked on one screen, no expand/inner-tab needed.

## What changes

- `components/shipment-info-section.jsx` (new): the "Thông tin lô hàng"/
  "Thông tin Book" `MetadataList`s, factored out of
  `ShipmentExpandedDetails` so both places render identical fields instead
  of duplicating them.
- `components/shipment-costs-section.jsx` (new): the costs `Table` +
  per-category totals, factored out the same way.
- `ShipmentExpandedDetails` now composes `ShipmentInfoSection` /
  `ShipmentVgmSection` (already existed) / `ShipmentCostsSection` per its
  own inner tab instead of inlining their JSX — behavior unchanged.
- `hooks/use-shipments-vgms-queries.js` (new): `useQueries`-based batch VGM
  fetch across every Shipment of a contract, sharing the same
  `queryKey`/`queryFn` as `useShipmentVgmsQuery` so cache is shared with
  the per-shipment VGM tab. Only ever runs from `ContractFullViewPanel`,
  which itself only mounts while its tab is active.
- `components/contract-full-view-panel.jsx` (new): the tab body — a
  `TextInput` search bar filtering the Shipment `TabList` by a lowercased
  substring match across every Shipment/cost/VGM field (no diacritics
  folding, matching `AdvanceTable`'s own search), and the selected
  Shipment's `ShipmentInfoSection` → `ShipmentVgmSection` (`isReadOnly`) →
  `ShipmentCostsSection` stacked vertically.
- `ContractFormDialog`: `TAB_LABELS.fullView = 'Xem đầy đủ'`, a 5th `Tab`
  (`aria-disabled` while creating, same as "Phụ lục"/"Thanh toán"/
  "Liên quan").
- `ContractExpandedDetails`/`ContractsList`: `ExpandedTab` typedef gains
  `'fullView'`; a new `activeTab === 'fullView'` branch renders
  `ContractFullViewPanel` with the same `shipments`/`customersById`/
  `costCategoriesById` the "Liên quan" branch already has in scope.

## Follow-up: advanced search (2026-09-12)

User request, refined twice in the same session: a funnel button opening
an advanced search, first asked to visually match `AdvanceTable`'s own
funnel trigger (icon/`variant`), then asked to match `AdvanceTable`'s
"Bộ lọc nâng cao" behavior exactly — a dialog with a field/operator/value
condition builder and a "Chọn điều kiện lọc" add-field control, not a
fixed set of always-visible text boxes. Final shape reuses
`@/shared/components/advanced-filter-builder.jsx`'s `AdvancedFilterBuilder`
directly (the same component `AdvanceTable`'s own server-filter-mode
dialog uses for `/logistics/contracts`), evaluated client-side instead of
sent to a server:
- `FILTER_FIELD_DEFS`: 5 `type: 'string'` fields (Mã/Tên Shipment, Số
  booking, Số cont VGM, Số seal VGM, Tên khoản chi phí) passed to
  `AdvancedFilterBuilder` as `fields`; `appliedConditions`/`advancedDraft`
  state holds `AdvancedFilterCondition[]` the same shape `AdvanceTable`
  itself owns.
- `fieldValues()`/`matchesCondition()`/`matchesAllConditions()`: a small
  client-side evaluator for `AdvancedFilterBuilder`'s string operators
  (Equals/Contains/NotContains/StartsWith/EndsWith/IsEmpty/IsNotEmpty).
  Container/seal/cost-name are one-to-many per Shipment (several VGM rows
  or cost lines), so a condition matches if ANY of that field's values
  satisfies it, not "the" single value the operator set was designed for
  on a real DB column — an approximation the underlying operators don't
  have a purpose-built answer for, but behaves correctly for the common
  case (does this Shipment have a VGM/cost matching this text).
  Conditions fold left-to-right by each row's own `connector` (And/Or),
  mirroring `AdvancedFilterBuilder`'s own row UI.
- Dialog: `CommonDialog` (`purpose="form"`, width 800 — same width
  `AdvanceTable`'s own filter-builder dialog uses) with title "Bộ lọc
  nâng cao" and a "Bỏ lọc"/"Lọc" footer, structurally identical to
  `AdvanceTableSearchDialog`'s `isServerFilterMode` branch. "Bỏ lọc"
  clears immediately (draft + applied) without closing, matching
  `AdvanceTable`'s own `handleAdvancedFilterClear`; "Lọc" applies and
  closes.
- Applying at least one condition replaces the plain search — that
  `TextInput` disables (`isDisabled`, "Đang dùng bộ lọc nâng cao"
  placeholder) while a condition set is applied; a "Bỏ lọc" `Button` next
  to a hint line clears back to plain search. The funnel `IconButton`
  itself always stays `icon="funnel"`/`variant="ghost"` (no active-state
  color change) — visually identical to `AdvanceTable`'s own trigger, per
  the first round of feedback.

## Scope decisions

- **Read-only**: VGM renders with `isReadOnly`; no add/edit/delete
  affordances anywhere in this tab. "Liên quan" stays the place to manage
  Shipments/VGM — this tab is purely for lookup.
- **Search filters the Shipment tab list, not in-page highlighting**: per
  user's own choice between the two options offered — simpler to implement
  and matches how `AdvanceTable`'s quick search already behaves elsewhere
  in this app (narrows a list, doesn't scroll-and-highlight).
- **Search covers VGM/costs, not just Shipment fields**: per user's own
  choice. Costs are already embedded in the `Shipment` object (no extra
  fetch); VGM is not, hence the new batch-fetch hook — gated to only fire
  while this tab is mounted, so contracts with many Shipments don't pay for
  it on every dialog open.
- **New tab, not a rework of "Liên quan"**: per user's own choice —
  "Liên quan" keeps its existing management-focused row-expansion UI
  unchanged.

## Out of scope

- Any backend change — this reads existing endpoints only
  (`listShipmentVgms`, the same shipments query "Liên quan" already uses).
- Annexes/payments/related search — this tab's search only reaches
  Shipment/VGM/costs, per the mockup the user provided.
