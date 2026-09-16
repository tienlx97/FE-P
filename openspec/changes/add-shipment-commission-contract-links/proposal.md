# Add contract-number links from Shipment/Commission lists

## Why

User request (2026-09-16, Vietnamese), part of the same multi-repo change
as `add-contract-completion-date-and-customer-history`: "Mã shipment cũng
là thẻ link đến dialog chi tiết shipment; Số hợp đồng cũng là thẻ link
sang dialog chi tiết hợp đồng. Tương tự cho commission, BOQ...".

Shipment code already linked to the Shipment detail dialog. Contract
number did not link anywhere from either the Shipments list or the
Commissions list — both denormalize `contractNumber` for display but
rendered it as plain text. BOQ's own `contractNumber` column already
opens *its own* detail dialog (BOQ rows are 1:1 with Contract, so the
number doubles as that row's own record code) — already correct, no
change needed there.

## What changes

1. `shipments-list.jsx`: `contractNumber` column becomes a link (same
   `Button variant="ghost"` pattern the `shipmentCode` column already
   uses in this file) opening a new, independent `ContractFormDialog`
   instance for that row's parent contract — reuses the `contractsById`
   map already built here for the denormalized `contractNumber`/
   `projectName` fields, so no new data fetch.
2. `commissions-list.jsx`: same pattern — `contractNumber` becomes a link
   opening its own `ContractFormDialog` instance, reusing the existing
   `contractsById` map.
3. Both links are conditional on `contractsById.has(row.contractId)` —
   falls back to plain text if the contract isn't in the currently-loaded
   set (matches the existing `orDash` fallback style).
