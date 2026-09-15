# Proposal: Extend Shipment search totals

**Status:** done
**Created:** 2026-09-14

## Why

The Shipment list already totals invoice value across the full filtered set,
but its declaration-value and logistics-cost columns show no aggregate.

## What changes

- Parse declaration totals per currency and the flat VNĐ logistics-cost total
  returned by the backend Shipment search endpoint.
- Render declaration totals on their matching currency rows.
- Render the logistics-cost total once rather than repeating it on every
  currency row.
- Keep visual regression evidence for all three totals shapes.

## Out of scope

- Changing the shared totals-row/table mechanism.
- Totals on other list screens.
