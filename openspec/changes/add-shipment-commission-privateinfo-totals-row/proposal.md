# Proposal: Add totals row to Shipments, Commissions, and BOQ lists

**Status:** done
**Created:** 2026-09-12

## Why

Follow-on to `add-contracts-totals-row`: user asked for the same
per-column totals row on the other list screens with a value column —
Shipments (Giá trị invoice), Commissions (Giá trị), BOQ (Số cont/Tổng/Lợi
nhuận). Depends on BE-kt-xnk's
`add-shipment-commission-privateinfo-totals`.

## What changes

- `api/shipments.js`'s `searchAllShipments` and `api/commissions.js`'s
  `searchCommissions` now parse the new `{ page, totals }` envelope
  (previously flat), same as `api/contracts.js` already did.
- `api/contract-private-info.js`'s `searchContractPrivateInfos` also
  parses `{ page, totals }`, but `totals` is a single object (no currency
  grouping — always VNĐ), not an array like the other three lists.
- `shipments-list.jsx`, `commissions-list.jsx`, `contract-private-infos-list.jsx`
  each build a `totalsRows` array (one row per currency, or one row total
  for BOQ) and wrap every column's `renderCell` to special-case it — same
  `TOTALS_ROW_CELL_RENDERERS` map pattern `contracts-list.jsx` established;
  no `advance-table.jsx` changes needed, `totalsRows` was already generic.
- BOQ's totals row does **not** total `costPricePerContainer`/
  `quotedPricePerContainer` (per-unit prices — summing them across
  contracts isn't meaningful); only `containerCount`/`logisticsTotal`/
  `profit`.

## Out of scope

- Customers list — no numeric value column to total.
- `advance-table.jsx` itself — `totalsRows` prop already existed, generic
  enough for all three.

## Decision log

| Date | Decision | Why |
|---|---|---|
| 2026-09-12 | BOQ's totals-row cell typing uses `any` for the wrapped `renderCell` param instead of the intersection type the other three lists use | `ContractPrivateInfoListItem.containerCount` is `number \| null` while the totals row's is always a concrete `number` — the field-name collision makes a strict intersection type fail to typecheck; the totals-vs-real-row branch is still runtime-guarded by `__isTotalsRow`. |
