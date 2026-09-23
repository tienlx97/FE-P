# Contract detail Shipment tab

## Scenario: Live shipment summary

Given a contract with Shipments, the Meta Shipment tab displays four KPI cards for container/weight totals, logistics cost, invoiced value, and invoiced value in VND. Figures derive from the current Contract, Shipment, and VGM data.

## Scenario: Review and manage shipments

Each Shipment appears as a card with declaration value, route and schedule, logistics costs, and linked operational details. The user can switch to a TanStack table, export Shipment data to XLSX, create a Shipment when eligible, and edit an existing Shipment.

## Scenario: Narrow viewport

At mobile width, KPI, summary, and linked-entity grids stack without page-level horizontal overflow. The table may scroll within its own surface.
