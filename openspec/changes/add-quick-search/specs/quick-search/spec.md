# Quick search

## Open and close
Scenario: Ctrl/⌘ + K on any protected page, including while focus is in an
input, opens the palette; pressing it again or Escape closes it. Users without
`logistics:contracts:view` get no palette.

## Contract lookup
Scenario: typing `26kct14` lists contracts whose number contains `26KCT14`
(exact match first) under "Hợp đồng", and their shipments under "Lô hàng".
Enter opens `/logistics/contract/{id}`.

## Shipment lookup
Scenario: typing `26KCT14/LOT-1` (or `lot1`, `LOT-01`) lists shipment
`26KCT14/LOT-01` only; Enter opens its detail page. `26KCT14/LOT` lists every
FCL lot of the contract, `26KCT14/LCL-2` the LCL lot 2.

## No match
Scenario: a query with no match shows "Không tìm thấy hợp đồng hay lô hàng nào".
