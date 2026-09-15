# Shipment logistics costs: compact ledger

## Why
The eight-column editor requires more than 1,500px and gives optional invoice
fields as much space as the cost itself. Users need to enter and compare costs
inside the Shipment dialog without horizontal travel on desktop.

## Design
Use the existing teal/mint theme and typography. Keep a ledger with category
subtotals, continuous numbering, and a prominent total above it. Combine name
and category in one column. Reveal supplier, invoice and notes through a labeled
per-row details control; show their saved summary while collapsed. Use the shared
TanStack renderer. Preserve draft state, suggestions, category creation, read-only
mode and the dialog's existing save behavior. Narrow screens scroll the ledger
within its own region. No API or parent dialog changes.

## Acceptance
- Desktop ledger fits a 1,024px dialog content region.
- Add, edit, expand/collapse and remove retain correct amounts and totals.
- Details remain accessible in view mode; editing them requires edit mode.
- Empty state explains how to add a cost; full harness and browser evidence pass.
