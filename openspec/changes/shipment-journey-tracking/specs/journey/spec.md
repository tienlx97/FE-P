# Shipment journey

## Requirements

### Backend-resolved progress

The shipment detail page SHALL display the milestones, scope, markers, and progress returned by the shipment journey endpoint.

#### Scenario: A milestone is confirmed

When a user confirms a milestone with an actual date, the page refreshes the journey and shows the returned state and date.

#### Scenario: Journey request fails

When the endpoint fails, the page shows the error without inventing milestone progress.

### CIF empty-container returns

The CIF journey SHALL show the returned-container count, deadline, overdue state, and completion from the backend response. Users SHALL be able to record or clear each container's return date and depot.

#### Scenario: A container return is saved

When a return is saved, the VGM list and journey are refreshed so the card reflects the new count and state.
