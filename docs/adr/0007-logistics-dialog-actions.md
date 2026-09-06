# ADR-0007: Logistics actions open entity dialogs

Date: 2026-09-06
Status: accepted

## Decision

Replace standalone Shipment/Commission table expansion with a pinned final
Xem/Sửa menu; Contracts gets the same menu. Extend existing form dialogs with
view content and a distinct keyed edit button, leaving feature controllers and
related editor ownership in place. Reuse existing detail renderers inside the
workspace with responsive metadata and one scroll owner. Keep nested contract
Shipment-table behavior outside this standalone-list change.

AdvanceTable accepts fixedEndColumnKeys, which normalizes visible column order
and always pins those keys at the end even when view options change. Other
callers keep their existing configurable pinning behavior.

## Consequences

Create/view/edit share dialog components and field controllers. Read-only mode
exposes no parent submit action; related VGM/annex/payment actions remain explicit
child operations. Save closes the Shipment/Commission dialog and invalidates
existing queries, consistent with their current mutation flow.
