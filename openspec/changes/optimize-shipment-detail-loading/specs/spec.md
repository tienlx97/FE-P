# Shipment detail loading

## Scenario: Opening a shipment
- WHEN the detail page opens on the Overview tab
- THEN it requests one shipment by id, not the contract's shipment list
- AND it does not request the shipment cost groups.

## Scenario: Switching to Costs
- WHEN the Costs tab is opened
- THEN the cost groups are requested once and reused for 5 minutes.
