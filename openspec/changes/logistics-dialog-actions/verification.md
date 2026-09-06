# Verification

## Browser

- `node harness/checks/logistics-actions-browser.mjs`: mocked standalone lists,
  final pinned menus and horizontal scrolling on desktop/mobile, Xem/Sửa,
  no expandable rows, read-only views, no writes on switching to edit,
  Shipment dirty discard and one PUT per save, VGM/annex child opening,
  quick payment save, subsequent edit retaining the newly saved payment,
  contract direct edit, singular Commission alias, action-column settings.
- `node harness/checks/dialog-browser.mjs`: existing Contract/Shipment/User
  creation and shared shell regression, all 14 checks passed.
- Screenshots/geometry/check logs: `harness/runs/20260906-logistics-actions/`
  and `harness/runs/20260906-dialog-audit/`. Synthetic fixtures only; no real
  API writes. Desktop and mobile screenshots visually reviewed.

## Scope

Standalone Commission and Shipment expansion was replaced. Nested Shipment
expansion inside the Contract workspace retains its current behavior. Existing
contract selection precedes Shipment/Commission creation. Direct save closes
these dialogs after success and refreshes the lists; no backend schema change.

All 39 action-workspace browser checks passed. Full gate passed in
`harness/runs/20260906-223740-631429/`: 120 unit tests, lint, typecheck,
structure/harness, build and quality thresholds (shared gzip 168.7 kB).
