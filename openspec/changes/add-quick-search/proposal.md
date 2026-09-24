# Quick search ("Tra cứu nhanh", Ctrl + K)

## Why
Jumping to a contract or shipment means opening the right list, filtering and
clicking through. Users already know the code (`26KCT14`, `26KCT14/LOT-01`).

## Scope and behavior
Ctrl + K (⌘ + K on macOS) on any protected page — even while typing in a field —
toggles a command palette (Astryx `CommandPalette`). It recognises, case-
insensitively:

- a contract number (`26KCT14`, `26kct14`) → matching contracts, plus their
  shipments;
- a shipment code (`26KCT14/LOT-1`, `26kct14/lot01`, `26KCT14/LCL-2`,
  `26KCT14/LOT`, `26KCT14/2`) → matching shipments only.

Enter / click opens the contract or shipment detail page. Only mounted for
users with `logistics:contracts:view` (the detail pages' permission). Only
contracts and shipments for now; more kinds get added later.

## Backend dependency
None — reuses `POST /api/v1/contracts/search` and `POST /api/v1/shipments/search`
with `contractNumber Contains`. The shipment code is computed at read time, so
the lot suffix is matched client-side over up to 100 of the contract's shipments.

## Verification
Unit tests for query parsing / suffix matching, browser check, full harness.
