# Shipment logistics cost lines: name suggestions

## Why
User request (Vietnamese): optimize the "Thêm chi phí logistics" UX
(currently not optimized) — concretely, the "Tên khoản chi phí" field
should offer a preset list of commonly-appearing names (Vận chuyển nội
địa, Vận chuyển quốc tế, Seal, Chứng từ, Telex, CSHT, Dịch vụ C/O, Khai
C/O, Dịch vụ hải quan, Khai hải quan, Kit đóng hàng, Điện L/C, Bảo hiểm)
instead of pure free typing every time.

## Accepted decisions
- BE already has a full `ShipmentCostItemTemplate` feature (CRUD +
  list-by-category) that was never wired into this UI —
  `ShipmentCostLinesFields`'s own doc comment already recorded why: no
  Astryx component does "free text plus suggestions while preserving an
  unmatched typed value" (`Selector` and `Typeahead` both only ever
  resolve to one of their known options, confirmed again by re-reading
  both components' current props/source — nothing changed since that
  comment was written). So `Name` stays a plain `TextInput`; suggestions
  are surfaced *beside* it instead, via a `DropdownMenu` (never
  constraining the typed value — matches BE's own "autocomplete
  convenience only" contract for this catalog).
- The suggestion `DropdownMenu` (icon-only trigger, a `Sparkles` icon)
  lists templates of the row's own cost category only, once one is chosen;
  otherwise every template, grouped into `DropdownMenu` sections by
  category (same section-grouping pattern the "Xuất" export menu in
  `advance-table.jsx` already uses) so the list stays scannable instead of
  one long flat list.
- Picking a suggestion always sets `name`; it also backfills
  `costCategoryId` when the row doesn't have one yet (never overwriting a
  category the user already picked) — this is what makes an uncategorized
  row jump straight into the right category group instead of leaving that
  as a second manual step.
- `DropdownMenu` isn't a documented `InputGroup` child (only `TextInput`,
  `NumberInput`, `TimeInput`, `DateInput`, `Typeahead`, `Selector`,
  `MultiSelector` are), so the trigger sits in a plain `HStack` beside a
  `StackItem(fill)`-wrapped `TextInput` instead of inside an `InputGroup` —
  avoids relying on undocumented behavior for the visual "seamless suffix"
  treatment.
- BE seed data for the 13 requested names is `BE-kt-xnk`'s own
  `add-common-shipment-cost-item-templates` change.

## Scope and behavior
`shipment-cost-lines-fields.jsx` only: new `useShipmentCostItemTemplatesQuery`
usage, one new `suggestionMenuSections(row)` helper, and the "Tên khoản chi
phí" column's `renderCell`.

## Out of scope
- A "save this name as a new template" flow from the row UI — BE's
  create/update/delete template endpoints stay unused by any UI; only
  reading (list) is wired. A natural follow-up, not requested here.
- Any change to `Selector`'s "Nhóm chi phí" column or the existing
  category-grouped table layout.

## Verification
`pnpm lint`/`typecheck`/`structure`/`test`/`build`/`verify:quality` all
green. Manual browser check (claude-in-chrome) against a real Shipment's
"Chi phí Logistics" tab: an existing Port/Terminal-categorized row's
suggestion menu shows only that category's 4 templates (CSHT, Phí D/O,
Phí THC, Seal); picking "Seal" replaces the row's name; a fresh
uncategorized row's suggestion menu shows every category as sections;
picking "Dịch vụ hải quan" sets both the name and backfills the row's
category to Customs, moving it into that group live.
