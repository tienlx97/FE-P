# Shipment transshipment ports

## Requirements

- Selecting Chuyển tải in the Shipment form reveals an ordered list of required transfer port inputs.
- Users can add and remove ports, up to ten; at least one port is required for transshipment.
- Editing a Shipment restores saved ports in order and preserves any detailed leg fields not shown in the main drawer.
- Saving a direct Shipment clears its transfer ports.

## Scenarios

- Select Chuyển tải and enter Singapore and Port Klang: save both in order, then reopen the Shipment to see both.
- Select Chuyển tải with an empty port: show a field error and prevent saving.
- Switch to Đi thẳng: save an empty port list.
