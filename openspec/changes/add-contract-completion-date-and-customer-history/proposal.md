# Add contract completion date, customer link, and contract history

## Why

User request (2026-09-16, Vietnamese), part of a multi-repo change also
touching BE-kt-xnk (`add-contract-project-completion-date`,
`add-search-sort`):

1. Contract needs a "ngày hoàn thành dự án" (project completion date)
   field, and its Customer/Buyer should render as a link to that
   customer's detail.
2. The Customer catalog UI should show detail info including a "contracts
   done" table (Số hợp đồng | Giá trị | Ngày ký | Ngày hoàn thành), with
   Số hợp đồng linking to the Contract detail dialog, plus an "Xuất file"
   button.

## What changes

1. `contractSchema`/`useContractForm`/`ContractGeneralFields` gain
   `projectCompletionDate` (optional date, `>= createdDate` when set —
   mirrors the backend's own rule); sent as `ProjectCompletionDate` in
   `buildContractBody`.
2. New `CustomerDetailDialog` (`customer-detail-dialog.jsx`) — opened by
   customer id from anywhere a customer name appears as a link (today:
   Contract's Buyer column in `contracts-list.jsx`, only when
   catalog-linked via `sourceCustomerId`). Shows the customer's profile
   plus a "Hợp đồng đã làm" table backed by a new
   `useCustomerContractsQuery` hook (`GET
   /api/v1/contracts/search` filtered on `buyerSourceCustomerId`, sorted
   by `createdDate` descending — both added on the BE side in this same
   multi-repo change). Số hợp đồng opens the existing `ContractFormDialog`
   (its own independent instance, same "one dialog, multiple entrypoints"
   convention already used elsewhere in this feature). "Xuất file" exports
   the table as CSV.
3. `searchContracts` (api) gains an optional `sort` passthrough
   (`{ field, direction }` → `Sort: { Field, Direction }`) — needed for
   #2's default order, and reused as-is by the later sortable-headers
   change.
4. Deliberately unchanged: `customers-list.jsx`'s own inline
   row-expansion profile panel (`CustomerExpandedDetails`) — it keeps
   working exactly as before; `CustomerDetailDialog` is a separate,
   independently-reachable surface, not a replacement.
