# Shipment list deletion

## Delete action
The system-wide Shipment list exposes a Delete action for each real row.

Scenario: choosing Delete opens a destructive confirmation that identifies the
Shipment and warns that its logistics costs and VGM records will also be
removed. Confirming calls the contract-scoped DELETE endpoint. A successful
request closes the dialog, refreshes Shipment data and shows a success toast;
a failed request keeps data recoverable and shows the error.
