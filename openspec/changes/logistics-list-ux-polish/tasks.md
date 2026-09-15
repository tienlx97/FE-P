# Tasks

- [x] 1. Tighten `shipment-contract-eligibility.js` to InProgress-only and
  fix the separately hardcoded contract-picker help text; move
  Contract/Shipment lists' primary action button into `AdvanceTable`'s
  `primaryAction` (extended with an optional `icon`); replace "Số hợp đồng"'s
  ghost `Button` with a blue-styled `Link`; verify full harness; manual
  browser check.
- [x] 2. Follow-up: add `AdvanceTable`'s optional `title` prop so
  Print/Xuất/`primaryAction` render level with the page Title instead of
  the search toolbar row; wire `ContractsList`/`ShipmentsList` to pass
  `title` instead of rendering their own `Heading`; verify full harness;
  manual browser check.
