# Shipment overview and drawer completeness

## Requirements

- The Shipment detail overview shows saved service providers, ordered transshipment ports, CY cut-off, actual departure/arrival, declaration weight and empty-container return deadline in relevant sections.
- The overview shows the delivery location consistently, including an empty state.
- The main Shipment drawer lets the user edit the manual empty-container return deadline for FCL shipments where destination free time is tracked but not yet configured.
- Fields managed in dedicated Schedule, Documents, VGM and Costs views remain editable there.

## Scenarios

- A transshipment shipment with two ports shows both in route order in the overview.
- A shipment with customs broker and trucking providers shows their names.
- An FCL shipment without destination free time accepts a manual empty-return deadline and shows the saved date in the overview.
