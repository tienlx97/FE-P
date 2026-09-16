# Polish customer dialog, completion-date gating, and cross-link styling

## Why

User feedback (2026-09-16, Vietnamese) after reviewing the previous 3
changes live in the browser:

1. "Điều chỉnh dialog Khách hàng to và lớn hơn" — enlarge the Customer
   detail dialog.
2. "Ngày hoàn thành dự án chỉ có thể thêm khi Trạng thái là/được chỉnh
   thành 'Đã hoàn thành'" — the completion-date field should only be
   fillable once the contract's Status is (or becomes) "Đã hoàn thành".
3. "Tắt nút filter search ở các column Header" — turn off the per-column
   funnel-icon filter popover app-wide (redundant with the search bar's
   "Bộ lọc nâng cao", and now crowded the header next to the new sort
   indicator).
4. "Ở BOQ cũng highlight và link 'Số hợp đồng' ... cho Text bold" — BOQ's
   contract-number link should get the same bold/highlighted styling as
   the other lists; apply that styling consistently everywhere a
   cross-link was added.
5. "Trong /logistics/customers chưa thêm Customer contract history" — the
   Customers list's own inline row-expansion panel was missed; the
   contract-history table needs to show there too, not just from the
   dialog reachable via a Contract's Buyer link.

## What changes

1. `CustomerDetailDialog`: `width` 720 → 1080.
2. `ProjectCompletionDate`:
   - `contract-schema.js` — new refine: non-empty only when
     `status === 'Completed'`.
   - `use-contract-form.js`'s `setField` — clears the value the moment
     status moves away from `'Completed'` (mirrors the existing
     `placeOfDischarge` clear-on-Incoterm-change convention).
   - `contract-general-fields.jsx` — the `DateInput` is `isDisabled`
     (with a `disabledMessage`) whenever status isn't `'Completed'`.
   - This is a UI-only rule — the backend still accepts the field
     independent of Status (unchanged; not asked for).
3. `AdvanceTable` no longer wires the per-column popover filter plugin
   into `TanStackDataTable` — the underlying `useTableFiltering` call is
   left in place (renamed `_filterPlugin`) rather than torn out, so this
   is a one-line revert if the trigger is wanted back later.
4. New shared `record-link-style.js` (`recordLinkStyles.link` — vivid
   blue + bold) factored out of `contracts-list.jsx`'s existing
   `contractNumberLink` style, applied to the contract-number links in
   `shipments-list.jsx`, `commissions-list.jsx`, and
   `contract-private-infos-list.jsx` (BOQ) that previously used a plain
   `Button variant="ghost"` with no highlight.
5. New shared `CustomerContractHistory` component (extracted from
   `CustomerDetailDialog`) — the "Hợp đồng đã làm" table + CSV export +
   its own `ContractFormDialog` instance, now rendered both by
   `CustomerDetailDialog` and by `customers-list.jsx`'s own
   `CustomerExpandedDetails` inline panel, so the two surfaces can never
   drift apart.
