# Proposal: Fix contract and Shipment list UX

**Status:** done
**Created:** 2026-09-15

## Why

The two operational lists contain redundant ordinal columns, header filter
metadata is split between two configurations, Shipment totals omit quantities
and VGM, and the create flow loses the chosen contract context.

## What changes

- Remove “Số thứ tự” from Contract and Shipment lists.
- Merge advanced-filter field metadata into header-filter discovery and cover
  every default Shipment data header.
- Render quantity/VGM totals returned by the API.
- Show contract number, project, and Incoterm in Shipment creation.
