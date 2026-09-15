# Contract export-value columns + Shipment declaration value in VNĐ

## Why
User request (Vietnamese): Shipment list needs "Giá trị Tờ khai (VNĐ)"
(= Giá trị tờ khai × Tỷ giá). Contract list's GIÁ TRỊ group needs "ĐÃ XUẤT"
(tổng giá trị tờ khai của các shipment), "ĐÃ XUẤT (VNĐ)" (tổng giá trị tờ
khai VNĐ của các shipment), and "CHƯA XUẤT" (Giá trị quyết toán − Đã xuất),
reorganized alongside the existing THANH TOÁN group (Đã/Chưa thanh toán).
Backend (`BE-kt-xnk`'s `add-contract-export-value-columns`) already exposes
`ShipmentResponse.declarationValueVnd` and
`ContractSettlement`/`ContractTotal`'s `exportedValue`/`exportedValueVnd`/
`unexportedValue`.

## Accepted decisions
- Shipment list: new `declarationValueVnd` column right after "Giá trị tờ
  khai", added to `DEFAULT_COLUMN_KEYS` (same visibility as its source
  column). No BE search/filter field for it, so no `filter` key on the
  column and not added to `FILTER_FIELD_DEFS` or `SEARCH_FIELD_DEFS`.
- Contract list: `CONTRACT_HEADER_GROUPS` now has two groups instead of
  one — "GIÁ TRỊ" (HỢP ĐỒNG/QUYẾT TOÁN/ĐÃ XUẤT/ĐÃ XUẤT (VNĐ)/CHƯA XUẤT) and
  a new "THANH TOÁN" (ĐÃ THANH TOÁN/CHƯA THANH TOÁN) — matching the exact
  layout given in the request. New columns get `filter` keys mirroring
  `settlementValue`'s existing pattern (client-side quick-search field,
  `SEARCH_FIELD_DEFS`; no BE advanced-filter support, so not in
  `FILTER_FIELD_DEFS`).
- `exportedValueVnd` (Contract) and `declarationValueVnd` (Shipment) render
  with a plain "đ" suffix (no `contract.currency`/`invoiceCurrency`
  interpolation) — both are always VNĐ regardless of the row's own
  currency, same convention `logisticsCost` already uses.

## Scope and behavior
Frontend only — `shipments-table.js`/`shipments-list.jsx`,
`contracts-table.js`/`contracts-list.jsx`, `api/contracts.js` JSDoc,
`types/index.js`'s `Shipment` typedef.

## Out of scope
- Any new BE filter/sort field for the exported-value figures.
- Cancelled-contract zeroing for `unexportedValue` (BE doesn't do it either
  — see BE-kt-xnk's proposal).

## Verification
`pnpm lint`/`typecheck`/`structure`/`test`/`build`/`verify:quality` all
green. Manual browser check (claude-in-chrome) against the two lists,
per user request.
