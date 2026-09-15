# Tasks

- [x] 1. Wire `useShipmentCostItemTemplatesQuery` into
  `ShipmentCostLinesFields`; add a per-row, category-aware suggestion
  `DropdownMenu` beside "Tên khoản chi phí" that fills the name and
  backfills an empty category; verify full harness; manual browser check.
- [x] 2. Investigate true live-as-you-type suggestions (user follow-up: no
  separate click, recommend while typing in the `TextInput` itself).
  Attempted a `usePopover`-anchored-to-the-input combobox; abandoned after
  `show()` never opened the popover in this nested table-cell context for
  an unconfirmed root cause (see `harness/PROGRESS.md` for the full
  investigation trail). Reverted to task 1's `DropdownMenu` design,
  re-verified it still works via full harness + manual browser check.
- [x] 3. Add an `STT` (số thứ tự) column numbering actual cost-line rows
  1, 2, 3, ... continuously across category groups, blank on group header
  rows; verify full harness; manual browser check.
