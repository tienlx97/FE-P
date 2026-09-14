# Delete a shipment from the UI

## Why
The backend now supports deleting a Shipment, but the system-wide Shipment
list only offers View and Edit actions.

## Scope and behavior
Add Delete to the Shipment row action menu. Confirm the irreversible action
and explain that logistics costs and VGM records are also removed. On success,
refresh both the system-wide and per-contract Shipment caches and show feedback;
preserve the row and show the backend error when deletion fails.

## Backend dependency
`DELETE /api/v1/contracts/{contractId}/shipments/{shipmentId}` in
`BE-kt-xnk/openspec/changes/add-delete-shipment/`.

## Verification
API adapter test, visual browser flow and full frontend harness.
